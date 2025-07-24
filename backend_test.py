#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for CSR Initiatives Platform
Tests authentication, business management, event management, and connection APIs
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Backend URL from frontend/.env
BASE_URL = "https://98c064ed-05ba-42c0-9a5b-f8714c611c69.preview.emergentagent.com/api"

class CSRPlatformTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.tokens = {}
        self.users = {}
        self.businesses = {}
        self.events = {}
        self.connections = {}
        
    def log(self, message, level="INFO"):
        print(f"[{level}] {message}")
        
    def test_api_root(self):
        """Test the root API endpoint"""
        self.log("Testing API root endpoint...")
        try:
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ API Root: {data}")
                return True
            else:
                self.log(f"❌ API Root failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ API Root error: {str(e)}", "ERROR")
            return False
    
    def test_user_registration(self):
        """Test user registration for all three roles"""
        self.log("Testing user registration...")
        
        test_users = [
            {
                "email": f"priya.ngo.{datetime.now().strftime('%H%M%S')}@ruralwomen.org",
                "password": "SecurePass123!",
                "name": "Priya Sharma",
                "role": "ngo",
                "organization": "Rural Women Empowerment Foundation",
                "phone": "+91-9876543210"
            },
            {
                "email": f"meera.business.{datetime.now().strftime('%H%M%S')}@acharmama.com",
                "password": "BusinessPass456!",
                "name": "Meera Devi",
                "role": "business_owner",
                "organization": "Achar Mama Enterprises",
                "phone": "+91-8765432109"
            },
            {
                "email": f"rajesh.corp.{datetime.now().strftime('%H%M%S')}@reliancemart.com",
                "password": "CorporatePass789!",
                "name": "Rajesh Kumar",
                "role": "corporate",
                "organization": "Reliance Mart",
                "phone": "+91-7654321098"
            }
        ]
        
        success_count = 0
        for user_data in test_users:
            try:
                response = requests.post(f"{self.base_url}/auth/register", json=user_data)
                if response.status_code == 200:
                    data = response.json()
                    self.tokens[user_data["role"]] = data["access_token"]
                    self.users[user_data["role"]] = data["user"]
                    self.log(f"✅ Registered {user_data['role']}: {user_data['name']}")
                    success_count += 1
                else:
                    self.log(f"❌ Registration failed for {user_data['role']}: {response.status_code} - {response.text}", "ERROR")
            except Exception as e:
                self.log(f"❌ Registration error for {user_data['role']}: {str(e)}", "ERROR")
        
        return success_count == len(test_users)
    
    def test_user_login(self):
        """Test user login functionality"""
        self.log("Testing user login...")
        
        login_data = [
            {"email": "priya.ngo@ruralwomen.org", "password": "SecurePass123!", "role": "ngo"},
            {"email": "meera.business@acharmama.com", "password": "BusinessPass456!", "role": "business_owner"},
            {"email": "rajesh.corp@reliancemart.com", "password": "CorporatePass789!", "role": "corporate"}
        ]
        
        success_count = 0
        for login in login_data:
            try:
                response = requests.post(f"{self.base_url}/auth/login", json={
                    "email": login["email"],
                    "password": login["password"]
                })
                if response.status_code == 200:
                    data = response.json()
                    # Update tokens from login
                    self.tokens[login["role"]] = data["access_token"]
                    self.log(f"✅ Login successful for {login['role']}")
                    success_count += 1
                else:
                    self.log(f"❌ Login failed for {login['role']}: {response.status_code} - {response.text}", "ERROR")
            except Exception as e:
                self.log(f"❌ Login error for {login['role']}: {str(e)}", "ERROR")
        
        return success_count == len(login_data)
    
    def test_business_creation(self):
        """Test business profile creation by business owners"""
        self.log("Testing business creation...")
        
        if "business_owner" not in self.tokens:
            self.log("❌ No business owner token available", "ERROR")
            return False
        
        business_data = [
            {
                "name": "Meera's Authentic Achar",
                "description": "Traditional homemade pickles using organic vegetables and authentic spices passed down through generations",
                "category": "achar",
                "location": "Rajasthan, India",
                "revenue_range": "₹50,000 - ₹1,00,000 annually",
                "employees_count": 3,
                "products": ["Mango Pickle", "Mixed Vegetable Pickle", "Lemon Pickle", "Garlic Pickle"],
                "image_url": "https://example.com/achar-business.jpg"
            },
            {
                "name": "Sunita's Papad Paradise",
                "description": "Handcrafted papads made with traditional recipes, sun-dried for authentic taste and texture",
                "category": "papad",
                "location": "Gujarat, India",
                "revenue_range": "₹30,000 - ₹60,000 annually",
                "employees_count": 2,
                "products": ["Urad Dal Papad", "Moong Dal Papad", "Rice Papad", "Masala Papad"],
                "image_url": "https://example.com/papad-business.jpg"
            }
        ]
        
        headers = {"Authorization": f"Bearer {self.tokens['business_owner']}"}
        success_count = 0
        
        for business in business_data:
            try:
                response = requests.post(f"{self.base_url}/businesses", json=business, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    self.businesses[data["id"]] = data
                    self.log(f"✅ Created business: {business['name']}")
                    success_count += 1
                else:
                    self.log(f"❌ Business creation failed: {response.status_code} - {response.text}", "ERROR")
            except Exception as e:
                self.log(f"❌ Business creation error: {str(e)}", "ERROR")
        
        return success_count > 0
    
    def test_business_listing(self):
        """Test business listing endpoints"""
        self.log("Testing business listing...")
        
        try:
            # Test public business listing
            response = requests.get(f"{self.base_url}/businesses")
            if response.status_code == 200:
                businesses = response.json()
                self.log(f"✅ Retrieved {len(businesses)} businesses from public listing")
                
                # Test my businesses endpoint
                if "business_owner" in self.tokens:
                    headers = {"Authorization": f"Bearer {self.tokens['business_owner']}"}
                    response = requests.get(f"{self.base_url}/businesses/my", headers=headers)
                    if response.status_code == 200:
                        my_businesses = response.json()
                        self.log(f"✅ Retrieved {len(my_businesses)} businesses for business owner")
                        return True
                    else:
                        self.log(f"❌ My businesses failed: {response.status_code} - {response.text}", "ERROR")
                        return False
                else:
                    return True
            else:
                self.log(f"❌ Business listing failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Business listing error: {str(e)}", "ERROR")
            return False
    
    def test_event_creation(self):
        """Test event creation by NGOs"""
        self.log("Testing event creation...")
        
        if "ngo" not in self.tokens:
            self.log("❌ No NGO token available", "ERROR")
            return False
        
        # Get businesses to include in events
        business_list = list(self.businesses.values())
        if not business_list:
            self.log("❌ No businesses available for event creation", "ERROR")
            return False
        
        event_data = {
            "title": "Rural Women Entrepreneurs Showcase 2025",
            "description": "A comprehensive platform connecting rural women entrepreneurs with corporate partners to scale their traditional businesses and create sustainable livelihoods",
            "initiative_type": "women_empowerment",
            "date": (datetime.now() + timedelta(days=30)).isoformat(),
            "location": "New Delhi Convention Center",
            "target_audience": "Corporate CSR teams, Impact investors, Retail chains",
            "participating_businesses": [
                {
                    "business_id": business_list[0]["id"],
                    "business_name": business_list[0]["name"],
                    "description": business_list[0]["description"],
                    "category": business_list[0]["category"]
                }
            ],
            "invited_corporates": []
        }
        
        headers = {"Authorization": f"Bearer {self.tokens['ngo']}"}
        
        try:
            response = requests.post(f"{self.base_url}/events", json=event_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.events[data["id"]] = data
                self.log(f"✅ Created event: {event_data['title']}")
                return True
            else:
                self.log(f"❌ Event creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Event creation error: {str(e)}", "ERROR")
            return False
    
    def test_event_listing(self):
        """Test event listing endpoints"""
        self.log("Testing event listing...")
        
        try:
            # Test public event listing
            response = requests.get(f"{self.base_url}/events")
            if response.status_code == 200:
                events = response.json()
                self.log(f"✅ Retrieved {len(events)} events from public listing")
                
                # Test specific event retrieval
                if events:
                    event_id = events[0]["id"]
                    response = requests.get(f"{self.base_url}/events/{event_id}")
                    if response.status_code == 200:
                        event = response.json()
                        self.log(f"✅ Retrieved specific event: {event['title']}")
                    else:
                        self.log(f"❌ Specific event retrieval failed: {response.status_code}", "ERROR")
                
                # Test my events endpoint for NGO
                if "ngo" in self.tokens:
                    headers = {"Authorization": f"Bearer {self.tokens['ngo']}"}
                    response = requests.get(f"{self.base_url}/events/my", headers=headers)
                    if response.status_code == 200:
                        my_events = response.json()
                        self.log(f"✅ Retrieved {len(my_events)} events for NGO")
                    else:
                        self.log(f"❌ My events failed: {response.status_code} - {response.text}", "ERROR")
                
                return True
            else:
                self.log(f"❌ Event listing failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Event listing error: {str(e)}", "ERROR")
            return False
    
    def test_connection_creation(self):
        """Test connection creation by corporates"""
        self.log("Testing connection creation...")
        
        if "corporate" not in self.tokens:
            self.log("❌ No corporate token available", "ERROR")
            return False
        
        if not self.events or not self.businesses:
            self.log("❌ No events or businesses available for connection", "ERROR")
            return False
        
        event_id = list(self.events.keys())[0]
        business_id = list(self.businesses.keys())[0]
        
        connection_data = {
            "event_id": event_id,
            "business_id": business_id,
            "notes": "Interested in partnering for retail distribution of authentic pickles through our store network"
        }
        
        headers = {"Authorization": f"Bearer {self.tokens['corporate']}"}
        
        try:
            response = requests.post(f"{self.base_url}/connections", json=connection_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.connections[data["id"]] = data
                self.log(f"✅ Created connection between corporate and business")
                return True
            else:
                self.log(f"❌ Connection creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Connection creation error: {str(e)}", "ERROR")
            return False
    
    def test_connection_listing(self):
        """Test connection listing for different user roles"""
        self.log("Testing connection listing...")
        
        success_count = 0
        
        # Test for corporate user
        if "corporate" in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['corporate']}"}
            try:
                response = requests.get(f"{self.base_url}/connections", headers=headers)
                if response.status_code == 200:
                    connections = response.json()
                    self.log(f"✅ Corporate retrieved {len(connections)} connections")
                    success_count += 1
                else:
                    self.log(f"❌ Corporate connections failed: {response.status_code} - {response.text}", "ERROR")
            except Exception as e:
                self.log(f"❌ Corporate connections error: {str(e)}", "ERROR")
        
        # Test for business owner
        if "business_owner" in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['business_owner']}"}
            try:
                response = requests.get(f"{self.base_url}/connections", headers=headers)
                if response.status_code == 200:
                    connections = response.json()
                    self.log(f"✅ Business owner retrieved {len(connections)} connections")
                    success_count += 1
                else:
                    self.log(f"❌ Business owner connections failed: {response.status_code} - {response.text}", "ERROR")
            except Exception as e:
                self.log(f"❌ Business owner connections error: {str(e)}", "ERROR")
        
        # Test for NGO
        if "ngo" in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['ngo']}"}
            try:
                response = requests.get(f"{self.base_url}/connections", headers=headers)
                if response.status_code == 200:
                    connections = response.json()
                    self.log(f"✅ NGO retrieved {len(connections)} connections")
                    success_count += 1
                else:
                    self.log(f"❌ NGO connections failed: {response.status_code} - {response.text}", "ERROR")
            except Exception as e:
                self.log(f"❌ NGO connections error: {str(e)}", "ERROR")
        
        return success_count > 0
    
    def test_role_based_access_control(self):
        """Test role-based access control"""
        self.log("Testing role-based access control...")
        
        success_count = 0
        
        # Test business creation with non-business-owner token
        if "ngo" in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['ngo']}"}
            business_data = {
                "name": "Test Business",
                "description": "Test",
                "category": "test",
                "location": "Test"
            }
            try:
                response = requests.post(f"{self.base_url}/businesses", json=business_data, headers=headers)
                if response.status_code == 403:
                    self.log("✅ NGO correctly denied business creation")
                    success_count += 1
                else:
                    self.log(f"❌ NGO should be denied business creation: {response.status_code}", "ERROR")
            except Exception as e:
                self.log(f"❌ RBAC test error: {str(e)}", "ERROR")
        
        # Test event creation with non-NGO token
        if "corporate" in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['corporate']}"}
            event_data = {
                "title": "Test Event",
                "description": "Test",
                "initiative_type": "test",
                "date": datetime.now().isoformat(),
                "location": "Test",
                "target_audience": "Test"
            }
            try:
                response = requests.post(f"{self.base_url}/events", json=event_data, headers=headers)
                if response.status_code == 403:
                    self.log("✅ Corporate correctly denied event creation")
                    success_count += 1
                else:
                    self.log(f"❌ Corporate should be denied event creation: {response.status_code}", "ERROR")
            except Exception as e:
                self.log(f"❌ RBAC test error: {str(e)}", "ERROR")
        
        return success_count > 0
    
    def run_all_tests(self):
        """Run all backend tests"""
        self.log("=" * 60)
        self.log("STARTING CSR PLATFORM BACKEND API TESTS")
        self.log("=" * 60)
        
        test_results = {}
        
        # Test API root
        test_results["api_root"] = self.test_api_root()
        
        # Test authentication
        test_results["user_registration"] = self.test_user_registration()
        test_results["user_login"] = self.test_user_login()
        
        # Test business management
        test_results["business_creation"] = self.test_business_creation()
        test_results["business_listing"] = self.test_business_listing()
        
        # Test event management
        test_results["event_creation"] = self.test_event_creation()
        test_results["event_listing"] = self.test_event_listing()
        
        # Test connection management
        test_results["connection_creation"] = self.test_connection_creation()
        test_results["connection_listing"] = self.test_connection_listing()
        
        # Test role-based access control
        test_results["role_based_access"] = self.test_role_based_access_control()
        
        # Summary
        self.log("=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
        
        self.log("=" * 60)
        self.log(f"OVERALL: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        if passed == total:
            self.log("🎉 ALL BACKEND TESTS PASSED!")
            return True
        else:
            self.log("⚠️  SOME TESTS FAILED - CHECK LOGS ABOVE")
            return False

if __name__ == "__main__":
    tester = CSRPlatformTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)