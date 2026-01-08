/**
 * Firestore Service
 * 
 * Handles Firestore database operations including:
 * - User profile management
 * - User role storage and retrieval
 * - Bus management
 * - Trip management
 * - Wait requests and absences
 */

import {
    Absence,
    FirestoreBus,
    FirestoreTrip,
    FirestoreUser,
    UserRole,
    WaitRequest,
} from '@/types';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    Unsubscribe,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from './firebase-config';

const usersCollection = collection(db, 'users');
const busesCollection = collection(db, 'buses');
const tripsCollection = collection(db, 'trips');

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  busId?: string;
  preferredStopId?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Save or update user data
 */
export const saveUserData = async (userId: string, data: object) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });
    console.log('User data saved');
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

/**
 * Get user data by ID
 */
export const getUserData = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    } else {
      console.log('No such user!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

/**
 * Create a new user profile after registration
 */
export const createUserProfile = async (
  uid: string, 
  email: string, 
  displayName: string, 
  role: UserRole
): Promise<UserProfile> => {
  const now = Date.now();
  const userProfile: UserProfile = {
    uid,
    email,
    displayName,
    role,
    createdAt: now,
    updatedAt: now,
  };
  
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, userProfile);
    console.log('User profile created');
    return userProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role,
      updatedAt: Date.now(),
    });
    console.log('User role updated');
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Get user role by ID
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const userData = await getUserData(userId);
    return userData?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Update user display name
 */
export const updateUserDisplayName = async (userId: string, displayName: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      displayName,
      updatedAt: Date.now(),
    });
    console.log('User display name updated');
  } catch (error) {
    console.error('Error updating display name:', error);
    throw error;
  }
};

/**
 * Delete user profile
 */
export const deleteUserProfile = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    console.log('User profile deleted');
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
};

// =====================================================
// Bus Management Functions
// =====================================================

/**
 * Get bus data by ID
 */
export const getBusData = async (busId: string): Promise<FirestoreBus | null> => {
  try {
    const busRef = doc(db, 'buses', busId);
    const busDoc = await getDoc(busRef);
    if (busDoc.exists()) {
      return busDoc.data() as FirestoreBus;
    }
    return null;
  } catch (error) {
    console.error('Error fetching bus data:', error);
    throw error;
  }
};

/**
 * Update bus data
 */
export const updateBusData = async (busId: string, data: Partial<FirestoreBus>): Promise<void> => {
  try {
    const busRef = doc(db, 'buses', busId);
    await updateDoc(busRef, data);
    console.log('Bus data updated');
  } catch (error) {
    console.error('Error updating bus data:', error);
    throw error;
  }
};

/**
 * Subscribe to bus changes
 */
export const subscribeToBus = (
  busId: string,
  callback: (bus: FirestoreBus | null) => void
): Unsubscribe => {
  const busRef = doc(db, 'buses', busId);
  return onSnapshot(busRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as FirestoreBus);
    } else {
      callback(null);
    }
  });
};

// =====================================================
// Trip Management Functions
// =====================================================

/**
 * Generate a trip ID based on date
 */
export const generateTripId = (busId: string): string => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '_');
  return `trip_${busId}_${dateStr}`;
};

/**
 * Create a new trip
 */
export const createTrip = async (
  tripId: string,
  busId: string,
  driverId: string,
  initialLocation: { lat: number; lng: number }
): Promise<FirestoreTrip> => {
  const trip: FirestoreTrip = {
    busId,
    driverId,
    startedAt: Date.now(),
    currentStopId: null,
    stopArrivedAt: null,
    status: 'IN_TRANSIT',
    location: initialLocation,
  };

  try {
    const tripRef = doc(db, 'trips', tripId);
    await setDoc(tripRef, trip);
    
    // Update bus with active trip ID
    await updateBusData(busId, { activeTripId: tripId });
    
    console.log('Trip created:', tripId);
    return trip;
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

/**
 * Get trip data by ID
 */
export const getTripData = async (tripId: string): Promise<FirestoreTrip | null> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);
    if (tripDoc.exists()) {
      return tripDoc.data() as FirestoreTrip;
    }
    return null;
  } catch (error) {
    console.error('Error fetching trip data:', error);
    throw error;
  }
};

/**
 * Update trip data
 */
export const updateTrip = async (tripId: string, data: Partial<FirestoreTrip>): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, data);
    console.log('Trip updated');
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
};

/**
 * Update driver location during trip
 */
export const updateTripLocation = async (
  tripId: string,
  location: { lat: number; lng: number }
): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, { location });
  } catch (error) {
    console.error('Error updating trip location:', error);
    throw error;
  }
};

/**
 * Arrive at a stop (driver action)
 */
export const arriveAtStop = async (tripId: string, stopId: string): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      currentStopId: stopId,
      stopArrivedAt: Date.now(),
      status: 'AT_STOP',
    });
    console.log('Arrived at stop:', stopId);
  } catch (error) {
    console.error('Error arriving at stop:', error);
    throw error;
  }
};

/**
 * Depart from stop (driver action)
 */
export const departFromStop = async (tripId: string): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      status: 'IN_TRANSIT',
    });
    console.log('Departed from stop');
  } catch (error) {
    console.error('Error departing from stop:', error);
    throw error;
  }
};

/**
 * Subscribe to trip changes
 */
export const subscribeToTrip = (
  tripId: string,
  callback: (trip: FirestoreTrip | null) => void
): Unsubscribe => {
  const tripRef = doc(db, 'trips', tripId);
  return onSnapshot(tripRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as FirestoreTrip);
    } else {
      callback(null);
    }
  });
};

// =====================================================
// Wait Request Functions
// =====================================================

/**
 * Create or update a wait request (passenger action)
 */
export const createWaitRequest = async (
  tripId: string,
  passengerId: string,
  stopId: string
): Promise<WaitRequest> => {
  const waitRequest: WaitRequest = {
    passengerId,
    stopId,
    requestedAt: Date.now(),
  };

  try {
    const waitRequestRef = doc(db, 'trips', tripId, 'waitRequests', passengerId);
    await setDoc(waitRequestRef, waitRequest);
    console.log('Wait request created');
    return waitRequest;
  } catch (error) {
    console.error('Error creating wait request:', error);
    throw error;
  }
};

/**
 * Get all wait requests for a trip
 */
export const getWaitRequests = async (tripId: string): Promise<WaitRequest[]> => {
  try {
    const waitRequestsRef = collection(db, 'trips', tripId, 'waitRequests');
    const snapshot = await getDocs(waitRequestsRef);
    return snapshot.docs.map(doc => doc.data() as WaitRequest);
  } catch (error) {
    console.error('Error fetching wait requests:', error);
    throw error;
  }
};

/**
 * Get wait requests for a specific stop
 */
export const getWaitRequestsForStop = async (
  tripId: string,
  stopId: string
): Promise<WaitRequest[]> => {
  try {
    const waitRequestsRef = collection(db, 'trips', tripId, 'waitRequests');
    const q = query(waitRequestsRef, where('stopId', '==', stopId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as WaitRequest);
  } catch (error) {
    console.error('Error fetching wait requests for stop:', error);
    throw error;
  }
};

/**
 * Subscribe to wait requests for a trip
 */
export const subscribeToWaitRequests = (
  tripId: string,
  callback: (waitRequests: WaitRequest[]) => void
): Unsubscribe => {
  const waitRequestsRef = collection(db, 'trips', tripId, 'waitRequests');
  return onSnapshot(waitRequestsRef, (snapshot) => {
    const waitRequests = snapshot.docs.map(doc => doc.data() as WaitRequest);
    callback(waitRequests);
  });
};

/**
 * Check if user has submitted a wait request for this trip
 */
export const hasWaitRequest = async (tripId: string, passengerId: string): Promise<boolean> => {
  try {
    const waitRequestRef = doc(db, 'trips', tripId, 'waitRequests', passengerId);
    const snapshot = await getDoc(waitRequestRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking wait request:', error);
    return false;
  }
};

// =====================================================
// Absence Functions
// =====================================================

/**
 * Mark passenger as absent (passenger action)
 */
export const markAbsent = async (
  tripId: string,
  passengerId: string,
  stopId: string
): Promise<Absence> => {
  const absence: Absence = {
    passengerId,
    stopId,
    markedAt: Date.now(),
  };

  try {
    const absenceRef = doc(db, 'trips', tripId, 'absences', passengerId);
    await setDoc(absenceRef, absence);
    console.log('Absence marked');
    return absence;
  } catch (error) {
    console.error('Error marking absence:', error);
    throw error;
  }
};

/**
 * Get all absences for a trip
 */
export const getAbsences = async (tripId: string): Promise<Absence[]> => {
  try {
    const absencesRef = collection(db, 'trips', tripId, 'absences');
    const snapshot = await getDocs(absencesRef);
    return snapshot.docs.map(doc => doc.data() as Absence);
  } catch (error) {
    console.error('Error fetching absences:', error);
    throw error;
  }
};

/**
 * Get absences for a specific stop
 */
export const getAbsencesForStop = async (
  tripId: string,
  stopId: string
): Promise<Absence[]> => {
  try {
    const absencesRef = collection(db, 'trips', tripId, 'absences');
    const q = query(absencesRef, where('stopId', '==', stopId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Absence);
  } catch (error) {
    console.error('Error fetching absences for stop:', error);
    throw error;
  }
};

/**
 * Subscribe to absences for a trip
 */
export const subscribeToAbsences = (
  tripId: string,
  callback: (absences: Absence[]) => void
): Unsubscribe => {
  const absencesRef = collection(db, 'trips', tripId, 'absences');
  return onSnapshot(absencesRef, (snapshot) => {
    const absences = snapshot.docs.map(doc => doc.data() as Absence);
    callback(absences);
  });
};

/**
 * Check if user has marked absence for this trip
 */
export const hasAbsence = async (tripId: string, passengerId: string): Promise<boolean> => {
  try {
    const absenceRef = doc(db, 'trips', tripId, 'absences', passengerId);
    const snapshot = await getDoc(absenceRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking absence:', error);
    return false;
  }
};

// =====================================================
// Passenger Query Functions
// =====================================================

/**
 * Get all passengers for a specific bus and stop
 */
export const getPassengersForStop = async (
  busId: string,
  stopId: string
): Promise<UserProfile[]> => {
  try {
    const q = query(
      usersCollection,
      where('busId', '==', busId),
      where('preferredStopId', '==', stopId),
      where('role', '==', 'passenger')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error fetching passengers for stop:', error);
    throw error;
  }
};

/**
 * Get all passengers for a bus
 */
export const getPassengersForBus = async (busId: string): Promise<UserProfile[]> => {
  try {
    const q = query(
      usersCollection,
      where('busId', '==', busId),
      where('role', '==', 'passenger')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error fetching passengers for bus:', error);
    throw error;
  }
};

/**
 * Update user's bus assignment
 */
export const updateUserBusAssignment = async (
  userId: string,
  busId: string,
  preferredStopId?: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData: { busId: string; preferredStopId?: string; updatedAt: number } = {
      busId,
      updatedAt: Date.now(),
    };
    if (preferredStopId) {
      updateData.preferredStopId = preferredStopId;
    }
    await updateDoc(userRef, updateData);
    console.log('User bus assignment updated');
  } catch (error) {
    console.error('Error updating user bus assignment:', error);
    throw error;
  }
};