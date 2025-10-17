import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Card from '../../components/Card';
import Button from '../../components/Button';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
}

const PatientView: React.FC = () => {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:3000/patients', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <Card style={styles.card}>
      <Text style={styles.patientName}>
        {item.firstName} {item.lastName}
      </Text>
      <Text style={styles.patientInfo}>DOB: {item.dateOfBirth}</Text>
      <Text style={styles.patientInfo}>Email: {item.email}</Text>
      <Text style={styles.patientInfo}>Phone: {item.phone}</Text>
      <Button
        title="View Details"
        onPress={() => {
          /* Navigate to patient details */
        }}
        variant="secondary"
        style={styles.button}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title={loading ? 'Loading...' : 'Refresh Patients'}
          onPress={fetchPatients}
          style={styles.refreshButton}
        />
      </View>

      {patients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No patients found</Text>
          <Text style={styles.emptySubtext}>Tap refresh to load patients</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 12,
  },
  card: {
    marginBottom: 12,
  },
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
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
  header: {
    padding: 16,
  },
  list: {
    padding: 16,
  },
  patientInfo: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  refreshButton: {
    width: '100%',
  },
});

export default PatientView;
