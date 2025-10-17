import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../db/database';
import { User } from '../types';
import { AppError } from '../middleware/errorHandler';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// GET /admin/users - Get all users
router.get('/users', (_req: AuthRequest, res: Response, next) => {
  try {
    const stmt = db.prepare('SELECT id, email, role, firstName, lastName, createdAt FROM users ORDER BY createdAt DESC');
    const users = stmt.all() as Omit<User, 'password'>[];

    res.json({ users, count: users.length });
  } catch (error) {
    next(error);
  }
});

// POST /admin/users - Create new user
router.post('/users', async (req: AuthRequest, res: Response, next) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;

    if (!email || !password || !role || !firstName || !lastName) {
      throw new AppError('Missing required fields', 400);
    }

    if (role !== 'admin' && role !== 'user') {
      throw new AppError('Invalid role. Must be "admin" or "user"', 400);
    }

    // Check if email already exists
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const existing = checkStmt.get(email);

    if (existing) {
      throw new AppError('Email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(
      'INSERT INTO users (email, password, role, firstName, lastName) VALUES (?, ?, ?, ?, ?)'
    );
    
    const result = stmt.run(email, hashedPassword, role, firstName, lastName);

    const newUser = db.prepare(
      'SELECT id, email, role, firstName, lastName, createdAt FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    next(error);
  }
});

// DELETE /admin/users/:id - Delete user
router.delete('/users/:id', (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.user?.userId === parseInt(id)) {
      throw new AppError('Cannot delete your own account', 400);
    }

    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /admin/stats - Get system statistics
router.get('/stats', (_req: AuthRequest, res: Response, next) => {
  try {
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    const patientCount = (db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number }).count;
    const readingCount = (db.prepare('SELECT COUNT(*) as count FROM readings').get() as { count: number }).count;
    const tokenCount = (db.prepare('SELECT COUNT(*) as count FROM refresh_tokens WHERE datetime(expiresAt) > datetime("now")').get() as { count: number }).count;

    res.json({
      stats: {
        users: userCount,
        patients: patientCount,
        readings: readingCount,
        activeTokens: tokenCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /admin/recent-activity - Get recent readings
router.get('/recent-activity', (_req: AuthRequest, res: Response, next) => {
  try {
    const stmt = db.prepare(`
      SELECT r.*, p.firstName, p.lastName 
      FROM readings r 
      JOIN patients p ON r.patientId = p.id 
      ORDER BY r.timestamp DESC 
      LIMIT 20
    `);
    
    const recentReadings = stmt.all();

    res.json({ recentActivity: recentReadings, count: recentReadings.length });
  } catch (error) {
    next(error);
  }
});

// DELETE /admin/readings/:id - Delete a reading
router.delete('/readings/:id', (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM readings WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new AppError('Reading not found', 404);
    }

    res.json({ message: 'Reading deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /admin/seed - Re-seed the database (development only)
router.post('/seed', async (_req: AuthRequest, res: Response, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Seeding is disabled in production', 403);
    }

    // This would call the seed function
    res.json({ message: 'Seeding functionality - implement based on requirements' });
  } catch (error) {
    next(error);
  }
});

export default router;
