/**
 * Buses Service
 * 
 * Handles Firestore operations for the buses collection
 */

import { Bus } from '@/types';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase-config';

const busesCollection = collection(db, 'buses');

/**
 * Get bus by ID
 */
export const getBus = async (busId: string): Promise<Bus | null> => {
  try {
    const busRef = doc(db, 'buses', busId);
    const busDoc = await getDoc(busRef);
    if (busDoc.exists()) {
      return busDoc.data() as Bus;
    }
    return null;
  } catch (error) {
    console.error('Error fetching bus:', error);
    throw error;
  }
};

/**
 * Get bus by driver ID
 */
export const getBusByDriverId = async (driverId: string): Promise<{ id: string; data: Bus } | null> => {
  try {
    const q = query(busesCollection, where('driverId', '==', driverId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        data: doc.data() as Bus
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching bus by driver:', error);
    throw error;
  }
};

/**
 * Create or update a bus
 */
export const saveBus = async (busId: string, bus: Bus): Promise<void> => {
  try {
    const busRef = doc(db, 'buses', busId);
    await setDoc(busRef, bus);
    console.log('Bus saved:', busId);
  } catch (error) {
    console.error('Error saving bus:', error);
    throw error;
  }
};

/**
 * Update bus active trip
 */
export const updateBusActiveTrip = async (busId: string, tripId: string | null): Promise<void> => {
  try {
    const busRef = doc(db, 'buses', busId);
    await updateDoc(busRef, {
      activeTripId: tripId
    });
    console.log('Bus active trip updated:', busId, tripId);
  } catch (error) {
    console.error('Error updating bus active trip:', error);
    throw error;
  }
};
