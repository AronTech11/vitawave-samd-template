// Mock react-native-ble-plx
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn().mockImplementation(() => ({
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
    state: jest.fn().mockResolvedValue('PoweredOn'),
    destroy: jest.fn(),
  })),
  State: {
    PoweredOn: 'PoweredOn',
    PoweredOff: 'PoweredOff',
  },
}));

import { BLEService } from '../BLEService';

describe('BLEService', () => {
  let bleService: BLEService;

  beforeEach(() => {
    bleService = new BLEService();
  });

  afterEach(() => {
    bleService.destroy();
  });

  it('should create BLE service instance', () => {
    expect(bleService).toBeDefined();
  });

  it('should have no connected device initially', () => {
    expect(bleService.getConnectedDevice()).toBeNull();
  });
});
