/**
 * BLE Service
 * 
 * Bluetooth Low Energy service for connecting to blood pressure monitoring devices.
 * Supports both real BLE hardware and simulated mode for testing.
 * 
 * SIMULATION MODE:
 * When __DEV__ is true or USE_SIMULATION is set, this service generates
 * mock blood pressure readings for testing without real hardware.
 * 
 * PRODUCTION MODE:
 * Uses react-native-ble-plx to communicate with actual BLE devices.
 * Requires Expo Development Build (not compatible with Expo Go).
 * 
 * For production BLE setup:
 * 1. Build with EAS: eas build --profile development --platform ios
 * 2. Install on device and run: npx expo start --dev-client
 * 3. Update SERVICE_UUID and CHARACTERISTIC_UUID for your device
 * 
 * AWS IoT Integration (Optional):
 * If using AWS IoT Core for device management:
 * 1. Register BLE devices in AWS IoT Device Registry
 * 2. Use AWS IoT Device SDK to publish readings to MQTT topics
 * 3. Process readings with AWS IoT Rules Engine → Lambda → DynamoDB
 * 4. Files to change: Add IoTService.ts for AWS IoT MQTT communication
 */

import { BleManager, Device, State, Characteristic } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { Reading } from './StorageService';

// BLE Service and Characteristic UUIDs for blood pressure devices
// TODO: Update these UUIDs to match your specific device
const SERVICE_UUID = '00001810-0000-1000-8000-00805f9b34fb'; // Blood Pressure Service
const CHARACTERISTIC_UUID = '00002a35-0000-1000-8000-00805f9b34fb'; // Blood Pressure Measurement

// Simulation mode flag
const USE_SIMULATION = __DEV__ || process.env.USE_SIMULATION === 'true';

/**
 * BLE Event types
 */
export type BLEEventType =
  | 'deviceDiscovered'
  | 'deviceConnected'
  | 'deviceDisconnected'
  | 'readingReceived'
  | 'error';

export interface BLEEvent {
  type: BLEEventType;
  data?: any;
  error?: Error;
}

export type BLEEventCallback = (event: BLEEvent) => void;

/**
 * Blood Pressure Reading from BLE device
 */
export interface BPReading {
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  timestamp: Date;
}

export class BLEService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private eventCallbacks: BLEEventCallback[] = [];
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  /**
   * Subscribe to BLE events
   * Returns unsubscribe function
   */
  subscribe(callback: BLEEventCallback): () => void {
    this.eventCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.eventCallbacks.indexOf(callback);
      if (index > -1) {
        this.eventCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit event to all subscribers
   */
  private emit(event: BLEEvent): void {
    this.eventCallbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in BLE event callback:', error);
      }
    });
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return (
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  }

  async checkBluetoothState(): Promise<State> {
    return await this.manager.state();
  }

  /**
   * Start scanning for BLE devices
   * In simulation mode, generates mock devices
   */
  startScan(
    onDeviceFound: (device: Device) => void,
    onError?: (error: Error) => void
  ): void {
    if (USE_SIMULATION) {
      // Simulation mode: Generate mock devices
      this.startSimulatedScan(onDeviceFound);
      return;
    }

    // Real BLE scan
    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        if (onError) {
          onError(error);
        }
        this.emit({ type: 'error', error });
        return;
      }

      if (device && device.name) {
        onDeviceFound(device);
        this.emit({ type: 'deviceDiscovered', data: device });
      }
    });
  }

  /**
   * Simulated scan: Generate mock BLE devices
   */
  private startSimulatedScan(onDeviceFound: (device: Device) => void): void {
    // Generate mock devices after a short delay
    setTimeout(() => {
      const mockDevices = [
        { id: 'sim-device-1', name: 'SAMD BP Monitor 1', rssi: -45 },
        { id: 'sim-device-2', name: 'SAMD BP Monitor 2', rssi: -60 },
        { id: 'sim-device-3', name: 'VitaWave Device', rssi: -55 },
      ];

      mockDevices.forEach((mockData, index) => {
        setTimeout(() => {
          const mockDevice = {
            id: mockData.id,
            name: mockData.name,
            rssi: mockData.rssi,
          } as Device;

          onDeviceFound(mockDevice);
          this.emit({ type: 'deviceDiscovered', data: mockDevice });
        }, index * 500); // Stagger device discoveries
      });
    }, 1000);
  }

  stopScan(): void {
    if (!USE_SIMULATION) {
      this.manager.stopDeviceScan();
    }
  }

  /**
   * Connect to a BLE device
   * In simulation mode, establishes mock connection
   */
  async connectToDevice(deviceId: string): Promise<Device> {
    if (USE_SIMULATION) {
      return this.connectToSimulatedDevice(deviceId);
    }

    try {
      const device = await this.manager.connectToDevice(deviceId);
      this.connectedDevice = device;
      await device.discoverAllServicesAndCharacteristics();

      this.emit({ type: 'deviceConnected', data: device });

      // Monitor for disconnection
      device.onDisconnected((error) => {
        this.connectedDevice = null;
        this.emit({
          type: 'deviceDisconnected',
          data: device,
          error: error || undefined,
        });
      });

      return device;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err });
      throw new Error(`Failed to connect to device: ${err.message}`);
    }
  }

  /**
   * Simulated connection
   */
  private async connectToSimulatedDevice(deviceId: string): Promise<Device> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockDevice = {
          id: deviceId,
          name: deviceId.includes('1') ? 'SAMD BP Monitor 1' : 'VitaWave Device',
          isConnected: true,
        } as unknown as Device;

        this.connectedDevice = mockDevice;
        this.emit({ type: 'deviceConnected', data: mockDevice });

        resolve(mockDevice);
      }, 1000);
    });
  }

  async disconnect(): Promise<void> {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    if (this.connectedDevice) {
      if (!USE_SIMULATION) {
        await this.connectedDevice.cancelConnection();
      }

      this.emit({
        type: 'deviceDisconnected',
        data: this.connectedDevice,
      });

      this.connectedDevice = null;
    }
  }

  /**
   * Read blood pressure data from connected device
   * Returns a Reading object compatible with StorageService
   * 
   * In simulation mode: Generates realistic mock readings
   * In production mode: Reads from BLE characteristic and parses data
   */
  async readBloodPressure(patientId: number): Promise<Omit<Reading, 'localId' | 'createdAt' | 'updatedAt'>> {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    if (USE_SIMULATION) {
      return this.generateSimulatedReading(patientId);
    }

    try {
      // Read from BLE characteristic
      const characteristic = await this.manager.readCharacteristicForDevice(
        this.connectedDevice.id,
        SERVICE_UUID,
        CHARACTERISTIC_UUID
      );

      // Parse BLE data
      const reading = this.parseBPCharacteristic(characteristic, patientId);

      this.emit({ type: 'readingReceived', data: reading });

      return reading;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err });
      throw new Error(`Failed to read blood pressure: ${err.message}`);
    }
  }

  /**
   * Parse Blood Pressure Measurement characteristic (standard BLE format)
   * Based on Bluetooth SIG Blood Pressure Profile specification
   */
  private parseBPCharacteristic(
    characteristic: Characteristic,
    patientId: number
  ): Omit<Reading, 'localId' | 'createdAt' | 'updatedAt'> {
    if (!characteristic.value) {
      throw new Error('No data in characteristic');
    }

    // Decode base64 value
    const data = Buffer.from(characteristic.value, 'base64');

    // Parse according to Blood Pressure Measurement format
    // Byte 0: Flags
    // Bytes 1-2: Systolic (mmHg) - IEEE-11073 SFLOAT
    // Bytes 3-4: Diastolic (mmHg) - IEEE-11073 SFLOAT
    // Bytes 5-6: Mean Arterial Pressure (optional)
    // Bytes 7-13: Timestamp (optional)
    // Additional bytes for heart rate, user ID, etc.

    const systolicBP = data.readInt16LE(1);
    const diastolicBP = data.readInt16LE(3);
    
    // Heart rate is often in byte 14 if present
    const heartRate = data.length > 14 ? data.readUInt8(14) : 0;

    return {
      patientId,
      timestamp: new Date().toISOString(),
      systolicBP,
      diastolicBP,
      heartRate,
      deviceId: this.connectedDevice?.id || 'unknown',
      synced: false,
    };
  }

  /**
   * Generate simulated blood pressure reading
   * Creates realistic values for testing
   */
  private generateSimulatedReading(
    patientId: number
  ): Omit<Reading, 'localId' | 'createdAt' | 'updatedAt'> {
    // Generate realistic random values
    const systolicBP = Math.floor(Math.random() * (180 - 90 + 1)) + 90; // 90-180
    const diastolicBP = Math.floor(Math.random() * (120 - 60 + 1)) + 60; // 60-120
    const heartRate = Math.floor(Math.random() * (120 - 50 + 1)) + 50; // 50-120

    const reading: Omit<Reading, 'localId' | 'createdAt' | 'updatedAt'> = {
      patientId,
      timestamp: new Date().toISOString(),
      systolicBP,
      diastolicBP,
      heartRate,
      deviceId: this.connectedDevice?.id || 'simulated-device',
      synced: false,
    };

    // Emit event
    this.emit({ type: 'readingReceived', data: reading });

    return reading;
  }

  /**
   * Start continuous monitoring (simulation mode only)
   * Generates a new reading every interval
   */
  startContinuousMonitoring(
    patientId: number,
    intervalMs: number = 5000
  ): void {
    if (!USE_SIMULATION) {
      console.warn('Continuous monitoring only available in simulation mode');
      return;
    }

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    this.simulationInterval = setInterval(() => {
      const reading = this.generateSimulatedReading(patientId);
      this.emit({ type: 'readingReceived', data: reading });
    }, intervalMs);
  }

  /**
   * Stop continuous monitoring
   */
  stopContinuousMonitoring(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  isSimulationMode(): boolean {
    return USE_SIMULATION;
  }

  destroy(): void {
    this.stopContinuousMonitoring();
    if (!USE_SIMULATION) {
      this.manager.destroy();
    }
    this.eventCallbacks = [];
  }
}

export const bleService = new BLEService();
export default BLEService;
