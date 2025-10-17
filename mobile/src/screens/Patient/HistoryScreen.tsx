import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootState } from '../../store';
import { PatientStackParamList } from '../../navigation/PatientStack';
import Card from '../../components/Card';
import Button from '../../components/Button';

type NavigationProp = NativeStackNavigationProp<PatientStackParamList, 'PatientTabs'>;

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { readings } = useSelector((state: RootState) => state.readings);

  const renderReadingItem = ({ item }: { item: typeof readings[0] }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        <Text style={styles.time}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <View style={styles.readingRow}>
        <View style={styles.readingItem}>
          <Text style={styles.label}>Systolic</Text>
          <Text style={styles.value}>{item.systolicBP}</Text>
        </View>
        <View style={styles.readingItem}>
          <Text style={styles.label}>Diastolic</Text>
          <Text style={styles.value}>{item.diastolicBP}</Text>
        </View>
        <View style={styles.readingItem}>
          <Text style={styles.label}>HR</Text>
          <Text style={styles.value}>{item.heartRate}</Text>
        </View>
      </View>
      <Button
        title="View Details"
        onPress={() => navigation.navigate('Details', { readingId: item.id })}
        variant="secondary"
        style={styles.button}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      {readings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No readings yet</Text>
          <Text style={styles.emptySubtext}>
            Connect your device to start tracking
          </Text>
        </View>
      ) : (
        <FlatList
          data={readings}
          renderItem={renderReadingItem}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  date: {
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
  label: {
    color: '#8E8E93',
    fontSize: 12,
  },
  list: {
    padding: 16,
  },
  readingItem: {
    alignItems: 'center',
  },
  readingRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-around',
  },
  time: {
    color: '#8E8E93',
    fontSize: 14,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default HistoryScreen;
