# Backend (Node.js + Express + TypeScript)

## Overview

This is the backend API service built with Node.js, Express, and TypeScript. It provides RESTful API endpoints for the mobile application and manages data storage.

## Tech Stack

- **Node.js**: 18+
- **Express**: 4.18+
- **TypeScript**: 5.2+
- **Testing**: Jest + ts-jest
- **Development**: ts-node-dev (hot reload)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:ci

# Type checking
npm run type-check

# Linting
npm run lint
```

## API Endpoints

### Health & Info

```
GET /
Response: API information and status

GET /health
Response: Health check status
```

### Device Data

```
GET /api/devices
Response: Array of all device data

GET /api/devices/:id
Response: Array of device data filtered by device ID

POST /api/devices
Body: {
  "id": "device-123",
  "name": "Device Name",
  "data": { "key": "value" }
}
Response: Created device data with timestamp
```

## Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   └── devices.ts              # Device API routes
│   ├── __tests__/
│   │   └── index.test.ts           # API tests
│   └── index.ts                    # Server entry point
├── dist/                           # Compiled JavaScript (after build)
├── .env.example                    # Environment variables template
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript configuration
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
NODE_ENV=development
```

See `.env.example` for all available options.

## Database

Currently using in-memory storage (array). For production, integrate with:
- **SQLite**: Lightweight, file-based (good for Codespaces/development)
- **PostgreSQL**: Production-ready relational database
- **MongoDB**: NoSQL document database

### SQLite Example

The DevContainer includes SQLite. To use it:

```bash
# Install better-sqlite3
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

```typescript
import Database from 'better-sqlite3';

const db = new Database('data.db');
// Use SQLite for persistence
```

## Testing

Tests are written using Jest and ts-jest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:ci
```

## API Usage Examples

### Get All Devices

```bash
curl http://localhost:3000/api/devices
```

### Get Device by ID

```bash
curl http://localhost:3000/api/devices/device-123
```

### Post Device Data

```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "id": "device-123",
    "name": "My Device",
    "data": {
      "temperature": 23.5,
      "humidity": 60
    }
  }'
```

## CORS Configuration

CORS is enabled for all origins in development. For production:

```typescript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

## Deployment

### Build for Production

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Start Production Server

```bash
npm start
```

### Deployment Platforms

- **Railway**: Easy deployment with automatic builds
- **Render**: Free tier available, automatic deployments
- **Heroku**: Classic PaaS with good documentation
- **AWS**: EC2, Elastic Beanstalk, or Lambda
- **DigitalOcean**: App Platform or Droplet
- **Fly.io**: Edge deployment

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t vitawave-backend .
docker run -p 3000:3000 vitawave-backend
```

## Error Handling

Add middleware for centralized error handling:

```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Rate Limiting**: Use `express-rate-limit`
3. **Helmet**: Use `helmet` for security headers
4. **Input Validation**: Validate all incoming data
5. **Authentication**: Add JWT or session-based auth
6. **HTTPS**: Always use HTTPS in production

## Monitoring

Consider adding:
- **Logging**: Winston or Pino
- **Monitoring**: Sentry for error tracking
- **Metrics**: Prometheus + Grafana
- **Health Checks**: Regular `/health` endpoint checks

## Adding New Routes

1. Create a new route file in `src/routes/`
2. Import and use in `src/index.ts`:

```typescript
import myRouter from './routes/myroute';
app.use('/api/myroute', myRouter);
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

### TypeScript Errors

```bash
# Clean build
rm -rf dist
npm run build
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Resources

- [Express Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## License

MIT
