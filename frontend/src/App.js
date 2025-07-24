import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();
  
  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-600">CSR Connect</h1>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full capitalize">
                {user.role.replace('_', ' ')}
              </span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Auth Forms
const AuthForm = ({ setCurrentView }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'ngo',
    organization: '',
    phone: ''
  });
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      login(response.data.user, response.data.access_token);
      setCurrentView('dashboard');
    } catch (error) {
      alert(error.response?.data?.detail || 'Authentication failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join the CSR initiatives platform
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <>
                <input
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <select
                  name="role"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="ngo">NGO</option>
                  <option value="business_owner">Business Owner</option>
                  <option value="corporate">Corporate</option>
                </select>
                <input
                  name="organization"
                  type="text"
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Organization/Company Name"
                  value={formData.organization}
                  onChange={handleChange}
                />
                <input
                  name="phone"
                  type="tel"
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </>
            )}
            <input
              name="email"
              type="email"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLogin ? 'Sign in' : 'Register'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Dashboard Components
const NGODashboard = ({ setCurrentView }) => {
  const [events, setEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchBusinesses();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events/my`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const response = await axios.get(`${API}/businesses`);
      setBusinesses(response.data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">NGO Dashboard</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Event
        </button>
      </div>

      {showCreateForm && (
        <CreateEventForm 
          setShowCreateForm={setShowCreateForm} 
          fetchEvents={fetchEvents}
          businesses={businesses}
        />
      )}

      <div className="grid grid-cols-1 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} isNGO={true} />
        ))}
        {events.length === 0 && (
          <p className="text-gray-500 text-center py-8">No events created yet. Create your first event!</p>
        )}
      </div>
    </div>
  );
};

const CreateEventForm = ({ setShowCreateForm, fetchEvents, businesses }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    initiative_type: 'women_empowerment',
    date: '',
    location: '',
    target_audience: '',
    participating_businesses: [],
    invited_corporates: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/events`, {
        ...formData,
        date: new Date(formData.date).toISOString()
      });
      setShowCreateForm(false);
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error creating event');
    }
  };

  const handleBusinessSelect = (business) => {
    const eventBusiness = {
      business_id: business.id,
      business_name: business.name,
      description: business.description,
      category: business.category
    };
    
    setFormData({
      ...formData,
      participating_businesses: [...formData.participating_businesses, eventBusiness]
    });
  };

  const removeBusiness = (index) => {
    const updated = formData.participating_businesses.filter((_, i) => i !== index);
    setFormData({ ...formData, participating_businesses: updated });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Create CSR Event</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Women Empowerment Initiative"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Connecting rural women entrepreneurs with corporate partners..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Initiative Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.initiative_type}
                onChange={(e) => setFormData({ ...formData, initiative_type: e.target.value })}
              >
                <option value="women_empowerment">Women Empowerment</option>
                <option value="skill_development">Skill Development</option>
                <option value="rural_development">Rural Development</option>
                <option value="sustainable_business">Sustainable Business</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="datetime-local"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Mumbai, Maharashtra"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              placeholder="Corporate leaders, investors, retail chains"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Participating Businesses</label>
            <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
              {businesses.map((business) => (
                <div key={business.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{business.name}</p>
                    <p className="text-sm text-gray-500">{business.category} • {business.location}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBusinessSelect(business)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                    disabled={formData.participating_businesses.some(b => b.business_id === business.id)}
                  >
                    {formData.participating_businesses.some(b => b.business_id === business.id) ? 'Added' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
            
            {formData.participating_businesses.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Businesses:</p>
                <div className="space-y-2">
                  {formData.participating_businesses.map((business, index) => (
                    <div key={index} className="flex items-center justify-between bg-indigo-50 p-2 rounded">
                      <span className="text-sm">{business.business_name}</span>
                      <button
                        type="button"
                        onClick={() => removeBusiness(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BusinessDashboard = () => {
  const [businesses, setBusinesses] = useState([]);
  const [events, setEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchBusinesses();
    fetchEvents();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await axios.get(`${API}/businesses/my`);
      setBusinesses(response.data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events/my`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Business
        </button>
      </div>

      {showCreateForm && (
        <CreateBusinessForm 
          setShowCreateForm={setShowCreateForm} 
          fetchBusinesses={fetchBusinesses}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">My Businesses</h2>
          <div className="space-y-4">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
            {businesses.length === 0 && (
              <p className="text-gray-500">No businesses added yet. Add your first business!</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Events I'm Participating In</h2>
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {events.length === 0 && (
              <p className="text-gray-500">No events yet. Wait for NGOs to invite your businesses!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateBusinessForm = ({ setShowCreateForm, fetchBusinesses }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'achar',
    location: '',
    revenue_range: '',
    employees_count: '',
    products: '',
    image_url: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const businessData = {
        ...formData,
        products: formData.products.split(',').map(p => p.trim()).filter(p => p),
        employees_count: formData.employees_count ? parseInt(formData.employees_count) : null
      };
      
      await axios.post(`${API}/businesses`, businessData);
      setShowCreateForm(false);
      fetchBusinesses();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error creating business');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Add Your Business</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Sita's Achar Enterprise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Traditional homemade achar and pickles made with organic ingredients..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="achar">Achar/Pickles</option>
                <option value="papad">Papad</option>
                <option value="handicrafts">Handicrafts</option>
                <option value="textiles">Textiles</option>
                <option value="food_products">Food Products</option>
                <option value="organic_farming">Organic Farming</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Village, District, State"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Range</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.revenue_range}
                onChange={(e) => setFormData({ ...formData, revenue_range: e.target.value })}
              >
                <option value="">Select Range</option>
                <option value="0-50k">₹0 - ₹50,000</option>
                <option value="50k-2l">₹50,000 - ₹2,00,000</option>
                <option value="2l-5l">₹2,00,000 - ₹5,00,000</option>
                <option value="5l+">₹5,00,000+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Employees</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.employees_count}
                onChange={(e) => setFormData({ ...formData, employees_count: e.target.value })}
                placeholder="5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Products (comma-separated)</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.products}
              onChange={(e) => setFormData({ ...formData, products: e.target.value })}
              placeholder="Mango Pickle, Lime Pickle, Mixed Vegetable Pickle"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Business
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CorporateDashboard = () => {
  const [events, setEvents] = useState([]);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchConnections();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await axios.get(`${API}/connections`);
      setConnections(response.data);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const expressInterest = async (eventId, businessId, notes = '') => {
    try {
      await axios.post(`${API}/connections`, {
        event_id: eventId,
        business_id: businessId,
        notes
      });
      fetchConnections();
      alert('Interest expressed successfully!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error expressing interest');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Corporate Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Available CSR Events</h2>
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                isCorporate={true}
                onExpressInterest={expressInterest}
                connections={connections}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">My Connections</h2>
          <div className="space-y-4">
            {connections.map((connection) => (
              <div key={connection.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <p className="font-medium">Connection ID: {connection.id}</p>
                <p className="text-sm text-gray-600">Status: {connection.status}</p>
                {connection.notes && (
                  <p className="text-sm text-gray-600 mt-2">Notes: {connection.notes}</p>
                )}
              </div>
            ))}
            {connections.length === 0 && (
              <p className="text-gray-500">No connections yet. Express interest in businesses from events!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Shared Components
const EventCard = ({ event, isNGO = false, isCorporate = false, onExpressInterest, connections = [] }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
          <p className="text-sm text-gray-600">by {event.ngo_name}</p>
        </div>
        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">
          {event.initiative_type.replace('_', ' ')}
        </span>
      </div>

      <p className="text-gray-700 mb-4">{event.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
        <div>
          <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Location:</strong> {event.location}</p>
        </div>
        <div>
          <p><strong>Target:</strong> {event.target_audience}</p>
          <p><strong>Status:</strong> {event.status}</p>
        </div>
      </div>

      {event.participating_businesses.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Participating Businesses:</h4>
          <div className="space-y-2">
            {event.participating_businesses.map((business, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{business.business_name}</p>
                  <p className="text-sm text-gray-600">{business.category}</p>
                </div>
                {isCorporate && (
                  <button
                    onClick={() => onExpressInterest(event.id, business.business_id, 'Interested in partnership')}
                    disabled={connections.some(c => c.business_id === business.business_id && c.event_id === event.id)}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {connections.some(c => c.business_id === business.business_id && c.event_id === event.id) 
                      ? 'Interest Expressed' 
                      : 'Express Interest'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {event.connections_made && event.connections_made.length > 0 && isNGO && (
        <div className="mt-4">
          <p className="text-sm text-green-600">
            <strong>{event.connections_made.length}</strong> connections made
          </p>
        </div>
      )}
    </div>
  );
};

const BusinessCard = ({ business }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{business.name}</h3>
      <p className="text-gray-700 mb-3">{business.description}</p>
      
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
        <div>
          <p><strong>Category:</strong> {business.category}</p>
          <p><strong>Location:</strong> {business.location}</p>
        </div>
        <div>
          {business.revenue_range && <p><strong>Revenue:</strong> {business.revenue_range}</p>}
          {business.employees_count && <p><strong>Employees:</strong> {business.employees_count}</p>}
        </div>
      </div>

      {business.products.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Products:</p>
          <div className="flex flex-wrap gap-1">
            {business.products.map((product, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {product}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Landing Page
const LandingPage = ({ setCurrentView }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-indigo-600">CSR Connect</span>
              <br />
              Empowering Rural Entrepreneurs
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connecting NGOs, rural women entrepreneurs, and corporations to create impactful CSR initiatives 
              that scale small businesses and drive sustainable community development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCurrentView('auth')}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </button>
              <button className="text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-50 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-16 flex justify-center">
          <img
            src="https://images.unsplash.com/photo-1708417134243-6d71770d82ef?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxydXJhbCUyMHdvbWVuJTIwZW50cmVwcmVuZXVyc3xlbnwwfHx8fDE3NTMzNDY3MTF8MA&ixlib=rb-4.1.0&q=85"
            alt="Rural women entrepreneurs"
            className="rounded-lg shadow-2xl max-w-4xl w-full h-64 object-cover"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Three simple steps to create impactful partnerships</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">NGOs Create Events</h3>
              <p className="text-gray-600">NGOs organize CSR initiatives and showcase participating rural businesses</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👩‍💼</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Businesses Join</h3>
              <p className="text-gray-600">Rural women entrepreneurs showcase their products and services</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Corporates Connect</h3>
              <p className="text-gray-600">Corporations discover and partner with promising rural businesses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Section */}
      <div className="py-16 bg-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-lg text-gray-600">Making a difference in rural communities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-indigo-600 mb-2">500+</div>
              <div className="text-gray-600">Women Entrepreneurs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">100+</div>
              <div className="text-gray-600">CSR Events</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600">Corporate Partners</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">₹2Cr+</div>
              <div className="text-gray-600">Business Value Created</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('landing');
  
  return (
    <AuthProvider>
      <div className="App">
        <AppContent currentView={currentView} setCurrentView={setCurrentView} />
      </div>
    </AuthProvider>
  );
}

const AppContent = ({ currentView, setCurrentView }) => {
  const { user, isAuthenticated } = useAuth();

  // Auto-redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated && currentView !== 'dashboard') {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated, currentView, setCurrentView]);

  const renderContent = () => {
    if (!isAuthenticated) {
      switch (currentView) {
        case 'auth':
          return <AuthForm setCurrentView={setCurrentView} />;
        default:
          return <LandingPage setCurrentView={setCurrentView} />;
      }
    }

    // Authenticated users see dashboard based on role
    switch (user?.role) {
      case 'ngo':
        return <NGODashboard setCurrentView={setCurrentView} />;
      case 'business_owner':
        return <BusinessDashboard />;
      case 'corporate':
        return <CorporateDashboard />;
      default:
        return <LandingPage setCurrentView={setCurrentView} />;
    }
  };

  return (
    <>
      {isAuthenticated && <Navigation />}
      {renderContent()}
    </>
  );
};

export default App;