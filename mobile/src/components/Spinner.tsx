import React from 'react';
import { ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'large',
  color = '#007AFF',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Spinner;
