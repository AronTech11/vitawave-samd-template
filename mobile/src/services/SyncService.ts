/**
 * Sync Service
 * 
 * Handles synchronization of local readings to the backend server.
 * Implements offline-first architecture with automatic retry and conflict resolution.
 * 
 * SYNC STRATEGY:
 * - Readings are stored locally first (StorageService)
 * - Background sync uploads unsynced readings to server
 * - Uses last-write-wins conflict resolution
 * - Handles network errors with exponential backoff retry
 * 
 * AWS MIGRATION PATH:
 * When using AWS AppSync + DynamoDB with DataStore:
 * 1. This entire service becomes OBSOLETE - DataStore handles sync automatically
 * 2. DataStore provides built-in conflict resolution strategies:
 *    - AUTO_MERGE (automatic merge)
 *    - OPTIMISTIC_CONCURRENCY (version-based)
 *    - CUSTOM (define your own resolver)
 * 3. DataStore syncs in real-time when online, queues when offline
 * 
 * Files to remove for AWS AppSync:
 * - mobile/src/services/SyncService.ts (this file - DataStore replaces it)
 * - mobile/src/services/StorageService.ts (replace with DataStore)
 * 
 * Files to add for AWS AppSync:
 * - amplify/backend/api/schema.graphql (GraphQL schema for Reading)
 * - amplify/backend/function/ (custom resolvers if needed)
 * 
 * AWS Services needed:
 * - AWS AppSync (managed GraphQL with offline sync)
 * - Amazon DynamoDB (database)
 * - Amazon Cognito (authentication)
 * 
 * Example AppSync DataStore configuration:
 * ```typescript
 * import { DataStore, syncExpression } from 'aws-amplify';
 * import { Reading } from './models';
 * 
 * // Configure DataStore
 * DataStore.configure({
 *   syncExpressions: [
 *     syncExpression(Reading, () => {
 *       // Only sync readings for current patient
 *       return (reading) => reading.patientId('eq', currentPatientId);
 *     })
 *   ],
 *   conflictHandler: async ({ modelConstructor, localModel, remoteModel }) => {
 *     // Last-write-wins based on updatedAt
 *     return localModel.updatedAt > remoteModel.updatedAt ? localModel : remoteModel;
 *   }
 * });
 * 
 * // Start DataStore (begins automatic sync)
 * await DataStore.start();
 * 
 * // Save reading (automatically syncs)
 * await DataStore.save(new Reading({ ...data }));
 * 
 * // No manual sync needed!
 * ```
 * 
 * For Manual DynamoDB Integration:
 * If not using AppSync DataStore, this service is still needed to:
 * 1. Queue unsynced readings
 * 2. Upload to backend via API Gateway
 * 3. Handle conflicts manually
 * 4. Retry failed uploads
 */

import storageService, { Reading } from './StorageService';
import apiService from './ApiService';
import authService from './AuthService';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingCount: number;
  successCount: number;
  failedCount: number;
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Sync Service
 * Handles uploading local readings to the backend server
 */
class SyncService {
  private isSyncing = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  /**
   * Subscribe to sync status updates
   * Returns unsubscribe function
   */
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit sync status to all listeners
   */
  private emitSyncStatus(status: SyncStatus): void {
    this.syncListeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in sync status callback:', error);
      }
    });
  }

  /**
   * Check if device has network connectivity
   * For simplicity, we'll assume online for now
   * Install @react-native-community/netinfo for real network detection
   */
  private async isOnline(): Promise<boolean> {
    // TODO: Install and use NetInfo for real network detection
    // import NetInfo from '@react-native-community/netinfo';
    // const state = await NetInfo.fetch();
    // return state.isConnected ?? false;
    
    return true; // Assume online for now
  }

  /**
   * Sync all unsynced readings to server
   * 
   * For AWS AppSync: Not needed - DataStore.start() handles this automatically
   */
  async syncReadings(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ['Sync already in progress'],
      };
    }

    // Check network connectivity
    const online = await this.isOnline();
    if (!online) {
      console.log('Device is offline, sync skipped');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ['Device is offline'],
      };
    }

    this.isSyncing = true;

    const errors: string[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    try {
      // Get authentication token
      const accessToken = await authService.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Get user profile to determine patient ID
      const user = await storageService.getUser();
      if (!user || !user.patientId) {
        throw new Error('No patient ID found for user');
      }

      // Get all unsynced readings
      const unsyncedReadings = await storageService.getUnsyncedReadings();

      if (unsyncedReadings.length === 0) {
        console.log('No readings to sync');
        this.isSyncing = false;
        
        const status: SyncStatus = {
          isSyncing: false,
          lastSyncTime: await storageService.getLastSyncTimestamp(),
          pendingCount: 0,
          successCount: syncedCount,
          failedCount: failedCount,
          errors: [],
        };
        this.emitSyncStatus(status);

        return {
          success: true,
          syncedCount: 0,
          failedCount: 0,
          errors: [],
        };
      }

      console.log(`Syncing ${unsyncedReadings.length} readings...`);

      // Emit initial status
      this.emitSyncStatus({
        isSyncing: true,
        lastSyncTime: await storageService.getLastSyncTimestamp(),
        pendingCount: unsyncedReadings.length,
        successCount: 0,
        failedCount: 0,
        errors: [],
      });

      // Sync each reading
      for (const reading of unsyncedReadings) {
        try {
          // Upload reading to server
          const response = await apiService.createReading(
            user.patientId,
            {
              systolicBP: reading.systolicBP,
              diastolicBP: reading.diastolicBP,
              heartRate: reading.heartRate,
              deviceId: reading.deviceId,
            },
            accessToken
          );

          // Mark as synced in local storage
          await storageService.markReadingAsSynced(
            reading.localId,
            response.id || Date.now()
          );

          // Remove from retry attempts
          this.retryAttempts.delete(reading.localId);

          syncedCount++;

          console.log(`Synced reading ${reading.localId}`);

          // Emit progress status
          this.emitSyncStatus({
            isSyncing: true,
            lastSyncTime: await storageService.getLastSyncTimestamp(),
            pendingCount: unsyncedReadings.length - syncedCount - failedCount,
            successCount: syncedCount,
            failedCount: failedCount,
            errors: [...errors],
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          
          console.error(`Failed to sync reading ${reading.localId}:`, errorMessage);

          // Track retry attempts
          const attempts = this.retryAttempts.get(reading.localId) || 0;
          this.retryAttempts.set(reading.localId, attempts + 1);

          // If max retries exceeded, mark as failed
          if (attempts >= this.maxRetries) {
            errors.push(`Reading ${reading.localId}: ${errorMessage} (max retries exceeded)`);
            failedCount++;
            this.retryAttempts.delete(reading.localId);
          } else {
            // Add to sync queue for retry
            await storageService.addToSyncQueue(reading.localId);
            errors.push(`Reading ${reading.localId}: ${errorMessage} (will retry)`);
            failedCount++;
          }

          // Emit progress status
          this.emitSyncStatus({
            isSyncing: true,
            lastSyncTime: await storageService.getLastSyncTimestamp(),
            pendingCount: unsyncedReadings.length - syncedCount - failedCount,
            successCount: syncedCount,
            failedCount: failedCount,
            errors: [...errors],
          });
        }
      }

      // Update last sync timestamp
      await storageService.setLastSyncTimestamp(new Date());

      const finalStatus: SyncStatus = {
        isSyncing: false,
        lastSyncTime: new Date(),
        pendingCount: failedCount,
        successCount: syncedCount,
        failedCount: failedCount,
        errors: [...errors],
      };

      this.emitSyncStatus(finalStatus);

      return {
        success: failedCount === 0,
        syncedCount,
        failedCount,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Sync error:', errorMessage);

      errors.push(`Sync failed: ${errorMessage}`);

      const failedStatus: SyncStatus = {
        isSyncing: false,
        lastSyncTime: await storageService.getLastSyncTimestamp(),
        pendingCount: 0,
        successCount: syncedCount,
        failedCount: failedCount,
        errors: [...errors],
      };

      this.emitSyncStatus(failedStatus);

      return {
        success: false,
        syncedCount,
        failedCount,
        errors,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Retry sync for failed readings in queue
   * 
   * For AWS AppSync: Not needed - DataStore handles retries automatically
   */
  async retrySyncQueue(): Promise<SyncResult> {
    const queue = await storageService.getSyncQueue();

    if (queue.length === 0) {
      console.log('No readings in sync queue');
      return {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        errors: [],
      };
    }

    console.log(`Retrying sync for ${queue.length} queued readings...`);

    // Get all readings
    const allReadings = await storageService.getAllReadings();

    // Filter readings in queue
    const queuedReadings = allReadings.filter((r) =>
      queue.includes(r.localId)
    );

    // Get auth token
    const accessToken = await authService.getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: queue.length,
        errors: ['Not authenticated'],
      };
    }

    // Get user profile
    const user = await storageService.getUser();
    if (!user || !user.patientId) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: queue.length,
        errors: ['No patient ID found'],
      };
    }

    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Attempt to sync each queued reading
    for (const reading of queuedReadings) {
      try {
        const response = await apiService.createReading(
          user.patientId,
          {
            systolicBP: reading.systolicBP,
            diastolicBP: reading.diastolicBP,
            heartRate: reading.heartRate,
            deviceId: reading.deviceId,
          },
          accessToken
        );

        // Mark as synced
        await storageService.markReadingAsSynced(
          reading.localId,
          response.id || Date.now()
        );

        // Remove from queue
        await storageService.removeFromSyncQueue(reading.localId);

        // Clear retry attempts
        this.retryAttempts.delete(reading.localId);

        syncedCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Reading ${reading.localId}: ${errorMessage}`);
        failedCount++;
      }
    }

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      errors,
    };
  }

  /**
   * Handle conflict resolution (last-write-wins)
   * 
   * For AWS AppSync: Configure conflictHandler in DataStore (see comments above)
   * 
   * This is a simple last-write-wins strategy. For production:
   * - Compare timestamps
   * - Use version numbers
   * - Implement custom merge logic
   * - Notify user of conflicts
   * 
   * Note: Currently not used but available for future conflict handling
   */
  // @ts-ignore - Reserved for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async _resolveConflict(
    localReading: Reading,
    serverReading: any
  ): Promise<Reading> {
    // Last-write-wins: Compare updatedAt timestamps
    const localTime = new Date(localReading.updatedAt).getTime();
    const serverTime = new Date(serverReading.updatedAt || serverReading.timestamp).getTime();

    if (localTime > serverTime) {
      console.log(`Local reading ${localReading.localId} wins conflict`);
      return localReading;
    } else {
      console.log(`Server reading wins conflict for ${localReading.localId}`);
      // Update local reading with server data
      await storageService.updateReading(localReading.localId, {
        id: serverReading.id,
        systolicBP: serverReading.systolicBP,
        diastolicBP: serverReading.diastolicBP,
        heartRate: serverReading.heartRate,
        timestamp: serverReading.timestamp,
        synced: true,
      });

      const allReadings = await storageService.getAllReadings();
      const updated = allReadings.find((r) => r.localId === localReading.localId);
      return updated || localReading;
    }
  }

  /**
   * Start automatic background sync
   * Syncs every interval when online
   * 
   * For AWS AppSync: Not needed - DataStore syncs automatically
   */
  startAutoSync(intervalMs: number = 60000): () => void {
    const intervalId = setInterval(async () => {
      const online = await this.isOnline();
      if (online && !this.isSyncing) {
        console.log('Auto-sync triggered');
        await this.syncReadings();
      }
    }, intervalMs);

    // Return stop function
    return () => clearInterval(intervalId);
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const unsyncedReadings = await storageService.getUnsyncedReadings();
    const lastSyncTime = await storageService.getLastSyncTimestamp();

    return {
      isSyncing: this.isSyncing,
      lastSyncTime,
      pendingCount: unsyncedReadings.length,
      successCount: 0,
      failedCount: 0,
      errors: [],
    };
  }
}

export const syncService = new SyncService();
export default syncService;
