/**
 * API Service
 * 
 * Centralized API client using Axios with request/response interceptors.
 * Handles authentication tokens and automatic token refresh.
 * 
 * AWS MIGRATION PATH:
 * To migrate to AWS API Gateway + Lambda:
 * 1. Replace API_BASE_URL with AWS API Gateway endpoint
 * 2. Update interceptors to use AWS Cognito tokens (ID token instead of custom JWT)
 * 3. Add AWS Signature V4 signing for authenticated requests (use aws-amplify)
 * 4. Replace AuthService.refreshToken() with AWS Cognito refreshSession()
 * 5. Consider using AWS Amplify API category for automatic retry and error handling
 * 
 * Files to change for AWS:
 * - mobile/src/services/ApiService.ts (this file - update baseURL and auth headers)
 * - mobile/src/services/AuthService.ts (replace JWT with Cognito tokens)
 * - mobile/src/services/StorageService.ts (optional: use DynamoDB via AppSync)
 * 
 * AWS Services needed:
 * - Amazon Cognito User Pools (authentication)
 * - Amazon API Gateway (REST or HTTP API)
 * - AWS Lambda (backend logic)
 * - Amazon DynamoDB (database)
 * - AWS AppSync (optional, for real-time GraphQL API)
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// TODO: Update this URL for production
// For physical devices, use your computer's local IP: http://192.168.1.X:3000
// For AWS: Replace with API Gateway endpoint, e.g., https://api.yourdomain.com or https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
export const API_BASE_URL = 'http://localhost:3000';

interface QueuedRequest {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: QueuedRequest[] = [];

  constructor(baseURL: string) {
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: Add auth token to requests
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Token will be added by the caller or from storage
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle token refresh on 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If 401 and not already retrying, attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request while refresh is in progress
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Import AuthService dynamically to avoid circular dependency
            const { authService } = await import('./AuthService');
            const newTokens = await authService.refreshToken();

            if (newTokens?.accessToken) {
              // Update authorization header
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;

              // Retry all queued requests with new token
              this.processQueue(null, newTokens.accessToken);

              // Retry the original request
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Token refresh failed, clear queue and logout
            this.processQueue(refreshError, null);
            
            // Import AuthService to trigger logout
            const { authService } = await import('./AuthService');
            await authService.logout();

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * Set authorization token for requests
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post<{
      user: { id: number; email: string; role: 'admin' | 'user' };
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', { email, password });
    return response.data;
  }

  async refreshToken(refreshToken: string) {
    const response = await this.api.post<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', { refreshToken });
    return response.data;
  }

  async logout(refreshToken: string) {
    const response = await this.api.post('/auth/logout', { refreshToken });
    return response.data;
  }

  async getProfile(token: string) {
    const response = await this.api.get<{
      id: number;
      email: string;
      role: string;
    }>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  // Patient endpoints
  async getPatients(token: string) {
    const response = await this.api.get<
      Array<{
        id: number;
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        email: string;
        phone: string;
      }>
    >('/patients', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getPatient(id: number, token: string) {
    const response = await this.api.get(`/patients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getPatientReadings(patientId: number, token: string) {
    const response = await this.api.get<
      Array<{
        id: number;
        patientId: number;
        timestamp: string;
        systolicBP: number;
        diastolicBP: number;
        heartRate: number;
        deviceId: string;
      }>
    >(`/patients/${patientId}/readings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
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
    const response = await this.api.post(
      `/patients/${patientId}/readings`,
      reading,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  }

  // Admin endpoints
  async getStats(token: string) {
    const response = await this.api.get<{
      totalUsers: number;
      totalPatients: number;
      totalReadings: number;
    }>('/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getRecentActivity(token: string) {
    const response = await this.api.get('/admin/recent-activity', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getUsers(token: string) {
    const response = await this.api.get('/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async createUser(
    user: { email: string; password: string; role: 'admin' | 'user' },
    token: string
  ) {
    const response = await this.api.post('/admin/users', user, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async deleteUser(id: number, token: string) {
    const response = await this.api.delete(`/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
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
    const response = await this.api.post('/patients', patient, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
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
    const response = await this.api.put(`/patients/${id}`, patient, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async deletePatient(id: number, token: string) {
    const response = await this.api.delete(`/patients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  /**
   * Get the underlying Axios instance for custom requests
   */
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;
