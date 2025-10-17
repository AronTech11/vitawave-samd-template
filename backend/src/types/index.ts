export interface User {
  id: number;
  email: string;
  password: string;
  role: 'admin' | 'user';
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Reading {
  id: number;
  patientId: number;
  timestamp: string;
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  deviceId: string;
  notes?: string;
}

export interface RefreshToken {
  id: number;
  userId: number;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthRequest extends Express.Request {
  user?: JWTPayload;
}
