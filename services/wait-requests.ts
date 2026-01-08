/**
 * Wait Requests Service
 * 
 * Handles Firestore operations for wait requests (subcollection under trips)
 */

import { WaitRequest } from '@/types';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase-config';

/**
 * Create or update a wait request
 */
export const createWaitRequest = async (
  tripId: string,
  passengerId: string,
  stopId: string
): Promise<void> => {
  try {
    const waitRequestRef = doc(db, 'trips', tripId, 'waitRequests', passengerId);
    const waitRequest: WaitRequest = {
      passengerId,
      stopId,
      requestedAt: Timestamp.now()
    };
    await setDoc(waitRequestRef, waitRequest);
    console.log('Wait request created:', passengerId);
  } catch (error) {
    console.error('Error creating wait request:', error);
    throw error;
  }
};

/**
 * Get wait request for a passenger
 */
export const getWaitRequest = async (
  tripId: string,
  passengerId: string
): Promise<WaitRequest | null> => {
  try {
    const waitRequestRef = doc(db, 'trips', tripId, 'waitRequests', passengerId);
    const waitRequestDoc = await getDoc(waitRequestRef);
    if (waitRequestDoc.exists()) {
      return waitRequestDoc.data() as WaitRequest;
    }
    return null;
  } catch (error) {
    console.error('Error fetching wait request:', error);
    throw error;
  }
};

/**
 * Get all wait requests for a specific stop
 */
export const getWaitRequestsForStop = async (
  tripId: string,
  stopId: string
): Promise<WaitRequest[]> => {
  try {
    const waitRequestsRef = collection(db, 'trips', tripId, 'waitRequests');
    const q = query(waitRequestsRef, where('stopId', '==', stopId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as WaitRequest);
  } catch (error) {
    console.error('Error fetching wait requests for stop:', error);
    throw error;
  }
};

/**
 * Get all wait requests for a trip
 */
export const getAllWaitRequests = async (tripId: string): Promise<WaitRequest[]> => {
  try {
    const waitRequestsRef = collection(db, 'trips', tripId, 'waitRequests');
    const querySnapshot = await getDocs(waitRequestsRef);
    
    return querySnapshot.docs.map(doc => doc.data() as WaitRequest);
  } catch (error) {
    console.error('Error fetching all wait requests:', error);
    throw error;
  }
};

/**
 * Delete a wait request
 */
export const deleteWaitRequest = async (
  tripId: string,
  passengerId: string
): Promise<void> => {
  try {
    const waitRequestRef = doc(db, 'trips', tripId, 'waitRequests', passengerId);
    await deleteDoc(waitRequestRef);
    console.log('Wait request deleted:', passengerId);
  } catch (error) {
    console.error('Error deleting wait request:', error);
    throw error;
  }
};

/**
 * Subscribe to wait requests for a stop (real-time)
 */
export const subscribeToWaitRequestsForStop = (
  tripId: string,
  stopId: string,
  onUpdate: (waitRequests: WaitRequest[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const waitRequestsRef = collection(db, 'trips', tripId, 'waitRequests');
  const q = query(waitRequestsRef, where('stopId', '==', stopId));
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const waitRequests = querySnapshot.docs.map(doc => doc.data() as WaitRequest);
      onUpdate(waitRequests);
    },
    (error) => {
      console.error('Error in wait requests subscription:', error);
      if (onError) onError(error);
    }
  );
};
