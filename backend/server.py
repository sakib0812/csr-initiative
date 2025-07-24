from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT and password handling
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# User Models
class UserRole(str):
    NGO = "ngo"
    BUSINESS_OWNER = "business_owner"
    CORPORATE = "corporate"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str
    organization: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str
    organization: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

# Business Models
class Business(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    name: str
    description: str
    category: str  # achar, papad, handicrafts, etc.
    location: str
    revenue_range: Optional[str] = None
    employees_count: Optional[int] = None
    products: List[str] = []
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BusinessCreate(BaseModel):
    name: str
    description: str
    category: str
    location: str
    revenue_range: Optional[str] = None
    employees_count: Optional[int] = None
    products: List[str] = []
    image_url: Optional[str] = None

# Event Models
class EventBusiness(BaseModel):
    business_id: str
    business_name: str
    description: str
    category: str

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ngo_id: str
    ngo_name: str
    title: str
    description: str
    initiative_type: str  # women_empowerment, skill_development, etc.
    date: datetime
    location: str
    target_audience: str
    participating_businesses: List[EventBusiness] = []
    invited_corporates: List[str] = []
    connections_made: List[dict] = []
    status: str = "upcoming"  # upcoming, ongoing, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EventCreate(BaseModel):
    title: str
    description: str
    initiative_type: str
    date: datetime
    location: str
    target_audience: str
    participating_businesses: List[EventBusiness] = []
    invited_corporates: List[str] = []

# Connection Models
class Connection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    business_id: str
    corporate_id: str
    status: str = "interested"  # interested, meeting_scheduled, partnership_formed
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConnectionCreate(BaseModel):
    event_id: str
    business_id: str
    notes: Optional[str] = None

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@api_router.get("/")
async def root():
    return {"message": "CSR Initiatives Platform API"}

# Authentication Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    user_dict["hashed_password"] = hashed_password
    
    user = User(**user_dict)
    # Save user dict with hashed_password to database
    user_db_dict = user.dict()
    user_db_dict["hashed_password"] = hashed_password
    await db.users.insert_one(user_db_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_obj = User(**user)
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_obj}

# Business Routes
@api_router.post("/businesses", response_model=Business)
async def create_business(business_data: BusinessCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.BUSINESS_OWNER:
        raise HTTPException(status_code=403, detail="Only business owners can create businesses")
    
    business_dict = business_data.dict()
    business_dict["owner_id"] = current_user.id
    business = Business(**business_dict)
    
    await db.businesses.insert_one(business.dict())
    return business

@api_router.get("/businesses", response_model=List[Business])
async def get_businesses():
    businesses = await db.businesses.find().to_list(1000)
    return [Business(**business) for business in businesses]

@api_router.get("/businesses/my", response_model=List[Business])
async def get_my_businesses(current_user: User = Depends(get_current_user)):
    businesses = await db.businesses.find({"owner_id": current_user.id}).to_list(1000)
    return [Business(**business) for business in businesses]

# Event Routes
@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.NGO:
        raise HTTPException(status_code=403, detail="Only NGOs can create events")
    
    event_dict = event_data.dict()
    event_dict["ngo_id"] = current_user.id
    event_dict["ngo_name"] = current_user.name
    event = Event(**event_dict)
    
    await db.events.insert_one(event.dict())
    return event

@api_router.get("/events", response_model=List[Event])
async def get_events():
    events = await db.events.find().to_list(1000)
    return [Event(**event) for event in events]

@api_router.get("/events/my", response_model=List[Event])
async def get_my_events(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.NGO:
        events = await db.events.find({"ngo_id": current_user.id}).to_list(1000)
    elif current_user.role == UserRole.CORPORATE:
        events = await db.events.find({"invited_corporates": current_user.id}).to_list(1000)
    else:
        # For business owners, find events where their business is participating
        businesses = await db.businesses.find({"owner_id": current_user.id}).to_list(1000)
        business_ids = [b["id"] for b in businesses]
        events = await db.events.find({"participating_businesses.business_id": {"$in": business_ids}}).to_list(1000)
    
    return [Event(**event) for event in events]

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**event)

# Connection Routes
@api_router.post("/connections", response_model=Connection)
async def create_connection(connection_data: ConnectionCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.CORPORATE:
        raise HTTPException(status_code=403, detail="Only corporates can express interest")
    
    connection_dict = connection_data.dict()
    connection_dict["corporate_id"] = current_user.id
    connection = Connection(**connection_dict)
    
    await db.connections.insert_one(connection.dict())
    
    # Update event with connection
    await db.events.update_one(
        {"id": connection_data.event_id},
        {"$push": {"connections_made": connection.dict()}}
    )
    
    return connection

@api_router.get("/connections", response_model=List[Connection])
async def get_connections(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.CORPORATE:
        connections = await db.connections.find({"corporate_id": current_user.id}).to_list(1000)
    elif current_user.role == UserRole.BUSINESS_OWNER:
        businesses = await db.businesses.find({"owner_id": current_user.id}).to_list(1000)
        business_ids = [b["id"] for b in businesses]
        connections = await db.connections.find({"business_id": {"$in": business_ids}}).to_list(1000)
    else:
        # NGOs can see all connections for their events
        events = await db.events.find({"ngo_id": current_user.id}).to_list(1000)
        event_ids = [e["id"] for e in events]
        connections = await db.connections.find({"event_id": {"$in": event_ids}}).to_list(1000)
    
    return [Connection(**connection) for connection in connections]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()