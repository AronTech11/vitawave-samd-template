import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice';
import { AppDispatch } from '../../store';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    dispatch(loginStart());

    try {
      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      dispatch(
        loginSuccess({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      dispatch(loginFailure(errorMessage));
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>VitaWave SAMD</Text>
        <Text style={styles.subtitle}>Login to your account</Text>

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Button
          title={loading ? 'Logging in...' : 'Login'}
          onPress={handleLogin}
          disabled={loading}
          style={styles.button}
        />

        <Text style={styles.hint}>
          Default admin: admin@example.com / AdminPass123!
        </Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
  },
  card: {
    padding: 24,
    width: '90%',
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    flex: 1,
    justifyContent: 'center',
  },
  hint: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default LoginScreen;
