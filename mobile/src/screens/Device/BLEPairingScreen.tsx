import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Device } from 'react-native-ble-plx';
import { RootState, AppDispatch } from '../../store';
import {
  startScanning,
  stopScanning,
  addDiscoveredDevice,
  clearDiscoveredDevices,
  connectStart,
  connectSuccess,
  connectFailure,
  disconnect,
  setSimulationMode,
} from '../../store/deviceSlice';
import BleService from '../../services/BLEService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

/**
 * BLE Pairing Screen
 *
 * SIMULATION MODE:
 * - Set __DEV_SIMULATE_BLE__ environment variable to true to use simulated BLE adapter
 * - This allows testing without real BLE hardware
 *
 * PRODUCTION MODE (Real BLE):
 * - Uses react-native-ble-plx for actual BLE communication
 * - Requires Expo Development Build (EAS Build)
 *
 * TO CREATE EXPO DEV BUILD WITH BLE:
 * 1. Install EAS CLI: npm install -g eas-cli
 * 2. Configure: eas build:configure
 * 3. Build dev client: eas build --profile development --platform ios (or android)
 * 4. Install the built app on your device
 * 5. Run: npx expo start --dev-client
 *
 * Note: react-native-ble-plx requires native modules, so Expo Go will not work.
 */

const USE_SIMULATION = process.env.__DEV_SIMULATE_BLE__ === 'true' || __DEV__;

const BLEPairingScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    isScanning,
    isConnecting,
    isConnected,
    discoveredDevices,
    connectedDeviceId,
    simulationMode,
  } = useSelector((state: RootState) => state.device);

  const [bleService] = useState(() => new BleService());

  useEffect(() => {
    // Set simulation mode in Redux
    dispatch(setSimulationMode(USE_SIMULATION));

    // Initialize BLE
    initializeBLE();

    return () => {
      bleService.stopScan();
    };
  }, []);

  const initializeBLE = async () => {
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await bleService.requestPermissions();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Bluetooth permissions are required to scan for devices'
          );
          return;
        }
      }

      const bluetoothState = await bleService.checkBluetoothState();
      if (!bluetoothState) {
        Alert.alert(
          'Bluetooth Off',
          'Please enable Bluetooth to connect to devices'
        );
      }
    } catch (error) {
      console.error('BLE initialization error:', error);
    }
  };

  const handleStartScan = async () => {
    dispatch(clearDiscoveredDevices());
    dispatch(startScanning());

    try {
      await bleService.startScan((device: Device) => {
        // Filter for blood pressure monitors (adjust UUIDs as needed)
        if (
          device.name?.includes('BP') ||
          device.name?.includes('SAMD') ||
          USE_SIMULATION
        ) {
          dispatch(addDiscoveredDevice(device));
        }
      });

      // Auto-stop after 10 seconds
      setTimeout(() => {
        handleStopScan();
      }, 10000);
    } catch (error) {
      console.error('Scan error:', error);
      dispatch(stopScanning());
      Alert.alert('Scan Error', 'Failed to scan for devices');
    }
  };

  const handleStopScan = () => {
    bleService.stopScan();
    dispatch(stopScanning());
  };

  const handleConnect = async (device: Device) => {
    dispatch(connectStart());

    try {
      const connectedDevice = await bleService.connectToDevice(device.id);
      dispatch(connectSuccess(connectedDevice));
      Alert.alert('Connected', `Connected to ${device.name || device.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Connection failed';
      dispatch(connectFailure(errorMessage));
      Alert.alert('Connection Failed', errorMessage);
    }
  };

  const handleDisconnect = async () => {
    if (connectedDeviceId) {
      await bleService.disconnect();
      dispatch(disconnect());
    }
  };

  const renderDeviceItem = ({ item }: { item: Device }) => (
    <Card style={styles.deviceCard}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
        {item.rssi && <Text style={styles.rssi}>Signal: {item.rssi} dBm</Text>}
      </View>
      <Button
        title={isConnecting ? 'Connecting...' : 'Connect'}
        onPress={() => handleConnect(item)}
        disabled={isConnecting || isConnected}
        style={styles.connectButton}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      {simulationMode && (
        <View style={styles.simulationBanner}>
          <Text style={styles.simulationText}>
            🔧 SIMULATION MODE - Using mock BLE adapter
          </Text>
        </View>
      )}

      <Card style={styles.statusCard}>
        <Text style={styles.statusTitle}>Device Status</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#34C759' : '#FF3B30' },
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        {connectedDeviceId && (
          <>
            <Text style={styles.connectedId}>ID: {connectedDeviceId}</Text>
            <Button
              title="Disconnect"
              onPress={handleDisconnect}
              variant="danger"
              style={styles.button}
            />
          </>
        )}
      </Card>

      {!isConnected && (
        <>
          <View style={styles.scanSection}>
            <Button
              title={isScanning ? 'Stop Scan' : 'Scan for Devices'}
              onPress={isScanning ? handleStopScan : handleStartScan}
              disabled={isConnecting}
              style={styles.button}
            />
            {isScanning && (
              <View style={styles.scanningIndicator}>
                <Spinner size="small" />
                <Text style={styles.scanningText}>Scanning...</Text>
              </View>
            )}
          </View>

          {discoveredDevices.length > 0 ? (
            <FlatList
              data={discoveredDevices}
              renderItem={renderDeviceItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ListHeaderComponent={
                <Text style={styles.listHeader}>
                  Found {discoveredDevices.length} device(s)
                </Text>
              }
            />
          ) : (
            !isScanning && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No devices found</Text>
                <Text style={styles.emptySubtext}>
                  Tap "Scan for Devices" to start
                </Text>
              </View>
            )
          )}
        </>
      )}

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>BLE Setup Instructions</Text>
        <Text style={styles.infoText}>
          • Expo Go does not support native BLE modules
        </Text>
        <Text style={styles.infoText}>
          • For production: Build with EAS (eas build --profile development)
        </Text>
        <Text style={styles.infoText}>
          • Currently running in {simulationMode ? 'SIMULATION' : 'PRODUCTION'}{' '}
          mode
        </Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 12,
  },
  connectButton: {
    marginLeft: 12,
  },
  connectedId: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
  },
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
    padding: 16,
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  deviceId: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptySubtext: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    marginTop: 16,
  },
  infoText: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  list: {
    paddingBottom: 16,
  },
  listHeader: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  rssi: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  scanSection: {
    marginBottom: 16,
  },
  scanningIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  scanningText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 8,
  },
  simulationBanner: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 12,
  },
  simulationText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusCard: {
    marginBottom: 16,
  },
  statusDot: {
    borderRadius: 6,
    height: 12,
    marginRight: 8,
    width: 12,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default BLEPairingScreen;
