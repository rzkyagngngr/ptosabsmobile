import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Image,
  FlatList,
  useColorScheme,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { absensiAPI } from '../services/api';
import { PRIMARY, GREEN, RED, YELLOW, NEUTRAL } from '../utils/colors';
import QRISModal from '../components/QRISModal';

export default function HomeScreen({ navigation }) {
  // Force light mode - ignore system dark mode preference
  const isDark = false;
  
  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // User Data
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [komentar, setKomentar] = useState('');
  const [programeName, setProgrameName] = useState('');
  const [imageFolder, setImageFolder] = useState('');
  
  // Absensi Settings
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // Images
  const [selectedImages, setSelectedImages] = useState([]);
  
  // Process State
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const [stats, setStats] = useState({
    successCount: 0,
    errorCount: 0,
    totalDays: 0,
    currentDate: null,
  });
  const statsRef = useRef({
    successCount: 0,
    errorCount: 0,
    totalDays: 0,
    currentDate: null,
  });
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  
  // QRIS Modal State
  const [showQRISModal, setShowQRISModal] = useState(false);
  const [qrisURL, setQrisURL] = useState('');
  const [qrisCountdown, setQrisCountdown] = useState(20);
  const [qrisEnable, setQrisEnable] = useState(false);
  
  // Holidays state
  const [holidaysLoaded, setHolidaysLoaded] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(true);

  useEffect(() => {
    loadUserData();
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      setLoadingHolidays(true);
      const holidays = await absensiAPI.loadHolidays();
      setHolidaysLoaded(true);
      console.log('Holidays loaded:', holidays.length, 'days');
    } catch (error) {
      console.error('Failed to load holidays', error);
      // Still mark as loaded even if failed, use cached data
      setHolidaysLoaded(true);
    } finally {
      setLoadingHolidays(false);
    }
  };

  const loadUserData = async () => {
    try {
      const saved = await AsyncStorage.getItem('userData');
      if (saved) {
        const userData = JSON.parse(saved);
        setNickname(userData.nickname || '');
        setUsername(userData.username || '');
        setToken(userData.token || '');
        setLokasi(userData.lokasi || '');
        setLat(userData.lat || '');
        setLng(userData.lng || '');
        setKomentar(userData.komentar || '');
        setProgrameName(userData.programeName || '');
        setImageFolder(userData.imageFolder || '');
      }
      
      // Load saved images
      const savedImages = await AsyncStorage.getItem('selectedImages');
      if (savedImages) {
        setSelectedImages(JSON.parse(savedImages));
      }
      
      // Load appinfo for QRIS
      const appinfoStr = await AsyncStorage.getItem('appinfo');
      if (appinfoStr) {
        const appinfo = JSON.parse(appinfoStr);
        setQrisEnable(appinfo.qrisEnable || false);
        setQrisURL(appinfo.qrisURL || '');
        setQrisCountdown(appinfo.qrisCountdown || 20);
      }
    } catch (error) {
      console.error('Failed to load user data', error);
    }
  };

  const saveUserData = async () => {
    try {
      const userData = { 
        nickname,
        username,
        token, 
        lokasi, 
        lat, 
        lng, 
        komentar, 
        programeName,
        imageFolder,
      };
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      Alert.alert('Sukses', 'Data berhasil disimpan!');
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data');
    }
  };

  const addLog = async (type, message) => {
    const newLog = {
      type,
      message,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    
    // Save to AsyncStorage for history
    try {
      await AsyncStorage.setItem('absensiLogs', JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to save logs', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Check current permission status
      const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();
      let finalStatus = existingStatus;

      // If not granted, request permission
      if (existingStatus !== 'granted') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Izin Diperlukan',
          'Aplikasi memerlukan izin akses kamera untuk mengambil foto. Silakan berikan izin di pengaturan aplikasi.',
          [
            { text: 'OK' }
          ]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        const updatedImages = [...selectedImages, ...newImages];
        setSelectedImages(updatedImages);
        await AsyncStorage.setItem('selectedImages', JSON.stringify(updatedImages));
        Alert.alert('Sukses', 'Foto berhasil ditambahkan');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Gagal mengambil foto: ' + error.message);
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      // Check current permission status
      const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      let finalStatus = existingStatus;

      // If not granted, request permission
      if (existingStatus !== 'granted') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Izin Diperlukan',
          'Aplikasi memerlukan izin akses galeri untuk memilih foto. Silakan berikan izin di pengaturan aplikasi.',
          [
            { text: 'OK' }
          ]
        );
        return;
      }

      // Launch image picker with proper method name
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      console.log('Gallery result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        const updatedImages = [...selectedImages, ...newImages];
        setSelectedImages(updatedImages);
        await AsyncStorage.setItem('selectedImages', JSON.stringify(updatedImages));
        Alert.alert('Sukses', `${result.assets.length} gambar ditambahkan`);
      }
    } catch (error) {
      console.error('Gallery selection error:', error);
      Alert.alert('Error', 'Gagal membuka galeri: ' + error.message);
    }
  };

  const handleDeleteImage = async (index) => {
    Alert.alert(
      'Konfirmasi',
      'Hapus gambar ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const updatedImages = selectedImages.filter((_, i) => i !== index);
            setSelectedImages(updatedImages);
            await AsyncStorage.setItem('selectedImages', JSON.stringify(updatedImages));
          },
        },
      ]
    );
  };

  const handleClearAllImages = async () => {
    Alert.alert(
      'Konfirmasi',
      'Hapus semua gambar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            setSelectedImages([]);
            await AsyncStorage.setItem('selectedImages', JSON.stringify([]));
          },
        },
      ]
    );
  };

  const getRandomImage = () => {
    if (selectedImages.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * selectedImages.length);
    return selectedImages[randomIndex];
  };

  const handleStartAbsensi = async () => {
    // Validation
    if (!token || !lokasi || !lat || !lng) {
      Alert.alert('Error', 'Mohon lengkapi data Token, Lokasi, Lat, dan Lng terlebih dahulu');
      return;
    }

    if (startDate > endDate) {
      Alert.alert('Error', 'Tanggal mulai harus sebelum tanggal akhir');
      return;
    }

    if (isRunning) {
      Alert.alert('Error', 'Proses sedang berjalan');
      return;
    }
    
    // Check if holidays are loaded
    if (loadingHolidays) {
      Alert.alert('Tunggu Sebentar', 'Data hari libur sedang dimuat. Mohon tunggu...');
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert(
        'Peringatan',
        'Tidak ada gambar yang dipilih. Lanjutkan tanpa gambar?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Lanjut', onPress: () => {
            // Check QRIS before starting
            if (qrisEnable && qrisURL) {
              setShowQRISModal(true);
            } else {
              startAbsensiProcess();
            }
          }},
        ]
      );
    } else {
      // Check QRIS before starting
      if (qrisEnable && qrisURL) {
        setShowQRISModal(true);
      } else {
        startAbsensiProcess();
      }
    }
  };

  const startAbsensiProcess = async () => {
    const userData = { token, lokasi, lat, lng, komentar, programeName };
    
    // Show stats card with animation
    setShowStats(true);
    Animated.timing(statsOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    // Animate transition to activity log
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowActivityLog(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    
    setIsRunning(true);
    isRunningRef.current = true;
    setLogs([]);
    const initialStats = { successCount: 0, errorCount: 0, totalDays: 0, currentDate: null };
    setStats(initialStats);
    statsRef.current = initialStats;

    addLog('info', `🚀 Memulai absensi automation...`);
    addLog('info', `📅 Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`);

    // Run bot in background
    runBotProcess(userData).then(() => {
      setIsRunning(false);
      isRunningRef.current = false;
      addLog('success', `✅ Proses selesai! Success: ${statsRef.current.successCount}, Failed: ${statsRef.current.errorCount}`);
    }).catch((error) => {
      setIsRunning(false);
      isRunningRef.current = false;
      addLog('error', `❌ Error: ${error.message}`);
    });
  };

  const runBotProcess = async (userData) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const currentDate = new Date(start);

    while (currentDate <= end && isRunningRef.current) {
      const isWorkDay = await absensiAPI.isWorkDay(currentDate);
      if (isWorkDay) {
        const dateStr = formatDate(currentDate);
        statsRef.current = {
          ...statsRef.current,
          currentDate: dateStr,
          totalDays: statsRef.current.totalDays + 1,
        };
        setStats({...statsRef.current});

        addLog('info', `📆 Memproses: ${dateStr}`);

        // Clock In
        try {
          const clockInTime = absensiAPI.getRandomClockIn(new Date(currentDate));
          addLog('info', `  ⏰ Clock In: ${clockInTime}`);

          const imageUri = getRandomImage();
          const result = await absensiAPI.doAbsen(userData, clockInTime, 1, imageUri);

          if (result.success) {
            addLog('success', `  ✅ Clock In berhasil`);
            statsRef.current.successCount++;
            setStats({...statsRef.current});
          } else {
            throw new Error(result.message);
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          addLog('error', `  ❌ Clock In gagal: ${error.message}`);
          statsRef.current.errorCount++;
          setStats({...statsRef.current});
        }

        // Clock Out
        try {
          const clockOutTime = absensiAPI.getRandomClockOut(new Date(currentDate));
          addLog('info', `  ⏰ Clock Out: ${clockOutTime}`);

          const imageUri = getRandomImage();
          const result = await absensiAPI.doAbsen(userData, clockOutTime, 2, imageUri);

          if (result.success) {
            addLog('success', `  ✅ Clock Out berhasil`);
            statsRef.current.successCount++;
            setStats({...statsRef.current});
          } else {
            throw new Error(result.message);
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          addLog('error', `  ❌ Clock Out gagal: ${error.message}`);
          statsRef.current.errorCount++;
          setStats({...statsRef.current});
        }
      } else {
        const reason = currentDate.getDay() === 0 || currentDate.getDay() === 6 ? 'Weekend' : 'Holiday';
        addLog('warning', `⏭️ Melewati ${formatDate(currentDate)} - ${reason}`);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  };

  const handleStopAbsensi = () => {
    Alert.alert(
      'Konfirmasi',
      'Apakah Anda yakin ingin menghentikan proses?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            isRunningRef.current = false;
            addLog('warning', '⏹️ Proses dihentikan oleh user');
          },
        },
      ]
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReset = () => {
    // Hide stats card with animation
    Animated.timing(statsOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setShowStats(false);
    });
    
    // Hide activity log
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowActivityLog(false);
      setLogs([]);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const getLogStyle = (type) => {
    switch (type) {
      case 'success': return styles.logSuccess;
      case 'error': return styles.logError;
      case 'warning': return styles.logWarning;
      default: return styles.logInfo;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 18) return 'Selamat Siang';
    return 'Selamat Malam';
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    });
  };

  // Calculate days remaining (example)
  const getDaysRemaining = () => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Calculate attendance completion percentage
  const getAttendancePercentage = () => {
    const totalDays = stats.totalDays || 0;
    const successCount = stats.successCount || 0;
    if (totalDays === 0) {
      // Calculate based on date range for initial display
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      
      if (today < start) return 0;
      if (today > end) return 100;
      
      const totalRangeDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const passedDays = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
      const percentage = Math.round((passedDays / totalRangeDays) * 100);
      return isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage));
    }
    // Calculate based on actual attendance (clock in/out counted as success)
    const percentage = Math.round((successCount / (totalDays * 2)) * 100);
    return isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage));
  };
  
  // Calculate total workdays in selected range
  const getTotalWorkdaysInRange = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    // Estimate workdays (excluding weekends ~ 71% of days)
    return Math.round(diffDays * 0.71);
  };
  
  // Get current month attendance rate
  const getCurrentMonthAttendanceRate = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentDay = today.getDate();
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    // Estimate workdays passed (excluding weekends)
    const workdaysPassed = Math.round(currentDay * 0.71);
    const totalWorkdays = Math.round(totalDaysInMonth * 0.71);
    
    if (stats.totalDays > 0) {
      return Math.round((stats.successCount / (totalWorkdays * 2)) * 100);
    }
    
    return Math.round((workdaysPassed / totalWorkdays) * 100);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B7CFF', '#B8A9FF', '#E8E3FF', '#F6F8FB', '#FFFFFF']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={[1, 0]}
        end={[0, 1]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.greetingText}>{getGreeting()}, {nickname || 'User'}</Text>
          <Text style={styles.dateSubtitle}>{getTodayDate()}</Text>
        </View>

        {/* Attendance Progress Card */}
        <View style={styles.activeGoalCard}>
          <BlurView intensity={Platform.OS === 'ios' ? 50 : 25} tint='light' style={styles.glassBlur}>
            <Text style={styles.goalBadge}>Target</Text>
            
            {/* Progress Bar with Percentage */}
            <View style={styles.progressRowContainer}>
              <View style={styles.progressBarWrapper}>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={['#007AFF', '#00C6FF']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={[styles.progressFill, { width: String(getAttendancePercentage()) + '%' }]}
                  >
                    <View style={styles.progressGlow} />
                  </LinearGradient>
                </View>
              </View>
              
              <Text style={styles.bigPercentage}>{getAttendancePercentage()}%</Text>
            </View>
            
            {/* Attendance Stats Row */}
            <View style={styles.miniStatsRow}>
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatValue}>{getTotalWorkdaysInRange()}</Text>
                <Text style={styles.miniStatLabel}>Hari Kerja</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatValue}>{stats.successCount || 0}</Text>
                <Text style={styles.miniStatLabel}>Absen Sukses</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatValue}>{stats.errorCount || 0}</Text>
                <Text style={styles.miniStatLabel}>Gagal</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Pengaturan Absensi</Text>

        {/* Learning Item 1 - Configuration */}
        <TouchableOpacity 
          style={styles.learningItem}
          onPress={() => setShowDetails(!showDetails)}
        >
          <BlurView intensity={Platform.OS === 'ios' ? 45 : 22} tint="light" style={styles.glassBlur}>
            <View style={styles.learningItemContent}>
              <View style={[styles.learningIconBox, { backgroundColor: '#FFF0EB' }]}>
                <FontAwesome5 name="cog" size={20} color="#FF6B6B" />
              </View>
              <View style={styles.learningTextColumn}>
                <Text style={styles.learningTitle}>Konfigurasi Lokasi</Text>
                <Text style={styles.learningSubtitle}>Atur lokasi & koordinat absen</Text>
              </View>
              <View style={styles.learningActionIcon}>
                <FontAwesome5 
                  name={showDetails ? "chevron-up" : "chevron-down"} 
                  size={14} 
                  color="#FFFFFF" 
                />
              </View>
            </View>
          </BlurView>
        </TouchableOpacity>

        {/* Configuration Detail (Collapsible) */}
        {showDetails && (
          <View style={styles.configDetailCard}>
            <BlurView intensity={Platform.OS === 'ios' ? 45 : 22} tint="light" style={styles.glassBlur}>
              <TextInput
                style={styles.modernInput}
                placeholder="Lokasi *"
                placeholderTextColor="#9CA3AF"
                value={lokasi}
                onChangeText={setLokasi}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.modernInput, styles.halfInput]}
                  placeholder="Latitude *"
                  placeholderTextColor="#9CA3AF"
                  value={lat}
                  onChangeText={setLat}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.modernInput, styles.halfInput]}
                  placeholder="Longitude *"
                  placeholderTextColor="#9CA3AF"
                  value={lng}
                  onChangeText={setLng}
                  keyboardType="numeric"
                />
              </View>
              <TextInput
                style={styles.modernInput}
                placeholder="Komentar (opsional)"
                placeholderTextColor="#9CA3AF"
                value={komentar}
                onChangeText={setKomentar}
              />
              <TextInput
                style={styles.modernInput}
                placeholder="Program Name (opsional)"
                placeholderTextColor="#9CA3AF"
                value={programeName}
                onChangeText={setProgrameName}
              />
            </BlurView>
          </View>
        )}

        {/* Learning Item 2 - Date Range */}
        <View style={styles.learningItem}>
          <BlurView intensity={Platform.OS === 'ios' ? 45 : 22} tint="light" style={styles.glassBlur}>
            <View style={styles.learningItemContent}>
              <View style={[styles.learningIconBox, { backgroundColor: '#E8F1FF' }]}>
                <FontAwesome5 name="calendar-alt" size={20} color="#007AFF" />
              </View>
              <View style={styles.learningTextColumn}>
                <Text style={styles.learningTitle}>Periode Absensi</Text>
                <Text style={styles.learningSubtitle}>Pilih rentang tanggal</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Date Range Card */}
        <View style={styles.dateRangeCard}>
          <BlurView intensity={Platform.OS === 'ios' ? 45 : 22} tint="light" style={styles.glassBlur}>
            <View style={styles.dateRow}>
              <View style={styles.dateGroup}>
                <Text style={styles.modernLabel}>Tanggal Mulai</Text>
                <TouchableOpacity style={styles.modernDateButton} onPress={() => setShowStartPicker(true)}>
                  <Text style={styles.modernDateText}>{formatDate(startDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateGroup}>
                <Text style={styles.modernLabel}>Tanggal Akhir</Text>
                <TouchableOpacity style={styles.modernDateButton} onPress={() => setShowEndPicker(false)}>
                  <Text style={styles.modernDateText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>

        {showStartPicker && (
          <>
            {Platform.OS === 'ios' && (
              <View style={styles.datePickerModal}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setStartDate(selectedDate);
                  }}
                />
              </View>
            )}
            {Platform.OS === 'android' && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) setStartDate(selectedDate);
                }}
              />
            )}
          </>
        )}

        {showEndPicker && (
          <>
            {Platform.OS === 'ios' && (
              <View style={styles.datePickerModal}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setEndDate(selectedDate);
                  }}
                />
              </View>
            )}
            {Platform.OS === 'android' && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) setEndDate(selectedDate);
                }}
              />
            )}
          </>
        )}

        {/* Learning Item 3 - Images */}
        {!showActivityLog && (
          <>
            <View style={styles.learningItem}>
              <BlurView intensity={Platform.OS === 'ios' ? 45 : 22} tint="light" style={styles.glassBlur}>
                <View style={styles.learningItemContent}>
                  <View style={[styles.learningIconBox, { backgroundColor: '#FFF0EB' }]}>
                    <FontAwesome5 name="images" size={20} color="#FF6B6B" />
                  </View>
                  <View style={styles.learningTextColumn}>
                    <Text style={styles.learningTitle}>Galeri Foto Absensi</Text>
                    <Text style={styles.learningSubtitle}>{selectedImages.length} foto tersimpan</Text>
                  </View>
                </View>
              </BlurView>
            </View>

            <View style={styles.imageManagementCard}>
              <BlurView intensity={Platform.OS === 'ios' ? 45 : 22} tint="light" style={styles.glassBlur}>
              <View style={styles.imageButtonRow}>
                <TouchableOpacity 
                  style={styles.modernCompactButton} 
                  onPress={handleTakePhoto}
                >
                  <FontAwesome5 name="camera" size={14} color="#007AFF" />
                  <Text style={styles.modernCompactButtonText}>Ambil Foto</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modernCompactButton} 
                  onPress={handleSelectFromGallery}
                >
                  <FontAwesome5 name="images" size={14} color="#007AFF" />
                  <Text style={styles.modernCompactButtonText}>Dari Galeri</Text>
                </TouchableOpacity>
              </View>

              {selectedImages.length > 0 && (
                <FlatList
                  data={selectedImages}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={styles.modernImageThumb}>
                      <Image source={{ uri: item }} style={styles.modernImageThumbImg} />
                      <TouchableOpacity
                        style={styles.modernDeleteButton}
                        onPress={() => handleDeleteImage(index)}
                      >
                        <Text style={styles.deleteButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  style={styles.imageList}
                />
              )}
              </BlurView>
            </View>
          </>
        )}

        {/* Activity Log */}
        {showActivityLog && (
          <>
            <View style={styles.learningItem}>
              <BlurView intensity={Platform.OS === 'ios' ? 45 : 22} tint="light" style={styles.glassBlur}>
                <View style={styles.learningItemContent}>
                  <View style={[styles.learningIconBox, { backgroundColor: '#E8F1FF' }]}>
                    <FontAwesome5 name="list-ul" size={20} color="#007AFF" />
                  </View>
                  <View style={styles.learningTextColumn}>
                    <Text style={styles.learningTitle}>Log Aktivitas</Text>
                    <Text style={styles.learningSubtitle}>Pembaruan real-time</Text>
                  </View>
                </View>
              </BlurView>
            </View>

            <View style={styles.activityLogCard}>
              <BlurView intensity={Platform.OS === 'ios' ? 45 : 22} tint="light" style={styles.glassBlur}>
              {logs.length === 0 ? (
                <Text style={styles.emptyText}>Belum ada aktivitas</Text>
              ) : (
                logs.slice().reverse().slice(0, 50).map((log, index) => (
                  <View key={index} style={[styles.logItem, getLogStyle(log.type)]}>
                    <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
                    <Text style={styles.logMessage}>{log.message}</Text>
                  </View>
                ))
              )}
              </BlurView>
            </View>
          </>
        )}

        {/* Stats Card */}
        {showStats && (
          <Animated.View style={[styles.modernStatsCard, { opacity: statsOpacity }]}>
            <BlurView intensity={Platform.OS === 'ios' ? 45 : 22} tint="light" style={styles.glassBlur}>
            <View style={styles.statRow}>
              <View style={styles.modernStatItem}>
                <View style={[styles.modernStatIcon, { backgroundColor: '#4CD9C0' }]}>
                  <FontAwesome5 name="check-circle" size={18} color="#FFFFFF" solid />
                </View>
                <Text style={styles.modernStatValue}>{stats.successCount}</Text>
                <Text style={styles.modernStatLabel}>BERHASIL</Text>
              </View>
              
              <View style={styles.modernStatItem}>
                <View style={[styles.modernStatIcon, { backgroundColor: '#FF6B6B' }]}>
                  <FontAwesome5 name="times-circle" size={18} color="#FFFFFF" solid />
                </View>
                <Text style={styles.modernStatValue}>{stats.errorCount}</Text>
                <Text style={styles.modernStatLabel}>GAGAL</Text>
              </View>
              
              <View style={styles.modernStatItem}>
                <View style={[styles.modernStatIcon, { backgroundColor: '#7F77FE' }]}>
                  <FontAwesome5 name="calendar-alt" size={18} color="#FFFFFF" solid />
                </View>
                <Text style={styles.modernStatValue}>{stats.totalDays}</Text>
                <Text style={styles.modernStatLabel}>TOTAL HARI</Text>
              </View>
            </View>
            
            {isRunning && (
              <View style={styles.processingStatus}>
                <ActivityIndicator size="small" color="#7F77FE" />
                <Text style={styles.processingText}>Memproses: {stats.currentDate || '-'}</Text>
              </View>
            )}
            </BlurView>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {!isRunning && !showActivityLog && (
            <TouchableOpacity
              style={[styles.modernButton, styles.modernButtonPrimary]}
              onPress={handleStartAbsensi}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <LinearGradient
                    colors={['#7F77FE', '#A47AF6']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={StyleSheet.absoluteFill}
                  />
                  <FontAwesome5 name="play" size={16} color="#FFFFFF" />
                  <Text style={styles.modernButtonText}>Mulai Absensi Otomatis</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isRunning && (
            <TouchableOpacity style={styles.modernButtonDanger} onPress={handleStopAbsensi}>
              <FontAwesome5 name="stop" size={16} color="#FFFFFF" />
              <Text style={styles.modernButtonText}>Hentikan Proses</Text>
            </TouchableOpacity>
          )}

          {showActivityLog && !isRunning && (
            <TouchableOpacity style={styles.modernButtonSecondary} onPress={handleReset}>
              <FontAwesome5 name="redo" size={16} color="#1A1B25" />
              <Text style={styles.modernButtonTextSecondary}>Reset & Mulai Lagi</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      
      {/* QRIS Modal */}
      <QRISModal
        visible={showQRISModal}
        qrisURL={qrisURL}
        countdown={qrisCountdown}
        onSkip={() => {
          setShowQRISModal(false);
          startAbsensiProcess();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Global Container
  container: { 
    flex: 1, 
    backgroundColor: '#F6F8FB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 40,
  },
  topBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 75,
    zIndex: 1000,
  },
  
  // Header Section
  headerSection: {
    marginBottom: 24,
    marginTop: 20,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  dateSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#E8E3FF',
    marginTop: 4,
  },
  
  // Active Goal Card (Main Hero)
  activeGoalCard: {
    borderRadius: 30,
    marginTop: 32,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.6)',
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  glassBlur: {
    padding: 24,
    borderRadius: 30,
    overflow: 'hidden',
  },
  goalBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8F92A1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24,
  },
  progressRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  progressBarWrapper: {
    flex: 0.7,
  },
  bigPercentage: {
    flex: 0.3,
    fontSize: 30,
    fontWeight: '800',
    color: '#007AFF',
    textAlign: 'right',
    letterSpacing: -2,
  },
  
  // Progress Bar
  progressTrack: {
    height: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
    position: 'relative',
  },
  progressGlow: {
    position: 'absolute',
    right: 0,
    width: 40,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
  },
  
  // Mini Stats Row (inside card)
  miniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F4F5F7',
  },
  miniStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1B25',
    marginBottom: 4,
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8F92A1',
    textAlign: 'center',
  },
  miniStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  
  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1B25',
    marginBottom: 16,
  },
  
  // Learning Items
  learningItem: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.7)',
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  learningItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  learningIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  learningTextColumn: {
    flex: 1,
  },
  learningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1B25',
    marginBottom: 4,
  },
  learningSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8F92A1',
  },
  learningActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 27, 37, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Config Detail Card
  configDetailCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.7)',
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernInput: {
    backgroundColor: 'rgba(249, 250, 251, 0.5)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
    color: '#1A1B25',
  },
  row: { 
    flexDirection: 'row', 
    gap: 12 
  },
  halfInput: { 
    flex: 1 
  },
  
  // Date Range Card
  dateRangeCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.7)',
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  dateGroup: { 
    flex: 1 
  },
  modernLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modernDateButton: {
    backgroundColor: 'rgba(249, 250, 251, 0.7)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  modernDateText: {
    fontSize: 15,
    color: '#1A1B25',
    fontWeight: '500',
  },
  
  // Image Management Card
  imageManagementCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 28,
    elevation: 6,
  },
  imageButtonRow: { 
    flexDirection: 'row', 
    marginBottom: 16 
  },
  modernCompactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  modernCompactButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  imageList: { 
    marginTop: 8 
  },
  modernImageThumb: {
    marginRight: 12,
    position: 'relative',
  },
  modernImageThumbImg: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  modernDeleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Activity Log Card
  activityLogCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 28,
    elevation: 6,
  },
  logItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    backgroundColor: 'rgba(249, 250, 251, 0.6)',
  },
  logSuccess: {
    backgroundColor: 'rgba(236, 253, 245, 0.7)',
    borderLeftColor: '#10B981',
  },
  logError: {
    backgroundColor: 'rgba(254, 242, 242, 0.7)',
    borderLeftColor: '#EF4444',
  },
  logWarning: {
    backgroundColor: 'rgba(255, 251, 235, 0.7)',
    borderLeftColor: '#F59E0B',
  },
  logInfo: {
    backgroundColor: 'rgba(239, 246, 255, 0.7)',
    borderLeftColor: '#3B82F6',
  },
  logTime: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 3,
    fontWeight: '500',
  },
  logMessage: {
    fontSize: 12,
    color: '#1A1B25',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 20,
    fontWeight: '500',
  },
  
  // Modern Stats Card
  modernStatsCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 28,
    elevation: 6,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modernStatItem: {
    alignItems: 'center',
  },
  modernStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1B25',
    marginBottom: 4,
  },
  modernStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8F92A1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  processingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  processingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8F92A1',
  },
  
  // Action Buttons
  actionButtonsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  modernButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  modernButtonPrimary: {
    backgroundColor: '#7F77FE',
  },
  modernButtonDanger: {
    backgroundColor: '#FF6B6B',
  },
  modernButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  modernButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modernButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1B25',
    letterSpacing: 0.5,
  },
  
  // Date Picker Modal
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerDone: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
});

