/**
 * Add Passenger Modal (Driver Debug Mode)
 * 
 * Allows drivers to assign EXISTING unassigned passengers to their bus and a stop.
 * 
 * IMPORTANT: This does NOT create new users. It only links existing passenger
 * accounts (registered via Firebase Auth) to a bus number and stop.
 * 
 * Flow:
 * 1. Query users WHERE role == "passenger" AND busId == null
 * 2. Driver selects a passenger from the list
 * 3. Driver selects a stop from the route stops dropdown
 * 4. App updates: users/{uid} { busId: "bus_1", preferredStopId: "stop_gateway" }
 * 
 * This is for debug/testing only. In production, only admins can assign passengers.
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BUS_COLORS } from '@/constants/bus-tracker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    assignPassengerToBusAndStop,
    debugLogAllUsers,
    getUnassignedPassengers,
    UnassignedPassenger,
} from '@/services/firestore';
import { getMockRoute } from '@/services/mock-data';
import { RouteStop } from '@/types';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AddPassengerModalProps {
  visible: boolean;
  onClose: () => void;
  busId: string;
  onPassengerAssigned?: () => void;
}

export default function AddPassengerModal({
  visible,
  onClose,
  busId,
  onPassengerAssigned,
}: AddPassengerModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [unassignedPassengers, setUnassignedPassengers] = useState<UnassignedPassenger[]>([]);
  const [selectedPassenger, setSelectedPassenger] = useState<UnassignedPassenger | null>(null);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showStopPicker, setShowStopPicker] = useState(false);
  
  const route = getMockRoute();
  const stops = route.stops;
  
  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  // Fetch unassigned passengers when modal opens
  useEffect(() => {
    if (visible) {
      loadUnassignedPassengers();
    } else {
      // Reset state when modal closes
      setSelectedPassenger(null);
      setSelectedStop(null);
      setShowStopPicker(false);
    }
  }, [visible]);

  const loadUnassignedPassengers = async () => {
    setIsLoading(true);
    try {
      // DEBUG: Log all users to see their actual field values
      await debugLogAllUsers();
      
      const passengers = await getUnassignedPassengers();
      setUnassignedPassengers(passengers);
    } catch (error) {
      console.error('Error loading unassigned passengers:', error);
      Alert.alert('Error', 'Failed to load unassigned passengers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPassenger = (passenger: UnassignedPassenger) => {
    setSelectedPassenger(passenger);
    setShowStopPicker(true);
  };

  const handleSelectStop = (stop: RouteStop) => {
    setSelectedStop(stop);
    setShowStopPicker(false);
  };

  const handleAssign = async () => {
    if (!selectedPassenger || !selectedStop) {
      Alert.alert('Error', 'Please select both a passenger and a stop.');
      return;
    }

    setIsAssigning(true);
    try {
      await assignPassengerToBusAndStop(
        selectedPassenger.uid,
        busId,
        selectedStop.stopId
      );
      
      Alert.alert(
        'Success',
        `${selectedPassenger.name} has been assigned to ${selectedStop.name}`,
        [{ text: 'OK', onPress: () => {
          // Reset and refresh
          setSelectedPassenger(null);
          setSelectedStop(null);
          loadUnassignedPassengers();
          onPassengerAssigned?.();
        }}]
      );
    } catch (error) {
      console.error('Error assigning passenger:', error);
      Alert.alert('Error', 'Failed to assign passenger. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancel = () => {
    if (showStopPicker) {
      setShowStopPicker(false);
      setSelectedPassenger(null);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: BUS_COLORS.primary }]}>
              {showStopPicker ? 'Back' : 'Cancel'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {showStopPicker ? 'Select Stop' : 'Add Passenger'}
          </Text>
          <View style={styles.headerButton} />
        </View>

        {/* Debug Mode Notice */}
        <View style={[styles.notice, { backgroundColor: BUS_COLORS.warning + '20' }]}>
          <IconSymbol name="exclamationmark.triangle.fill" size={20} color={BUS_COLORS.warning} />
          <Text style={[styles.noticeText, { color: textColor }]}>
            Debug Mode: Assigning existing passengers to Bus {busId}
          </Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BUS_COLORS.primary} />
              <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
                Loading unassigned passengers...
              </Text>
            </View>
          ) : showStopPicker ? (
            // Stop Selection View
            <View>
              <View style={[styles.selectedCard, { backgroundColor: cardColor }]}>
                <Text style={[styles.selectedLabel, { color: secondaryTextColor }]}>
                  Assigning:
                </Text>
                <Text style={[styles.selectedName, { color: textColor }]}>
                  {selectedPassenger?.name}
                </Text>
                <Text style={[styles.selectedEmail, { color: secondaryTextColor }]}>
                  {selectedPassenger?.email}
                </Text>
              </View>

              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Select Pickup Stop
              </Text>

              {stops.map((stop) => (
                <TouchableOpacity
                  key={stop.stopId}
                  style={[
                    styles.stopItem,
                    { backgroundColor: cardColor },
                    selectedStop?.stopId === stop.stopId && styles.stopItemSelected,
                  ]}
                  onPress={() => handleSelectStop(stop)}
                >
                  <View style={styles.stopInfo}>
                    <Text style={[styles.stopName, { color: textColor }]}>
                      {stop.name}
                    </Text>
                    {stop.time && (
                      <Text style={[styles.stopTime, { color: secondaryTextColor }]}>
                        Scheduled: {stop.time}
                      </Text>
                    )}
                  </View>
                  {selectedStop?.stopId === stop.stopId && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={BUS_COLORS.success} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Assign Button */}
              {selectedStop && (
                <TouchableOpacity
                  style={[styles.assignButton, { backgroundColor: BUS_COLORS.success }]}
                  onPress={handleAssign}
                  disabled={isAssigning}
                >
                  {isAssigning ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.assignButtonText}>
                      Assign to {selectedStop.name}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Passenger Selection View
            <View>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Unassigned Passengers ({unassignedPassengers.length})
              </Text>

              {unassignedPassengers.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                  <IconSymbol name=\"person.2.fill\" size={32} color={secondaryTextColor} />
                  <Text style={[styles.emptyTitle, { color: textColor }]}>
                    No Unassigned Passengers
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
                    All registered passengers have been assigned to a bus.
                  </Text>
                </View>
              ) : (
                unassignedPassengers.map((passenger) => (
                  <TouchableOpacity
                    key={passenger.uid}
                    style={[styles.passengerItem, { backgroundColor: cardColor }]}
                    onPress={() => handleSelectPassenger(passenger)}
                  >
                    <View style={styles.passengerAvatar}>
                      <Text style={styles.passengerInitial}>
                        {passenger.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.passengerInfo}>
                      <Text style={[styles.passengerName, { color: textColor }]}>
                        {passenger.name}
                      </Text>
                      <Text style={[styles.passengerEmail, { color: secondaryTextColor }]}>
                        {passenger.email}
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={secondaryTextColor} />
                  </TouchableOpacity>
                ))
              )}

              {/* Refresh Button */}
              <TouchableOpacity
                style={[styles.refreshButton, { borderColor: BUS_COLORS.primary }]}
                onPress={loadUnassignedPassengers}
              >
                <IconSymbol name="arrow.clockwise" size={18} color={BUS_COLORS.primary} />
                <Text style={[styles.refreshButtonText, { color: BUS_COLORS.primary }]}>
                  Refresh List
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    width: 70,
  },
  headerButtonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  passengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  passengerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BUS_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  passengerInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  passengerEmail: {
    fontSize: 14,
  },
  selectedCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  selectedLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  selectedName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedEmail: {
    fontSize: 14,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  stopItemSelected: {
    borderWidth: 2,
    borderColor: BUS_COLORS.success,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  stopTime: {
    fontSize: 14,
  },
  assignButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
