/**
 * Authentication Service
 * 
 * Handles user authentication, token management, and secure storage.
 * Uses Expo SecureStore for storing sensitive authentication tokens.
 * 
 * AWS MIGRATION PATH:
 * To migrate to AWS Cognito for authentication:
 * 1. Replace this entire service with AWS Amplify Auth category
 * 2. Use Amplify.configure() in App.tsx with Cognito User Pool configuration
 * 3. Replace login() with Auth.signIn(email, password)
 * 4. Replace register() with Auth.signUp(email, password)
 * 5. Replace refreshToken() with Auth.currentSession() (automatic refresh)
 * 6. Replace logout() with Auth.signOut()
 * 7. Replace getStoredTokens() with Auth.currentAuthenticatedUser()
 * 8. Remove SecureStore usage - Amplify handles token storage securely
 * 
 * Files to change for AWS Cognito:
 * - mobile/src/services/AuthService.ts (replace with Amplify Auth)
 * - mobile/App.tsx (add Amplify.configure())
 * - mobile/src/store/authSlice.ts (update to use Amplify Auth actions)
 * 
 * AWS Services needed:
 * - Amazon Cognito User Pools (user management and authentication)
 * - Amazon Cognito Identity Pools (optional, for AWS resource access)
 * 
 * Install AWS Amplify:
 * npm install aws-amplify @aws-amplify/react-native amazon-cognito-identity-js
 * 
 * Example Amplify configuration:
 * ```typescript
 * import { Amplify } from 'aws-amplify';
 * 
 * Amplify.configure({
 *   Auth: {
 *     region: 'us-east-1',
 *     userPoolId: 'us-east-1_XXXXXXXX',
 *     userPoolWebClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
 *     mandatorySignIn: true,
 *   }
 * });
 * ```
 */

import * as SecureStore from 'expo-secure-store';
import apiService from './ApiService';

// SecureStore keys for token storage
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Secure Storage Abstraction
 * 
 * Uses Expo SecureStore for iOS/Android secure storage.
 * SecureStore uses Keychain (iOS) and EncryptedSharedPreferences (Android).
 * 
 * AWS MIGRATION:
 * When using AWS Cognito, this storage layer is not needed.
 * AWS Amplify Auth handles secure token storage automatically.
 */
class SecureStorageService {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await Promise.all([
        this.removeItem(ACCESS_TOKEN_KEY),
        this.removeItem(REFRESH_TOKEN_KEY),
        this.removeItem(USER_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      throw error;
    }
  }
}

const secureStorage = new SecureStorageService();

/**
 * Authentication Service
 */
class AuthService {
  /**
   * Login with email and password
   * 
   * AWS Cognito equivalent:
   * ```typescript
   * import { Auth } from 'aws-amplify';
   * const user = await Auth.signIn(email, password);
   * const session = await Auth.currentSession();
   * const idToken = session.getIdToken().getJwtToken();
   * ```
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiService.login(email, password);

      // Store tokens securely
      await this.storeTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      // Store user info
      await secureStorage.setItem(USER_KEY, JSON.stringify(response.user));

      // Set token in API service for subsequent requests
      apiService.setAuthToken(response.accessToken);

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   * 
   * AWS Cognito equivalent:
   * ```typescript
   * import { Auth } from 'aws-amplify';
   * await Auth.signUp({
   *   username: email,
   *   password: password,
   *   attributes: { email }
   * });
   * // Then verify with: Auth.confirmSignUp(email, code)
   * ```
   */
  async register(
    email: string,
    password: string,
    role: 'admin' | 'user' = 'user'
  ): Promise<void> {
    try {
      // Note: Registration typically requires admin privileges
      // You may need to call this through admin endpoints or handle differently
      const tokens = await this.getStoredTokens();
      if (!tokens?.accessToken) {
        throw new Error('Admin authentication required for user registration');
      }

      await apiService.createUser({ email, password, role }, tokens.accessToken);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * 
   * AWS Cognito equivalent:
   * ```typescript
   * import { Auth } from 'aws-amplify';
   * const session = await Auth.currentSession();
   * // Cognito automatically refreshes tokens when needed
   * const newIdToken = session.getIdToken().getJwtToken();
   * ```
   */
  async refreshToken(): Promise<AuthTokens | null> {
    try {
      const tokens = await this.getStoredTokens();
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.refreshToken(tokens.refreshToken);

      // Store new tokens
      await this.storeTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      // Update token in API service
      apiService.setAuthToken(response.accessToken);

      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, clear stored tokens
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Logout and clear stored tokens
   * 
   * AWS Cognito equivalent:
   * ```typescript
   * import { Auth } from 'aws-amplify';
   * await Auth.signOut();
   * ```
   */
  async logout(): Promise<void> {
    try {
      const tokens = await this.getStoredTokens();
      
      // Call logout endpoint if tokens exist
      if (tokens?.refreshToken && tokens?.accessToken) {
        try {
          await apiService.logout(tokens.refreshToken);
        } catch (error) {
          console.warn('Logout API call failed, clearing local tokens anyway:', error);
        }
      }

      // Clear stored tokens
      await this.clearTokens();

      // Clear token from API service
      apiService.setAuthToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get currently authenticated user
   * 
   * AWS Cognito equivalent:
   * ```typescript
   * import { Auth } from 'aws-amplify';
   * const user = await Auth.currentAuthenticatedUser();
   * const attributes = await Auth.userAttributes(user);
   * ```
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await secureStorage.getItem(USER_KEY);
      if (!userJson) {
        return null;
      }

      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get stored authentication tokens
   */
  async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      const accessToken = await secureStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);

      if (!accessToken || !refreshToken) {
        return null;
      }

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Error getting stored tokens:', error);
      return null;
    }
  }

  /**
   * Store authentication tokens securely
   */
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await secureStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    await secureStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  /**
   * Clear all stored authentication data
   */
  private async clearTokens(): Promise<void> {
    await secureStorage.clear();
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getStoredTokens();
    return tokens !== null;
  }

  /**
   * Get access token for API requests
   */
  async getAccessToken(): Promise<string | null> {
    const tokens = await this.getStoredTokens();
    return tokens?.accessToken || null;
  }

  /**
   * Initialize auth state on app startup
   * Restores tokens and sets up API service
   */
  async initialize(): Promise<User | null> {
    try {
      const tokens = await this.getStoredTokens();
      if (!tokens) {
        return null;
      }

      // Set token in API service
      apiService.setAuthToken(tokens.accessToken);

      // Get current user
      const user = await this.getCurrentUser();
      
      // Optionally verify token is still valid by calling /auth/me
      // const profile = await apiService.getProfile(tokens.accessToken);
      
      return user;
    } catch (error) {
      console.error('Auth initialization error:', error);
      await this.clearTokens();
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;
