/**
 * Driver Dashboard
 * 
 * Main screen for drivers showing:
 * - Location tracking toggle
 * - Current speed and location info
 * - Student notifications
 * - List of students on route
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BUS_COLORS, NOTIFICATION_CONFIG, STUDENT_STATUS_CONFIG } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatHeading, formatSpeed } from '@/services/location';
import { Student, StudentNotification } from '@/types';
import React, { useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const STOP_COLOR_MAP = {
  GREY: '#8E8E93',
  RED: BUS_COLORS.danger,
  YELLOW: BUS_COLORS.warning,
  GREEN: BUS_COLORS.success,
};

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
    stopStatuses,
    currentStopStatus,
    advanceToNextStop,
  } = useApp();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

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

      {currentStopStatus && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Current Stop</Text>
          <View style={[styles.stopStatusCard, { backgroundColor: cardColor }]}>
            <View style={styles.stopStatusHeader}>
              <View style={[styles.stopColorDot, { backgroundColor: STOP_COLOR_MAP[currentStopStatus.color] }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stopStatusTitle, { color: textColor }]}>{currentStopStatus.name}</Text>
                <Text style={[styles.stopStatusSubtitle, { color: secondaryTextColor }]}>
                  State: {currentStopStatus.color}
                </Text>
              </View>
              <TouchableOpacity style={[styles.nextStopButton, { backgroundColor: BUS_COLORS.primary }]} onPress={advanceToNextStop}>
                <Text style={styles.nextStopButtonText}>Next Stop</Text>
              </TouchableOpacity>
            </View>
            {currentStopStatus.windowRemainingSeconds !== null && (
              <Text style={[styles.stopStatusInfo, { color: secondaryTextColor }]}>
                {currentStopStatus.color === 'RED' ? 'Standard wait' : 'Extended wait'}: {currentStopStatus.windowRemainingSeconds}s left
              </Text>
            )}
            <Text style={[styles.stopStatusInfo, { color: secondaryTextColor }]}>
              Wait requests: {currentStopStatus.waitRequestCount}
            </Text>
            {currentStopStatus.allPassengersAbsent && (
              <Text style={[styles.stopStatusInfo, { color: secondaryTextColor }]}>
                All passengers are absent at this stop. You may skip it.
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Route Stops</Text>
        {stopStatuses.map((status) => (
          <View key={status.stopId} style={[styles.stopRow, { backgroundColor: cardColor }]}>
            <View style={[styles.stopColorDot, { backgroundColor: STOP_COLOR_MAP[status.color] }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.stopName, { color: textColor }]}>{status.name}</Text>
              <Text style={[styles.stopMeta, { color: secondaryTextColor }]}>
                {status.color} • Wait requests: {status.waitRequestCount}
              </Text>
            </View>
            {status.allPassengersAbsent && (
              <Text style={[styles.stopMeta, { color: secondaryTextColor }]}>All absent</Text>
            )}
          </View>
        ))}
      </View>

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
  stopStatusCard: {
    borderRadius: 16,
    padding: 16,
  },
  stopStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  stopColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stopStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  stopStatusSubtitle: {
    fontSize: 12,
  },
  stopStatusInfo: {
    fontSize: 12,
    marginBottom: 4,
  },
  nextStopButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  nextStopButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
  },
  stopMeta: {
    fontSize: 12,
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
});
