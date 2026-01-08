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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
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

  // Animated values for header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [Platform.OS === 'ios' ? 140 : 130, Platform.OS === 'ios' ? 93 : 87],
    extrapolate: 'clamp',
  });

  const headerPaddingTop = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [Platform.OS === 'ios' ? 60 : 50, Platform.OS === 'ios' ? 48 : 42],
    extrapolate: 'clamp',
  });

  const headerPaddingBottom = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [24, 16],
    extrapolate: 'clamp',
  });

  const borderRadius = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [30, 20],
    extrapolate: 'clamp',
  });

  const badgeOpacity = scrollY.interpolate({
    inputRange: [0, 30, 60],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const profileImageSize = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [56, 44],
    extrapolate: 'clamp',
  });

  const titleFontSize = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [22, 19],
    extrapolate: 'clamp',
  });

  const nameContainerMargin = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [16, 12],
    extrapolate: 'clamp',
  });

  const profileIconTranslateY = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, -14],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      
      {/* Liquid Glass Header */}
      <Animated.View style={[styles.headerContainer, { 
        height: headerHeight,
        borderBottomLeftRadius: borderRadius,
        borderBottomRightRadius: borderRadius,
      }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.85)' }]} />
        )}
        <Animated.View style={{ 
          borderBottomLeftRadius: borderRadius,
          borderBottomRightRadius: borderRadius,
          flex: 1,
        }}>
          <LinearGradient
            colors={[PRIMARY.DARK, PRIMARY.MEDIUM, PRIMARY.LIGHT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerGradient, {
              borderBottomLeftRadius: 20,
              borderBottomRightRadius: 20,
            }]}
          >
            <Animated.View style={[styles.header, {
              paddingTop: headerPaddingTop,
              paddingBottom: headerPaddingBottom,
            }]}>
              <View style={styles.profileSection}>
                <Animated.View style={{ 
                  width: profileImageSize, 
                  height: profileImageSize,
                  transform: [{ translateY: profileIconTranslateY }]
                }}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F0F9FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.profileImage, {
                      width: '100%',
                      height: '100%',
                    }]}
                  >
                    <FontAwesome5 name="user" size={20} color="#007AFF" />
                  </LinearGradient>
                </Animated.View>
                <Animated.View style={{ marginLeft: nameContainerMargin }}>
                  <Animated.Text style={[styles.headerTitle, { fontSize: titleFontSize }]}>
                    {nickname || 'User'}
                  </Animated.Text>
                  <Animated.View style={[styles.badgeRow, { opacity: badgeOpacity }]}>
                    <View style={styles.badge}>
                      <FontAwesome5 name="briefcase" size={10} color="#FFFFFF" />
                      <Text style={styles.badgeText}>PTOS Batch</Text>
                    </View>
                  </Animated.View>
                </Animated.View>
              </View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Stats Row - Show when started, hide when reset */}
        {showStats && (
          <Animated.View style={[styles.statsCard, { opacity: statsOpacity }]}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: GREEN.DARK }]}>
                <FontAwesome5 name="check-circle" size={20} color="#FFFFFF" solid />
              </View>
              <Text style={styles.statValue}>{stats.successCount}</Text>
              <Text style={styles.statLabel}>Berhasil</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: RED.DARK }]}>
                <FontAwesome5 name="times-circle" size={20} color="#FFFFFF" solid />
              </View>
              <Text style={styles.statValue}>{stats.errorCount}</Text>
              <Text style={styles.statLabel}>Gagal</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: PRIMARY.DARK }]}>
                <FontAwesome5 name="calendar-alt" size={20} color="#FFFFFF" solid />
              </View>
              <Text style={styles.statValue}>{stats.totalDays}</Text>
              <Text style={styles.statLabel}>Total Hari</Text>
            </View>
            
            {isRunning && (
              <View style={styles.processStatus}>
                <ActivityIndicator size="small" color={PRIMARY.MEDIUM} />
                <Text style={styles.processLabel}>Memproses: {stats.currentDate || '-'}</Text>
              </View>
            )}
            
            {!isRunning && stats.totalDays > 0 && (
              <View style={styles.processStatus}>
                <FontAwesome5 name="check-circle" size={14} color={GREEN.MEDIUM} solid />
                <Text style={styles.processDone}>
                  Selesai! {stats.successCount} Berhasil, {stats.errorCount} Gagal
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* User Data Form & Absensi Settings */}
        <View style={[styles.card, styles.cardWithTopMargin]}>
          {/* Detail Toggle Button */}
          <TouchableOpacity 
            style={styles.detailToggle}
            onPress={() => setShowDetails(!showDetails)}
          >
            <View style={styles.detailToggleContent}>
              <FontAwesome5 name="info-circle" size={14} color="#007AFF" />
              <Text style={styles.detailToggleText}>Detail</Text>
            </View>
            <FontAwesome5 
              name={showDetails ? "chevron-up" : "chevron-down"} 
              size={12} 
              color="#6B7280" 
            />
          </TouchableOpacity>

          {/* User Data Fields - Hidden by default */}
          {showDetails && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Lokasi *"
                placeholderTextColor="#9CA3AF"
                value={lokasi}
                onChangeText={setLokasi}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Latitude *"
                  placeholderTextColor="#9CA3AF"
                  value={lat}
                  onChangeText={setLat}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Longitude *"
                  placeholderTextColor="#9CA3AF"
                  value={lng}
                  onChangeText={setLng}
                  keyboardType="numeric"
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Komentar (opsional)"
                placeholderTextColor="#9CA3AF"
                value={komentar}
                onChangeText={setKomentar}
              />
              <TextInput
                style={styles.input}
                placeholder="Program Name (opsional)"
                placeholderTextColor="#9CA3AF"
                value={programeName}
                onChangeText={setProgrameName}
              />
              <View style={styles.sectionDivider} />
            </>
          )}
          
          {/* Periode Absensi - Always visible */}
          {/* <Text style={styles.sectionLabel}>Periode Absensi</Text> */}
          <View style={styles.dateRow}>
            <View style={styles.dateGroup}>
              <Text style={styles.label}>Tanggal Mulai</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateGroup}>
              <Text style={styles.label}>Tanggal Akhir</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
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
        </View>

        {/* Image Selection / Activity Log (Conditional with Animation) */}
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          {!showActivityLog ? (
            // Image Selection
            <>
              <Text style={styles.cardTitle}>Gambar ({selectedImages.length})</Text>
              
              <View style={styles.imageButtonRow}>
                <TouchableOpacity 
                  style={styles.compactButton} 
                  onPress={handleTakePhoto}
                >
                  <FontAwesome5 name="camera" size={12} color="#007AFF" />
                  <Text style={styles.compactButtonText}>Ambil Foto</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.compactButton} 
                  onPress={handleSelectFromGallery}
                >
                  <FontAwesome5 name="images" size={12} color="#007AFF" />
                  <Text style={styles.compactButtonText}>Galeri</Text>
                </TouchableOpacity>
              </View>

              {selectedImages.length > 0 && (
                <>
                  <FlatList
                    data={selectedImages}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                      <View style={styles.imageThumbContainer}>
                        <Image source={{ uri: item }} style={styles.imageThumb} />
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteImage(index)}
                        >
                          <Text style={styles.deleteButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    style={styles.imageList}
                  />
                </>
              )}
            </>
          ) : (
            // Activity Log
            <>
              <Text style={styles.cardTitle}>Activity Log</Text>
              <View style={styles.logsContainer}>
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
              </View>
            </>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.card}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, (isRunning || loading) && styles.buttonDisabled]}
              onPress={handleStartAbsensi}
              disabled={isRunning || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="play" size={14} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Mulai Absensi</Text>
                </>
              )}
            </TouchableOpacity>

            {showActivityLog && !isRunning && (
              <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleReset}>
                <FontAwesome5 name="redo" size={14} color="#007AFF" style={styles.buttonIcon} />
                <Text style={styles.buttonTextSecondary}>Reset</Text>
              </TouchableOpacity>
            )}

            {isRunning && (
              <TouchableOpacity style={[styles.button, styles.buttonDanger]} onPress={handleStopAbsensi}>
                <FontAwesome5 name="stop" size={14} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Stop</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

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
  // Light Theme (Default)
  container: { 
    flex: 1, 
    backgroundColor: '#F5F7FA',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textDark: {
    color: '#FFFFFF',
  },
  textSecondaryDark: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  content: { flex: 1, paddingBottom: 500, paddingTop: Platform.OS === 'ios' ? 140 : 130 },
  
  // Stats Card - Solid
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: `${PRIMARY.DEEP}18`,
  },
  statItem: {
    alignItems: 'center',
    width: '30%',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  processStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    gap: 8,
  },
  processLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 8,
  },
  processDone: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN.MEDIUM,
  },
  
  card: { 
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
  },
  cardWithTopMargin: {
    marginTop: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  detailToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  card_original: { 
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#1A1A1A', 
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  input: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 15, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    marginBottom: 12,
    color: '#1A1A1A',
  },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  dateGroup: { flex: 1 },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#374151', 
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  dateButton: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 12, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
  },
  dateText: { 
    fontSize: 15, 
    color: '#1A1A1A',
  },
  buttonRow: { flexDirection: 'row', gap: 12 },
  button: { 
    flexDirection: 'row',
    flex: 1, 
    borderRadius: 14, 
    paddingVertical: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonPrimary: { 
    backgroundColor: '#007AFF',
  },
  buttonDanger: { 
    backgroundColor: '#FF3B30',
  },
  buttonSecondary: { 
    backgroundColor: '#F3F4F6', 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
  },
  buttonCamera: { 
    backgroundColor: '#E0F2FE', 
    borderWidth: 1, 
    borderColor: '#BAE6FD',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonTextSecondary: { 
    color: '#374151', 
    fontSize: 16, 
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonTextDanger: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  imageButtonRow: { flexDirection: 'row', marginBottom: 12 },
  imageList: { marginTop: 12, marginBottom: 8 },
  imageThumbContainer: { 
    marginRight: 12, 
    position: 'relative',
  },
  imageThumb: { 
    width: 85, 
    height: 85, 
    borderRadius: 16, 
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteButton: { 
    position: 'absolute', 
    top: -8, 
    right: -8, 
    backgroundColor: '#FF3B30', 
    borderRadius: 15, 
    width: 30, 
    height: 30, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  deleteButtonText: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: 'bold',
  },
  logsContainer: { marginTop: 8 },
  logItem: { 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 8, 
    borderLeftWidth: 3,
    backgroundColor: '#F9FAFB',
  },
  logSuccess: { 
    backgroundColor: '#ECFDF5', 
    borderLeftColor: '#10B981',
  },
  logError: { 
    backgroundColor: '#FEF2F2', 
    borderLeftColor: '#EF4444',
  },
  logWarning: { 
    backgroundColor: '#FFFBEB', 
    borderLeftColor: '#F59E0B',
  },
  logInfo: { 
    backgroundColor: '#EFF6FF', 
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
    color: '#1A1A1A',
    fontWeight: '500',
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#9CA3AF', 
    fontSize: 14, 
    paddingVertical: 20,
    fontWeight: '500',
  },
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
