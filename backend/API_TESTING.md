# Backend API Testing Guide

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Initialize and seed the database:**
   ```bash
   npm run seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## Default Admin Credentials

```
Email: admin@example.com
Password: AdminPass123!
```

## API Endpoints

### Health & Info

#### GET /
Get API information

```bash
curl http://localhost:3000/
```

#### GET /health
Health check

```bash
curl http://localhost:3000/health
```

### Authentication (`/auth`)

#### POST /auth/login
Login and get access & refresh tokens

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123!"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### POST /auth/refresh
Refresh access token using refresh token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### POST /auth/logout
Logout and revoke refresh token

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### GET /auth/me
Get current user information

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Patients (`/patients`)

All patient routes require authentication.

#### GET /patients
Get all patients

```bash
curl http://localhost:3000/patients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### GET /patients/:id
Get single patient

```bash
curl http://localhost:3000/patients/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### POST /patients
Create new patient (Admin only)

```bash
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1980-05-15",
    "email": "john.doe@example.com",
    "phone": "555-123-4567"
  }'
```

#### PUT /patients/:id
Update patient (Admin only)

```bash
curl -X PUT http://localhost:3000/patients/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1980-05-15",
    "email": "john.updated@example.com",
    "phone": "555-999-8888"
  }'
```

#### DELETE /patients/:id
Delete patient (Admin only)

```bash
curl -X DELETE http://localhost:3000/patients/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### GET /patients/:id/readings
Get all readings for a patient

```bash
curl http://localhost:3000/patients/1/readings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### POST /patients/:id/readings
Add new reading for a patient

```bash
curl -X POST http://localhost:3000/patients/1/readings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-10-17T12:00:00Z",
    "systolicBP": 120,
    "diastolicBP": 80,
    "heartRate": 72,
    "deviceId": "SAMD-001",
    "notes": "Morning reading"
  }'
```

### Admin (`/admin`)

All admin routes require authentication AND admin role.

#### GET /admin/users
Get all users

```bash
curl http://localhost:3000/admin/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### POST /admin/users
Create new user

```bash
curl -X POST http://localhost:3000/admin/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "role": "user",
    "firstName": "New",
    "lastName": "User"
  }'
```

#### DELETE /admin/users/:id
Delete user

```bash
curl -X DELETE http://localhost:3000/admin/users/2 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### GET /admin/stats
Get system statistics

```bash
curl http://localhost:3000/admin/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "stats": {
    "users": 1,
    "patients": 50,
    "readings": 276,
    "activeTokens": 1
  }
}
```

#### GET /admin/recent-activity
Get recent readings (last 20)

```bash
curl http://localhost:3000/admin/recent-activity \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### DELETE /admin/readings/:id
Delete a specific reading

```bash
curl -X DELETE http://localhost:3000/admin/readings/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Testing Workflow

### 1. Login and Get Token

```bash
# Login
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123!"}')

# Extract access token
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.accessToken')

echo "Access Token: $ACCESS_TOKEN"
```

### 2. Get Patients

```bash
curl http://localhost:3000/patients \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3. Get Patient Readings

```bash
curl http://localhost:3000/patients/1/readings \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 4. Get Stats

```bash
curl http://localhost:3000/admin/stats \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Patient not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Database

The application uses SQLite with the following schema:

- **users**: User accounts (admin/user)
- **patients**: Patient information
- **readings**: Blood pressure and heart rate readings
- **refresh_tokens**: Active refresh tokens

Database location: `backend/data.db`

## Seed Data

Running `npm run seed` creates:
- 1 admin user (admin@example.com / AdminPass123!)
- 50 random patients
- 3-10 readings per patient (276 total)
- Readings from the last 30 days

## TypeScript Types

All types are defined in `backend/src/types/index.ts`:

- `User`: User account
- `Patient`: Patient information
- `Reading`: Blood pressure/heart rate reading
- `RefreshToken`: Refresh token storage
- `AuthTokens`: Access & refresh token pair
- `JWTPayload`: JWT token payload
- `AuthRequest`: Authenticated request interface

## JWT Configuration

Tokens are configured in `.env`:

- **Access Token**: Short-lived (default: 15 minutes)
- **Refresh Token**: Long-lived (default: 7 days)

Access tokens are used for API requests.  
Refresh tokens are stored in the database and used to get new access tokens.

## Development Tips

1. **Auto-reload**: The dev server auto-reloads on file changes
2. **Re-seed**: Run `npm run seed` to reset data
3. **Check logs**: Server logs all requests to console
4. **Database viewer**: Use `sqlite3 data.db` to inspect the database

## Production Deployment

1. Build the TypeScript:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Use environment variables for:
   - Strong JWT secrets
   - Production database path
   - CORS origins
   - Port configuration
