/**
 * Storage Service
 * 
 * Handles persistent storage using AsyncStorage.
 * Stores user preferences, role selection, and app state.
 */

import { STORAGE_KEYS } from '@/constants/bus-tracker';
import { AppState, UserRole } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultAppState: AppState = {
  userRole: null,
  userId: null,
  userName: null,
  busRouteId: null,
  onboardingComplete: false,
};

/**
 * Get the complete app state
 */
export async function getAppState(): Promise<AppState> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.APP_STATE);
    if (data) {
      return { ...defaultAppState, ...JSON.parse(data) };
    }
    return defaultAppState;
  } catch (error) {
    console.error('Error getting app state:', error);
    return defaultAppState;
  }
}

/**
 * Save the complete app state
 */
export async function saveAppState(state: Partial<AppState>): Promise<void> {
  try {
    const currentState = await getAppState();
    const newState = { ...currentState, ...state };
    await AsyncStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(newState));
  } catch (error) {
    console.error('Error saving app state:', error);
    throw error;
  }
}

/**
 * Get user role
 */
export async function getUserRole(): Promise<UserRole> {
  try {
    const state = await getAppState();
    return state.userRole;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Set user role
 */
export async function setUserRole(role: UserRole): Promise<void> {
  await saveAppState({ userRole: role });
}

/**
 * Get user name
 */
export async function getUserName(): Promise<string | null> {
  try {
    const state = await getAppState();
    return state.userName;
  } catch (error) {
    console.error('Error getting user name:', error);
    return null;
  }
}

/**
 * Set user name
 */
export async function setUserName(name: string): Promise<void> {
  await saveAppState({ userName: name });
}

/**
 * Get user ID
 */
export async function getUserId(): Promise<string | null> {
  try {
    const state = await getAppState();
    return state.userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * Set user ID
 */
export async function setUserId(id: string): Promise<void> {
  await saveAppState({ userId: id });
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const state = await getAppState();
    return state.onboardingComplete;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(): Promise<void> {
  await saveAppState({ onboardingComplete: true });
}

/**
 * Clear all app data (for logout/reset)
 */
export async function clearAppData(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing app data:', error);
    throw error;
  }
}

/**
 * Save driver-specific data
 */
export async function saveDriverData(data: {
  busNumber?: string;
  routeId?: string;
}): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DRIVER_DATA, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving driver data:', error);
    throw error;
  }
}

/**
 * Get driver-specific data
 */
export async function getDriverData(): Promise<{
  busNumber?: string;
  routeId?: string;
} | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DRIVER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting driver data:', error);
    return null;
  }
}

/**
 * Save student-specific data
 */
export async function saveStudentData(data: {
  stopId?: string;
  stopName?: string;
}): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_DATA, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving student data:', error);
    throw error;
  }
}

/**
 * Get student-specific data
 */
export async function getStudentData(): Promise<{
  stopId?: string;
  stopName?: string;
} | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDENT_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting student data:', error);
    return null;
  }
}
