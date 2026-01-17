/**
 * Passenger Activity Tab
 * 
 * Shows activity history and sent notifications for passengers.
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BUS_COLORS, NOTIFICATION_CONFIG } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { NotificationType, PassengerNotification } from '@/types';
import { formatRelativeTime } from '@/utils/formatters';
import React from 'react';
import {
    Alert,
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
    routeStops,
    sendNotification,
    hasMarkedAbsence,
    hasSentWaitRequest,
    hasBusDeparted,
    isDriverActive,
    activeTrip,
    refreshBusLocation,
  } = useApp();
  
  const { backgroundColor, cardColor, textColor, secondaryTextColor } = useThemeColors();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBusLocation();
    setRefreshing(false);
  };

  /**
   * Handle sending notification to driver
   */
  const handleSendNotification = (type: NotificationType) => {
    // Check if trip is active
    if (!isDriverActive || !activeTrip) {
      Alert.alert('Trip Not Active', 'You can only send notifications when the bus trip is active.');
      return;
    }
    
    // Check if bus has already passed the passenger's stop
    if (hasBusDeparted) {
      Alert.alert('Bus Has Departed', 'The bus has already passed your stop. You cannot send notifications for this trip.');
      return;
    }
    
    // Check if action is allowed per specification
    if (type === 'wait' && hasMarkedAbsence) {
      Alert.alert('Cannot Request Wait', 'You have already marked yourself absent for today.');
      return;
    }
    
    if (type === 'skip' && hasMarkedAbsence) {
      Alert.alert('Already Marked Absent', 'You have already marked yourself absent for today.');
      return;
    }
    
    const config = NOTIFICATION_CONFIG[type];
    Alert.alert(
      config.label,
      `Send "${config.description}" to the driver?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            sendNotification(type);
            
            if (type === 'skip') {
              Alert.alert('Marked Absent', 'The driver has been notified you won\'t be taking the bus today.');
            } else {
              Alert.alert('Sent!', 'The driver has been notified to wait for you.');
            }
          },
        },
      ]
    );
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
          <IconSymbol name="tray.fill" size={48} color={secondaryTextColor} />
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
              formatTime={formatRelativeTime}
              onPress={() => markNotificationRead(notification.id)}
            />
          ))}
        </View>
      )}

      {/* Notify Driver - Quick Actions */}
      <View style={styles.notifySection}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Notify Driver
        </Text>
        <Text style={[styles.sectionSubtitle, { color: secondaryTextColor }]}>
          {hasBusDeparted
            ? 'The bus has already passed your stop'
            : hasMarkedAbsence 
              ? 'You are marked absent for today' 
              : 'Let the driver know your status'}
        </Text>

        <View style={styles.actionsGrid}>
          <ActionButton
            type="wait"
            icon="clock.fill"
            label="Wait for Me"
            description="I'm coming!"
            color={NOTIFICATION_CONFIG.wait.color}
            isActive={hasSentWaitRequest}
            isDisabled={hasMarkedAbsence || hasBusDeparted || !isDriverActive}
            onPress={() => handleSendNotification('wait')}
            cardColor={cardColor}
            textColor={textColor}
          />
          <ActionButton
            type="skip"
            icon="xmark.circle.fill"
            label="Absent Today"
            description="Not taking bus"
            color={NOTIFICATION_CONFIG.skip.color}
            isActive={hasMarkedAbsence}
            isDisabled={hasMarkedAbsence || hasBusDeparted || !isDriverActive}
            onPress={() => handleSendNotification('skip')}
            cardColor={cardColor}
            textColor={textColor}
          />
        </View>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
        <IconSymbol name="lightbulb.fill" size={20} color={BUS_COLORS.warning} />
        <Text style={[styles.infoText, { color: secondaryTextColor }]}>
          Tip: Use "Wait for Me" to request extra time, or "Absent Today" if you won't be taking the bus. Your sent notifications appear above. Actions reset with each new trip.
        </Text>
      </View>
    </ScrollView>
  );
}

// Action Button Component
function ActionButton({
  type,
  icon,
  label,
  description,
  color,
  isActive,
  onPress,
  cardColor,
  textColor,
  isDisabled = false,
}: {
  type: NotificationType;
  icon: string;
  label: string;
  description: string;
  color: string;
  isActive: boolean;
  isDisabled?: boolean;
  onPress: () => void;
  cardColor: string;
  textColor: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: cardColor },
        isActive && { borderColor: color, borderWidth: 2 },
        isDisabled && styles.actionButtonDisabled,
      ]}
      onPress={onPress}
      activeOpacity={isDisabled ? 1 : 0.8}
      disabled={isDisabled}
    >
      <View style={[styles.actionIconContainer, isDisabled && styles.actionEmojiDisabled]}>
        <IconSymbol name={icon as any} size={32} color={isDisabled ? '#999' : color} />
      </View>
      <Text style={[styles.actionLabel, { color: isDisabled ? '#999' : textColor }]}>{label}</Text>
      <Text style={[styles.actionDescription, { color: isDisabled ? '#999' : color }]}>{description}</Text>
      {isActive && (
        <View style={[styles.sentBadge, { backgroundColor: color }]}>
          <Text style={styles.sentText}>{type === 'skip' ? 'Absent' : 'Sent'}</Text>
        </View>
      )}
    </TouchableOpacity>
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
  notification: PassengerNotification;
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
        <IconSymbol 
          name={notification.type === 'wait' ? 'clock.fill' : 'xmark.circle.fill'} 
          size={24} 
          color={config.color} 
        />
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
  notificationStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  notificationStop: {
    fontSize: 13,
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
  stopTime: {
    fontSize: 13,
    marginTop: 2,
  },
  stopPassengers: {
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
  notifySection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionIconContainer: {
    marginBottom: 8,
  },
  actionEmojiDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
  },
  sentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sentText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
