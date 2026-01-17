/**
 * Passenger Dashboard
 * 
 * Main screen for passengers showing:
 * - Bus location and ETA
 * - Route stops list
 * 
 * Per specification:
 * - Passengers can view bus location and route
 * - Notify driver actions are on the Activity tab
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import {
    ARRIVAL_THRESHOLDS,
    BUS_COLORS,
} from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { calculateDistance, formatDistance, formatETA, getEstimatedArrival } from '@/services/mock-data';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function PassengerDashboard() {
  const {
    userName,
    busId,
    busLocation,
    isDriverActive,
    refreshBusLocation,
    preferredStopId,
    activeTrip,
    routeStops,
    currentStopIndex,
  } = useApp();
  
  const { backgroundColor, cardColor, textColor, secondaryTextColor } = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Get the user's stop from preferredStopId using routeStops from context
  const myStop = useMemo(() => {
    if (!preferredStopId || routeStops.length === 0) return null;
    const stop = routeStops.find(s => s.stopId === preferredStopId);
    if (stop) {
      return {
        id: stop.stopId,
        name: stop.name,
        latitude: stop.lat,
        longitude: stop.lng,
      };
    }
    return null;
  }, [preferredStopId, routeStops]);

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
  const distance = busLocation && myStop
    ? calculateDistance(
        busLocation.latitude,
        busLocation.longitude,
        myStop.latitude,
        myStop.longitude
      )
    : null;

  const eta = busLocation && myStop
    ? getEstimatedArrival(
        busLocation,
        { latitude: myStop.latitude, longitude: myStop.longitude, timestamp: Date.now() }
      )
    : null;

  const isApproaching = distance !== null && distance <= ARRIVAL_THRESHOLDS.APPROACHING;
  const hasArrived = distance !== null && distance <= ARRIVAL_THRESHOLDS.ARRIVED;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBusLocation();
    setRefreshing(false);
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
          Bus: {busId || 'Not assigned'} | Stop: {myStop?.name || 'Not assigned'}
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
                <IconSymbol name="bus" size={48} color="#fff" />
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

            {/* Show current stop from trip */}
            {activeTrip?.currentStopId && routeStops.length > 0 && (
              <View style={styles.currentStopInfo}>
                <Text style={styles.currentStopLabel}>Current Stop:</Text>
                <Text style={styles.currentStopName}>
                  {routeStops.find(s => s.stopId === activeTrip.currentStopId)?.name || 'Unknown'}
                </Text>
              </View>
            )}

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
            <IconSymbol name="moon.zzz.fill" size={48} color="#999" />
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

      {/* Route Stops */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Route Stops ({routeStops.length})
        </Text>

        <View style={[styles.routeCard, { backgroundColor: cardColor }]}>
          {routeStops.map((stop, index, arr) => {
            // Determine if bus is at this stop or en route after this stop
            const isCurrentStop = isDriverActive && index === currentStopIndex;
            const isBusAtThisStop = isCurrentStop && activeTrip?.status === 'AT_STOP';
            const isBusEnRouteAfterThis = isDriverActive && 
              index === currentStopIndex && 
              activeTrip?.status === 'IN_TRANSIT' && 
              index < arr.length - 1;
            const isStopCompleted = isDriverActive && index < currentStopIndex;
            
            // Dot color: green if bus is here or stop is completed, orange for user's stop, grey otherwise
            const dotColor = isBusAtThisStop || isStopCompleted
              ? BUS_COLORS.success
              : stop.stopId === preferredStopId
                ? BUS_COLORS.primary
                : secondaryTextColor;
            
            // Line color: green if completed or bus is en route after this stop
            const lineColor = isStopCompleted || isBusEnRouteAfterThis
              ? BUS_COLORS.success
              : secondaryTextColor;

            return (
              <View key={stop.stopId} style={styles.stopItem}>
                <View style={styles.stopIndicator}>
                  <View
                    style={[
                      styles.stopDot,
                      { backgroundColor: dotColor },
                      isBusAtThisStop && styles.stopDotActive,
                    ]}
                  />
                  {index < arr.length - 1 && (
                    <View style={[styles.stopLine, { backgroundColor: lineColor }]} />
                  )}
                </View>
                <View style={styles.stopInfo2}>
                  <Text style={[
                    styles.stopName, 
                    { 
                      color: textColor, 
                      fontWeight: stop.stopId === preferredStopId || isBusAtThisStop ? '600' : '400' 
                    }
                  ]}>
                    {stop.name}
                    {stop.stopId === preferredStopId && ' (Your Stop)'}
                    {isBusAtThisStop && ' (Bus Here)'}
                  </Text>
                  <Text style={[styles.stopPassengers, { color: secondaryTextColor }]}>
                    Scheduled: {stop.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Tips */}
      <View style={[styles.tipCard, { backgroundColor: cardColor }]}>
        <IconSymbol name="lightbulb.fill" size={20} color={BUS_COLORS.warning} />
        <Text style={[styles.tipText, { color: secondaryTextColor }]}>
          Tip: Track the bus location and view all route stops here. Go to the Activity tab to notify the driver if you need them to wait or mark yourself absent.
        </Text>
      </View>
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
  currentStopInfo: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentStopLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 2,
  },
  currentStopName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  stopDotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -2,
    borderWidth: 3,
    borderColor: 'rgba(76, 175, 80, 0.3)',
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
  stopPassengers: {
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
