import React from 'react';
import {
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  style?: ViewStyle;
}

const Input: React.FC<InputProps> = ({ style, ...props }) => {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor="#8E8E93"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    borderColor: '#E5E5EA',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default Input;
