/**
 * API Service
 * 
 * Centralized API client for communicating with the backend.
 * Handles authentication tokens and common request patterns.
 */

// TODO: Update this URL for production
// For physical devices, use your computer's local IP: http://192.168.1.X:3000
export const API_BASE_URL = 'http://localhost:3000';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, headers = {}, token } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{
      user: { id: number; email: string; role: 'admin' | 'user' };
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
  }

  async logout(refreshToken: string, accessToken: string) {
    return this.request('/auth/logout', {
      method: 'POST',
      body: { refreshToken },
      token: accessToken,
    });
  }

  async getProfile(token: string) {
    return this.request<{ id: number; email: string; role: string }>(
      '/auth/me',
      { token }
    );
  }

  // Patient endpoints
  async getPatients(token: string) {
    return this.request<Array<{
      id: number;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      email: string;
      phone: string;
    }>>('/patients', { token });
  }

  async getPatient(id: number, token: string) {
    return this.request(`/patients/${id}`, { token });
  }

  async getPatientReadings(patientId: number, token: string) {
    return this.request<Array<{
      id: number;
      patientId: number;
      timestamp: string;
      systolicBP: number;
      diastolicBP: number;
      heartRate: number;
      deviceId: string;
    }>>(`/patients/${patientId}/readings`, { token });
  }

  async createReading(
    patientId: number,
    reading: {
      systolicBP: number;
      diastolicBP: number;
      heartRate: number;
      deviceId: string;
    },
    token: string
  ) {
    return this.request(`/patients/${patientId}/readings`, {
      method: 'POST',
      body: reading,
      token,
    });
  }

  // Admin endpoints
  async getStats(token: string) {
    return this.request<{
      totalUsers: number;
      totalPatients: number;
      totalReadings: number;
    }>('/admin/stats', { token });
  }

  async getRecentActivity(token: string) {
    return this.request('/admin/recent-activity', { token });
  }

  async getUsers(token: string) {
    return this.request('/admin/users', { token });
  }

  async createUser(
    user: { email: string; password: string; role: 'admin' | 'user' },
    token: string
  ) {
    return this.request('/admin/users', {
      method: 'POST',
      body: user,
      token,
    });
  }

  async deleteUser(id: number, token: string) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async createPatient(
    patient: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      email: string;
      phone: string;
    },
    token: string
  ) {
    return this.request('/patients', {
      method: 'POST',
      body: patient,
      token,
    });
  }

  async updatePatient(
    id: number,
    patient: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      email: string;
      phone: string;
    },
    token: string
  ) {
    return this.request(`/patients/${id}`, {
      method: 'PUT',
      body: patient,
      token,
    });
  }

  async deletePatient(id: number, token: string) {
    return this.request(`/patients/${id}`, {
      method: 'DELETE',
      token,
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;
