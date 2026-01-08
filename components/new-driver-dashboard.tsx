/**
 * New Driver Dashboard
 * 
 * Implements the BusBuddy driver interface with:
 * - Trip lifecycle management (start/stop)
 * - Real-time location tracking
 * - Stop status with color indicators (GREY, RED, YELLOW, GREEN)
 * - Wait request counts
 * - Countdown timers
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as AbsencesService from '@/services/absences';
import * as BusinessLogic from '@/services/business-logic';
import * as BusesService from '@/services/buses';
import * as FirestoreService from '@/services/firestore';
import * as TripsService from '@/services/trips';
import * as WaitRequestsService from '@/services/wait-requests';
import { Bus, Location, Stop, StopColorState, StopStatus, Trip, WaitRequest } from '@/types';
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
import * as ExpoLocation from 'expo-location';

export default function NewDriverDashboard() {
  const { userName, userId, authUser } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Bus and trip state
  const [bus, setBus] = useState<{ id: string; data: Bus } | null>(null);
  const [activeTrip, setActiveTrip] = useState<{ id: string; data: Trip } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // Stop status state
  const [stopStatuses, setStopStatuses] = useState<StopStatus[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  
  // Real-time subscriptions
  const [tripUnsubscribe, setTripUnsubscribe] = useState<(() => void) | null>(null);

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  // Load initial data
  useEffect(() => {
    loadDriverData();
    return () => {
      if (tripUnsubscribe) {
        tripUnsubscribe();
      }
    };
  }, [userId]);

  // Update stop statuses when trip changes
  useEffect(() => {
    if (activeTrip && bus) {
      updateStopStatuses();
    }
  }, [activeTrip, bus]);

  // Auto-refresh stop statuses every second when at a stop
  useEffect(() => {
    if (activeTrip?.data.status === 'AT_STOP') {
      const interval = setInterval(() => {
        updateStopStatuses();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTrip?.data.status]);

  const loadDriverData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Get driver's bus
      const busData = await BusesService.getBusByDriverId(userId);
      if (busData) {
        setBus(busData);
        
        // Check for active trip
        if (busData.data.activeTripId) {
          const trip = await TripsService.getTrip(busData.data.activeTripId);
          if (trip) {
            setActiveTrip({ id: busData.data.activeTripId, data: trip });
            setIsTracking(true);
            
            // Subscribe to trip updates
            const unsubscribe = TripsService.subscribeToTrip(
              busData.data.activeTripId,
              (tripData) => {
                if (tripData) {
                  setActiveTrip({ id: busData.data.activeTripId!, data: tripData });
                }
              }
            );
            setTripUnsubscribe(() => unsubscribe);
          }
        }
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
      Alert.alert('Error', 'Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  const updateStopStatuses = async () => {
    if (!activeTrip || !bus) return;

    try {
      const statuses: StopStatus[] = [];

      for (const stop of bus.data.stops) {
        // Get passengers at this stop
        const passengers = await FirestoreService.getPassengersAtStop(bus.id, stop.stopId);
        
        // Get absences for this stop
        const absences = await AbsencesService.getAbsencesForStop(activeTrip.id, stop.stopId);
        
        // Get wait requests for this stop
        const waitRequests = await WaitRequestsService.getWaitRequestsForStop(activeTrip.id, stop.stopId);
        
        // Check if all passengers are absent
        const allPassengersAbsent = BusinessLogic.checkAllPassengersAbsent(
          stop.stopId,
          passengers,
          absences
        );
        
        // Compute color state
        const color = BusinessLogic.computeStopColor(
          stop.stopId,
          activeTrip.data,
          allPassengersAbsent,
          waitRequests.length > 0
        );
        
        // Calculate elapsed seconds
        const elapsedSeconds = activeTrip.data.currentStopId === stop.stopId
          ? BusinessLogic.getElapsedSeconds(activeTrip.data.stopArrivedAt)
          : null;

        statuses.push({
          stopId: stop.stopId,
          name: stop.name,
          color,
          waitRequestCount: waitRequests.length,
          allPassengersAbsent,
          elapsedSeconds,
          totalPassengers: passengers.length,
          absentCount: absences.length,
        });
      }

      setStopStatuses(statuses);
    } catch (error) {
      console.error('Error updating stop statuses:', error);
    }
  };

  const handleStartTrip = async () => {
    if (!bus || !userId) return;

    try {
      // Request location permissions
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to start a trip');
        return;
      }

      // Get current location
      const location = await ExpoLocation.getCurrentPositionAsync({});
      const currentLoc: Location = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setCurrentLocation(currentLoc);

      // Generate trip ID
      const tripId = BusinessLogic.generateTripId(bus.id);

      // Create trip
      await TripsService.createTrip(tripId, {
        busId: bus.id,
        driverId: userId,
        currentStopId: null,
        stopArrivedAt: null,
        status: 'IN_TRANSIT',
        location: currentLoc,
      });

      // Update bus active trip
      await BusesService.updateBusActiveTrip(bus.id, tripId);

      // Set active trip
      const trip = await TripsService.getTrip(tripId);
      if (trip) {
        setActiveTrip({ id: tripId, data: trip });
        setIsTracking(true);

        // Subscribe to trip updates
        const unsubscribe = TripsService.subscribeToTrip(
          tripId,
          (tripData) => {
            if (tripData) {
              setActiveTrip({ id: tripId, data: tripData });
            }
          }
        );
        setTripUnsubscribe(() => unsubscribe);

        // Start location tracking
        startLocationTracking(tripId);
      }

      Alert.alert('Success', 'Trip started successfully');
    } catch (error) {
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start trip');
    }
  };

  const handleStopTrip = async () => {
    Alert.alert(
      'Stop Trip',
      'Are you sure you want to stop the current trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              if (bus && activeTrip) {
                // Update bus active trip to null
                await BusesService.updateBusActiveTrip(bus.id, null);

                // Unsubscribe from trip updates
                if (tripUnsubscribe) {
                  tripUnsubscribe();
                  setTripUnsubscribe(null);
                }

                // Clear state
                setActiveTrip(null);
                setIsTracking(false);
                setStopStatuses([]);

                Alert.alert('Success', 'Trip stopped successfully');
              }
            } catch (error) {
              console.error('Error stopping trip:', error);
              Alert.alert('Error', 'Failed to stop trip');
            }
          },
        },
      ]
    );
  };

  const startLocationTracking = async (tripId: string) => {
    // Start continuous location tracking
    const subscription = await ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      async (location) => {
        const newLoc: Location = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        setCurrentLocation(newLoc);

        // Update trip location in Firestore
        try {
          await TripsService.updateTripLocation(tripId, newLoc);
        } catch (error) {
          console.error('Error updating trip location:', error);
        }
      }
    );

    // Store subscription for cleanup
    // Note: In a production app, you'd want to store this and clean it up properly
  };

  const handleArriveAtStop = async (stopId: string) => {
    if (!activeTrip || !currentLocation) return;

    try {
      await TripsService.arriveAtStop(activeTrip.id, stopId, currentLocation);
      Alert.alert('Arrived', `Arrived at stop`);
    } catch (error) {
      console.error('Error arriving at stop:', error);
      Alert.alert('Error', 'Failed to mark arrival at stop');
    }
  };

  const handleLeaveStop = async () => {
    if (!activeTrip || !currentLocation) return;

    try {
      await TripsService.leaveStop(activeTrip.id, currentLocation);
      Alert.alert('Departed', 'Left stop');
    } catch (error) {
      console.error('Error leaving stop:', error);
      Alert.alert('Error', 'Failed to mark departure from stop');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDriverData();
    if (activeTrip && bus) {
      await updateStopStatuses();
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={BUS_COLORS.primary} />
        <Text style={[styles.loadingText, { color: textColor }]}>Loading...</Text>
      </View>
    );
  }

  if (!bus) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: textColor }]}>No bus assigned</Text>
          <Text style={[styles.emptySubtext, { color: secondaryTextColor }]}>
            Contact your administrator to get assigned to a bus.
          </Text>
        </View>
      </View>
    );
  }

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
        <Text style={[styles.busNumber, { color: secondaryTextColor }]}>
          Bus: {bus.data.busNumber}
        </Text>
      </View>

      {/* Trip Control Card */}
      <View style={[styles.tripCard, { backgroundColor: isTracking ? BUS_COLORS.success : cardColor }]}>
        <View style={styles.tripHeader}>
          <View style={styles.tripInfo}>
            <Text style={[styles.tripLabel, { color: isTracking ? '#fff' : secondaryTextColor }]}>
              Trip Status
            </Text>
            <Text style={[styles.tripStatus, { color: isTracking ? '#fff' : textColor }]}>
              {isTracking ? '● Active' : '○ Inactive'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.tripButton,
              { backgroundColor: isTracking ? 'rgba(255,255,255,0.3)' : BUS_COLORS.primary },
            ]}
            onPress={isTracking ? handleStopTrip : handleStartTrip}
          >
            <Text style={styles.tripButtonText}>
              {isTracking ? 'Stop Trip' : 'Start Trip'}
            </Text>
          </TouchableOpacity>
        </View>

        {isTracking && activeTrip && (
          <View style={styles.tripDetails}>
            <Text style={styles.tripDetailText}>
              Status: {activeTrip.data.status === 'AT_STOP' ? 'At Stop' : 'In Transit'}
            </Text>
            {activeTrip.data.currentStopId && (
              <Text style={styles.tripDetailText}>
                Current Stop: {bus.data.stops.find(s => s.stopId === activeTrip.data.currentStopId)?.name}
              </Text>
            )}
          </View>
        )}

        {isTracking && activeTrip && activeTrip.data.status === 'AT_STOP' && (
          <TouchableOpacity
            style={[styles.leaveButton, { backgroundColor: 'rgba(255,255,255,0.3)' }]}
            onPress={handleLeaveStop}
          >
            <Text style={styles.leaveButtonText}>Leave Stop</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stops List */}
      {isTracking && bus.data.stops.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Route Stops ({bus.data.stops.length})
          </Text>

          {bus.data.stops.map((stop, index) => {
            const status = stopStatuses.find(s => s.stopId === stop.stopId);
            return (
              <StopCard
                key={stop.stopId}
                stop={stop}
                status={status}
                isCurrentStop={activeTrip?.data.currentStopId === stop.stopId}
                cardColor={cardColor}
                textColor={textColor}
                secondaryTextColor={secondaryTextColor}
                onArrivePress={() => handleArriveAtStop(stop.stopId)}
                canArrive={activeTrip?.data.status === 'IN_TRANSIT'}
              />
            );
          })}
        </View>
      )}

      {!isTracking && (
        <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.infoText, { color: secondaryTextColor }]}>
            Start a trip to begin tracking and see stop statuses
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// Stop Card Component
function StopCard({
  stop,
  status,
  isCurrentStop,
  cardColor,
  textColor,
  secondaryTextColor,
  onArrivePress,
  canArrive,
}: {
  stop: Stop;
  status?: StopStatus;
  isCurrentStop: boolean;
  cardColor: string;
  textColor: string;
  secondaryTextColor: string;
  onArrivePress: () => void;
  canArrive: boolean;
}) {
  const getColorDisplay = (color: StopColorState) => {
    switch (color) {
      case 'GREY':
        return { color: '#9CA3AF', label: 'GREY - All Absent' };
      case 'RED':
        return { color: '#EF4444', label: 'RED - Waiting' };
      case 'YELLOW':
        return { color: '#F59E0B', label: 'YELLOW - Extended' };
      case 'GREEN':
        return { color: '#10B981', label: 'GREEN - Clear' };
      default:
        return { color: '#6B7280', label: 'Unknown' };
    }
  };

  const colorInfo = status ? getColorDisplay(status.color) : null;

  return (
    <View
      style={[
        styles.stopCard,
        { backgroundColor: cardColor },
        isCurrentStop && styles.currentStopCard,
      ]}
    >
      <View style={styles.stopHeader}>
        <View style={styles.stopInfo}>
          <Text style={[styles.stopName, { color: textColor }]}>
            {stop.name}
          </Text>
          <Text style={[styles.stopTime, { color: secondaryTextColor }]}>
            Scheduled: {stop.scheduledTime}
          </Text>
        </View>

        {canArrive && !isCurrentStop && (
          <TouchableOpacity
            style={[styles.arriveButton, { backgroundColor: BUS_COLORS.primary }]}
            onPress={onArrivePress}
          >
            <Text style={styles.arriveButtonText}>Arrive</Text>
          </TouchableOpacity>
        )}
      </View>

      {status && (
        <View style={styles.stopStatus}>
          <View style={styles.statusRow}>
            <View style={[styles.colorIndicator, { backgroundColor: colorInfo!.color }]} />
            <Text style={[styles.colorLabel, { color: textColor }]}>
              {colorInfo!.label}
            </Text>
          </View>

          {status.allPassengersAbsent && (
            <Text style={[styles.statusMessage, { color: '#9CA3AF' }]}>
              ✓ All students absent - Skip available
            </Text>
          )}

          {!status.allPassengersAbsent && (
            <View style={styles.statusDetails}>
              <Text style={[styles.statusDetail, { color: secondaryTextColor }]}>
                Students: {status.totalPassengers} ({status.absentCount} absent)
              </Text>
              {status.waitRequestCount > 0 && (
                <Text style={[styles.statusDetail, { color: '#F59E0B' }]}>
                  Wait Requests: {status.waitRequestCount}
                </Text>
              )}
            </View>
          )}

          {status.elapsedSeconds !== null && (status.color === 'RED' || status.color === 'YELLOW') && (
            <View style={styles.timerContainer}>
              <Text style={[styles.timerLabel, { color: secondaryTextColor }]}>
                Time at stop:
              </Text>
              <Text style={[styles.timerValue, { color: colorInfo!.color }]}>
                {BusinessLogic.formatElapsedTime(status.elapsedSeconds)}
              </Text>
              {status.color === 'RED' && (
                <Text style={[styles.timerNote, { color: secondaryTextColor }]}>
                  (Standard wait: 5 min)
                </Text>
              )}
              {status.color === 'YELLOW' && (
                <Text style={[styles.timerNote, { color: '#F59E0B' }]}>
                  (Extended wait: 7 min)
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
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
  busNumber: {
    fontSize: 14,
  },
  tripCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripInfo: {
    flex: 1,
  },
  tripLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  tripStatus: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tripButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tripButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  tripDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  tripDetailText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  leaveButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  stopCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  currentStopCard: {
    borderWidth: 2,
    borderColor: BUS_COLORS.primary,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  stopTime: {
    fontSize: 14,
  },
  arriveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  arriveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  stopStatus: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  statusDetails: {
    gap: 4,
  },
  statusDetail: {
    fontSize: 13,
  },
  timerContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  timerLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timerNote: {
    fontSize: 11,
  },
  infoCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
