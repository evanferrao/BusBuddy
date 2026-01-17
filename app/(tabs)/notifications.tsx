/**
 * Notifications Tab
 * 
 * For drivers: Shows all passenger notifications
 * For passengers: Shows activity history and sent notifications
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BUS_COLORS, NOTIFICATION_CONFIG } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PassengerNotification } from '@/types';
import React from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NotificationsScreen() {
  const {
    userRole,
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

  const isDriver = userRole === 'driver';

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
        <Text style={[styles.title, { color: textColor }]}>
          {isDriver ? 'Notifications' : 'Activity'}
        </Text>
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          {isDriver 
            ? 'Messages from passengers on your route'
            : 'Your recent notifications to the driver'
          }
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
          <IconSymbol name="tray.fill" size={48} color={secondaryTextColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No notifications yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
            {isDriver
              ? "When passengers send you messages, they'll appear here"
              : "Your sent notifications will appear here"
            }
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
              isDriver={isDriver}
            />
          ))}
        </View>
      )}

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
        <IconSymbol name="lightbulb.fill" size={20} color={BUS_COLORS.warning} />
        <Text style={[styles.infoText, { color: secondaryTextColor }]}>
          {isDriver
            ? "Tap a notification to mark it as read. Passengers can send: Wait, Skip, Running Late, or Ready notifications."
            : "Your notifications help the driver know whether to wait for you or move on. Send updates promptly!"
          }
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
  isDriver,
}: {
  notification: PassengerNotification;
  cardColor: string;
  textColor: string;
  secondaryTextColor: string;
  formatTime: (timestamp: number) => string;
  onPress: () => void;
  isDriver: boolean;
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
        <IconSymbol 
          name={
            notification.type === 'wait' ? 'clock.fill' : 
            notification.type === 'skip' ? 'xmark.circle.fill' : 
            notification.type === 'running_late' ? 'figure.run' : 
            'checkmark.circle.fill'
          } 
          size={24} 
          color={config.color} 
        />
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: textColor }]}>
            {isDriver ? notification.passengerName : config.label}
          </Text>
          <Text style={[styles.notificationTime, { color: secondaryTextColor }]}>
            {formatTime(notification.timestamp)}
          </Text>
        </View>
        
        <Text style={[styles.notificationType, { color: config.color }]}>
          {config.label}
        </Text>
        
        <View style={styles.notificationStopRow}>
          <IconSymbol name="location.fill" size={14} color={secondaryTextColor} />
          <Text style={[styles.notificationStop, { color: secondaryTextColor }]}>
            {notification.stopName}
          </Text>
        </View>
        
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
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: BUS_COLORS.primary,
  },
  notificationIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  notificationType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationStop: {
    fontSize: 13,
  },
  notificationMessage: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    alignItems: 'flex-start',
  },
  infoEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
