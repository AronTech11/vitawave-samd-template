import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalReadings: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:3000/admin/stats', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>System Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalPatients}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalReadings}</Text>
            <Text style={styles.statLabel}>Readings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
        </View>
        <Button
          title={loading ? 'Refreshing...' : 'Refresh Stats'}
          onPress={fetchStats}
          variant="secondary"
          style={styles.button}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <Button
          title="View All Patients"
          onPress={() => {
            /* Navigate to patients */
          }}
          style={styles.button}
        />
        <Button
          title="Add New Patient"
          onPress={() => {
            /* Navigate to add patient */
          }}
          variant="secondary"
          style={styles.button}
        />
        <Button
          title="User Management"
          onPress={() => {
            /* Navigate to users */
          }}
          variant="secondary"
          style={styles.button}
        />
      </Card>

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="danger"
        style={styles.logoutButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 12,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  logoutButton: {
    marginBottom: 32,
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    flex: 1,
    minWidth: '30%',
    padding: 16,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default Dashboard;
