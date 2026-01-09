/**
 * Passenger Activity Tab
 * 
 * Shows activity history and sent notifications for passengers.
 */

import { BUS_COLORS, NOTIFICATION_CONFIG } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getBusStops } from '@/services/mock-data';
import { StudentNotification } from '@/types';
import React from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PassengerActivityScreen() {
  const {
    notifications,
    markNotificationRead,
    clearAllNotifications,
  } = useApp();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = React.useState(false);

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-IN');
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
        <Text style={[styles.title, { color: textColor }]}>Activity</Text>
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          Your recent notifications to the driver
        </Text>
      </View>

      {/* Clear All Button */}
      {notifications.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { borderColor: BUS_COLORS.danger }]}
          onPress={clearAllNotifications}
        >
          <Text style={[styles.clearButtonText, { color: BUS_COLORS.danger }]}>
            Clear All
          </Text>
        </TouchableOpacity>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No activity yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
            Your sent notifications will appear here
          </Text>
        </View>
      ) : (
        <View style={styles.notificationsList}>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              cardColor={cardColor}
              textColor={textColor}
              secondaryTextColor={secondaryTextColor}
              formatTime={formatTime}
              onPress={() => markNotificationRead(notification.id)}
            />
          ))}
        </View>
      )}

      {/* Route Stops */}
      <View style={styles.routeSection}>
        <Text style={[styles.routeTitle, { color: textColor }]}>
          Route Stops
        </Text>

        <View style={[styles.routeCard, { backgroundColor: cardColor }]}>
          {getBusStops().map((stop, index, arr) => (
            <View key={stop.id} style={styles.stopItem}>
              <View style={styles.stopIndicator}>
                <View
                  style={[
                    styles.stopDot,
                    { backgroundColor: secondaryTextColor },
                  ]}
                />
                {index < arr.length - 1 && (
                  <View style={[styles.stopLine, { backgroundColor: secondaryTextColor }]} />
                )}
              </View>
              <View style={styles.stopInfo}>
                <Text style={[styles.stopName, { color: textColor }]}>
                  {stop.name}
                </Text>
                <Text style={[styles.stopStudents, { color: secondaryTextColor }]}>
                  {stop.students.length} student{stop.students.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
        <Text style={styles.infoEmoji}>💡</Text>
        <Text style={[styles.infoText, { color: secondaryTextColor }]}>
          Your notifications help the driver know whether to wait for you or move on. Send updates promptly!
        </Text>
      </View>
    </ScrollView>
  );
}

// Notification Item Component
function NotificationItem({
  notification,
  cardColor,
  textColor,
  secondaryTextColor,
  formatTime,
  onPress,
}: {
  notification: StudentNotification;
  cardColor: string;
  textColor: string;
  secondaryTextColor: string;
  formatTime: (timestamp: number) => string;
  onPress: () => void;
}) {
  const config = NOTIFICATION_CONFIG[notification.type];
  
  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: cardColor },
        !notification.isRead && styles.notificationUnread,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.notificationIcon, { backgroundColor: config.color + '20' }]}>
        <Text style={{ fontSize: 24 }}>
          {notification.type === 'wait' && '⏳'}
          {notification.type === 'skip' && '❌'}
        </Text>
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: textColor }]}>
            {config.label}
          </Text>
          <Text style={[styles.notificationTime, { color: secondaryTextColor }]}>
            {formatTime(notification.timestamp)}
          </Text>
        </View>
        
        <Text style={[styles.notificationStop, { color: secondaryTextColor }]}>
          📍 {notification.stopName}
        </Text>
        
        {notification.message && (
          <Text style={[styles.notificationMessage, { color: secondaryTextColor }]}>
            "{notification.message}"
          </Text>
        )}
      </View>

      {!notification.isRead && (
        <View style={[styles.unreadIndicator, { backgroundColor: config.color }]} />
      )}
    </TouchableOpacity>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  clearButton: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  clearButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsList: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    position: 'relative',
  },
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationStop: {
    fontSize: 13,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeSection: {
    marginTop: 24,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  routeCard: {
    borderRadius: 16,
    padding: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stopIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stopLine: {
    width: 2,
    height: 36,
    marginTop: 4,
  },
  stopInfo: {
    flex: 1,
    paddingBottom: 16,
  },
  stopName: {
    fontSize: 16,
  },
  stopStudents: {
    fontSize: 12,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  infoEmoji: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
