import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LoginScreen from './src/screens/LoginScreen';
import LoadingScreen from './src/components/LoadingScreen';
import VersionCheckModal from './src/components/VersionCheckModal';
import ErrorBoundary from './src/components/ErrorBoundary';
import CustomBottomTabBar from './src/components/CustomBottomTabBar';
import appJson from './app.json';
import { authAPI } from './src/services/api';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ signOut }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'History') {
            iconName = 'clock';
          } else if (route.name === 'Settings') {
            iconName = 'cog';
          }

          return <FontAwesome5 name={iconName} size={size} color={color} solid={focused} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
      tabBar={props => <CustomBottomTabBar {...props} />}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ tabBarLabel: 'Riwayat' }}
      />
      <Tab.Screen 
        name="Settings"
        options={{ tabBarLabel: 'Pengaturan' }}
      >
        {props => <SettingsScreen {...props} signOut={signOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [updateURL, setUpdateURL] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if user is logged in first
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
      
      // Try to fetch fresh data from API (non-blocking)
      try {
        const apiResult = await authAPI.fetchUsersData();
        
        if (apiResult && apiResult.success) {
          // Update AsyncStorage with fresh appinfo
          if (apiResult.appinfo) {
            await AsyncStorage.setItem('appinfo', JSON.stringify(apiResult.appinfo));
            
            // Check version with fresh data
            const needsUpdate = compareVersions(appJson.expo.version, apiResult.appinfo.version);
            if (needsUpdate) {
              setUpdateURL(apiResult.appinfo.updateURL || '');
              setShowVersionModal(true);
            }
          }
          
          // Update users data in AsyncStorage
          if (apiResult.users) {
            await AsyncStorage.setItem('usersData', JSON.stringify(apiResult.users));
          }
        }
      } catch (apiError) {
        // API call failed, use cached data
        console.log('API call failed, using cached data:', apiError.message);
        
        // Check version with cached appinfo
        try {
          const appinfoStr = await AsyncStorage.getItem('appinfo');
          if (appinfoStr) {
            const appinfo = JSON.parse(appinfoStr);
            const needsUpdate = compareVersions(appJson.expo.version, appinfo.version);
            if (needsUpdate) {
              setUpdateURL(appinfo.updateURL || '');
              setShowVersionModal(true);
            }
          }
        } catch (e) {
          console.log('Error checking cached appinfo:', e.message);
        }
      }
    } catch (error) {
      console.error('Failed to check auth status', error);
      // Set loading false even if error
      setUserToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const compareVersions = (currentVersion, apiVersion) => {
    try {
      if (!currentVersion || !apiVersion) return false;
      
      // Compare version strings (e.g., "1.0.0" vs "1.0.1")
      // Returns true if current < api (needs update)
      const current = currentVersion.split('.').map(Number);
      const api = apiVersion.split('.').map(Number);
      
      for (let i = 0; i < 3; i++) {
        const curr = current[i] || 0;
        const apiVer = api[i] || 0;
        if (curr < apiVer) return true;
        if (curr > apiVer) return false;
      }
      return false; // Versions are equal
    } catch (error) {
      console.error('Error comparing versions:', error);
      return false;
    }
  };

  const signIn = async (token, userData, appinfo) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Store appinfo and check version
      if (appinfo) {
        try {
          await AsyncStorage.setItem('appinfo', JSON.stringify(appinfo));
          const needsUpdate = compareVersions(appJson.expo.version, appinfo.version);
          if (needsUpdate) {
            setUpdateURL(appinfo.updateURL || '');
            setShowVersionModal(true);
          }
        } catch (e) {
          console.error('Error storing appinfo:', e);
        }
      }
      
      setUserToken(token);
    } catch (error) {
      console.error('Error in signIn:', error);
      // Still set token even if storage fails
      setUserToken(token);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUserToken(null);
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <NavigationContainer 
        theme={DefaultTheme}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userToken == null ? (
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} signIn={signIn} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="MainTabs">
              {props => <MainTabs {...props} signOut={signOut} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      
      {/* Version Check Modal - Blocks entire app */}
      <VersionCheckModal visible={showVersionModal} updateURL={updateURL} />
    </ErrorBoundary>
  );
}
