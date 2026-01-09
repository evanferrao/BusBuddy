/**
 * App Context
 * 
 * Global state management for the Bus Buddy app.
 * Provides user authentication, role, tracking state, and notifications across all screens.
 * 
 * Per specification:
 * - Trips are the single source of truth for real-time state
 * - Colors are derived client-side only, never stored
 * - Wait requests and absences are trip-scoped
 */

import * as AuthService from '@/services/auth';
import * as FirestoreService from '@/services/firestore';
import * as LocationService from '@/services/location';
import * as MockData from '@/services/mock-data';
import * as StorageService from '@/services/storage';
import { DEFAULT_ASSIGNMENT } from '@/constants/bus-tracker';
import { AuthUserData, Location, NotificationType, StopState, Student, StudentNotification, Trip, UserRole } from '@/types';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface AppContextType {
  // Auth state
  isAuthenticated: boolean;
  authUser: AuthUserData | null;
  
  // User state
  userRole: UserRole;
  userName: string | null;
  userId: string | null;
  busNo: string | null;
  preferredStopId: string | null;
  isLoading: boolean;
  
  // Location tracking (driver)
  isTracking: boolean;
  currentLocation: Location | null;
  
  // Trip state
  activeTrip: Trip | null;
  currentStopState: StopState | null;
  
  // Bus location (student view)
  busLocation: Location | null;
  isDriverActive: boolean;
  
  // Passenger state
  hasMarkedAbsence: boolean;
  hasSentWaitRequest: boolean;
  
  // Notifications
  notifications: StudentNotification[];
  unreadCount: number;
  
  // Students list (for driver)
  students: Student[];
  
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Actions
  setRole: (role: UserRole, name: string) => Promise<void>;
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  sendNotification: (type: NotificationType, message?: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  refreshBusLocation: () => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUserData | null>(null);
  
  // User state
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [busNo, setBusNo] = useState<string | null>(DEFAULT_ASSIGNMENT.BUS_NO);
  const [preferredStopId, setPreferredStopId] = useState<string | null>(DEFAULT_ASSIGNMENT.PREFERRED_STOP_ID);
  const [isLoading, setIsLoading] = useState(true);
  
  // Location state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [busLocation, setBusLocation] = useState<Location | null>(null);
  const [isDriverActive, setIsDriverActive] = useState(false);
  
  // Trip state
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [currentStopState, setCurrentStopState] = useState<StopState | null>(null);
  
  // Passenger action state (per spec: trip-scoped)
  const [hasMarkedAbsence, setHasMarkedAbsence] = useState(false);
  const [hasSentWaitRequest, setHasSentWaitRequest] = useState(false);
  
  // Notifications
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  
  // Students
  const [students, setStudents] = useState<Student[]>([]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch their profile from Firestore
        try {
          const userProfile = await FirestoreService.getUserData(firebaseUser.uid);
          if (userProfile) {
            const userData: AuthUserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: userProfile.displayName || firebaseUser.displayName,
              role: userProfile.role,
            };
            setAuthUser(userData);
            setIsAuthenticated(true);
            setUserRole(userProfile.role);
            setUserName(userProfile.displayName);
            setUserId(firebaseUser.uid);
            setBusNo(userProfile.busNo || null);
            setPreferredStopId(userProfile.preferredStopId || null);
            
            // Save to local storage
            await StorageService.saveAppState({
              userRole: userProfile.role,
              userName: userProfile.displayName,
              userId: firebaseUser.uid,
              busNo: userProfile.busNo || null,
              preferredStopId: userProfile.preferredStopId || null,
              onboardingComplete: true,
            });
          } else {
            // User exists in Auth but not in Firestore (incomplete registration)
            setAuthUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: null,
            });
            setIsAuthenticated(true);
            setUserRole(null);
            setUserId(firebaseUser.uid);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        // User is signed out
        setAuthUser(null);
        setIsAuthenticated(false);
        setUserRole(null);
        setUserName(null);
        setUserId(null);
      }
      setIsLoading(false);
    });

    // Load initial data
    setStudents(MockData.getStudents());
    setIsDriverActive(MockData.isDriverTracking());
    setBusLocation(MockData.getBusLocation());

    return unsubscribe;
  }, []);

  // Poll for bus location updates (for students)
  useEffect(() => {
    if (userRole === 'student') {
      const interval = setInterval(() => {
        refreshBusLocation();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  // Poll for notifications (for driver)
  useEffect(() => {
    if (userRole === 'driver') {
      const interval = setInterval(() => {
        const newNotifications = MockData.getNotifications();
        setNotifications(newNotifications);
        setStudents(MockData.getStudents());
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      await AuthService.signInWithEmail(email, password);
      // Auth state change listener will handle the rest
    } catch (error) {
      throw error;
    }
  };

  /**
   * Register new user with email, password, role, and display name
   */
  const register = async (
    email: string, 
    password: string, 
    role: UserRole, 
    displayName: string
  ): Promise<void> => {
    try {
      const firebaseUser = await AuthService.signUpWithEmail(email, password);
      
      // Update Firebase Auth profile
      await AuthService.updateUserProfile(displayName);
      
      // Create user profile in Firestore
      await FirestoreService.createUserProfile(
        firebaseUser.uid,
        email,
        displayName,
        role
      );
      
      // Auth state change listener will handle updating the state
    } catch (error) {
      throw error;
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async (): Promise<void> => {
    try {
      // Stop any active tracking
      if (isTracking) {
        stopTracking();
      }
      
      await AuthService.signOut();
      
      // Clear local storage
      await StorageService.clearAppData();
      
      // Auth state change listener will handle updating the state
    } catch (error) {
      throw error;
    }
  };

  const setRole = async (role: UserRole, name: string) => {
    try {
      if (userId) {
        // Update role in Firestore
        await FirestoreService.updateUserRole(userId, role);
        await FirestoreService.updateUserDisplayName(userId, name);
      }
      
      const id = userId || `${role}-${Date.now()}`;
      await StorageService.saveAppState({
        userRole: role,
        userName: name,
        userId: id,
        onboardingComplete: true,
      });
      setUserRole(role);
      setUserName(name);
      setUserId(id);
      
      if (authUser) {
        setAuthUser({ ...authUser, role, displayName: name });
      }
    } catch (error) {
      console.error('Error setting role:', error);
      throw error;
    }
  };

  const startTracking = async (): Promise<boolean> => {
    const success = await LocationService.startLocationTracking(
      (location) => {
        setCurrentLocation(location);
        MockData.updateBusLocation(location);
      },
      (error) => {
        console.error('Location error:', error);
      }
    );
    
    if (success) {
      setIsTracking(true);
      MockData.setDriverActive(true);
      setIsDriverActive(true);
    }
    
    return success;
  };

  const stopTracking = () => {
    LocationService.stopLocationTracking();
    setIsTracking(false);
    setCurrentLocation(null);
    MockData.setDriverActive(false);
    setIsDriverActive(false);
  };

  const sendNotification = useCallback((
    type: NotificationType,
    message?: string
  ) => {
    if (!userId) return;
    
    try {
      const studentId = 'student-1';
      MockData.sendStudentNotification(studentId, type, message);
      setNotifications(MockData.getNotifications());
      
      // Track what the passenger has sent (per spec: trip-scoped)
      if (type === 'wait') {
        setHasSentWaitRequest(true);
      } else if (type === 'skip') {
        setHasMarkedAbsence(true);
        // Per spec: Absence disables wait requests for that trip
        setHasSentWaitRequest(false);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [userId]);

  const markNotificationRead = useCallback((id: string) => {
    MockData.markNotificationRead(id);
    setNotifications(MockData.getNotifications());
  }, []);

  const clearAllNotifications = useCallback(() => {
    MockData.clearNotifications();
    setNotifications([]);
  }, []);

  const refreshBusLocation = useCallback(() => {
    const location = MockData.getBusLocation();
    setBusLocation(location);
    setIsDriverActive(MockData.isDriverTracking());
  }, []);

  const logout = async () => {
    await signOut();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        authUser,
        userRole,
        userName,
        userId,
        busNo,
        preferredStopId,
        isLoading,
        isTracking,
        currentLocation,
        activeTrip,
        currentStopState,
        busLocation,
        isDriverActive,
        hasMarkedAbsence,
        hasSentWaitRequest,
        notifications,
        unreadCount,
        students,
        login,
        register,
        signOut,
        setRole,
        startTracking,
        stopTracking,
        sendNotification,
        markNotificationRead,
        clearAllNotifications,
        refreshBusLocation,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
