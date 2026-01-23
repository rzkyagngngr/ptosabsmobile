import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { absensiAPI } from '../services/api';
import { PRIMARY, GREEN, RED, YELLOW, NEUTRAL } from '../utils/colors';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 96) / 7; // Screen width - more padding for spacing

export default function HistoryScreen() {
  // Force light mode - ignore system dark mode preference
  const isDark = false;
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayData, setDayData] = useState({});
  const [holidays, setHolidays] = useState([]);
  const carouselRef = useRef(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    loadHolidays();
    loadLaporan();
  }, [currentDate]);

  // Auto-scroll carousel
  useEffect(() => {
    const monthHolidays = holidays.filter(dateStr => {
      const [year, month] = dateStr.split('-');
      return parseInt(year) === currentDate.getFullYear() && 
             parseInt(month) === currentDate.getMonth() + 1;
    });
    
    // Only auto-scroll if there are holidays (2 cards)
    if (monthHolidays.length === 0) return;

    const interval = setInterval(() => {
      setCarouselIndex(prev => {
        const next = prev === 0 ? 1 : 0; // Toggle between 2 cards
        if (carouselRef.current) {
          carouselRef.current.scrollTo({
            x: next * (width - 16),
            animated: true
          });
        }
        return next;
      });
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [holidays, currentDate]);

  const loadHolidays = async () => {
    try {
      const stored = await AsyncStorage.getItem('holidays');
      if (stored) {
        setHolidays(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load holidays', error);
    }
  };

  const loadLaporan = async () => {
    try {
      setLoading(true);
      
      // Get token from userData object (same as HomeScreen)
      const saved = await AsyncStorage.getItem('userData');
      if (!saved) {
        console.error('No userData found in AsyncStorage');
        return;
      }
      
      const userData = JSON.parse(saved);
      const token = userData.token;
      
      if (!token) {
        console.error('No token found in userData');
        return;
      }
      
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = currentDate.getFullYear().toString();
      
      const result = await absensiAPI.getLaporan(token, month, year);
      
      if (result.success && Array.isArray(result.data)) {
        setData(result.data);
        processCalendarData(result.data);
      }
    } catch (error) {
      console.error('Failed to load laporan', error);
    } finally {
      setLoading(false);
    }
  };

  const processCalendarData = (records) => {
    const grouped = {};
    records.forEach(record => {
      // Parse date from "01/07/2026 17:28:45" format
      const [date] = record.TR_DATE.split(' ');
      const [month, day, year] = date.split('/');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(record);
    });
    setDayData(grouped);
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getDayColor = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayStr}`;
    
    const date = new Date(year, currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    
    // Check if national holiday (soft red)
    if (holidays.includes(dateKey)) {
      return { bg: RED.LIGHT, text: RED.DARK }; // Soft red for holidays
    }
    
    // Weekend (Saturday=6, Sunday=0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { bg: RED.MEDIUM, text: '#FFFFFF' }; // Red
    }
    
    const records = dayData[dateKey];
    if (!records || records.length === 0) {
      return { bg: '#FFFFFF', text: NEUTRAL.GRAY_500 }; // White/gray
    }
    
    if (records.length === 1) {
      return { bg: YELLOW.BRIGHT, text: '#FFFFFF' }; // Yellow
    }
    
    // >= 2 records
    return { bg: GREEN.LIGHT, text: '#FFFFFF' }; // Green
  };

  const getDayRecords = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayStr}`;
    return dayData[dateKey] || [];
  };

  const openDayDetail = (day) => {
    const records = getDayRecords(day);
    if (records.length > 0) {
      setSelectedDate(day);
      setSelectedItem(records);
      setModalVisible(true);
    }
  };

  const getTipeLabel = (tipe) => {
    return tipe === 1 ? 'Clock In' : 'Clock Out';
  };

  const getTipeIcon = (tipe) => {
    return tipe === 1 
      ? { name: 'sign-in-alt', color: GREEN.MEDIUM } 
      : { name: 'sign-out-alt', color: RED.MEDIUM };
  };

  const formatDate = (dateStr) => {
    // Format: 01/07/2026 17:28:45 -> 7 Jan 2026, 17:28
    const [date, time] = dateStr.split(' ');
    const [month, day, year] = date.split('/');
    const [hour, minute] = time.split(':');
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}, ${hour}:${minute}`;
  };

  const getMonthYearText = () => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const closeDetail = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setSelectedDate(null);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const calendarDays = [];
  
  // Empty cells before first day
  for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
    calendarDays.push(null);
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <LinearGradient
        colors={['#8B7CFF', '#B8A9FF', '#E8E3FF', '#F6F8FB', '#FFFFFF']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <ScrollView style={styles.contentNoHeader} showsVerticalScrollIndicator={false}>
        <View style={styles.monthNavigator}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 45 : 22}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <FontAwesome5 name="chevron-left" size={20} color="#8B7CFF" />
          </TouchableOpacity>
          
          <Text style={styles.monthYearText}>{getMonthYearText()}</Text>
          
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 45 : 22}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <FontAwesome5 name="chevron-right" size={20} color="#8B7CFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarCard}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 50 : 25}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY.MEDIUM} />
            </View>
          ) : (
            <>
              {/* Day Headers */}
              <View style={styles.dayHeaderRow}>
                {days.map((day, index) => (
                  <View key={index} style={styles.dayHeader}>
                    <Text style={styles.dayHeaderText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <View key={`empty-${index}`} style={styles.emptyCell} />;
                  }
                  
                  const { bg, text } = getDayColor(day);
                  const records = getDayRecords(day);
                  const hasData = records.length > 0;
                  
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayCell, { backgroundColor: bg }]}
                      onPress={() => openDayDetail(day)}
                      disabled={!hasData}
                    >
                      <Text style={[styles.dayNumber, { color: text }]}>{day}</Text>
                      {hasData && (
                        <View style={styles.dotsContainer}>
                          {records.slice(0, 2).map((_, i) => (
                            <View key={i} style={[styles.dot, { backgroundColor: text }]} />
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FCA5A5' }]} />
                  <Text style={styles.legendText}>Holiday</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Weekend</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' }]} />
                  <Text style={styles.legendText}>No Data</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FBBF24' }]} />
                  <Text style={styles.legendText}>Partial</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Complete</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Carousel Section - Holiday & Insights */}
        {!loading && (
          <View style={styles.carouselSection}>
            <Text style={[styles.carouselTitle, isDark && styles.textDark]}>Monthly Overview</Text>
            <ScrollView
              ref={carouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={width - 32}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (width - 16));
                setCarouselIndex(index);
              }}
            >
              {/* Card 1: Holiday Reminder */}
              {(() => {
                const monthHolidays = holidays.filter(dateStr => {
                  const [year, month] = dateStr.split('-');
                  return parseInt(year) === currentDate.getFullYear() && 
                         parseInt(month) === currentDate.getMonth() + 1;
                }).map(dateStr => {
                  const date = new Date(dateStr + 'T00:00:00');
                  const dayOfWeek = date.getDay();
                  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                  
                  let longWeekendTip = '';
                  if (dayOfWeek === 1) {
                    longWeekendTip = '💡 Cuti Jumat sebelumnya untuk long weekend 4 hari!';
                  } else if (dayOfWeek === 5) {
                    longWeekendTip = '💡 Cuti Senin setelahnya untuk long weekend 4 hari!';
                  } else if (dayOfWeek === 2) {
                    longWeekendTip = '💡 Cuti/WFH Senin untuk long weekend 4 hari!';
                  } else if (dayOfWeek === 4) {
                    longWeekendTip = '💡 Cuti/WFH Jumat untuk long weekend 4 hari!';
                  }
                  
                  return {
                    date: dateStr,
                    dayName: dayNames[dayOfWeek],
                    dayNumber: date.getDate(),
                    tip: longWeekendTip
                  };
                });

                if (monthHolidays.length === 0) return null;

                return (
                  <View style={styles.carouselCard}>
                    <View style={styles.holidayCardWrapper}>
                      <BlurView
                        intensity={Platform.OS === 'ios' ? 45 : 22}
                        tint="light"
                        style={StyleSheet.absoluteFill}
                      />
                      <LinearGradient
                        colors={['rgba(252, 165, 165, 0.4)', 'rgba(254, 202, 202, 0.3)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                          <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardIconContainer}
                          >
                            <FontAwesome5 name="calendar-alt" size={18} color="#FFFFFF" />
                          </LinearGradient>
                          <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Hari Libur</Text>
                            <Text style={styles.cardSubtitle}>
                              {monthHolidays.length} hari libur nasional
                            </Text>
                          </View>
                        </View>

                        <ScrollView style={styles.holidayList} showsVerticalScrollIndicator={false}>
                          {monthHolidays.map((holiday, index) => (
                            <View key={index} style={styles.holidayItemCompact}>
                              <View style={styles.holidayDateBadgeCompact}>
                                <Text style={styles.holidayDateNumberCompact}>{holiday.dayNumber}</Text>
                                <Text style={styles.holidayDateDayCompact}>{holiday.dayName}</Text>
                              </View>
                              <View style={styles.holidayItemContentCompact}>
                                {holiday.tip && (
                                  <Text style={styles.holidayTipCompact}>{holiday.tip}</Text>
                                )}
                              </View>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </View>
                );
              })()}

              {/* Card 2: Summary with 4 Stats */}
              <View style={styles.carouselCard}>
                <View style={styles.insightsCardWrapper}>
                  <BlurView
                    intensity={Platform.OS === 'ios' ? 45 : 22}
                    tint="light"
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    colors={['rgba(147, 197, 253, 0.4)', 'rgba(191, 219, 254, 0.3)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <LinearGradient
                        colors={['#3B82F6', '#2563EB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardIconContainer}
                      >
                        <FontAwesome5 name="chart-bar" size={18} color="#FFFFFF" />
                      </LinearGradient>
                      <View style={styles.cardHeaderText}>
                        <Text style={[styles.cardTitle, { color: '#1E40AF' }]}>Statistik</Text>
                        <Text style={[styles.cardSubtitle, { color: '#3B82F6' }]}>
                          Ringkasan absensi bulan ini
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <LinearGradient
                          colors={['#10B981', '#059669']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.statIcon}
                        >
                          <FontAwesome5 name="check-circle" size={14} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={styles.statValue}>
                          {Object.values(dayData).filter(records => records.length >= 2).length}
                        </Text>
                        <Text style={styles.statLabel}>Complete</Text>
                      </View>

                      <View style={styles.statItem}>
                        <LinearGradient
                          colors={['#F59E0B', '#D97706']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.statIcon}
                        >
                          <FontAwesome5 name="exclamation-circle" size={14} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={styles.statValue}>
                          {Object.values(dayData).filter(records => records.length === 1).length}
                        </Text>
                        <Text style={styles.statLabel}>Partial</Text>
                      </View>

                      <View style={styles.statItem}>
                        <LinearGradient
                          colors={['#3B82F6', '#2563EB']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.statIcon}
                        >
                          <FontAwesome5 name="clipboard-list" size={14} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={styles.statValue}>
                          {data.length}
                        </Text>
                        <Text style={styles.statLabel}>Total Records</Text>
                      </View>

                      <View style={styles.statItem}>
                        <LinearGradient
                          colors={['#8B5CF6', '#7C3AED']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.statIcon}
                        >
                          <FontAwesome5 name="percentage" size={14} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={styles.statValue}>
                          {Object.keys(dayData).length > 0 
                            ? Math.round((Object.values(dayData).filter(r => r.length >= 2).length / Object.keys(dayData).length) * 100)
                            : 0}%
                        </Text>
                        <Text style={styles.statLabel}>Complete Rate</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
            
            {/* Pagination Dots */}
            <View style={styles.paginationDots}>
              {holidays.filter(dateStr => {
                const [year, month] = dateStr.split('-');
                return parseInt(year) === currentDate.getFullYear() && 
                       parseInt(month) === currentDate.getMonth() + 1;
              }).length > 0 ? (
                <>
                  <View style={[styles.dot, carouselIndex === 0 && styles.dotActive]} />
                  <View style={[styles.dot, carouselIndex === 1 && styles.dotActive]} />
                </>
              ) : (
                <View style={[styles.dot, styles.dotActive]} />
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 55 : 28}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>
                {selectedDate && `${selectedDate} ${getMonthYearText()}`}
              </Text>
              <TouchableOpacity onPress={closeDetail}>
                <FontAwesome5 name="times" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedItem && Array.isArray(selectedItem) && selectedItem.map((record, index) => {
                const icon = getTipeIcon(record.TIPE);
                return (
                  <View key={index} style={styles.recordCard}>
                    <BlurView
                      intensity={Platform.OS === 'ios' ? 45 : 22}
                      tint="light"
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.recordHeader}>
                      <View style={[styles.recordIconContainer, { backgroundColor: icon.color + '20' }]}>
                        <FontAwesome5 name={icon.name} size={20} color={icon.color} />
                      </View>
                      <View style={styles.recordHeaderText}>
                        <Text style={[styles.recordTitle, isDark && styles.textDark]}>
                          {getTipeLabel(record.TIPE)}
                        </Text>
                        <Text style={styles.recordTime}>{formatDate(record.TR_DATE)}</Text>
                      </View>
                    </View>

                    {record.FOTO && (
                      <Image 
                        source={{ uri: record.FOTO }} 
                        style={styles.recordPhoto}
                        resizeMode="cover"
                      />
                    )}

                    <View style={styles.recordDetails}>
                      <View style={styles.recordDetailRow}>
                        <FontAwesome5 name="map-marker-alt" size={14} color="#3B82F6" />
                        <Text style={styles.recordDetailText} numberOfLines={2}>
                          {record.LOKASI}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  contentNoHeader: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  monthYearText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1B25',
  },
  calendarCard: {
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 28,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeader: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyCell: {
    width: ITEM_WIDTH * 0.92,
    height: ITEM_WIDTH * 0.85,
    marginHorizontal: 2,
  },
  dayCell: {
    width: ITEM_WIDTH * 0.92,
    height: ITEM_WIDTH * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginHorizontal: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  textDark: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 10,
  },
  modalContentDark: {
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  recordCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordHeaderText: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  recordTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  recordPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  recordDetails: {
    gap: 8,
  },
  recordDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordDetailText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  carouselSection: {
    marginTop: 16,
    marginBottom: 200,
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  carouselContent: {
    paddingHorizontal: 10,
  },
  carouselCard: {
    width: width  -50,
    marginHorizontal: 10,
  },
  holidayCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 330,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 6,
  },
  insightsCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 330,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 6,
  },
  statCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 330,
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 6,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#DC2626',
  },
  holidayList: {
    flex: 1,
  },
  holidayItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.1)',
  },
  holidayDateBadgeCompact: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  holidayDateNumberCompact: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
  },
  holidayDateDayCompact: {
    fontSize: 9,
    fontWeight: '600',
    color: '#EF4444',
  },
  holidayItemContentCompact: {
    flex: 1,
  },
  holidayTipCompact: {
    fontSize: 12,
    fontWeight: '500',
    color: '#991B1B',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    width: (width - 112) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  bigStatContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  bigStatValue: {
    fontSize: 72,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  bigStatLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  bigStatDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  summaryStatsGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
  },
  summaryStatItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  summaryStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
});

