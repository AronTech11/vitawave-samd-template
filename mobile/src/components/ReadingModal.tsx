import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Reading } from '../models/Reading';
import Card from './Card';
import Button from './Button';

interface ReadingModalProps {
  visible: boolean;
  reading: Reading | null;
  isLoading?: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave?: () => void;
  onRetry?: () => void;
  error?: string | null;
}

const ReadingModal: React.FC<ReadingModalProps> = ({
  visible,
  reading,
  isLoading = false,
  isSaving = false,
  onClose,
  onSave,
  onRetry,
  error,
}) => {
  const getBPCategory = (systolic: number, diastolic: number): { category: string; color: string } => {
    if (systolic < 120 && diastolic < 80) {
      return { category: 'Normal', color: '#34C759' };
    } else if (systolic < 130 && diastolic < 80) {
      return { category: 'Elevated', color: '#FF9500' };
    } else if (systolic < 140 || diastolic < 90) {
      return { category: 'High BP Stage 1', color: '#FF9500' };
    } else if (systolic < 180 || diastolic < 120) {
      return { category: 'High BP Stage 2', color: '#FF3B30' };
    } else {
      return { category: 'Hypertensive Crisis', color: '#FF3B30' };
    }
  };

  const getHeartRateStatus = (heartRate: number): { status: string; color: string } => {
    if (heartRate < 60) {
      return { status: 'Low', color: '#FF9500' };
    } else if (heartRate <= 100) {
      return { status: 'Normal', color: '#34C759' };
    } else {
      return { status: 'High', color: '#FF3B30' };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
          <Card style={styles.modalContent}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Taking reading...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>Reading Failed</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                {onRetry && (
                  <Button
                    title="Try Again"
                    onPress={onRetry}
                    style={styles.retryButton}
                  />
                )}
                <Button
                  title="Close"
                  onPress={onClose}
                  variant="secondary"
                  style={styles.closeButton}
                />
              </View>
            ) : reading ? (
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>Blood Pressure Reading</Text>
                  <Text style={styles.timestamp}>
                    {new Date(reading.timestamp).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.readingSection}>
                  <View style={styles.mainReading}>
                    <View style={styles.bpContainer}>
                      <View style={styles.bpValue}>
                        <Text style={styles.bpNumber}>{reading.systolicBP}</Text>
                        <Text style={styles.bpLabel}>Systolic</Text>
                      </View>
                      <Text style={styles.bpSeparator}>/</Text>
                      <View style={styles.bpValue}>
                        <Text style={styles.bpNumber}>{reading.diastolicBP}</Text>
                        <Text style={styles.bpLabel}>Diastolic</Text>
                      </View>
                    </View>
                    <Text style={styles.unit}>mmHg</Text>
                  </View>

                  {(() => {
                    const { category, color } = getBPCategory(
                      reading.systolicBP,
                      reading.diastolicBP
                    );
                    return (
                      <View style={[styles.categoryBadge, { backgroundColor: color + '20' }]}>
                        <View style={[styles.categoryDot, { backgroundColor: color }]} />
                        <Text style={[styles.categoryText, { color }]}>{category}</Text>
                      </View>
                    );
                  })()}

                  <View style={styles.heartRateSection}>
                    <View style={styles.heartRateContainer}>
                      <Text style={styles.heartRateIcon}>❤️</Text>
                      <View>
                        <Text style={styles.heartRateValue}>{reading.heartRate}</Text>
                        <Text style={styles.heartRateLabel}>Heart Rate (bpm)</Text>
                      </View>
                    </View>
                    {(() => {
                      const { status, color } = getHeartRateStatus(reading.heartRate);
                      return (
                        <View style={[styles.heartRateBadge, { backgroundColor: color + '20' }]}>
                          <Text style={[styles.heartRateStatus, { color }]}>{status}</Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>

                {reading.deviceId && (
                  <View style={styles.metaInfo}>
                    <Text style={styles.metaLabel}>Device ID:</Text>
                    <Text style={styles.metaValue}>{reading.deviceId}</Text>
                  </View>
                )}

                <View style={styles.actions}>
                  {onSave && (
                    <Button
                      title={isSaving ? 'Saving...' : 'Save Reading'}
                      onPress={onSave}
                      disabled={isSaving}
                      style={styles.saveButton}
                    />
                  )}
                  <Button
                    title="Close"
                    onPress={onClose}
                    variant="secondary"
                    style={styles.closeButton}
                  />
                </View>
              </>
            ) : null}
          </Card>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actions: {
    marginTop: 24,
  },
  bpContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bpLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  bpNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  bpSeparator: {
    fontSize: 48,
    fontWeight: '300',
    marginHorizontal: 8,
  },
  bpValue: {
    alignItems: 'center',
  },
  categoryBadge: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryDot: {
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorMessage: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: 1,
    marginBottom: 24,
    paddingBottom: 16,
  },
  heartRateBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heartRateContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  heartRateIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  heartRateLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  heartRateSection: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    padding: 16,
  },
  heartRateStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  heartRateValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 16,
  },
  mainReading: {
    alignItems: 'center',
  },
  metaInfo: {
    alignItems: 'center',
    borderTopColor: '#E5E5EA',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 16,
  },
  metaLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginRight: 8,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '80%',
    padding: 24,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
  },
  readingSection: {
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  saveButton: {
    marginBottom: 8,
  },
  timestamp: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  unit: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
  },
});

export default ReadingModal;
