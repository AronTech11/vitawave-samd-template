import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import { addReading } from '../../store/readingsSlice';
import BleService from '../../services/BLEService';
import { storageService } from '../../services/StorageService';
import { syncService } from '../../services/SyncService';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ReadingModal from '../../components/ReadingModal';
import { Reading } from '../../models/Reading';

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { readings, lastSync } = useSelector((state: RootState) => state.readings);
  const { isConnected, connectedDeviceId } = useSelector(
    (state: RootState) => state.device
  );

  const [bleService] = useState(() => new BleService());
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [currentReading, setCurrentReading] = useState<Reading | null>(null);
  const [isReadingLoading, setIsReadingLoading] = useState(false);
  const [readingError, setReadingError] = useState<string | null>(null);
  const [isSavingReading, setIsSavingReading] = useState(false);

  const latestReading = readings[0];

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleTakeBP = async () => {
    if (!isConnected) {
      // Navigate to BLE pairing screen
      navigation.navigate('BLEPairing' as never);
      return;
    }

    // Take reading from connected device
    setShowReadingModal(true);
    setIsReadingLoading(true);
    setReadingError(null);
    setCurrentReading(null);

    try {
      const patientId = user?.id || 1;
      const partialReading = await bleService.readBloodPressure(patientId);
      
      // Create full reading with local fields
      const fullReading: Reading = {
        ...partialReading,
        localId: `uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        deviceId: partialReading.deviceId || 'Unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setCurrentReading(fullReading);
      setIsReadingLoading(false);
    } catch (error) {
      console.error('Reading error:', error);
      setReadingError(
        error instanceof Error ? error.message : 'Failed to take reading'
      );
      setIsReadingLoading(false);
    }
  };

  const handleSaveReading = async () => {
    if (!currentReading) return;

    setIsSavingReading(true);
    try {
      // Save to local storage
      const savedReading = await storageService.saveReading({
        id: currentReading.id,
        patientId: currentReading.patientId,
        timestamp: currentReading.timestamp,
        systolicBP: currentReading.systolicBP,
        diastolicBP: currentReading.diastolicBP,
        heartRate: currentReading.heartRate,
        deviceId: currentReading.deviceId || 'Unknown',
        synced: currentReading.synced,
      });
      
      // Add to Redux store
      dispatch(addReading(savedReading));
      
      // Trigger sync in background
      syncService.syncReadings().catch(console.error);
      
      setShowReadingModal(false);
      setCurrentReading(null);
    } catch (error) {
      console.error('Save error:', error);
      setReadingError('Failed to save reading');
    } finally {
      setIsSavingReading(false);
    }
  };

  const handleRetryReading = () => {
    handleTakeBP();
  };

  const handleCloseModal = () => {
    setShowReadingModal(false);
    setCurrentReading(null);
    setReadingError(null);
    setIsReadingLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back!</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Device Status</Text>
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
          <Text style={styles.deviceId}>Device: {connectedDeviceId}</Text>
        )}
      </Card>

      {latestReading && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Latest Reading</Text>
          <View style={styles.readingGrid}>
            <View style={styles.readingItem}>
              <Text style={styles.readingLabel}>Systolic BP</Text>
              <Text style={styles.readingValue}>
                {latestReading.systolicBP} mmHg
              </Text>
            </View>
            <View style={styles.readingItem}>
              <Text style={styles.readingLabel}>Diastolic BP</Text>
              <Text style={styles.readingValue}>
                {latestReading.diastolicBP} mmHg
              </Text>
            </View>
            <View style={styles.readingItem}>
              <Text style={styles.readingLabel}>Heart Rate</Text>
              <Text style={styles.readingValue}>
                {latestReading.heartRate} bpm
              </Text>
            </View>
            <View style={styles.readingItem}>
              <Text style={styles.readingLabel}>Time</Text>
              <Text style={styles.readingValue}>
                {new Date(latestReading.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        {lastSync && (
          <Text style={styles.syncText}>
            Last synced: {new Date(lastSync).toLocaleString()}
          </Text>
        )}
        <Button
          title="💉 Take Blood Pressure"
          onPress={handleTakeBP}
          style={styles.actionButton}
        />
        <Button
          title="View History"
          onPress={() => {
            /* Navigate to history */
          }}
          variant="secondary"
          style={styles.actionButton}
        />
      </Card>

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="danger"
        style={styles.logoutButton}
      />

      <ReadingModal
        visible={showReadingModal}
        reading={currentReading}
        isLoading={isReadingLoading}
        isSaving={isSavingReading}
        error={readingError}
        onClose={handleCloseModal}
        onSave={handleSaveReading}
        onRetry={handleRetryReading}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    marginTop: 12,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
    padding: 16,
  },
  deviceId: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 4,
  },
  email: {
    color: '#8E8E93',
    fontSize: 14,
  },
  header: {
    marginBottom: 24,
  },
  logoutButton: {
    marginBottom: 32,
    marginTop: 16,
  },
  readingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  readingItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    padding: 12,
  },
  readingLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 4,
  },
  readingValue: {
    fontSize: 18,
    fontWeight: '600',
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
  syncText: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 8,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default HomeScreen;
