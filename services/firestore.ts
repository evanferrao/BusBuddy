/**
 * Firestore Service
 * 
 * Handles Firestore database operations including:
 * - User profile management
 * - User role storage and retrieval
 */

import { UserRole } from '@/types';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from './firebase-config';

const usersCollection = collection(db, 'users');

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
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