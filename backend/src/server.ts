import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/database';
import { seedDatabase } from './seed/seed';
import authRouter from './routes/auth';
import patientRouter from './routes/patient';
import adminRouter from './routes/admin';
import { errorHandler, notFound } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

// Seed database if in development and DB is empty
if (process.env.NODE_ENV === 'development') {
  const db = require('./db/database').default;
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  
  if (userCount === 0) {
    console.log('Database is empty. Running seed...');
    seedDatabase().catch(console.error);
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'VitaWave SAMD Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/auth',
      patients: '/patients',
      admin: '/admin',
    },
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRouter);
app.use('/patients', patientRouter);
app.use('/admin', adminRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 VitaWave SAMD Backend Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
