import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome5 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { PRIMARY, GREEN, NEUTRAL } from '../utils/colors';

const QRISModal = ({ visible, qrisURL, countdown = 20, onSkip }) => {
  const [timer, setTimer] = useState(countdown);
  const [canSkip, setCanSkip] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (visible) {
      setTimer(countdown);
      setCanSkip(false);
    }
  }, [visible, countdown]);

  useEffect(() => {
    if (!visible || canSkip) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, canSkip]);

  const handleDownloadQRIS = async () => {
    try {
      setDownloading(true);

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Izin akses galeri diperlukan untuk menyimpan gambar');
        setDownloading(false);
        return;
      }

      // Download image
      const filename = `QRIS_${Date.now()}.jpg`;
      const downloadPath = FileSystem.documentDirectory + filename;
      
      const downloadResult = await FileSystem.downloadAsync(qrisURL, downloadPath);

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      await MediaLibrary.createAlbumAsync('Absensi', asset, false);

      Alert.alert('Berhasil', 'QRIS berhasil disimpan ke galeri');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Gagal menyimpan QRIS: ' + error.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <FontAwesome5 name="qrcode" size={24} color={PRIMARY.DEEP} solid />
            </View>
            <Text style={styles.title}>Scan QRIS untuk Donasi</Text>
            <Text style={styles.subtitle}>
              Dukung pengembangan aplikasi dengan scan QRIS di bawah
            </Text>
          </View>

          {/* QRIS Image */}
          <View style={styles.qrisContainer}>
            <Image
              source={{ uri: qrisURL }}
              style={styles.qrisImage}
              resizeMode="contain"
            />
          </View>

          {/* Timer or Skip Button */}
          <View style={styles.actionContainer}>
            {!canSkip ? (
              <View style={styles.timerContainer}>
                <View style={styles.timerCircle}>
                  <Text style={styles.timerText}>{timer}</Text>
                </View>
                <Text style={styles.timerLabel}>
                  Menunggu {timer} detik...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={onSkip}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>Lewati</Text>
                <FontAwesome5 name="arrow-right" size={16} color="#FFFFFF" solid />
              </TouchableOpacity>
            )}
          </View>

          {/* Download Button */}
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownloadQRIS}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <FontAwesome5 name="download" size={16} color="#FFFFFF" solid />
                <Text style={styles.downloadButtonText}>Download QRIS</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <Text style={styles.infoText}>
            Donasi bersifat sukarela dan tidak wajib
          </Text>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${PRIMARY.DEEP}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  qrisContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  qrisImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  actionContainer: {
    width: '100%',
    marginBottom: 16,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${PRIMARY.DEEP}15`,
    borderWidth: 3,
    borderColor: PRIMARY.DEEP,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '800',
    color: PRIMARY.DEEP,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY.DEEP,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY.DEEP,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN.DARK,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 10,
    width: '100%',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: GREEN.DARK,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default QRISModal;
