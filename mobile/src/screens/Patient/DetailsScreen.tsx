import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Reading } from '../../models/Reading';
import { PatientStackParamList } from '../../navigation/PatientStack';
import Card from '../../components/Card';

type DetailsRouteProp = RouteProp<PatientStackParamList, 'Details'>;

const DetailsScreen: React.FC = () => {
  const route = useRoute<DetailsRouteProp>();
  const { readingId } = route.params;
  const { readings } = useSelector((state: RootState) => state.readings);

  const reading = readings.find((r: Reading) => r.id === readingId);

  if (!reading) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Reading not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Reading Details</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Date & Time</Text>
          <Text style={styles.value}>
            {new Date(reading.timestamp).toLocaleString()}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Systolic Blood Pressure</Text>
          <Text style={styles.valueHighlight}>{reading.systolicBP} mmHg</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Diastolic Blood Pressure</Text>
          <Text style={styles.valueHighlight}>{reading.diastolicBP} mmHg</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Heart Rate</Text>
          <Text style={styles.valueHighlight}>{reading.heartRate} bpm</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Device ID</Text>
          <Text style={styles.value}>{reading.deviceId}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Reading ID</Text>
          <Text style={styles.value}>{reading.id}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Analysis</Text>
        <Text style={styles.analysisText}>
          {reading.systolicBP > 140 || reading.diastolicBP > 90
            ? '⚠️ Blood pressure is elevated. Consider consulting your healthcare provider.'
            : reading.systolicBP < 90 || reading.diastolicBP < 60
            ? '⚠️ Blood pressure is low. Monitor closely.'
            : '✓ Blood pressure is within normal range.'}
        </Text>
        <Text style={styles.analysisText}>
          {reading.heartRate > 100
            ? '⚠️ Heart rate is elevated.'
            : reading.heartRate < 60
            ? '⚠️ Heart rate is low.'
            : '✓ Heart rate is within normal range.'}
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
  },
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
    padding: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
  label: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
  section: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  value: {
    fontSize: 16,
  },
  valueHighlight: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default DetailsScreen;
