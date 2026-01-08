import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { PRIMARY, RED } from '../utils/colors';

const VersionCheckModal = ({ visible, updateURL }) => {
  const handleUpdate = async () => {
    if (updateURL) {
      try {
        const supported = await Linking.canOpenURL(updateURL);
        if (supported) {
          await Linking.openURL(updateURL);
        } else {
          console.error('Cannot open URL:', updateURL);
        }
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.8)" barStyle="light-content" />
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <FontAwesome5 name="exclamation-triangle" size={60} color={RED.DARK} solid />
          </View>
          
          <Text style={styles.title}>Aplikasi Kadaluarsa</Text>
          
          <Text style={styles.message}>
            Aplikasi sudah expired, hubungi admin untuk versi terbarunya!
          </Text>
          
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdate}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="download" size={18} color="#FFFFFF" solid />
            <Text style={styles.updateButtonText}>Buka Link Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${RED.DARK}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: RED.DARK,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY.DEEP,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    shadowColor: PRIMARY.DEEP,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default VersionCheckModal;
