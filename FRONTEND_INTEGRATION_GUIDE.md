# 🚀 Frontend Integration Guide

## 🔗 API Base URL

After HTTPS setup, use:
```javascript
const API_BASE_URL = 'https://tourlicity.duckdns.org';
```

## 📱 React/Next.js Integration

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://tourlicity.duckdns.org
```

### API Service Setup
```javascript
// services/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tourlicity.duckdns.org';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Authentication
  async googleAuth(userData) {
    return this.request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Bookings
  async getBookings(token) {
    return this.request('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async createBooking(bookingData, token) {
    return this.request('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(bookingData),
    });
  }

  // Locations
  async getLocations() {
    return this.request('/api/locations');
  }

  // Reviews
  async getReviews(locationId) {
    return this.request(`/api/reviews?location=${locationId}`);
  }

  async createReview(reviewData, token) {
    return this.request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(reviewData),
    });
  }

  // File uploads
  async uploadFile(file, token) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/api/uploads', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData
      },
      body: formData,
    });
  }
}

export default new ApiService();
```

### React Hook for API
```javascript
// hooks/useApi.js
import { useState, useEffect } from 'react';
import ApiService from '../services/api';

export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await ApiService.request(endpoint, options);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}

// Usage example
function LocationsList() {
  const { data: locations, loading, error } = useApi('/api/locations');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {locations?.map(location => (
        <div key={location._id}>{location.name}</div>
      ))}
    </div>
  );
}
```

## 📱 React Native Integration

```javascript
// services/ApiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = 'https://tourlicity.duckdns.org';
  }

  async getAuthToken() {
    return await AsyncStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  // Google Sign-In integration
  async signInWithGoogle(googleUser) {
    const userData = {
      google_id: googleUser.user.id,
      email: googleUser.user.email,
      first_name: googleUser.user.givenName,
      last_name: googleUser.user.familyName,
    };

    const response = await this.request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store token
    await AsyncStorage.setItem('authToken', response.token);
    return response;
  }
}

export default new ApiService();
```

## 🌐 Vanilla JavaScript Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>Tourlicity API Integration</title>
</head>
<body>
    <script>
        const API_BASE_URL = 'https://tourlicity.duckdns.org';

        class TourlicityAPI {
            constructor() {
                this.baseURL = API_BASE_URL;
                this.token = localStorage.getItem('authToken');
            }

            async request(endpoint, options = {}) {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(this.token && { Authorization: `Bearer ${this.token}` }),
                        ...options.headers,
                    },
                    ...options,
                };

                try {
                    const response = await fetch(`${this.baseURL}${endpoint}`, config);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    return await response.json();
                } catch (error) {
                    console.error('API Error:', error);
                    throw error;
                }
            }

            async healthCheck() {
                return this.request('/health');
            }

            async authenticate(googleData) {
                const response = await this.request('/api/auth/google', {
                    method: 'POST',
                    body: JSON.stringify(googleData),
                });
                
                this.token = response.token;
                localStorage.setItem('authToken', this.token);
                return response;
            }
        }

        // Usage
        const api = new TourlicityAPI();
        
        // Test connection
        api.healthCheck()
            .then(health => console.log('API Health:', health))
            .catch(error => console.error('API Error:', error));
    </script>
</body>
</html>
```

## 🔧 Error Handling Best Practices

```javascript
// utils/errorHandler.js
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function handleApiError(error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        break;
      case 403:
        // Show permission denied message
        alert('Permission denied');
        break;
      case 500:
        // Show server error message
        alert('Server error. Please try again later.');
        break;
      default:
        alert(`Error: ${error.message}`);
    }
  } else {
    console.error('Unexpected error:', error);
    alert('An unexpected error occurred');
  }
}
```

## 🧪 Testing Your Integration

```javascript
// Test script
async function testApiIntegration() {
  const api = new ApiService();
  
  try {
    // Test health
    console.log('Testing health endpoint...');
    const health = await api.healthCheck();
    console.log('✅ Health check passed:', health);
    
    // Test locations
    console.log('Testing locations endpoint...');
    const locations = await api.getLocations();
    console.log('✅ Locations loaded:', locations.length);
    
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testApiIntegration();
```

## 📋 Environment Configuration

### Development
```javascript
const API_BASE_URL = 'http://localhost:5000';
```

### Production
```javascript
const API_BASE_URL = 'https://tourlicity.duckdns.org';
```

### Auto-detect
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://tourlicity.duckdns.org'
  : 'http://localhost:5000';
```