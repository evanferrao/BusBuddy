/**
 * Absences Service
 * 
 * Handles Firestore operations for absences (subcollection under trips)
 */

import { Absence } from '@/types';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase-config';

/**
 * Mark passenger as absent
 */
export const markAbsent = async (
  tripId: string,
  passengerId: string,
  stopId: string
): Promise<void> => {
  try {
    const absenceRef = doc(db, 'trips', tripId, 'absences', passengerId);
    const absence: Absence = {
      passengerId,
      stopId,
      markedAt: Timestamp.now()
    };
    await setDoc(absenceRef, absence);
    console.log('Absence marked:', passengerId);
  } catch (error) {
    console.error('Error marking absence:', error);
    throw error;
  }
};

/**
 * Get absence for a passenger
 */
export const getAbsence = async (
  tripId: string,
  passengerId: string
): Promise<Absence | null> => {
  try {
    const absenceRef = doc(db, 'trips', tripId, 'absences', passengerId);
    const absenceDoc = await getDoc(absenceRef);
    if (absenceDoc.exists()) {
      return absenceDoc.data() as Absence;
    }
    return null;
  } catch (error) {
    console.error('Error fetching absence:', error);
    throw error;
  }
};

/**
 * Get all absences for a specific stop
 */
export const getAbsencesForStop = async (
  tripId: string,
  stopId: string
): Promise<Absence[]> => {
  try {
    const absencesRef = collection(db, 'trips', tripId, 'absences');
    const q = query(absencesRef, where('stopId', '==', stopId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as Absence);
  } catch (error) {
    console.error('Error fetching absences for stop:', error);
    throw error;
  }
};

/**
 * Get all absences for a trip
 */
export const getAllAbsences = async (tripId: string): Promise<Absence[]> => {
  try {
    const absencesRef = collection(db, 'trips', tripId, 'absences');
    const querySnapshot = await getDocs(absencesRef);
    
    return querySnapshot.docs.map(doc => doc.data() as Absence);
  } catch (error) {
    console.error('Error fetching all absences:', error);
    throw error;
  }
};

/**
 * Subscribe to absences for a stop (real-time)
 */
export const subscribeToAbsencesForStop = (
  tripId: string,
  stopId: string,
  onUpdate: (absences: Absence[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const absencesRef = collection(db, 'trips', tripId, 'absences');
  const q = query(absencesRef, where('stopId', '==', stopId));
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const absences = querySnapshot.docs.map(doc => doc.data() as Absence);
      onUpdate(absences);
    },
    (error) => {
      console.error('Error in absences subscription:', error);
      if (onError) onError(error);
    }
  );
};
