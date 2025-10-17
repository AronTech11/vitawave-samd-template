import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload, AuthTokens } from '../types';
import db from '../db/database';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload as object, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY } as SignOptions);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload as object, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY } as SignOptions);
};

export const generateTokens = (userId: number, email: string, role: 'admin' | 'user'): AuthTokens => {
  const payload: JWTPayload = { userId, email, role };
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  
  const stmt = db.prepare(
    'INSERT INTO refresh_tokens (userId, token, expiresAt) VALUES (?, ?, ?)'
  );
  stmt.run(userId, refreshToken, expiresAt.toISOString());
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
};

export const revokeRefreshToken = (token: string): void => {
  const stmt = db.prepare('DELETE FROM refresh_tokens WHERE token = ?');
  stmt.run(token);
};

export const isRefreshTokenValid = (token: string): boolean => {
  const stmt = db.prepare(
    'SELECT * FROM refresh_tokens WHERE token = ? AND datetime(expiresAt) > datetime("now")'
  );
  const result = stmt.get(token);
  return !!result;
};
