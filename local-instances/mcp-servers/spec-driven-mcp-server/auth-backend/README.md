# Medical Practice Authentication Backend

Backend authentication system for medical practice management application.

## Features

- User registration with email and password
- Secure password hashing with bcrypt (cost factor 10)
- JWT-based authentication (1-hour access token expiry)
- Refresh token rotation with database storage
- Role-based access control (admin, provider, staff, patient)
- Input validation with Zod
- PostgreSQL database with Prisma ORM
- TypeScript for type safety

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **CORS**: cors

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the following in `.env`:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_ACCESS_SECRET`: Strong secret for access tokens
- `JWT_REFRESH_SECRET`: Strong secret for refresh tokens

### 3. Setup Database

Generate Prisma Client:
```bash
npm run prisma:generate
```

Run database migrations:
```bash
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on http://localhost:3000

## API Endpoints

### 1. Register User
**POST** `/api/auth/register`

Request:
```json
{
  "email": "doctor@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "provider"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "doctor@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "provider",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2. Login
**POST** `/api/auth/login`

Request:
```json
{
  "email": "doctor@example.com",
  "password": "SecurePass123!"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 3. Refresh Token
**POST** `/api/auth/refresh`

Request:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 4. Logout
**POST** `/api/auth/logout`

Request:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Logged out successfully"
  }
}
```

## Frontend Integration Points

### Authentication Flow

1. **Registration/Login**:
   - Call `/api/auth/register` or `/api/auth/login`
   - Store `accessToken` in memory or session storage
   - Store `refreshToken` in httpOnly cookie or secure storage
   - Store user object in application state

2. **Making Authenticated Requests**:
   - Include access token in Authorization header:
     ```
     Authorization: Bearer <accessToken>
     ```

3. **Token Refresh**:
   - When access token expires (401 error), call `/api/auth/refresh`
   - Use stored refresh token
   - Update access token in storage
   - Retry original request

4. **Logout**:
   - Call `/api/auth/logout` with refresh token
   - Clear all stored tokens and user data

### Using Auth Middleware (Backend Routes)

```typescript
import { authenticate, authorize } from './middleware/auth.middleware';

// Protect route - any authenticated user
app.get('/api/protected', authenticate, (req, res) => {
  // Access user from req.user
});

// Protect route - specific roles only
app.get('/api/admin', authenticate, authorize('admin'), (req, res) => {
  // Only admin users can access
});
```

## Security Features

- Passwords hashed with bcrypt (cost factor 10)
- JWT tokens with 1-hour expiry
- Refresh tokens stored in database
- Token revocation on logout
- Role-based access control
- Input validation with Zod
- CORS enabled for frontend
- Protection against SQL injection (Prisma ORM)

## User Roles

- `admin`: Full system access
- `provider`: Healthcare provider (doctors, nurses)
- `staff`: Administrative staff
- `patient`: Patient portal access

## Error Handling

All errors return consistent format:
```json
{
  "success": false,
  "error": "Error message"
}
```

Validation errors include details:
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

## Database Schema

### Users Table
- `id`: UUID (primary key)
- `email`: String (unique)
- `password`: String (bcrypt hashed)
- `firstName`: String
- `lastName`: String
- `role`: Enum (ADMIN, PROVIDER, STAFF, PATIENT)
- `isActive`: Boolean
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### RefreshTokens Table
- `id`: UUID (primary key)
- `token`: String (unique)
- `userId`: UUID (foreign key)
- `expiresAt`: Timestamp
- `isRevoked`: Boolean
- `createdAt`: Timestamp

## Production Deployment

1. Set strong JWT secrets in environment variables
2. Use SSL/TLS for database connection
3. Enable HTTPS for API endpoints
4. Configure CORS for specific frontend domains
5. Set up rate limiting for auth endpoints
6. Enable audit logging for authentication events
7. Regular security updates for dependencies
