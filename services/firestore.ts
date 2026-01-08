/**
 * Firestore Service
 * 
 * Handles Firestore database operations including:
 * - User profile management
 * - User role storage and retrieval
 */

import { UserRole, UserProfileDoc } from '@/types';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from './firebase-config';

const usersCollection = collection(db, 'users');

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
export const getUserData = async (userId: string): Promise<UserProfileDoc | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data() as UserProfileDoc;
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
  role: UserRole,
  busId?: string,
  preferredStopId?: string
): Promise<UserProfileDoc> => {
  const now = Date.now();
  const userProfile: UserProfileDoc = {
    uid,
    email,
    displayName,
    role,
    busId,
    preferredStopId,
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

/**
 * Update user bus and stop assignments
 */
export const updateUserAssignments = async (
  userId: string,
  busId: string,
  preferredStopId?: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const updates: Partial<UserProfileDoc> = {
      busId,
      updatedAt: Date.now(),
    };
    if (preferredStopId) {
      updates.preferredStopId = preferredStopId;
    }
    await updateDoc(userRef, updates);
    console.log('User assignments updated');
  } catch (error) {
    console.error('Error updating user assignments:', error);
    throw error;
  }
};

/**
 * Get all passengers for a bus
 */
export const getPassengersForBus = async (busId: string): Promise<UserProfileDoc[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('busId', '==', busId), where('role', '==', 'passenger'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as UserProfileDoc);
  } catch (error) {
    console.error('Error fetching passengers for bus:', error);
    throw error;
  }
};

/**
 * Get all passengers at a specific stop
 */
export const getPassengersAtStop = async (busId: string, stopId: string): Promise<UserProfileDoc[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('busId', '==', busId),
      where('role', '==', 'passenger'),
      where('preferredStopId', '==', stopId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as UserProfileDoc);
  } catch (error) {
    console.error('Error fetching passengers at stop:', error);
    throw error;
  }
};