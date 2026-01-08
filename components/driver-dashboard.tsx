/**
 * Driver Dashboard
 * 
 * Main screen for drivers showing:
 * - Location tracking toggle
 * - Current speed and location info
 * - Stop status with color indicator
 * - Countdown timer for RED/YELLOW states
 * - Wait request count
 * - Student notifications
 * - List of students on route
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BUS_COLORS, NOTIFICATION_CONFIG, STOP_COLOR_CONFIG, STOP_COLOR_TIMING, STUDENT_STATUS_CONFIG } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatHeading, formatSpeed } from '@/services/location';
import { StopColor, Student, StudentNotification } from '@/types';
import React, { useEffect, useState } from 'react';
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
    currentStopStatus,
    currentTrip,
    currentBus,
    arriveAtStop,
    departFromStop,
  } = useApp();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  // Update countdown timer
  useEffect(() => {
    if (!currentStopStatus || !currentTrip?.stopArrivedAt) {
      setCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const elapsed = Math.floor((Date.now() - currentTrip.stopArrivedAt!) / 1000);
      let remaining = 0;

      if (currentStopStatus.color === 'RED') {
        remaining = Math.max(0, STOP_COLOR_TIMING.RED_DURATION - elapsed);
      } else if (currentStopStatus.color === 'YELLOW') {
        remaining = Math.max(0, STOP_COLOR_TIMING.YELLOW_END - elapsed);
      }

      setCountdown(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentStopStatus, currentTrip?.stopArrivedAt]);

  const handleToggleTracking = async () => {
    if (isTracking) {
      Alert.alert(
        'Stop Tracking',
        'Are you sure you want to stop sharing your location?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop', style: 'destructive', onPress: stopTracking },
        ]
      );
    } else {
      const success = await startTracking();
      if (!success) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to share your location with students.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleArriveAtStop = (stopId: string, stopName: string) => {
    Alert.alert(
      'Arrive at Stop',
      `Confirm arrival at ${stopName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Arrive',
          onPress: async () => {
            try {
              await arriveAtStop(stopId);
            } catch {
              Alert.alert('Error', 'Failed to update stop status');
            }
          },
        },
      ]
    );
  };

  const handleDepartFromStop = () => {
    Alert.alert(
      'Depart from Stop',
      'Ready to leave this stop?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Depart',
          onPress: async () => {
            try {
              await departFromStop();
            } catch {
              Alert.alert('Error', 'Failed to update stop status');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStopColorConfig = (color: StopColor) => {
    return STOP_COLOR_CONFIG[color] || STOP_COLOR_CONFIG.GREEN;
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
              Location Sharing
            </Text>
            <Text style={[styles.trackingStatus, { color: isTracking ? '#fff' : textColor }]}>
              {isTracking ? '● Live' : '○ Off'}
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
              {isTracking ? 'Stop' : 'Start'}
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
            Start sharing to let students track your bus
          </Text>
        )}
      </View>

      {/* Current Stop Status Card */}
      {currentTrip && currentStopStatus && (
        <View 
          style={[
            styles.stopStatusCard, 
            { backgroundColor: getStopColorConfig(currentStopStatus.color).backgroundColor }
          ]}
        >
          <View style={styles.stopStatusHeader}>
            <Text style={styles.stopStatusEmoji}>
              {getStopColorConfig(currentStopStatus.color).emoji}
            </Text>
            <View style={styles.stopStatusInfo}>
              <Text style={[styles.stopStatusLabel, { color: getStopColorConfig(currentStopStatus.color).textColor }]}>
                Current Stop
              </Text>
              <Text style={[styles.stopStatusName, { color: getStopColorConfig(currentStopStatus.color).textColor }]}>
                {currentStopStatus.name}
              </Text>
            </View>
          </View>

          <View style={[styles.stopStatusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={[styles.stopStatusBadgeText, { color: getStopColorConfig(currentStopStatus.color).textColor }]}>
              {getStopColorConfig(currentStopStatus.color).label}
            </Text>
          </View>

          {/* All Students Absent Message */}
          {currentStopStatus.allPassengersAbsent && (
            <View style={styles.absentMessage}>
              <Text style={styles.absentMessageText}>
                ⚠️ All students at this stop are absent
              </Text>
              <Text style={styles.absentSubtext}>
                You may skip this stop
              </Text>
            </View>
          )}

          {/* Countdown Timer */}
          {(currentStopStatus.color === 'RED' || currentStopStatus.color === 'YELLOW') && countdown > 0 && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>
                {currentStopStatus.color === 'RED' ? 'Standard Wait' : 'Extended Wait'}
              </Text>
              <Text style={styles.countdownTimer}>{formatCountdown(countdown)}</Text>
            </View>
          )}

          {/* Wait Requests */}
          {currentStopStatus.waitRequestCount > 0 && (
            <View style={styles.waitRequestsContainer}>
              <Text style={styles.waitRequestsText}>
                ⏳ {currentStopStatus.waitRequestCount} wait request{currentStopStatus.waitRequestCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Status Details */}
          <View style={styles.stopStatusDetails}>
            <View style={styles.stopStatusDetail}>
              <Text style={styles.stopStatusDetailLabel}>Total Passengers</Text>
              <Text style={styles.stopStatusDetailValue}>{currentStopStatus.totalPassengers}</Text>
            </View>
            <View style={styles.stopStatusDetail}>
              <Text style={styles.stopStatusDetailLabel}>Absent</Text>
              <Text style={styles.stopStatusDetailValue}>{currentStopStatus.absentCount}</Text>
            </View>
            <View style={styles.stopStatusDetail}>
              <Text style={styles.stopStatusDetailLabel}>Wait Requests</Text>
              <Text style={styles.stopStatusDetailValue}>{currentStopStatus.waitRequestCount}</Text>
            </View>
          </View>

          {/* Depart Button */}
          <TouchableOpacity
            style={styles.departButton}
            onPress={handleDepartFromStop}
          >
            <Text style={styles.departButtonText}>Depart from Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bus Stops Section (when tracking but no current stop) */}
      {isTracking && currentBus && !currentStopStatus && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Stops on Route
          </Text>
          {currentBus.stops.map((stop) => (
            <TouchableOpacity
              key={stop.stopId}
              style={[styles.stopCard, { backgroundColor: cardColor }]}
              onPress={() => handleArriveAtStop(stop.stopId, stop.name)}
            >
              <View style={styles.stopCardContent}>
                <Text style={[styles.stopCardName, { color: textColor }]}>{stop.name}</Text>
                <Text style={[styles.stopCardTime, { color: secondaryTextColor }]}>
                  Scheduled: {stop.scheduledTime}
                </Text>
              </View>
              <View style={[styles.arriveButton, { backgroundColor: BUS_COLORS.primary }]}>
                <Text style={styles.arriveButtonText}>Arrive</Text>
              </View>
            </TouchableOpacity>
          ))}
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
              Student messages will appear here
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
          {notification.type === 'running_late' && '🏃'}
          {notification.type === 'ready' && '✅'}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  stopStatusEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  stopStatusInfo: {
    flex: 1,
  },
  stopStatusLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  stopStatusName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  stopStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  stopStatusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  absentMessage: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  absentMessageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  absentSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  countdownContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  countdownLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  countdownTimer: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  waitRequestsContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  waitRequestsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stopStatusDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  stopStatusDetail: {
    alignItems: 'center',
  },
  stopStatusDetailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  stopStatusDetailValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  departButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  departButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  // Stop Card Styles (for selecting stops)
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stopCardContent: {
    flex: 1,
  },
  stopCardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stopCardTime: {
    fontSize: 14,
  },
  arriveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  arriveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
