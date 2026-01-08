import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking, Alert, useColorScheme, StatusBar } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation, signOut }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const openURL = (url) => {
    Linking.openURL(url);
  };

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            if (signOut) {
              await signOut();
            }
          },
        },
      ]
    );
  };

  const [userData, setUserData] = React.useState(null);

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const saved = await AsyncStorage.getItem('userData');
      if (saved) {
        setUserData(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load user data', error);
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Pengaturan</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {userData && (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="user-circle" size={20} color="#007AFF" />
              <Text style={[styles.cardTitle, isDark && styles.textDark]}>Profil User</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <FontAwesome5 name="id-badge" size={14} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nickname</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>{userData.nickname || '-'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <FontAwesome5 name="user" size={14} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>{userData.username || '-'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <FontAwesome5 name="briefcase" size={14} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Program</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>{userData.programeName || '-'}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.cardHeader}>
            <FontAwesome5 name="info-circle" size={20} color="#007AFF" />
            <Text style={[styles.cardTitle, isDark && styles.textDark]}>Tentang Aplikasi</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <FontAwesome5 name="mobile-alt" size={14} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>PTOS Batch</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <FontAwesome5 name="tag" size={14} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Versi</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>1.0.0</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <FontAwesome5 name="code" size={14} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>React Native</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.cardHeader}>
            <FontAwesome5 name="book-open" size={20} color="#007AFF" />
            <Text style={[styles.cardTitle, isDark && styles.textDark]}>Cara Penggunaan</Text>
          </View>
          <View style={styles.stepContainer}>
            {[
              { icon: 'edit', text: 'Isi data user (Token, Lokasi, Lat, Lng) di halaman utama' },
              { icon: 'save', text: 'Tekan "Simpan Data" untuk menyimpan' },
              { icon: 'images', text: 'Pilih gambar untuk absensi' },
              { icon: 'calendar', text: 'Pilih tanggal mulai dan akhir' },
              { icon: 'play', text: 'Tekan "Mulai Absensi"' },
              { icon: 'clock', text: 'Aplikasi akan otomatis absen setiap hari kerja' },
            ].map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepIcon}>
                  <FontAwesome5 name={step.icon} size={12} color="#007AFF" />
                </View>
                <Text style={[styles.stepText, isDark && styles.textSecondaryDark]}>{step.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.cardHeader}>
            <FontAwesome5 name="exclamation-triangle" size={20} color="#F59E0B" />
            <Text style={[styles.cardTitle, isDark && styles.textDark]}>Catatan</Text>
          </View>
          <View style={styles.noteContainer}>
            {[
              'Aplikasi ini langsung mengirim data ke API Pelindo',
              'Tidak memerlukan server tambahan',
              'Data disimpan secara lokal di device',
              'Pastikan koneksi internet stabil'
            ].map((note, index) => (
              <View key={index} style={styles.noteRow}>
                <FontAwesome5 name="dot-circle" size={8} color="#9CA3AF" />
                <Text style={[styles.noteText, isDark && styles.textSecondaryDark]}>{note}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, isDark && styles.logoutButtonDark]} 
          onPress={handleLogout}
        >
          <FontAwesome5 name="sign-out-alt" size={16} color="#EF4444" />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F7FA',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: { 
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  backText: { 
    fontSize: 24, 
    color: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#1A1A1A',
  },
  textDark: {
    color: '#FFFFFF',
  },
  textSecondaryDark: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  content: { 
    flex: 1,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1A1A1A',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: { 
    fontSize: 12, 
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: { 
    fontSize: 15, 
    color: '#1A1A1A',
    fontWeight: '500',
  },
  stepContainer: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  noteContainer: {
    gap: 10,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutButtonDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
