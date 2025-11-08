# Authentication Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the authentication system into your frontend and backend applications. It includes code examples, best practices, and common use cases.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Frontend Integration](#frontend-integration)
3. [Backend Integration](#backend-integration)
4. [Common Use Cases](#common-use-cases)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 16+ installed
- React 18+ for frontend examples
- Express.js for backend examples
- Understanding of JWT tokens

### Installation

```bash
# Install required packages for frontend
npm install axios jwt-decode

# Install required packages for backend
npm install jsonwebtoken bcrypt
```

### 5-Minute Setup

1. **Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "firstName": "Test",
    "lastName": "User",
    "role": "patient"
  }'
```

2. **Store the returned tokens securely**

3. **Use the access token for authenticated requests:**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Frontend Integration

### React Setup

#### 1. Create Authentication Context

```javascript
// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Decode token to get user info
      try {
        const decoded = jwtDecode(token);
        setUser({
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        });
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  // Register new user
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, refreshToken, user } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);

      setToken(token);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Login existing user
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, refreshToken, user } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);

      setToken(token);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Refresh access token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post('/api/auth/refresh', { refreshToken });
      const { token: newToken } = response.data;

      localStorage.setItem('accessToken', newToken);
      setToken(newToken);

      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axios.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    refreshAccessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### 2. Setup Axios Interceptor for Token Refresh

```javascript
// src/utils/axiosConfig.js
import axios from 'axios';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setupAxiosInterceptors = (refreshAccessToken, logout) => {
  // Response interceptor for token refresh
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue the request while token is being refreshed
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return axios(originalRequest);
            })
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          processQueue(null, newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (err) {
          processQueue(err, null);
          logout();
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};
```

#### 3. Create Login Component

```javascript
// src/components/LoginForm.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm;
```

#### 4. Create Registration Component

```javascript
// src/components/RegistrationForm.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'patient'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!minLength) return 'Password must be at least 8 characters';
    if (!hasUppercase) return 'Password must contain an uppercase letter';
    if (!hasLowercase) return 'Password must contain a lowercase letter';
    if (!hasNumber) return 'Password must contain a number';

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password requirements
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="firstName">First Name:</label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="lastName">Last Name:</label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />
        <small>Min 8 chars, 1 uppercase, 1 lowercase, 1 number</small>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="form-group">
        <label htmlFor="role">Role:</label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="patient">Patient</option>
          <option value="staff">Staff</option>
          <option value="provider">Provider</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegistrationForm;
```

#### 5. Create Protected Route Component

```javascript
// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;
```

#### 6. Setup App with Routes

```javascript
// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setupAxiosInterceptors } from './utils/axiosConfig';
import LoginForm from './components/LoginForm';
import RegistrationForm from './components/RegistrationForm';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';

const AppContent = () => {
  const { refreshAccessToken, logout } = useAuth();

  useEffect(() => {
    setupAxiosInterceptors(refreshAccessToken, logout);
  }, [refreshAccessToken, logout]);

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegistrationForm />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
```

---

## Backend Integration

### Express.js Middleware Setup

#### 1. Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please refresh your token'
      });
    }
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
};

module.exports = authenticateToken;
```

#### 2. Role-Based Authorization Middleware

```javascript
// middleware/authorize.js
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = authorize;
```

#### 3. Protect Routes

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// All routes require authentication
router.use(authenticateToken);

// Get current user profile (any authenticated user)
router.get('/profile', (req, res) => {
  res.json({
    user: req.user
  });
});

// Admin only route
router.get('/admin/users', authorize('admin'), async (req, res) => {
  // Admin-only logic
  const users = await User.find();
  res.json(users);
});

// Provider and admin route
router.get('/patients', authorize('provider', 'admin'), async (req, res) => {
  // Provider/admin logic
  const patients = await Patient.find();
  res.json(patients);
});

module.exports = router;
```

---

## Common Use Cases

### Use Case 1: User Registration Flow

```javascript
// Complete registration with error handling
const handleRegistration = async () => {
  try {
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123',
      firstName: 'New',
      lastName: 'User',
      role: 'patient'
    };

    const response = await axios.post('/api/auth/register', userData);

    // Store tokens
    localStorage.setItem('accessToken', response.data.token);
    localStorage.setItem('refreshToken', response.data.refreshToken);

    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error) {
    if (error.response?.status === 409) {
      alert('Email already registered. Please login instead.');
    } else if (error.response?.status === 400) {
      alert('Invalid data: ' + error.response.data.message);
    } else {
      alert('Registration failed. Please try again.');
    }
  }
};
```

### Use Case 2: Automatic Token Refresh

```javascript
// Setup automatic token refresh before expiration
const setupAutoRefresh = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  try {
    const decoded = jwtDecode(token);
    const expiresIn = decoded.exp * 1000 - Date.now();

    // Refresh 5 minutes before expiration
    const refreshTime = expiresIn - (5 * 60 * 1000);

    if (refreshTime > 0) {
      setTimeout(async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', response.data.token);
        setupAutoRefresh(); // Setup next refresh
      }, refreshTime);
    }
  } catch (error) {
    console.error('Token decode error:', error);
  }
};
```

### Use Case 3: Persistent Login

```javascript
// Check and restore session on app load
const restoreSession = async () => {
  const token = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!token && !refreshToken) {
    return null; // No session to restore
  }

  try {
    // Try to use existing token
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 > Date.now()) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return decoded;
    }
  } catch (error) {
    // Token invalid or expired, try refresh
  }

  // Token expired, try to refresh
  try {
    const response = await axios.post('/api/auth/refresh', { refreshToken });
    localStorage.setItem('accessToken', response.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    return jwtDecode(response.data.token);
  } catch (error) {
    // Refresh failed, clear session
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return null;
  }
};
```

### Use Case 4: Role-Based UI Rendering

```javascript
// Conditionally render based on user role
const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Everyone sees this */}
      <UserProfile />

      {/* Only providers and admins see this */}
      {(['provider', 'admin'].includes(user.role)) && (
        <PatientList />
      )}

      {/* Only admins see this */}
      {user.role === 'admin' && (
        <AdminPanel />
      )}
    </div>
  );
};
```

### Use Case 5: Handling Multiple Simultaneous Requests

```javascript
// Making multiple authenticated requests efficiently
const fetchDashboardData = async () => {
  try {
    const [profile, appointments, messages] = await Promise.all([
      axios.get('/api/users/profile'),
      axios.get('/api/appointments'),
      axios.get('/api/messages')
    ]);

    return {
      profile: profile.data,
      appointments: appointments.data,
      messages: messages.data
    };
  } catch (error) {
    // Axios interceptor will handle token refresh for all requests
    console.error('Failed to fetch dashboard data:', error);
    throw error;
  }
};
```

---

## Troubleshooting

### Issue 1: "Token expired" error on every request

**Cause:** Access token has expired and refresh flow is not working.

**Solution:**
1. Check that refresh token is stored correctly
2. Verify axios interceptor is properly configured
3. Ensure refresh endpoint is accessible
4. Check that refresh token hasn't expired (7 days)

```javascript
// Debug token expiration
const token = localStorage.getItem('accessToken');
const decoded = jwtDecode(token);
console.log('Token expires:', new Date(decoded.exp * 1000));
console.log('Current time:', new Date());
```

### Issue 2: Infinite redirect loop between login and protected route

**Cause:** User state not properly synchronized with token.

**Solution:**
1. Ensure `loading` state is handled in ProtectedRoute
2. Check that token is being read from storage on mount
3. Verify token is valid before setting user state

```javascript
// Add loading state to ProtectedRoute
if (loading) {
  return <div>Loading...</div>; // Or loading spinner
}
```

### Issue 3: "CORS policy" errors

**Cause:** Backend not configured to accept requests from frontend origin.

**Solution:**
Configure CORS in your Express backend:

```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3001', // Your frontend URL
  credentials: true
}));
```

### Issue 4: 401 errors after token refresh

**Cause:** New token not being set in axios headers.

**Solution:**
Update axios default headers after token refresh:

```javascript
const newToken = await refreshAccessToken();
axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
```

### Issue 5: Password validation failing unexpectedly

**Cause:** Frontend and backend validation rules don't match.

**Solution:**
Use the same validation function on both:

```javascript
const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
};
```

### Issue 6: User logged out unexpectedly

**Possible Causes:**
1. Refresh token expired (after 7 days)
2. Token invalidated on backend (after logout from another device)
3. localStorage cleared by user

**Solution:**
1. Implement "Remember Me" functionality with longer refresh token expiry
2. Show clear message when session expires
3. Provide easy re-login flow

```javascript
// Show session expired message
if (error.response?.status === 401) {
  alert('Your session has expired. Please login again.');
  logout();
  navigate('/login');
}
```

### Issue 7: Multiple token refresh requests

**Cause:** Multiple API calls triggering refresh simultaneously.

**Solution:**
Use request queue pattern (already implemented in axiosConfig example above):

```javascript
let isRefreshing = false;
let failedQueue = [];

// Queue requests while refreshing
if (isRefreshing) {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
}
```

### Debug Checklist

When authentication isn't working:

- [ ] Check browser console for errors
- [ ] Verify tokens are stored in localStorage
- [ ] Check network tab for API request/response
- [ ] Validate token hasn't expired using jwt.io
- [ ] Ensure Authorization header is being sent
- [ ] Check backend logs for authentication errors
- [ ] Verify environment variables are set correctly
- [ ] Test authentication endpoints with curl/Postman
- [ ] Check CORS configuration
- [ ] Verify JWT_SECRET matches between services

---

## Best Practices

1. **Never store sensitive data in tokens** - Only store user ID, role, and essential metadata
2. **Use httpOnly cookies in production** - More secure than localStorage for token storage
3. **Implement token refresh** - Don't force users to login every hour
4. **Handle errors gracefully** - Show user-friendly messages, not technical errors
5. **Log authentication events** - Track login attempts, failures, and suspicious activity
6. **Use HTTPS in production** - Never send tokens over unencrypted connections
7. **Implement rate limiting** - Prevent brute force attacks
8. **Validate on both client and server** - Client for UX, server for security
9. **Clear tokens on logout** - Remove from storage and invalidate on backend
10. **Test edge cases** - Expired tokens, invalid credentials, network failures

---

## Next Steps

- [API Documentation](../api/authentication.md) - Detailed endpoint specifications
- [Security Best Practices](../security/authentication-security.md) - Security guidelines and recommendations
