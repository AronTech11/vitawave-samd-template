import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
  background: '#fff',
  subtitle: '#666',
};

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VitaWave SAMD Template</Text>
      <Text style={styles.subtitle}>Mobile App with BLE Support</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    color: COLORS.subtitle,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
