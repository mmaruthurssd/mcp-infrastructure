# Quick Start Guide
## Get the Authentication Backend Running in 5 Minutes

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

---

## Step-by-Step Setup

### 1. Install Dependencies (1 minute)

```bash
cd auth-backend
npm install
```

### 2. Configure Environment (1 minute)

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and update:

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/medical_practice_db?schema=public"

# Generate strong secrets (or use these for testing ONLY)
JWT_ACCESS_SECRET="your-super-secret-access-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

PORT=3000
NODE_ENV=development
```

**For testing, you can use the example secrets, but NEVER in production!**

### 3. Setup Database (2 minutes)

Generate Prisma Client:
```bash
npm run prisma:generate
```

Run database migrations:
```bash
npm run prisma:migrate
```

When prompted for migration name, enter: `init`

### 4. Start Server (1 minute)

```bash
npm run dev
```

You should see:
```
Authentication server running on port 3000
Health check: http://localhost:3000/health
API endpoints: http://localhost:3000/api/auth
```

---

## Test the API

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "provider"
  }'
```

Expected response (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "doctor@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "provider",
      "isActive": true,
      "createdAt": "..."
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "SecurePass123!"
  }'
```

---

## Troubleshooting

### Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env`
3. Test connection: `psql postgresql://username:password@localhost:5432/medical_practice_db`

### Migration Error

**Error**: `Database does not exist`

**Solution**:
```bash
# Create database manually
psql -U postgres -c "CREATE DATABASE medical_practice_db;"

# Then run migrations again
npm run prisma:migrate
```

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
1. Change PORT in `.env` to 3001 or another available port
2. Or kill process using port: `lsof -ti:3000 | xargs kill`

---

## Next Steps

1. Read **FRONTEND_INTEGRATION_GUIDE.md** for frontend integration
2. Read **README.md** for complete documentation
3. Test all 4 endpoints (register, login, refresh, logout)
4. Integrate with your frontend application

---

## Quick Reference

**Base URL**: `http://localhost:3000/api/auth`

**Endpoints**:
- `POST /register` - Create new user account
- `POST /login` - Authenticate user
- `POST /refresh` - Refresh access token
- `POST /logout` - Invalidate refresh token

**User Roles**: `admin`, `provider`, `staff`, `patient`

**Password Requirements**:
- 8+ characters
- 1 uppercase letter
- 1 lowercase letter
- 1 number
- 1 special character

---

## Development Tools

**Prisma Studio** (Database GUI):
```bash
npm run prisma:studio
```

Opens at http://localhost:5555

**View Database Schema**:
```bash
cat prisma/schema.prisma
```

**View Logs**:
```bash
npm run dev  # Logs to console
```

---

## Common Issues

### "Invalid email format"
Make sure email is valid format: `user@domain.com`

### "Password must contain..."
Password must meet all requirements (see above)

### "User with this email already exists"
Email is already registered. Use login or different email.

### "Invalid email or password"
Check credentials. Password is case-sensitive.

### "Refresh token has expired"
Refresh tokens expire after 7 days. Login again.

---

## Testing Checklist

- [ ] Health check works
- [ ] Register new user (success)
- [ ] Register duplicate email (error)
- [ ] Login with valid credentials (success)
- [ ] Login with invalid credentials (error)
- [ ] Refresh token (success)
- [ ] Logout (success)
- [ ] Use access token to make authenticated request

---

**Ready to Go!** The authentication backend is now running and ready for frontend integration.
