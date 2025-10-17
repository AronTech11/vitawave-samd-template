import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Device } from 'react-native-ble-plx';

interface DeviceState {
  currentDevice: Device | null;
  connectedDeviceId: string | null;
  isScanning: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  discoveredDevices: Device[];
  error: string | null;
  simulationMode: boolean;
}

const initialState: DeviceState = {
  currentDevice: null,
  connectedDeviceId: null,
  isScanning: false,
  isConnecting: false,
  isConnected: false,
  discoveredDevices: [],
  error: null,
  simulationMode: false,
};

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setSimulationMode: (state, action: PayloadAction<boolean>) => {
      state.simulationMode = action.payload;
    },
    startScanning: (state) => {
      state.isScanning = true;
      state.error = null;
    },
    stopScanning: (state) => {
      state.isScanning = false;
    },
    addDiscoveredDevice: (state, action: PayloadAction<Device>) => {
      const exists = state.discoveredDevices.some(
        (d) => d.id === action.payload.id
      );
      if (!exists) {
        state.discoveredDevices.push(action.payload);
      }
    },
    clearDiscoveredDevices: (state) => {
      state.discoveredDevices = [];
    },
    connectStart: (state) => {
      state.isConnecting = true;
      state.error = null;
    },
    connectSuccess: (state, action: PayloadAction<Device>) => {
      state.isConnecting = false;
      state.isConnected = true;
      state.currentDevice = action.payload;
      state.connectedDeviceId = action.payload.id;
      state.error = null;
    },
    connectFailure: (state, action: PayloadAction<string>) => {
      state.isConnecting = false;
      state.error = action.payload;
    },
    disconnect: (state) => {
      state.currentDevice = null;
      state.connectedDeviceId = null;
      state.isConnected = false;
      state.isConnecting = false;
    },
    setDevice: (state, action: PayloadAction<Device | null>) => {
      state.currentDevice = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setSimulationMode,
  startScanning,
  stopScanning,
  addDiscoveredDevice,
  clearDiscoveredDevices,
  connectStart,
  connectSuccess,
  connectFailure,
  disconnect,
  setDevice,
  setError,
  clearError,
} = deviceSlice.actions;

export default deviceSlice.reducer;
