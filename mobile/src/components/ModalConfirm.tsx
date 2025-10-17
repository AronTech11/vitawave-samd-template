import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Card from './Card';
import Button from './Button';

interface ModalConfirmProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

const ModalConfirm: React.FC<ModalConfirmProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View style={styles.container}>
          <Card style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonContainer}>
              <Button
                title={cancelText}
                onPress={onCancel}
                variant="secondary"
                style={styles.button}
              />
              <Button
                title={confirmText}
                onPress={onConfirm}
                variant={variant === 'danger' ? 'danger' : 'primary'}
                style={styles.button}
              />
            </View>
          </Card>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  card: {
    maxWidth: '90%',
    width: 320,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  message: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ModalConfirm;
