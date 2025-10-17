import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../db/database';
import { generateTokens, verifyRefreshToken, isRefreshTokenValid, revokeRefreshToken } from '../utils/jwt';
import { User } from '../types';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /auth/login
router.post('/login', async (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as User | undefined;

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify token exists in database and not expired
    if (!isRefreshTokenValid(refreshToken)) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Verify token signature
    const payload = verifyRefreshToken(refreshToken);

    // Revoke old refresh token
    revokeRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = generateTokens(payload.userId, payload.email, payload.role);

    res.json({
      message: 'Token refreshed successfully',
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('User not found', 404);
    }

    // Fetch full user details
    const stmt = db.prepare('SELECT id, email, role, firstName, lastName, createdAt FROM users WHERE id = ?');
    const user = stmt.get(req.user.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
