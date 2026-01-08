/**
 * New Passenger Dashboard
 * 
 * Implements the BusBuddy passenger interface with:
 * - Real-time bus tracking
 * - "Wait for Me" button with validation
 * - "Absent Today" button with one-time restriction
 * - Current stop color display
 * - Button enablement logic based on trip state
 */

import { BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as AbsencesService from '@/services/absences';
import * as BusinessLogic from '@/services/business-logic';
import * as BusesService from '@/services/buses';
import * as FirestoreService from '@/services/firestore';
import * as TripsService from '@/services/trips';
import * as WaitRequestsService from '@/services/wait-requests';
import { Bus, Location, StopColorState, Trip, UserProfileDoc } from '@/types';
import * as FirestoreService from '@/services/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

export default function NewPassengerDashboard() {
  const { userName, userId, authUser } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // User and bus state
  const [userProfile, setUserProfile] = useState<FirestoreService.UserProfileDoc | null>(null);
  const [bus, setBus] = useState<Bus | null>(null);
  const [activeTrip, setActiveTrip] = useState<{ id: string; data: Trip } | null>(null);

  // Passenger-specific state
  const [hasMarkedAbsence, setHasMarkedAbsence] = useState(false);
  const [hasWaitRequest, setHasWaitRequest] = useState(false);
  const [stopColor, setStopColor] = useState<StopColorState>('GREEN');
  
  // Real-time subscriptions
  const [tripUnsubscribe, setTripUnsubscribe] = useState<(() => void) | null>(null);

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  // Load initial data
  useEffect(() => {
    loadPassengerData();
    return () => {
      if (tripUnsubscribe) {
        tripUnsubscribe();
      }
    };
  }, [userId]);

  // Update passenger state when trip changes
  useEffect(() => {
    if (activeTrip && userProfile) {
      updatePassengerState();
    }
  }, [activeTrip, userProfile]);

  // Auto-refresh every 2 seconds when trip is active
  useEffect(() => {
    if (activeTrip) {
      const interval = setInterval(() => {
        updatePassengerState();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeTrip]);

  const loadPassengerData = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Get user profile
      const profile = await FirestoreService.getUserData(userId);
      if (!profile || !profile.busId) {
        setLoading(false);
        return;
      }
      setUserProfile(profile);

      // Get bus
      const busData = await BusesService.getBus(profile.busId);
      if (busData) {
        setBus(busData);

        // Check for active trip
        if (busData.activeTripId) {
          const trip = await TripsService.getTrip(busData.activeTripId);
          if (trip) {
            setActiveTrip({ id: busData.activeTripId, data: trip });

            // Subscribe to trip updates
            const unsubscribe = TripsService.subscribeToTrip(
              busData.activeTripId,
              (tripData) => {
                if (tripData) {
                  setActiveTrip({ id: busData.activeTripId!, data: tripData });
                }
              }
            );
            setTripUnsubscribe(() => unsubscribe);
          }
        }
      }
    } catch (error) {
      console.error('Error loading passenger data:', error);
      Alert.alert('Error', 'Failed to load passenger data');
    } finally {
      setLoading(false);
    }
  };

  const updatePassengerState = async () => {
    if (!activeTrip || !userProfile || !userProfile.preferredStopId) return;

    try {
      // Check if passenger has marked absence
      const absence = await AbsencesService.getAbsence(activeTrip.id, userId!);
      setHasMarkedAbsence(!!absence);

      // Check if passenger has wait request
      const waitRequest = await WaitRequestsService.getWaitRequest(activeTrip.id, userId!);
      setHasWaitRequest(!!waitRequest);

      // Compute stop color for passenger's stop
      if (userProfile.preferredStopId) {
        const passengersAtStop = await FirestoreService.getPassengersAtStop(
          userProfile.busId!,
          userProfile.preferredStopId
        );
        const absences = await AbsencesService.getAbsencesForStop(
          activeTrip.id,
          userProfile.preferredStopId
        );
        const waitRequests = await WaitRequestsService.getWaitRequestsForStop(
          activeTrip.id,
          userProfile.preferredStopId
        );

        const allAbsent = BusinessLogic.checkAllPassengersAbsent(
          userProfile.preferredStopId,
          passengersAtStop,
          absences
        );

        const color = BusinessLogic.computeStopColor(
          userProfile.preferredStopId,
          activeTrip.data,
          allAbsent,
          waitRequests.length > 0
        );
        setStopColor(color);
      }
    } catch (error) {
      console.error('Error updating passenger state:', error);
    }
  };

  const handleWaitRequest = async () => {
    if (!activeTrip || !userProfile || !userProfile.preferredStopId) return;

    // Validate
    const validation = BusinessLogic.canSendWaitRequest(
      userProfile,
      activeTrip.data,
      hasMarkedAbsence
    );

    if (!validation.allowed) {
      Alert.alert('Cannot Send Wait Request', validation.reason || 'Unknown error');
      return;
    }

    try {
      await WaitRequestsService.createWaitRequest(
        activeTrip.id,
        userId!,
        userProfile.preferredStopId
      );
      setHasWaitRequest(true);
      Alert.alert('Success', 'Wait request sent to driver');
    } catch (error) {
      console.error('Error sending wait request:', error);
      Alert.alert('Error', 'Failed to send wait request');
    }
  };

  const handleMarkAbsent = async () => {
    if (!activeTrip || !userProfile || !userProfile.preferredStopId) return;

    // Validate
    const validation = BusinessLogic.canMarkAbsence(hasMarkedAbsence, !!activeTrip);

    if (!validation.allowed) {
      Alert.alert('Cannot Mark Absence', validation.reason || 'Unknown error');
      return;
    }

    Alert.alert(
      'Mark Absent',
      'Are you sure you want to mark yourself as absent for today? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Absent',
          style: 'destructive',
          onPress: async () => {
            try {
              await AbsencesService.markAbsent(
                activeTrip.id,
                userId!,
                userProfile.preferredStopId!
              );
              setHasMarkedAbsence(true);
              Alert.alert('Success', 'Marked as absent for today');
            } catch (error) {
              console.error('Error marking absence:', error);
              Alert.alert('Error', 'Failed to mark absence');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPassengerData();
    if (activeTrip && userProfile) {
      await updatePassengerState();
    }
    setRefreshing(false);
  };

  const getStopName = () => {
    if (!bus || !userProfile?.preferredStopId) return 'Not assigned';
    const stop = bus.stops.find(s => s.stopId === userProfile.preferredStopId);
    return stop?.name || 'Unknown';
  };

  const getColorDisplay = (color: StopColorState) => {
    switch (color) {
      case 'GREY':
        return { color: '#9CA3AF', label: 'All Absent', emoji: '⚪' };
      case 'RED':
        return { color: '#EF4444', label: 'Waiting', emoji: '🔴' };
      case 'YELLOW':
        return { color: '#F59E0B', label: 'Extended Wait', emoji: '🟡' };
      case 'GREEN':
        return { color: '#10B981', label: 'Clear / In Transit', emoji: '🟢' };
      default:
        return { color: '#6B7280', label: 'Unknown', emoji: '⚫' };
    }
  };

  const calculateDistance = (loc1: Location, loc2: { lat: number; lng: number }) => {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getDistanceToStop = () => {
    if (!activeTrip || !bus || !userProfile?.preferredStopId) return null;
    const stop = bus.stops.find(s => s.stopId === userProfile.preferredStopId);
    if (!stop) return null;
    
    const distance = calculateDistance(activeTrip.data.location, stop);
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={BUS_COLORS.primary} />
        <Text style={[styles.loadingText, { color: textColor }]}>Loading...</Text>
      </View>
    );
  }

  if (!userProfile || !userProfile.busId) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: textColor }]}>No bus assigned</Text>
          <Text style={[styles.emptySubtext, { color: secondaryTextColor }]}>
            Contact your administrator to get assigned to a bus and stop.
          </Text>
        </View>
      </View>
    );
  }

  const colorInfo = getColorDisplay(stopColor);
  const isAtMyStop = activeTrip?.data.currentStopId === userProfile.preferredStopId;
  const distance = getDistanceToStop();

  // Button enablement logic
  const canWait = activeTrip && BusinessLogic.canSendWaitRequest(
    userProfile,
    activeTrip.data,
    hasMarkedAbsence
  ).allowed;

  const canMarkAbsent = activeTrip && BusinessLogic.canMarkAbsence(
    hasMarkedAbsence,
    !!activeTrip
  ).allowed;

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
          📍 Your stop: {getStopName()}
        </Text>
      </View>

      {/* Bus Status Card */}
      {activeTrip ? (
        <View style={[styles.statusCard, { backgroundColor: BUS_COLORS.primary }]}>
          <Text style={styles.busEmoji}>🚌</Text>
          <Text style={styles.statusTitle}>Bus is Active</Text>

          <View style={styles.statusDetails}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={styles.statusValue}>
                {activeTrip.data.status === 'AT_STOP' ? 'At Stop' : 'In Transit'}
              </Text>
            </View>

            {isAtMyStop && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Location:</Text>
                <Text style={[styles.statusValue, { color: '#F59E0B' }]}>
                  🎯 At Your Stop!
                </Text>
              </View>
            )}

            {!isAtMyStop && distance && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Distance:</Text>
                <Text style={styles.statusValue}>{distance}</Text>
              </View>
            )}

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Stop Color:</Text>
              <View style={styles.colorRow}>
                <Text style={styles.colorEmoji}>{colorInfo.emoji}</Text>
                <Text style={[styles.colorText, { color: colorInfo.color }]}>
                  {colorInfo.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.statusCard, { backgroundColor: cardColor }]}>
          <Text style={styles.offlineEmoji}>😴</Text>
          <Text style={[styles.offlineTitle, { color: textColor }]}>
            Bus is not active
          </Text>
          <Text style={[styles.offlineSubtitle, { color: secondaryTextColor }]}>
            The driver hasn't started the route yet.{'\n'}
            Pull down to refresh.
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Quick Actions
        </Text>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: cardColor },
            !canWait && styles.disabledButton,
            hasWaitRequest && styles.activeButton,
          ]}
          onPress={handleWaitRequest}
          disabled={!canWait}
        >
          <Text style={styles.actionEmoji}>⏳</Text>
          <Text style={[styles.actionLabel, { color: textColor }]}>
            Wait for Me
          </Text>
          <Text style={[styles.actionDescription, { color: secondaryTextColor }]}>
            {hasWaitRequest
              ? '✓ Request sent'
              : 'Ask driver to wait at your stop'}
          </Text>
          {!canWait && (
            <Text style={[styles.disabledText, { color: '#EF4444' }]}>
              {hasMarkedAbsence
                ? 'Marked as absent'
                : !activeTrip
                ? 'No active trip'
                : activeTrip.data.currentStopId !== userProfile.preferredStopId
                ? 'Bus not at your stop'
                : activeTrip.data.status !== 'AT_STOP'
                ? 'Bus not at stop'
                : 'Wait window closed'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: cardColor },
            !canMarkAbsent && styles.disabledButton,
            hasMarkedAbsence && styles.absentButton,
          ]}
          onPress={handleMarkAbsent}
          disabled={!canMarkAbsent}
        >
          <Text style={styles.actionEmoji}>❌</Text>
          <Text style={[styles.actionLabel, { color: textColor }]}>
            Absent Today
          </Text>
          <Text style={[styles.actionDescription, { color: secondaryTextColor }]}>
            {hasMarkedAbsence
              ? '✓ Marked as absent'
              : 'Not taking the bus today'}
          </Text>
          {hasMarkedAbsence && (
            <Text style={[styles.finalText, { color: '#EF4444' }]}>
              Final - Cannot be undone
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Information */}
      <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
        <Text style={styles.infoEmoji}>💡</Text>
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: textColor }]}>
            How it works
          </Text>
          <Text style={[styles.infoText, { color: secondaryTextColor }]}>
            • "Wait for Me" is only available when the bus arrives at your stop
          </Text>
          <Text style={[styles.infoText, { color: secondaryTextColor }]}>
            • You can only mark absent once per trip
          </Text>
          <Text style={[styles.infoText, { color: secondaryTextColor }]}>
            • Colors indicate stop status: Red (waiting), Yellow (extended), Green (clear)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
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
  busEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  statusDetails: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  statusValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorEmoji: {
    fontSize: 16,
  },
  colorText: {
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  activeButton: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  absentButton: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  actionEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  disabledText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  finalText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
  },
  infoEmoji: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
    gap: 6,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
