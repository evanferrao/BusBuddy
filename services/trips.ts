/**
 * Trips Service
 * 
 * Handles Firestore operations for the trips collection
 */

import { Location, Trip, TripStatus } from '@/types';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase-config';

const tripsCollection = collection(db, 'trips');

/**
 * Get trip by ID
 */
export const getTrip = async (tripId: string): Promise<Trip | null> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);
    if (tripDoc.exists()) {
      return tripDoc.data() as Trip;
    }
    return null;
  } catch (error) {
    console.error('Error fetching trip:', error);
    throw error;
  }
};

/**
 * Get active trip for a bus
 */
export const getActiveTripForBus = async (busId: string): Promise<{ id: string; data: Trip } | null> => {
  try {
    const q = query(
      tripsCollection,
      where('busId', '==', busId),
      orderBy('startedAt', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        data: doc.data() as Trip
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching active trip:', error);
    throw error;
  }
};

/**
 * Create a new trip
 */
export const createTrip = async (tripId: string, trip: Omit<Trip, 'startedAt'> & { startedAt?: any }): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripData = {
      ...trip,
      startedAt: trip.startedAt || Timestamp.now()
    };
    await setDoc(tripRef, tripData);
    console.log('Trip created:', tripId);
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

/**
 * Update trip location
 */
export const updateTripLocation = async (tripId: string, location: Location): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      location,
      status: 'IN_TRANSIT'
    });
  } catch (error) {
    console.error('Error updating trip location:', error);
    throw error;
  }
};

/**
 * Update trip when arriving at a stop
 */
export const arriveAtStop = async (
  tripId: string,
  stopId: string,
  location: Location
): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      currentStopId: stopId,
      stopArrivedAt: Timestamp.now(),
      status: 'AT_STOP',
      location
    });
    console.log('Arrived at stop:', stopId);
  } catch (error) {
    console.error('Error updating stop arrival:', error);
    throw error;
  }
};

/**
 * Leave current stop
 */
export const leaveStop = async (tripId: string, location: Location): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      currentStopId: null,
      stopArrivedAt: null,
      status: 'IN_TRANSIT',
      location
    });
    console.log('Left stop');
  } catch (error) {
    console.error('Error leaving stop:', error);
    throw error;
  }
};

/**
 * Subscribe to trip updates (real-time)
 */
export const subscribeToTrip = (
  tripId: string,
  onUpdate: (trip: Trip | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const tripRef = doc(db, 'trips', tripId);
  
  return onSnapshot(
    tripRef,
    (doc) => {
      if (doc.exists()) {
        onUpdate(doc.data() as Trip);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Error in trip subscription:', error);
      if (onError) onError(error);
    }
  );
};
