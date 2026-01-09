/**
 * Driver Dashboard
 * 
 * Main screen for drivers showing:
 * - Location tracking toggle (starts/ends trip)
 * - Current stop with color indicator
 * - Countdown timer for RED/YELLOW states
 * - Student notifications (wait requests and absences)
 * - Route stops with color-coded status
 * 
 * Per specification:
 * - Colors are derived client-side only
 * - GREY: all passengers absent (can skip)
 * - RED: standard waiting (0-5 min)
 * - YELLOW: extended wait with requests (5-7 min)
 * - GREEN: in transit or stop completed
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BUS_COLORS, NOTIFICATION_CONFIG, STOP_COLOR_CONFIG, STOP_TIMING, STUDENT_STATUS_CONFIG } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatHeading, formatSpeed } from '@/services/location';
import { getBusStops } from '@/services/mock-data';
import { StopColor, Student, StudentNotification } from '@/types';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DriverDashboard() {
  const {
    userName,
    isTracking,
    currentLocation,
    startTracking,
    stopTracking,
    notifications,
    unreadCount,
    students,
    markNotificationRead,
    clearAllNotifications,
    activeTrip,
    route,
    waitRequests,
    absences,
    startTrip,
    endTrip,
    arriveAtStop,
    departFromStop,
  } = useApp();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  
  // Track current stop index for navigation
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  
  // Get bus stops from route (per specification: routes/{routeId}.stops)
  const busStops = useMemo(() => {
    if (route && route.stops.length > 0) {
      return route.stops.map(stop => ({
        id: stop.stopId,
        name: stop.name,
        location: { latitude: stop.lat, longitude: stop.lng, timestamp: 0 },
        students: [],
        order: 0,
        scheduledTime: stop.scheduledTime,
      }));
    }
    return getBusStops();
  }, [route]);
  
  const currentStop = busStops[currentStopIndex];
  
  // Use trip data for stop arrival time (per specification: trips/{tripId}.stopArrivedAt)
  const stopArrivedAt = activeTrip?.stopArrivedAt ?? null;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  // Timer for tracking elapsed time at stop
  useEffect(() => {
    if (isTracking && stopArrivedAt) {
      const interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - stopArrivedAt) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [isTracking, stopArrivedAt]);

  // Compute current stop color (per specification)
  // Colors are NEVER stored in the database - computed client-side
  const computeStopColor = (): StopColor => {
    if (!isTracking || stopArrivedAt === null) return 'GREEN';
    
    // Get current stop ID
    const currentStopId = currentStop?.id;
    
    // Count passengers at this stop (per spec: COUNT(users where preferredStopId == stopId))
    const stopStudents = students.filter(s => s.stopId === currentStopId);
    const totalPassengers = stopStudents.length;
    
    // Count absences at this stop from real Firestore data
    // Per spec: trips/{tripId}/absences where stopId == stopId
    const stopAbsences = absences.filter(a => a.stopId === currentStopId);
    const absentCount = stopAbsences.length;
    
    // Check if all passengers are absent (per spec: GREY state)
    const allAbsent = totalPassengers > 0 && absentCount >= totalPassengers;
    if (allAbsent) return 'GREY';
    
    // Check time-based colors (per spec: RED 0-5 min, YELLOW 5-7 min with wait requests)
    if (elapsedSeconds <= STOP_TIMING.RED_DURATION) return 'RED';
    
    // Count wait requests from real Firestore data
    // Per spec: trips/{tripId}/waitRequests where stopId == stopId
    const stopWaitRequests = waitRequests.filter(w => w.stopId === currentStopId);
    if (stopWaitRequests.length > 0 && elapsedSeconds <= STOP_TIMING.YELLOW_DURATION) return 'YELLOW';
    
    return 'GREEN';
  };
  
  const currentStopColor = computeStopColor();
  const stopColorConfig = STOP_COLOR_CONFIG[currentStopColor];
  
  // Get counts for display (per spec: derived from real-time data)
  const currentStopId = currentStop?.id;
  const currentStopWaitRequests = waitRequests.filter(w => w.stopId === currentStopId);
  const currentStopAbsences = absences.filter(a => a.stopId === currentStopId);

  const handleToggleTracking = async () => {
    if (isTracking) {
      Alert.alert(
        'End Trip',
        'Are you sure you want to end this trip?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'End Trip', 
            style: 'destructive', 
            onPress: async () => {
              try {
                // End trip in Firestore (per spec: trips/{tripId})
                await endTrip();
                stopTracking();
                setElapsedSeconds(0);
                setCurrentStopIndex(0);
              } catch (error) {
                console.error('Error ending trip:', error);
                Alert.alert('Error', 'Failed to end trip. Please try again.');
              }
            }
          },
        ]
      );
    } else {
      const success = await startTracking();
      if (success) {
        try {
          // Start trip in Firestore (per spec: trips/{tripId})
          await startTrip();
        } catch (error) {
          console.error('Error starting trip:', error);
        }
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to share your location with students.',
          [{ text: 'OK' }]
        );
      }
    }
  };
  
  const handleArriveAtStop = async () => {
    if (!currentStop?.id) return;
    
    try {
      // Arrive at stop in Firestore (per spec: trips/{tripId}.currentStopId, stopArrivedAt, status)
      await arriveAtStop(currentStop.id);
      setElapsedSeconds(0);
    } catch (error) {
      console.error('Error arriving at stop:', error);
      Alert.alert('Error', 'Failed to mark arrival. Please try again.');
    }
  };
  
  const handleDepartFromStop = async () => {
    try {
      // Depart from stop in Firestore (per spec: trips/{tripId}.status = IN_TRANSIT)
      await departFromStop();
      
      // Move to next stop
      if (currentStopIndex < busStops.length - 1) {
        setCurrentStopIndex(currentStopIndex + 1);
      }
      setElapsedSeconds(0);
    } catch (error) {
      console.error('Error departing from stop:', error);
      Alert.alert('Error', 'Failed to depart. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };
  
  const getRemainingTime = (): number | null => {
    if (currentStopColor === 'GREY' || currentStopColor === 'GREEN') return null;
    if (currentStopColor === 'RED') return Math.max(0, STOP_TIMING.RED_DURATION - elapsedSeconds);
    if (currentStopColor === 'YELLOW') return Math.max(0, STOP_TIMING.YELLOW_DURATION - elapsedSeconds);
    return null;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: secondaryTextColor }]}>Hello,</Text>
        <Text style={[styles.userName, { color: textColor }]}>{userName || 'Driver'}</Text>
      </View>

      {/* Tracking Status Card */}
      <View style={[styles.trackingCard, { backgroundColor: isTracking ? BUS_COLORS.success : cardColor }]}>
        <View style={styles.trackingHeader}>
          <View style={styles.trackingInfo}>
            <Text style={[styles.trackingLabel, { color: isTracking ? '#fff' : secondaryTextColor }]}>
              Trip Status
            </Text>
            <Text style={[styles.trackingStatus, { color: isTracking ? '#fff' : textColor }]}>
              {isTracking ? '● Active Trip' : '○ No Active Trip'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.trackingButton,
              { backgroundColor: isTracking ? 'rgba(255,255,255,0.3)' : BUS_COLORS.primary },
            ]}
            onPress={handleToggleTracking}
          >
            <Text style={styles.trackingButtonText}>
              {isTracking ? 'End Trip' : 'Start Trip'}
            </Text>
          </TouchableOpacity>
        </View>

        {isTracking && currentLocation && (
          <View style={styles.locationDetails}>
            <View style={styles.locationItem}>
              <IconSymbol name="speedometer" size={20} color="#fff" />
              <Text style={styles.locationText}>
                {formatSpeed(currentLocation.speed)}
              </Text>
            </View>
            <View style={styles.locationItem}>
              <IconSymbol name="safari" size={20} color="#fff" />
              <Text style={styles.locationText}>
                {formatHeading(currentLocation.heading)}
              </Text>
            </View>
            <View style={styles.locationItem}>
              <IconSymbol name="location.fill" size={20} color="#fff" />
              <Text style={styles.locationText}>
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        )}

        {!isTracking && (
          <Text style={[styles.trackingHint, { color: secondaryTextColor }]}>
            Start a trip to share your location with students
          </Text>
        )}
      </View>

      {/* Current Stop Status Card - Only shown when trip is active */}
      {isTracking && currentStop && (
        <View style={[styles.stopStatusCard, { backgroundColor: stopColorConfig.color }]}>
          <View style={styles.stopStatusHeader}>
            <View>
              <Text style={styles.stopStatusLabel}>Current Stop</Text>
              <Text style={styles.stopStatusName}>{currentStop.name}</Text>
            </View>
            <View style={[styles.stopColorBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={styles.stopColorText}>{stopColorConfig.label}</Text>
            </View>
          </View>
          
          {/* Countdown Timer */}
          {(currentStopColor === 'RED' || currentStopColor === 'YELLOW') && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>
                {currentStopColor === 'RED' ? 'Standard wait' : 'Extended wait'}
              </Text>
              <Text style={styles.countdownTimer}>
                {formatCountdown(getRemainingTime() || 0)}
              </Text>
            </View>
          )}
          
          {/* All Absent Message */}
          {currentStopColor === 'GREY' && (
            <View style={styles.allAbsentContainer}>
              <Text style={styles.allAbsentText}>
                All students at this stop are absent
              </Text>
              <Text style={styles.allAbsentHint}>You may skip this stop</Text>
            </View>
          )}
          
          {/* Wait Request Count */}
          {currentStopColor === 'YELLOW' && (
            <View style={styles.waitRequestInfo}>
              <Text style={styles.waitRequestText}>
                {currentStopWaitRequests.length} wait request(s)
              </Text>
            </View>
          )}
          
          {/* Action Buttons */}
          <View style={styles.stopActions}>
            {!stopArrivedAt ? (
              <TouchableOpacity
                style={styles.stopActionButton}
                onPress={handleArriveAtStop}
              >
                <Text style={styles.stopActionText}>Arrive at Stop</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.stopActionButton, (currentStopColor === 'GREY' || currentStopColor === 'GREEN') && styles.stopActionButtonHighlight]}
                onPress={handleDepartFromStop}
              >
                <Text style={styles.stopActionText}>
                  {currentStopColor === 'GREY' ? 'Skip Stop' : 'Depart'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Notifications Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAllNotifications}>
              <Text style={{ color: BUS_COLORS.primary }}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardColor }]}>
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptySubtext, { color: secondaryTextColor }]}>
              Wait requests and absences will appear here
            </Text>
          </View>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              cardColor={cardColor}
              textColor={textColor}
              secondaryTextColor={secondaryTextColor}
              onPress={() => markNotificationRead(notification.id)}
              formatTime={formatTime}
            />
          ))
        )}
      </View>

      {/* Students Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Students on Route ({students.length})
        </Text>

        {students.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            cardColor={cardColor}
            textColor={textColor}
            secondaryTextColor={secondaryTextColor}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// Notification Card Component
function NotificationCard({
  notification,
  cardColor,
  textColor,
  secondaryTextColor,
  onPress,
  formatTime,
}: {
  notification: StudentNotification;
  cardColor: string;
  textColor: string;
  secondaryTextColor: string;
  onPress: () => void;
  formatTime: (timestamp: number) => string;
}) {
  const config = NOTIFICATION_CONFIG[notification.type];
  
  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { backgroundColor: cardColor },
        !notification.isRead && styles.notificationUnread,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.notificationIcon, { backgroundColor: config.color + '20' }]}>
        <Text style={{ fontSize: 20 }}>
          {notification.type === 'wait' && '⏳'}
          {notification.type === 'skip' && '❌'}
        </Text>
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationName, { color: textColor }]}>
          {notification.studentName}
        </Text>
        <Text style={[styles.notificationMessage, { color: config.color }]}>
          {config.label}
        </Text>
        <Text style={[styles.notificationStop, { color: secondaryTextColor }]}>
          {notification.stopName} • {formatTime(notification.timestamp)}
        </Text>
      </View>
      {!notification.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: BUS_COLORS.primary }]} />
      )}
    </TouchableOpacity>
  );
}

// Student Card Component
function StudentCard({
  student,
  cardColor,
  textColor,
  secondaryTextColor,
}: {
  student: Student;
  cardColor: string;
  textColor: string;
  secondaryTextColor: string;
}) {
  const statusConfig = STUDENT_STATUS_CONFIG[student.status];
  
  return (
    <View style={[styles.studentCard, { backgroundColor: cardColor }]}>
      <View style={styles.studentAvatar}>
        <Text style={styles.studentInitial}>
          {student.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: textColor }]}>
          {student.name}
        </Text>
        <Text style={[styles.studentStop, { color: secondaryTextColor }]}>
          {student.stopName}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
        <Text style={[styles.statusText, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  trackingCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingInfo: {
    flex: 1,
  },
  trackingLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  trackingStatus: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  trackingButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  trackingButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  locationDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    gap: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
  },
  trackingHint: {
    marginTop: 12,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: BUS_COLORS.primary,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  notificationStop: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BUS_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  studentStop: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Stop Status Card Styles
  stopStatusCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  stopStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stopStatusLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  stopStatusName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  stopColorBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stopColorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  countdownLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  countdownTimer: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  allAbsentContainer: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  allAbsentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  allAbsentHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  waitRequestInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  waitRequestText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  stopActions: {
    flexDirection: 'row',
    gap: 12,
  },
  stopActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopActionButtonHighlight: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  stopActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
