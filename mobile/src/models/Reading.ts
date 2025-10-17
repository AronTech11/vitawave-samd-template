/**
 * Represents a single blood pressure reading.
 * This interface is used for both local storage and API responses.
 */
export interface Reading {
  id?: number; // Server-assigned ID
  localId: string; // Client-generated UUID for local tracking
  patientId: number;
  timestamp: string; // ISO 8601 format
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  deviceId?: string;
  synced: boolean; // True if the reading has been synced with the server
  createdAt: string;
  updatedAt: string;
}
