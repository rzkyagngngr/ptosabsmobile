import axios from 'axios';
import FormData from 'form-data';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URLs
const PELINDO_API_URL = 'https://my.api.pelindo.co.id/absensifc/doabsen';
const LAPORAN_API_URL = 'https://my.api.pelindo.co.id/absensifc/laporan';
const USERS_DATA_API_URL = 'https://ptosm-hub.ilcs.co.id/webhook/users/data';
const HOLIDAY_API_URL = 'https://api-harilibur.vercel.app/api';

export const absensiAPI = {
  // Absen langsung ke API Pelindo
  doAbsen: async (userData, trDate, tipe, imageUri) => {
    try {
      const formData = new FormData();
      
      // Add image if provided
      if (imageUri) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('GAMBAR', {
          uri: imageUri,
          name: filename,
          type,
        });
      }
      
      formData.append('LOKASI', userData.lokasi);
      formData.append('LAT', userData.lat);
      formData.append('LNG', userData.lng);
      formData.append('TR_DATE', trDate);
      formData.append('KOMENTAR', userData.komentar);
      formData.append('PROGRAME_NAME', userData.programeName);
      formData.append('TIPE', tipe.toString());

      const response = await axios.post(PELINDO_API_URL, formData, {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Get laporan absensi by month and year
  getLaporan: async (token, month, year) => {
    try {
      const formData = new FormData();
      formData.append('month', month);
      formData.append('year', year);

      const response = await axios.post(LAPORAN_API_URL, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Generate random clock in time
  getRandomClockIn: (date) => {
    const hour = 7;
    const minute = Math.floor(Math.random() * 30) + 30; // 07:30 - 07:59
    const second = Math.floor(Math.random() * 60);
    return formatDateTime(date, hour, minute, second);
  },

  // Generate random clock out time
  getRandomClockOut: (date) => {
    const hour = 17;
    const minute = Math.floor(Math.random() * 61); // 17:00 - 17:60
    const second = Math.floor(Math.random() * 60);
    return formatDateTime(date, hour, minute, second);
  },

  // Fetch holidays from API
  fetchHolidays: async (year) => {
    try {
      const response = await axios.get(`${HOLIDAY_API_URL}?year=${year}`);
      const nationalHolidays = response.data
        .filter(h => h.is_national_holiday === true)
        .map(h => {
          // Normalize date format: "2026-01-1" -> "2026-01-01"
          const parts = h.holiday_date.split('-');
          const year = parts[0];
          const month = parts[1].padStart(2, '0');
          const day = parts[2].padStart(2, '0');
          return `${year}-${month}-${day}`;
        });
      return nationalHolidays;
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return [];
    }
  },

  // Load holidays for current and previous year
  loadHolidays: async () => {
    try {
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      
      const [currentYearHolidays, previousYearHolidays] = await Promise.all([
        absensiAPI.fetchHolidays(currentYear),
        absensiAPI.fetchHolidays(previousYear)
      ]);
      
      const allHolidays = [...previousYearHolidays, ...currentYearHolidays];
      await AsyncStorage.setItem('holidays', JSON.stringify(allHolidays));
      
      return allHolidays;
    } catch (error) {
      console.error('Error loading holidays:', error);
      return [];
    }
  },

  // Get holidays from AsyncStorage
  getStoredHolidays: async () => {
    try {
      const stored = await AsyncStorage.getItem('holidays');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored holidays:', error);
      return [];
    }
  },

  // Check if date is holiday
  isHoliday: async (date) => {
    const holidays = await absensiAPI.getStoredHolidays();
    // Use local date format to match API format (yyyy-mm-dd)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return holidays.includes(dateStr);
  },

  // Check if date is work day
  isWorkDay: async (date) => {
    const day = date.getDay();
    const isHoliday = await absensiAPI.isHoliday(date);
    return day >= 1 && day <= 5 && !isHoliday;
  },
};

// Helper function to format date time
function formatDateTime(date, hour, minute, second) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  const s = String(second).padStart(2, '0');
  return `${month}/${day}/${year} ${h}:${m}:${s}`;
}

// Auth API
export const authAPI = {
  // Fetch users data from API
  fetchUsersData: async () => {
    try {
      const response = await axios.get(USERS_DATA_API_URL, {
        timeout: 10000,
      });
      
      if (response.data && response.data.users) {
        return { 
          success: true, 
          users: response.data.users,
          appinfo: response.data.appinfo || null
        };
      }
      
      return { 
        success: false, 
        message: 'Invalid response format' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Login with username and password
  login: async (username, password) => {
    try {
      // Fetch users data from API
      const usersResult = await authAPI.fetchUsersData();
      
      if (!usersResult.success) {
        return { 
          success: false, 
          message: usersResult.message || 'Gagal mengambil data user' 
        };
      }

      // Find user by username and password
      const users = usersResult.users;
      const userEntry = Object.entries(users).find(
        ([_, user]) => user.username === username && user.password === password
      );

      if (!userEntry) {
        return { 
          success: false, 
          message: 'Username atau password salah!' 
        };
      }

      const [nickname, userData] = userEntry;
      
      // Return user data with token and appinfo
      return {
        success: true,
        token: userData.token,
        appinfo: usersResult.appinfo,
        user: {
          nickname: userData.nickname,
          username: userData.username,
          token: userData.token,
          lokasi: userData.lokasi,
          lat: userData.lat,
          lng: userData.lng,
          komentar: userData.komentar,
          programeName: userData.programeName,
          imageFolder: userData.imageFolder,
        },
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Terjadi kesalahan saat login' 
      };
    }
  },
};

export default absensiAPI;
