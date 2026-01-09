import { DEFAULT_ASSIGNMENT } from '@/constants/bus-tracker';
import { UserProfile, UserRole } from '@/types';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase-config';

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
 * For passengers, busNo and preferredStopId should be set after registration
 * For drivers, busNo will be assigned by admin
 */
export const createUserProfile = async (
  uid: string, 
  email: string, 
  displayName: string, 
  role: UserRole,
  busNo: string = DEFAULT_ASSIGNMENT.BUS_NO, // Default bus number for demo
  preferredStopId?: string              // Only for passengers
): Promise<UserProfile> => {
  const now = Date.now();
  const userProfile: UserProfile = {
    uid,
    email,
    displayName,
    role,
    busNo,
    ...(role === 'student' && preferredStopId ? { preferredStopId } : {}),
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
 * Update passenger's preferred stop
 */
export const updatePreferredStop = async (userId: string, preferredStopId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      preferredStopId,
      updatedAt: Date.now(),
    });
    console.log('Preferred stop updated');
  } catch (error) {
    console.error('Error updating preferred stop:', error);
    throw error;
  }
};

/**
 * Update user's assigned bus number
 */
export const updateUserBus = async (userId: string, busNo: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      busNo,
      updatedAt: Date.now(),
    });
    console.log('User bus number updated');
  } catch (error) {
    console.error('Error updating user bus:', error);
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
