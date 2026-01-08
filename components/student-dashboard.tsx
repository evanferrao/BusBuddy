/**
 * Student Dashboard (Passenger Dashboard)
 * 
 * Main screen for passengers showing:
 * - Bus location and ETA
 * - Current stop status with color indicator
 * - "Wait for Me" button (conditionally enabled)
 * - "Absent Today" button (one-time per trip)
 * - Route information
 */

import {
    ARRIVAL_THRESHOLDS,
    BUS_COLORS,
    STOP_COLOR_CONFIG,
} from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { calculateDistance, formatDistance, formatETA, getEstimatedArrival } from '@/services/mock-data';
import { StopColor } from '@/types';
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

export default function StudentDashboard() {
  const {
    userName,
    busLocation,
    isDriverActive,
    refreshBusLocation,
    currentTrip,
    currentBus,
    activeTripId,
    hasSubmittedWaitRequest,
    hasMarkedAbsent,
    submitWaitRequest,
    markAbsent,
    canSubmitWaitRequest,
    canMarkAbsent,
    userPreferredStopId,
  } = useApp();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  // Get the user's preferred stop name
  const myStopName = currentBus?.stops.find(s => s.stopId === userPreferredStopId)?.name || 'Your Stop';
  const myStopLocation = currentBus?.stops.find(s => s.stopId === userPreferredStopId);

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

  // Calculate distance and ETA using the user's preferred stop
  const myStopCoords = myStopLocation 
    ? { latitude: myStopLocation.lat, longitude: myStopLocation.lng }
    : { latitude: 26.9124, longitude: 75.7873 }; // Default fallback

  const distance = busLocation
    ? calculateDistance(
        busLocation.latitude,
        busLocation.longitude,
        myStopCoords.latitude,
        myStopCoords.longitude
      )
    : null;

  const eta = busLocation
    ? getEstimatedArrival(
        busLocation,
        { ...myStopCoords, timestamp: Date.now() }
      )
    : null;

  const isApproaching = distance !== null && distance <= ARRIVAL_THRESHOLDS.APPROACHING;
  const hasArrived = distance !== null && distance <= ARRIVAL_THRESHOLDS.ARRIVED;

  // Check if bus is at my stop
  const isAtMyStop = currentTrip?.currentStopId === userPreferredStopId && currentTrip?.status === 'AT_STOP';

  // Get current stop color for display
  const getCurrentStopColor = (): StopColor => {
    if (!isAtMyStop || !currentTrip?.stopArrivedAt) {
      return 'GREEN';
    }
    // This is a simplified version - the actual color logic is in the context
    const elapsed = Math.floor((Date.now() - currentTrip.stopArrivedAt) / 1000);
    if (elapsed <= 300) return 'RED';
    if (elapsed <= 420) return 'YELLOW';
    return 'GREEN';
  };

  const currentStopColor = getCurrentStopColor();

  const onRefresh = async () => {
    setRefreshing(true);
    refreshBusLocation();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleWaitForMe = () => {
    if (!canSubmitWaitRequest()) {
      Alert.alert(
        'Cannot Send Request',
        'Wait request is not available right now. The bus must be at your stop and within the time limit.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Wait for Me',
      'Send a wait request to the driver?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await submitWaitRequest();
              Alert.alert('Sent!', 'Your wait request has been sent to the driver.');
            } catch {
              Alert.alert('Error', 'Failed to send wait request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleMarkAbsent = () => {
    if (!canMarkAbsent()) {
      Alert.alert(
        'Cannot Mark Absent',
        'You have already marked yourself as absent for this trip.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Absent Today',
      'Mark yourself as absent for today\'s trip? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Absent',
          style: 'destructive',
          onPress: async () => {
            try {
              await markAbsent();
              Alert.alert('Marked Absent', 'You have been marked as absent for today\'s trip.');
            } catch {
              Alert.alert('Error', 'Failed to mark absent. Please try again.');
            }
          },
        },
      ]
    );
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
        <Text style={[styles.userName, { color: textColor }]}>{userName || 'Passenger'}</Text>
        <Text style={[styles.stopInfo, { color: secondaryTextColor }]}>
          📍 Your stop: {myStopName}
        </Text>
      </View>

      {/* Status Badges */}
      {(hasMarkedAbsent || hasSubmittedWaitRequest) && (
        <View style={styles.statusBadges}>
          {hasMarkedAbsent && (
            <View style={[styles.statusBadge, { backgroundColor: BUS_COLORS.danger + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: BUS_COLORS.danger }]}>
                ❌ Marked Absent Today
              </Text>
            </View>
          )}
          {hasSubmittedWaitRequest && (
            <View style={[styles.statusBadge, { backgroundColor: BUS_COLORS.warning + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: BUS_COLORS.warning }]}>
                ⏳ Wait Request Sent
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Bus at My Stop Card */}
      {isAtMyStop && (
        <View 
          style={[
            styles.atStopCard, 
            { backgroundColor: getStopColorConfig(currentStopColor).backgroundColor }
          ]}
        >
          <Text style={styles.atStopEmoji}>{getStopColorConfig(currentStopColor).emoji}</Text>
          <Text style={[styles.atStopTitle, { color: getStopColorConfig(currentStopColor).textColor }]}>
            Bus is at your stop!
          </Text>
          <Text style={[styles.atStopSubtitle, { color: getStopColorConfig(currentStopColor).textColor }]}>
            {getStopColorConfig(currentStopColor).description}
          </Text>
        </View>
      )}

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
              {activeTripId ? 'Bus is on the way' : 'Bus is not active'}
            </Text>
            <Text style={[styles.offlineSubtitle, { color: secondaryTextColor }]}>
              {activeTripId 
                ? 'Location will update when available.' 
                : 'The driver hasn\'t started the route yet.'}
              {'\n'}Pull down to refresh.
            </Text>
          </>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Actions
        </Text>
        <Text style={[styles.sectionSubtitle, { color: secondaryTextColor }]}>
          Let the driver know your status
        </Text>

        <View style={styles.actionsGrid}>
          {/* Wait for Me Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: cardColor },
              hasSubmittedWaitRequest && { borderColor: BUS_COLORS.warning, borderWidth: 2 },
              !canSubmitWaitRequest() && styles.actionButtonDisabled,
            ]}
            onPress={handleWaitForMe}
            activeOpacity={canSubmitWaitRequest() ? 0.8 : 1}
            disabled={!canSubmitWaitRequest()}
          >
            <Text style={styles.actionEmoji}>⏳</Text>
            <Text style={[styles.actionLabel, { color: textColor }]}>Wait for Me</Text>
            <Text style={[styles.actionDescription, { color: BUS_COLORS.warning }]}>
              {hasSubmittedWaitRequest ? 'Sent!' : "I'm coming!"}
            </Text>
            {hasSubmittedWaitRequest && (
              <View style={[styles.sentBadge, { backgroundColor: BUS_COLORS.warning }]}>
                <Text style={styles.sentText}>Sent</Text>
              </View>
            )}
            {!canSubmitWaitRequest() && !hasSubmittedWaitRequest && (
              <View style={[styles.disabledOverlay]}>
                <Text style={styles.disabledText}>
                  {hasMarkedAbsent ? 'Absent' : 'Not available'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Absent Today Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: cardColor },
              hasMarkedAbsent && { borderColor: BUS_COLORS.danger, borderWidth: 2 },
              !canMarkAbsent() && styles.actionButtonDisabled,
            ]}
            onPress={handleMarkAbsent}
            activeOpacity={canMarkAbsent() ? 0.8 : 1}
            disabled={!canMarkAbsent()}
          >
            <Text style={styles.actionEmoji}>❌</Text>
            <Text style={[styles.actionLabel, { color: textColor }]}>Absent Today</Text>
            <Text style={[styles.actionDescription, { color: BUS_COLORS.danger }]}>
              {hasMarkedAbsent ? 'Marked!' : 'Not coming'}
            </Text>
            {hasMarkedAbsent && (
              <View style={[styles.sentBadge, { backgroundColor: BUS_COLORS.danger }]}>
                <Text style={styles.sentText}>Done</Text>
              </View>
            )}
            {!canMarkAbsent() && !hasMarkedAbsent && (
              <View style={[styles.disabledOverlay]}>
                <Text style={styles.disabledText}>No active trip</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tips */}
      <View style={[styles.tipCard, { backgroundColor: cardColor }]}>
        <Text style={styles.tipEmoji}>💡</Text>
        <Text style={[styles.tipText, { color: secondaryTextColor }]}>
          {hasMarkedAbsent 
            ? "You've marked yourself as absent for today. The driver will skip your stop."
            : hasSubmittedWaitRequest
            ? "Your wait request has been sent. The driver will wait a bit longer for you."
            : 'Use "Wait for Me" when the bus is at your stop, or "Absent Today" if you won\'t be taking the bus!'}
        </Text>
      </View>

      {/* Trip Status Info */}
      {activeTripId && (
        <View style={[styles.tripInfoCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.tripInfoTitle, { color: textColor }]}>Trip Status</Text>
          <View style={styles.tripInfoRow}>
            <Text style={[styles.tripInfoLabel, { color: secondaryTextColor }]}>Trip ID:</Text>
            <Text style={[styles.tripInfoValue, { color: textColor }]}>
              {activeTripId.split('_').pop()}
            </Text>
          </View>
          <View style={styles.tripInfoRow}>
            <Text style={[styles.tripInfoLabel, { color: secondaryTextColor }]}>Status:</Text>
            <Text style={[styles.tripInfoValue, { color: textColor }]}>
              {currentTrip?.status === 'AT_STOP' ? '🛑 At Stop' : '🚌 In Transit'}
            </Text>
          </View>
          {currentTrip?.currentStopId && currentBus && (
            <View style={styles.tripInfoRow}>
              <Text style={[styles.tripInfoLabel, { color: secondaryTextColor }]}>Current Stop:</Text>
              <Text style={[styles.tripInfoValue, { color: textColor }]}>
                {currentBus.stops.find(s => s.stopId === currentTrip.currentStopId)?.name || 'Unknown'}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
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
  // New styles for updated UI
  statusBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  atStopCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  atStopEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  atStopTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  atStopSubtitle: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  disabledOverlay: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  disabledText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  tripInfoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  tripInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tripInfoLabel: {
    fontSize: 14,
  },
  tripInfoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
