/**
 * Storage Service
 * 
 * Local storage wrapper using AsyncStorage for persistent data.
 * Provides typed methods for storing readings, user data, and app state.
 * 
 * AWS MIGRATION PATH - Option 1: AWS AppSync + DynamoDB (Recommended for offline-first apps)
 * ==================================================================================
 * 1. Replace this entire service with AWS Amplify DataStore
 * 2. Define GraphQL schema in amplify/backend/api/schema.graphql
 * 3. Use DataStore.query() and DataStore.save() instead of AsyncStorage
 * 4. DataStore automatically syncs with DynamoDB via AppSync
 * 5. Provides automatic conflict resolution (last-writer-wins or custom)
 * 6. Offline support built-in with automatic sync when online
 * 
 * Files to change:
 * - mobile/src/services/StorageService.ts (replace with DataStore)
 * - mobile/src/services/SyncService.ts (remove - DataStore handles sync)
 * - mobile/amplify/backend/api/schema.graphql (define Reading model)
 * 
 * AWS Services needed:
 * - AWS AppSync (managed GraphQL API with real-time sync)
 * - Amazon DynamoDB (NoSQL database)
 * - Amazon Cognito (authentication)
 * 
 * Example DataStore usage:
 * ```typescript
 * import { DataStore } from 'aws-amplify';
 * import { Reading } from './models';
 * 
 * // Save reading (auto-syncs to DynamoDB)
 * await DataStore.save(new Reading({
 *   patientId: 1,
 *   systolicBP: 120,
 *   diastolicBP: 80,
 *   heartRate: 75,
 *   timestamp: new Date().toISOString()
 * }));
 * 
 * // Query readings (works offline, syncs when online)
 * const readings = await DataStore.query(Reading);
 * ```
 * 
 * AWS MIGRATION PATH - Option 2: Direct DynamoDB Access (For simpler apps)
 * =========================================================================
 * 1. Replace AsyncStorage with AWS SDK DynamoDB calls
 * 2. Use API Gateway + Lambda to proxy DynamoDB operations
 * 3. Call Lambda functions via API Gateway from ApiService
 * 4. Handle offline mode manually (store in AsyncStorage, sync when online)
 * 
 * Files to change:
 * - mobile/src/services/StorageService.ts (add DynamoDB client or API calls)
 * - mobile/src/services/ApiService.ts (add DynamoDB CRUD endpoints)
 * - Keep SyncService for offline sync logic
 * 
 * AWS Services needed:
 * - Amazon API Gateway (REST API)
 * - AWS Lambda (business logic)
 * - Amazon DynamoDB (database)
 * - Amazon Cognito (authentication)
 * 
 * Example Lambda + DynamoDB:
 * ```typescript
 * // In Lambda function:
 * const AWS = require('aws-sdk');
 * const dynamoDB = new AWS.DynamoDB.DocumentClient();
 * 
 * exports.handler = async (event) => {
 *   const params = {
 *     TableName: 'Readings',
 *     Item: JSON.parse(event.body)
 *   };
 *   await dynamoDB.put(params).promise();
 *   return { statusCode: 200, body: 'Success' };
 * };
 * ```
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const READINGS_KEY = 'local_readings';
const USER_KEY = 'local_user';
const SYNC_QUEUE_KEY = 'sync_queue';
const LAST_SYNC_KEY = 'last_sync_timestamp';

export interface Reading {
  id?: number; // Server-assigned ID (undefined for local-only readings)
  localId: string; // Client-generated UUID for local tracking
  patientId: number;
  timestamp: string; // ISO 8601 format
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  deviceId: string;
  synced: boolean; // true if synced to server, false if pending
  createdAt: string; // Local creation timestamp
  updatedAt: string; // Local update timestamp
}

export interface UserProfile {
  id: number;
  email: string;
  role: 'admin' | 'user';
  patientId?: number; // Associated patient ID for regular users
}

/**
 * Local Storage Service using AsyncStorage
 * 
 * For AWS migration: Replace AsyncStorage operations with:
 * - AWS Amplify DataStore (recommended - automatic sync)
 * - Direct DynamoDB calls via API Gateway (manual sync required)
 */
class StorageService {
  /**
   * Get all readings from local storage
   * 
   * AWS DataStore equivalent:
   * ```typescript
   * const readings = await DataStore.query(Reading);
   * ```
   */
  async getAllReadings(): Promise<Reading[]> {
    try {
      const readingsJson = await AsyncStorage.getItem(READINGS_KEY);
      if (!readingsJson) {
        return [];
      }

      const readings = JSON.parse(readingsJson) as Reading[];
      return readings;
    } catch (error) {
      console.error('Error getting all readings:', error);
      return [];
    }
  }

  /**
   * Get unsynced readings that need to be uploaded to server
   * 
   * AWS DataStore equivalent:
   * DataStore automatically tracks unsynced items - no manual query needed
   */
  async getUnsyncedReadings(): Promise<Reading[]> {
    try {
      const allReadings = await this.getAllReadings();
      return allReadings.filter((reading) => !reading.synced);
    } catch (error) {
      console.error('Error getting unsynced readings:', error);
      return [];
    }
  }

  /**
   * Save a new reading to local storage
   * 
   * AWS DataStore equivalent:
   * ```typescript
   * await DataStore.save(new Reading({
   *   patientId, systolicBP, diastolicBP, heartRate, deviceId, timestamp
   * }));
   * ```
   */
  async saveReading(reading: Omit<Reading, 'localId' | 'createdAt' | 'updatedAt'>): Promise<Reading> {
    try {
      const now = new Date().toISOString();
      const newReading: Reading = {
        ...reading,
        localId: this.generateUUID(),
        synced: false,
        createdAt: now,
        updatedAt: now,
      };

      const allReadings = await this.getAllReadings();
      allReadings.unshift(newReading); // Add to beginning (most recent first)

      await AsyncStorage.setItem(READINGS_KEY, JSON.stringify(allReadings));

      return newReading;
    } catch (error) {
      console.error('Error saving reading:', error);
      throw error;
    }
  }

  /**
   * Update a reading (typically to mark as synced)
   * 
   * AWS DataStore equivalent:
   * ```typescript
   * const original = await DataStore.query(Reading, reading.id);
   * await DataStore.save(Reading.copyOf(original, updated => {
   *   updated.synced = true;
   * }));
   * ```
   */
  async updateReading(localId: string, updates: Partial<Reading>): Promise<Reading | null> {
    try {
      const allReadings = await this.getAllReadings();
      const index = allReadings.findIndex((r) => r.localId === localId);

      if (index === -1) {
        console.warn(`Reading with localId ${localId} not found`);
        return null;
      }

      const updatedReading: Reading = {
        ...allReadings[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      allReadings[index] = updatedReading;
      await AsyncStorage.setItem(READINGS_KEY, JSON.stringify(allReadings));

      return updatedReading;
    } catch (error) {
      console.error('Error updating reading:', error);
      throw error;
    }
  }

  /**
   * Delete a reading from local storage
   * 
   * AWS DataStore equivalent:
   * ```typescript
   * const toDelete = await DataStore.query(Reading, reading.id);
   * await DataStore.delete(toDelete);
   * ```
   */
  async deleteReading(localId: string): Promise<boolean> {
    try {
      const allReadings = await this.getAllReadings();
      const filtered = allReadings.filter((r) => r.localId !== localId);

      if (filtered.length === allReadings.length) {
        console.warn(`Reading with localId ${localId} not found`);
        return false;
      }

      await AsyncStorage.setItem(READINGS_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting reading:', error);
      return false;
    }
  }

  /**
   * Mark a reading as synced after successful server upload
   */
  async markReadingAsSynced(localId: string, serverId: number): Promise<boolean> {
    try {
      const updated = await this.updateReading(localId, {
        id: serverId,
        synced: true,
      });
      return updated !== null;
    } catch (error) {
      console.error('Error marking reading as synced:', error);
      return false;
    }
  }

  /**
   * Get user profile from local storage
   * 
   * AWS Cognito equivalent:
   * ```typescript
   * import { Auth } from 'aws-amplify';
   * const user = await Auth.currentAuthenticatedUser();
   * const attributes = await Auth.userAttributes(user);
   * ```
   */
  async getUser(): Promise<UserProfile | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (!userJson) {
        return null;
      }

      return JSON.parse(userJson) as UserProfile;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Save user profile to local storage
   */
  async saveUser(user: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  /**
   * Clear user profile from local storage
   */
  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing user:', error);
      throw error;
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTimestamp(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }

  /**
   * Update last sync timestamp
   */
  async setLastSyncTimestamp(timestamp: Date): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp.toISOString());
    } catch (error) {
      console.error('Error setting last sync timestamp:', error);
      throw error;
    }
  }

  /**
   * Add reading to sync queue (for retry logic)
   */
  async addToSyncQueue(localId: string): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: string[] = queueJson ? JSON.parse(queueJson) : [];

      if (!queue.includes(localId)) {
        queue.push(localId);
        await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  }

  /**
   * Remove reading from sync queue
   */
  async removeFromSyncQueue(localId: string): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: string[] = queueJson ? JSON.parse(queueJson) : [];

      const filtered = queue.filter((id) => id !== localId);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from sync queue:', error);
      throw error;
    }
  }

  /**
   * Get sync queue
   */
  async getSyncQueue(): Promise<string[]> {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Clear all local storage (use with caution!)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        READINGS_KEY,
        USER_KEY,
        SYNC_QUEUE_KEY,
        LAST_SYNC_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing all storage:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalReadings: number;
    unsyncedReadings: number;
    queuedReadings: number;
    lastSync: Date | null;
  }> {
    try {
      const allReadings = await this.getAllReadings();
      const unsyncedReadings = allReadings.filter((r) => !r.synced);
      const queue = await this.getSyncQueue();
      const lastSync = await this.getLastSyncTimestamp();

      return {
        totalReadings: allReadings.length,
        unsyncedReadings: unsyncedReadings.length,
        queuedReadings: queue.length,
        lastSync,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalReadings: 0,
        unsyncedReadings: 0,
        queuedReadings: 0,
        lastSync: null,
      };
    }
  }

  /**
   * Generate a simple UUID for local IDs
   * For production, consider using 'uuid' package
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export const storageService = new StorageService();
export default storageService;
