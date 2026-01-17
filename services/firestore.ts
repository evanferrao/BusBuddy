/**
 * Firestore Service
 * 
 * Handles Firestore database operations including:
 * - User profile management
 * - User role storage and retrieval
 * - Bus assignment for passengers
 */

import { UserProfile, UserRole } from '@/types';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase-config';

const usersCollection = collection(db, 'users');

// Re-export UserProfile for backwards compatibility
export type { UserProfile } from '@/types';

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
 * For passengers, busId and preferredStopId should be set after registration
 * For drivers, busId will be assigned by admin
 */
export const createUserProfile = async (
  uid: string, 
  email: string, 
  displayName: string, 
  role: UserRole,
  busId: string = 'bus_1',              // Default bus ID for demo
  preferredStopId?: string              // Only for passengers
): Promise<UserProfile> => {
  const now = Date.now();
  const userProfile: UserProfile = {
    uid,
    email,
    name: displayName,
    role,
    busId,
    ...(role === 'passenger' && preferredStopId ? { preferredStopId } : {}),
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
    await setDoc(userRef, {
      role,
      updatedAt: Date.now(),
    }, { merge: true });
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
    await setDoc(userRef, {
      name: displayName,
      updatedAt: Date.now(),
    }, { merge: true });
    console.log('User display name updated');
  } catch (error) {
    console.error('Error updating display name:', error);
    throw error;
  }
};

/**
 * Update passenger's preferred stop
 */
export const updatePreferredStop = async (userId: string, preferredStopId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      preferredStopId,
      updatedAt: Date.now(),
    }, { merge: true });
    console.log('Preferred stop updated');
  } catch (error) {
    console.error('Error updating preferred stop:', error);
    throw error;
  }
};

/**
 * Update user's assigned bus ID
 */
export const updateUserBusId = async (userId: string, busId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      busId,
      updatedAt: Date.now(),
    });
    console.log('User bus ID updated');
  } catch (error) {
    console.error('Error updating user bus ID:', error);
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

// ============================================
// DRIVER PASSENGER ASSIGNMENT (Debug Mode)
// ============================================

/**
 * Unassigned passenger - a registered passenger with no bus yet
 */
export interface UnassignedPassenger {
  uid: string;
  name: string;
  email: string;
}

// Mock unassigned passengers for testing (simulates users in Firebase Auth but not yet assigned)
const MOCK_UNASSIGNED_PASSENGERS: UnassignedPassenger[] = [
  { uid: 'passenger-adam', name: 'Adam', email: 'adam@example.com' },
  { uid: 'passenger-eve', name: 'Eve', email: 'eve@example.com' },
  { uid: 'passenger-varun', name: 'Varun', email: 'varun@example.com' },
  { uid: 'passenger-akash', name: 'Akash', email: 'akash@example.com' },
  { uid: 'passenger-priya', name: 'Priya', email: 'priya@example.com' },
  { uid: 'passenger-rahul', name: 'Rahul', email: 'rahul@example.com' },
];

// Track which mock passengers have been assigned (in-memory for demo)
const assignedMockPassengers = new Set<string>();

/**
 * Get all unassigned passengers (for driver assignment)
 * 
 * Fetches all passengers and filters for those without a valid busId.
 * A passenger is "unassigned" if busId is null, undefined, empty string, or "undefined".
 * 
 * NOTE: This is for debug/testing only. In production, only admins can assign passengers.
 * Falls back to mock data if Firestore is empty (for demo purposes).
 */
export const getUnassignedPassengers = async (): Promise<UnassignedPassenger[]> => {
  try {
    const usersRef = collection(db, 'users');
    
    // Query for all passengers (we'll filter busId client-side since undefined values 
    // can't be queried directly in Firestore)
    const qPassengers = query(
      usersRef,
      where('role', '==', 'passenger')
    );
    
    const snapshot = await getDocs(qPassengers);
    
    const passengers: UnassignedPassenger[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const busId = data.busId;
      
      // Check if passenger is unassigned:
      // - busId is null, undefined, empty string, or the string "undefined"
      const isUnassigned = !busId || busId === '' || busId === 'undefined';
      
      if (isUnassigned) {
        passengers.push({
          uid: doc.id,
          name: data.name || data.displayName || 'Unknown',
          email: data.email || '',
        });
      }
    });
    
    // If no real passengers found, return mock data for testing
    if (passengers.length === 0) {
      console.log('No Firestore passengers found, using mock data for testing');
      return MOCK_UNASSIGNED_PASSENGERS.filter(p => !assignedMockPassengers.has(p.uid));
    }
    
    console.log(`Found ${passengers.length} unassigned passengers from Firestore`);
    return passengers;
  } catch (error) {
    console.error('Error fetching unassigned passengers:', error);
    // Return mock data on error (for demo/offline testing)
    console.log('Firestore error, falling back to mock data');
    return MOCK_UNASSIGNED_PASSENGERS.filter(p => !assignedMockPassengers.has(p.uid));
  }
};

/**
 * Assign an existing passenger to a bus and stop (Driver debug mode)
 * 
 * This does NOT create a new user - it only updates an existing passenger's
 * busId and preferredStopId fields.
 * 
 * @param uid - The passenger's user ID (must already exist)
 * @param busId - The bus ID to assign (e.g., "bus_1")
 * @param preferredStopId - The stop ID to assign (e.g., "stop_dadar_tt")
 * 
 * NOTE: In production, this should be restricted to admin only.
 */
export const assignPassengerToBusAndStop = async (
  uid: string,
  busId: string,
  preferredStopId: string
): Promise<void> => {
  // Check if this is a mock passenger
  const isMockPassenger = MOCK_UNASSIGNED_PASSENGERS.some(p => p.uid === uid);
  
  if (isMockPassenger) {
    // For mock passengers, just track the assignment in memory
    assignedMockPassengers.add(uid);
    console.log(`[MOCK] Assigned passenger ${uid} to bus ${busId}, stop ${preferredStopId}`);
    return;
  }
  
  try {
    // First verify the user exists and is a passenger
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User does not exist');
    }
    
    const userData = userDoc.data();
    if (userData.role !== 'passenger') {
      throw new Error('User is not a passenger');
    }
    
    // Update the passenger's bus and stop assignment
    await updateDoc(userRef, {
      busId,
      preferredStopId,
      updatedAt: Date.now(),
    });
    
    console.log(`Assigned passenger ${uid} to bus ${busId}, stop ${preferredStopId}`);
  } catch (error) {
    console.error('Error assigning passenger to bus/stop:', error);
    throw error;
  }
};

/**
 * Unassign a passenger from their current bus (resets to unassigned)
 * 
 * This removes the busId and preferredStopId from the user,
 * returning them to the unassigned pool.
 * 
 * NOTE: In production, this should be restricted to admin only.
 */
export const unassignPassenger = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      busId: null,
      preferredStopId: null,
      updatedAt: Date.now(),
    });
    
    console.log(`Unassigned passenger ${uid} from bus`);
  } catch (error) {
    console.error('Error unassigning passenger:', error);
    throw error;
  }
};

/**
 * DEBUG: Log all users in Firestore to understand their current field values.
 * This helps diagnose issues with the passenger query.
 */
export const debugLogAllUsers = async (): Promise<void> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log('=== DEBUG: All Users in Firestore ===');
    console.log(`Total users: ${snapshot.size}`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`User ID: ${doc.id}`);
      console.log(`  role: "${data.role}" (type: ${typeof data.role})`);
      console.log(`  busId: "${data.busId}" (type: ${typeof data.busId})`);
      console.log(`  email: "${data.email}"`);
      console.log(`  name: "${data.name || data.displayName}"`);
      console.log('---');
    });
    
    console.log('=== END DEBUG ===');
  } catch (error) {
    console.error('Error in debugLogAllUsers:', error);
  }
};