# Authentication API Reference

## Overview

The Authentication API provides endpoints for user registration, login, token refresh, and logout functionality. All authentication is handled via JWT (JSON Web Tokens) with a refresh token mechanism for extended sessions.

**Base URL:** `/api/auth`

**Authentication Method:** Bearer Token (JWT)

**Token Expiration:**
- Access Token: 1 hour
- Refresh Token: 7 days

---

## Endpoints

### 1. Register User

Create a new user account in the system.

**Endpoint:** `POST /api/auth/register`

**Authentication Required:** No

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "provider"
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address (unique) |
| password | string | Yes | Must meet password requirements |
| firstName | string | Yes | User's first name |
| lastName | string | Yes | User's last name |
| role | string | Yes | One of: admin, provider, staff, patient |

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

**Success Response (201 Created):**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "doctor@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "provider",
    "createdAt": "2025-10-30T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

**400 Bad Request** - Validation Error
```json
{
  "error": "Validation failed",
  "details": {
    "password": "Password must be at least 8 characters and contain uppercase, lowercase, and number"
  }
}
```

**409 Conflict** - Duplicate Email
```json
{
  "error": "User already exists",
  "message": "An account with this email address already exists"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "provider"
  }'
```

---

### 2. Login

Authenticate an existing user and receive access tokens.

**Endpoint:** `POST /api/auth/login`

**Authentication Required:** No

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "SecurePass123"
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_abc123",
    "email": "doctor@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "provider"
  }
}
```

**Error Responses:**

**401 Unauthorized** - Invalid Credentials
```json
{
  "error": "Authentication failed",
  "message": "Invalid email or password"
}
```

**404 Not Found** - User Not Found
```json
{
  "error": "User not found",
  "message": "No account exists with this email address"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "SecurePass123"
  }'
```

---

### 3. Refresh Token

Obtain a new access token using a valid refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Authentication Required:** No (refresh token required in body)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes | Valid refresh token from login/register |

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

**401 Unauthorized** - Invalid or Expired Token
```json
{
  "error": "Invalid token",
  "message": "Refresh token is invalid or has expired"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

### 4. Logout

Invalidate a refresh token to end a user session.

**Endpoint:** `POST /api/auth/logout`

**Authentication Required:** No (refresh token required in body)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes | Refresh token to invalidate |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses:**

**401 Unauthorized** - Invalid Token
```json
{
  "error": "Invalid token",
  "message": "Refresh token is invalid"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

## Error Code Reference

| Status Code | Error Type | Description | Common Causes |
|-------------|------------|-------------|---------------|
| 400 | Bad Request | Request validation failed | Missing required fields, invalid data format, password requirements not met |
| 401 | Unauthorized | Authentication failed | Invalid credentials, expired token, invalid token |
| 404 | Not Found | Resource not found | User email doesn't exist |
| 409 | Conflict | Resource already exists | Email already registered |
| 500 | Internal Server Error | Server-side error | Database error, server misconfiguration |

---

## Rate Limiting

To prevent abuse, the authentication endpoints are rate-limited:

- **Registration:** 5 requests per IP per hour
- **Login:** 10 requests per IP per 15 minutes (account lockout after 5 failed attempts)
- **Refresh:** 20 requests per token per hour
- **Logout:** 10 requests per token per hour

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1698765432
```

When rate limit is exceeded:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

---

## Authentication Flow Diagram

```
Registration Flow:
------------------
Client                          Server                      Database
  |                               |                             |
  |--POST /api/auth/register----->|                             |
  |  {email, password, ...}       |                             |
  |                               |--Check email exists-------->|
  |                               |<--Email available-----------|
  |                               |--Hash password              |
  |                               |--Create user record-------->|
  |                               |<--User created--------------|
  |                               |--Generate JWT tokens        |
  |<--{user, token, refreshToken}-|                             |
  |                               |                             |


Login Flow:
-----------
Client                          Server                      Database
  |                               |                             |
  |--POST /api/auth/login-------->|                             |
  |  {email, password}            |                             |
  |                               |--Find user by email-------->|
  |                               |<--User record---------------|
  |                               |--Verify password hash       |
  |                               |--Generate JWT tokens        |
  |<--{token, refreshToken, user}-|                             |
  |                               |                             |


Token Refresh Flow:
-------------------
Client                          Server                      Database
  |                               |                             |
  |--POST /api/auth/refresh------>|                             |
  |  {refreshToken}               |                             |
  |                               |--Verify refresh token------>|
  |                               |<--Token valid---------------|
  |                               |--Generate new access token  |
  |<--{token}---------------------|                             |
  |                               |                             |


Logout Flow:
------------
Client                          Server                      Database
  |                               |                             |
  |--POST /api/auth/logout------->|                             |
  |  {refreshToken}               |                             |
  |                               |--Invalidate token---------->|
  |                               |<--Token invalidated---------|
  |<--{success: true}-------------|                             |
  |                               |                             |
```

---

## Using Access Tokens

After successful login or registration, use the access token in the Authorization header for protected endpoints:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example with cURL:**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Token Structure

**Access Token Payload:**
```json
{
  "userId": "user_abc123",
  "email": "doctor@example.com",
  "role": "provider",
  "iat": 1698765432,
  "exp": 1698769032
}
```

**Refresh Token Payload:**
```json
{
  "userId": "user_abc123",
  "tokenId": "refresh_xyz789",
  "iat": 1698765432,
  "exp": 1699370232
}
```

---

## Security Considerations

1. **HTTPS Only:** All authentication endpoints must be accessed over HTTPS in production
2. **Token Storage:** Store tokens securely (httpOnly cookies or secure storage, never localStorage)
3. **Token Transmission:** Always send tokens in Authorization header, never in URL parameters
4. **Password Handling:** Never log or expose passwords in any form
5. **CORS:** Configure CORS properly to restrict access to trusted origins
6. **XSS Protection:** Implement proper Content Security Policy headers
7. **CSRF Protection:** Use CSRF tokens for state-changing operations

---

## Next Steps

- [Integration Guide](../guides/authentication-integration.md) - Learn how to integrate authentication in your application
- [Security Best Practices](../security/authentication-security.md) - Detailed security guidelines
