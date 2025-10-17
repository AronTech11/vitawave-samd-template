import { BleManager, Device, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

export class BLEService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;

  constructor() {
    this.manager = new BleManager();
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

  startScan(
    onDeviceFound: (device: Device) => void,
    onError?: (error: Error) => void
  ): void {
    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        if (onError) {
          onError(error);
        }
        return;
      }

      if (device && device.name) {
        onDeviceFound(device);
      }
    });
  }

  stopScan(): void {
    this.manager.stopDeviceScan();
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      this.connectedDevice = device;
      await device.discoverAllServicesAndCharacteristics();
      return device;
    } catch (error) {
      throw new Error(`Failed to connect to device: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
  }

  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  destroy(): void {
    this.manager.destroy();
  }
}

export const bleService = new BLEService();
export default BLEService;
