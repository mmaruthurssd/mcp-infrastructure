# Frontend Integration Guide
## Medical Practice Authentication Backend

This guide provides everything the frontend team needs to integrate with the authentication backend.

---

## Base URL
```
http://localhost:3000/api/auth
```

## Authentication Flow

### 1. User Registration

**Endpoint**: `POST /api/auth/register`

**Request**:
```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'doctor@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    role: 'provider' // Options: 'admin', 'provider', 'staff', 'patient'
  })
});

const data = await response.json();
```

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "doctor@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "provider",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (409 - Email exists)**:
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

**Error Response (400 - Validation failed)**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

---

### 2. User Login

**Endpoint**: `POST /api/auth/login`

**Request**:
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'doctor@example.com',
    password: 'SecurePass123!'
  })
});

const data = await response.json();
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "doctor@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "provider",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 - Invalid credentials)**:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### 3. Refresh Access Token

**Endpoint**: `POST /api/auth/refresh`

**Request**:
```javascript
const response = await fetch('http://localhost:3000/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
});

const data = await response.json();
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 - Invalid/expired token)**:
```json
{
  "success": false,
  "error": "Refresh token has expired"
}
```

---

### 4. Logout

**Endpoint**: `POST /api/auth/logout`

**Request**:
```javascript
const response = await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
});

const data = await response.json();
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Logged out successfully"
  }
}
```

---

## Making Authenticated Requests

Once logged in, include the access token in the `Authorization` header:

```javascript
const response = await fetch('http://localhost:3000/api/protected-route', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Token Management Best Practices

### Storage Recommendations

1. **Access Token**:
   - Store in memory (React state/context)
   - OR sessionStorage (less secure but acceptable for POC)
   - NEVER in localStorage (vulnerable to XSS)

2. **Refresh Token**:
   - Ideally: httpOnly cookie (requires backend modification)
   - Alternative: Secure storage with encryption
   - NEVER in localStorage

### Token Refresh Strategy

**Option 1: Proactive Refresh**
```javascript
// Refresh token before it expires (e.g., after 50 minutes)
setInterval(async () => {
  const newAccessToken = await refreshAccessToken();
  updateAccessToken(newAccessToken);
}, 50 * 60 * 1000); // 50 minutes
```

**Option 2: Reactive Refresh (Recommended)**
```javascript
// Intercept 401 errors and refresh token
async function fetchWithAuth(url, options) {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });

  // If 401, try refreshing token
  if (response.status === 401) {
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      // Retry original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`
        }
      });
    } else {
      // Refresh failed, redirect to login
      redirectToLogin();
    }
  }

  return response;
}
```

---

## React Integration Example

### Auth Context Provider

```typescript
import React, { createContext, useState, useContext, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const { data } = await response.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    // Store refresh token securely
    sessionStorage.setItem('refreshToken', data.refreshToken);
  };

  const register = async (registerData: RegisterData) => {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const { data } = await response.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    sessionStorage.setItem('refreshToken', data.refreshToken);
  };

  const logout = async () => {
    if (refreshToken) {
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    sessionStorage.removeItem('refreshToken');
  };

  const value = {
    user,
    accessToken,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!accessToken
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

### Protected Route Component

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};
```

---

## Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-)

**Example valid passwords**:
- `SecurePass123!`
- `MyP@ssw0rd`
- `Doctor#2024`

---

## User Roles

The system supports 4 user roles:

1. **admin**: Full system access
2. **provider**: Healthcare providers (doctors, nurses)
3. **staff**: Administrative staff
4. **patient**: Patient portal access

**Role validation**: Role must be exactly one of these strings (lowercase).

---

## Error Handling

All API responses follow this format:

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message"
}
```

**Validation Error**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "fieldName", "message": "Error message" }
  ]
}
```

### HTTP Status Codes

- **200**: Success (login, refresh, logout)
- **201**: Created (registration)
- **400**: Bad request (validation error)
- **401**: Unauthorized (invalid credentials, expired token)
- **403**: Forbidden (insufficient permissions)
- **409**: Conflict (email already exists)
- **500**: Internal server error

---

## CORS Configuration

The backend has CORS enabled by default. For production, update the CORS configuration in `src/app.ts`:

```typescript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

---

## Testing the API

### Using cURL

**Register**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "patient"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

**Refresh**:
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Logout**:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Using Postman

1. Import the API endpoints
2. Set base URL: `http://localhost:3000/api/auth`
3. For authenticated requests, add header:
   - Key: `Authorization`
   - Value: `Bearer <your_access_token>`

---

## JWT Token Structure

The access token contains:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "doctor@example.com",
  "role": "provider",
  "iat": 1234567890,
  "exp": 1234571490
}
```

You can decode the JWT on the frontend to access user information without making additional API calls. Use a library like `jwt-decode`:

```typescript
import jwtDecode from 'jwt-decode';

const decoded = jwtDecode(accessToken);
console.log(decoded.userId, decoded.role);
```

**Important**: JWT tokens are signed but NOT encrypted. Don't include sensitive data in tokens.

---

## Need Help?

Contact the backend team with:
- Endpoint you're calling
- Request payload
- Response received
- Expected behavior

---

## Checklist for Frontend Integration

- [ ] Implement login form
- [ ] Implement registration form with password validation
- [ ] Store tokens securely
- [ ] Add Authorization header to protected requests
- [ ] Implement token refresh logic
- [ ] Handle 401 errors and redirect to login
- [ ] Implement logout functionality
- [ ] Add role-based route protection
- [ ] Display validation errors to users
- [ ] Test all authentication flows
