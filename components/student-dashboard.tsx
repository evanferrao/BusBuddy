/**
 * Student Dashboard
 * 
 * Main screen for students showing:
 * - Bus location and ETA
 * - Quick action buttons to notify driver
 * - Route information
 */

import {
    ARRIVAL_THRESHOLDS,
    BUS_COLORS,
    NOTIFICATION_CONFIG,
} from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { calculateDistance, formatDistance, formatETA, getBusStops, getEstimatedArrival } from '@/services/mock-data';
import { NotificationType } from '@/types';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Student's stop location (mock - in real app this would be from user profile)
const MY_STOP = {
  name: 'Ganesh Nagar',
  latitude: 26.9124,
  longitude: 75.7873,
};

export default function StudentDashboard() {
  const {
    userName,
    busLocation,
    isDriverActive,
    sendNotification,
    refreshBusLocation,
  } = useApp();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [lastSentNotification, setLastSentNotification] = useState<NotificationType | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  // Pulse animation for live indicator
  useEffect(() => {
    if (isDriverActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isDriverActive, pulseAnim]);

  // Calculate distance and ETA
  const distance = busLocation
    ? calculateDistance(
        busLocation.latitude,
        busLocation.longitude,
        MY_STOP.latitude,
        MY_STOP.longitude
      )
    : null;

  const eta = busLocation
    ? getEstimatedArrival(
        busLocation,
        { ...MY_STOP, timestamp: Date.now() }
      )
    : null;

  const isApproaching = distance !== null && distance <= ARRIVAL_THRESHOLDS.APPROACHING;
  const hasArrived = distance !== null && distance <= ARRIVAL_THRESHOLDS.ARRIVED;

  const onRefresh = async () => {
    setRefreshing(true);
    refreshBusLocation();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleSendNotification = (type: NotificationType) => {
    Alert.alert(
      NOTIFICATION_CONFIG[type].label,
      `Send "${NOTIFICATION_CONFIG[type].description}" to the driver?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            sendNotification(type);
            setLastSentNotification(type);
            Alert.alert('Sent!', 'Your notification has been sent to the driver.');
          },
        },
      ]
    );
  };

  const busStops = getBusStops();

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
        <Text style={[styles.userName, { color: textColor }]}>{userName || 'Student'}</Text>
        <Text style={[styles.stopInfo, { color: secondaryTextColor }]}>
          📍 Your stop: {MY_STOP.name}
        </Text>
      </View>

      {/* Bus Status Card */}
      <View
        style={[
          styles.statusCard,
          {
            backgroundColor: isDriverActive
              ? hasArrived
                ? BUS_COLORS.success
                : isApproaching
                ? BUS_COLORS.warning
                : BUS_COLORS.primary
              : cardColor,
          },
        ]}
      >
        {isDriverActive ? (
          <>
            <View style={styles.statusHeader}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Text style={styles.busEmoji}>🚌</Text>
              </Animated.View>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            <Text style={styles.statusTitle}>
              {hasArrived
                ? 'Bus has arrived!'
                : isApproaching
                ? 'Bus is approaching!'
                : 'Bus is on the way'}
            </Text>

            <View style={styles.etaContainer}>
              <View style={styles.etaItem}>
                <Text style={styles.etaLabel}>Distance</Text>
                <Text style={styles.etaValue}>
                  {distance !== null ? formatDistance(distance) : '--'}
                </Text>
              </View>
              <View style={styles.etaDivider} />
              <View style={styles.etaItem}>
                <Text style={styles.etaLabel}>ETA</Text>
                <Text style={styles.etaValue}>
                  {eta !== null ? formatETA(eta) : '--'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.offlineEmoji}>😴</Text>
            <Text style={[styles.offlineTitle, { color: textColor }]}>
              Bus is not active
            </Text>
            <Text style={[styles.offlineSubtitle, { color: secondaryTextColor }]}>
              The driver hasn't started the route yet.{'\n'}
              Pull down to refresh.
            </Text>
          </>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Notify Driver
        </Text>
        <Text style={[styles.sectionSubtitle, { color: secondaryTextColor }]}>
          Let the driver know your status
        </Text>

        <View style={styles.actionsGrid}>
          <ActionButton
            type="wait"
            emoji="⏳"
            label="Wait for Me"
            description="I'm coming!"
            color={NOTIFICATION_CONFIG.wait.color}
            isActive={lastSentNotification === 'wait'}
            onPress={() => handleSendNotification('wait')}
            cardColor={cardColor}
            textColor={textColor}
          />
          <ActionButton
            type="skip"
            emoji="❌"
            label="Skip Today"
            description="Not coming"
            color={NOTIFICATION_CONFIG.skip.color}
            isActive={lastSentNotification === 'skip'}
            onPress={() => handleSendNotification('skip')}
            cardColor={cardColor}
            textColor={textColor}
          />
          <ActionButton
            type="running_late"
            emoji="🏃"
            label="Running Late"
            description="Few mins"
            color={NOTIFICATION_CONFIG.running_late.color}
            isActive={lastSentNotification === 'running_late'}
            onPress={() => handleSendNotification('running_late')}
            cardColor={cardColor}
            textColor={textColor}
          />
          <ActionButton
            type="ready"
            emoji="✅"
            label="Ready!"
            description="At the stop"
            color={NOTIFICATION_CONFIG.ready.color}
            isActive={lastSentNotification === 'ready'}
            onPress={() => handleSendNotification('ready')}
            cardColor={cardColor}
            textColor={textColor}
          />
        </View>
      </View>

      {/* Route Stops */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Route Stops
        </Text>

        <View style={[styles.routeCard, { backgroundColor: cardColor }]}>
          {busStops.map((stop, index) => (
            <View key={stop.id} style={styles.stopItem}>
              <View style={styles.stopIndicator}>
                <View
                  style={[
                    styles.stopDot,
                    {
                      backgroundColor:
                        stop.name === MY_STOP.name
                          ? BUS_COLORS.primary
                          : secondaryTextColor,
                    },
                  ]}
                />
                {index < busStops.length - 1 && (
                  <View style={[styles.stopLine, { backgroundColor: secondaryTextColor }]} />
                )}
              </View>
              <View style={styles.stopInfo2}>
                <Text
                  style={[
                    styles.stopName,
                    {
                      color: stop.name === MY_STOP.name ? BUS_COLORS.primary : textColor,
                      fontWeight: stop.name === MY_STOP.name ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {stop.name}
                  {stop.name === MY_STOP.name && ' (Your Stop)'}
                </Text>
                <Text style={[styles.stopStudents, { color: secondaryTextColor }]}>
                  {stop.students.length} student{stop.students.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Tips */}
      <View style={[styles.tipCard, { backgroundColor: cardColor }]}>
        <Text style={styles.tipEmoji}>💡</Text>
        <Text style={[styles.tipText, { color: secondaryTextColor }]}>
          Tip: Send a "Ready" notification when you're at the stop so the driver knows you're there!
        </Text>
      </View>
    </ScrollView>
  );
}

// Action Button Component
function ActionButton({
  type,
  emoji,
  label,
  description,
  color,
  isActive,
  onPress,
  cardColor,
  textColor,
}: {
  type: NotificationType;
  emoji: string;
  label: string;
  description: string;
  color: string;
  isActive: boolean;
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
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.actionDescription, { color }]}>{description}</Text>
      {isActive && (
        <View style={[styles.sentBadge, { backgroundColor: color }]}>
          <Text style={styles.sentText}>Sent</Text>
        </View>
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
  greeting: {
    fontSize: 16,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stopInfo: {
    fontSize: 14,
  },
  statusCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  busEmoji: {
    fontSize: 48,
    marginRight: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  etaContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  etaItem: {
    flex: 1,
    alignItems: 'center',
  },
  etaDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 16,
  },
  etaLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  etaValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  offlineEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  offlineSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
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
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
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
  stopInfo2: {
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
  tipCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
