/**
 * App Context
 * 
 * Global state management for the Bus Buddy app.
 * Provides user authentication, role, tracking state, and notifications across all screens.
 */

import * as AuthService from '@/services/auth';
import * as FirestoreService from '@/services/firestore';
import * as LocationService from '@/services/location';
import * as MockData from '@/services/mock-data';
import * as StorageService from '@/services/storage';
import { ActionResult, AuthUserData, Location, StopStatus, Student, StudentNotification, TripState, UserRole } from '@/types';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface AppContextType {
  // Auth state
  isAuthenticated: boolean;
  authUser: AuthUserData | null;
  
  // User state
  userRole: UserRole;
  userName: string | null;
  userId: string | null;
  isLoading: boolean;
  
  // Location tracking (driver)
  isTracking: boolean;
  currentLocation: Location | null;
  
   // Bus location (student view)
   busLocation: Location | null;
   isDriverActive: boolean;
  activeTrip: TripState | null;
  stopStatuses: StopStatus[];
  currentStopStatus: StopStatus | null;
  passengerPreferredStopId: string | null;
  passengerPreferredStopName: string | null;
  passengerCanRequestWait: boolean;
  hasMarkedAbsence: boolean;
   
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
  requestWaitForStop: () => ActionResult;
  markAbsentForTrip: () => ActionResult;
  advanceToNextStop: () => void;
   sendNotification: (type: 'wait' | 'skip' | 'running_late' | 'ready', message?: string) => void;
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Location state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [busLocation, setBusLocation] = useState<Location | null>(null);
  const [isDriverActive, setIsDriverActive] = useState(false);
  const [activeTrip, setActiveTrip] = useState<TripState | null>(MockData.getActiveTrip());
  const [stopStatuses, setStopStatuses] = useState<StopStatus[]>(MockData.getStopStatuses());
  const [currentStopStatus, setCurrentStopStatus] = useState<StopStatus | null>(MockData.getCurrentStopStatus());
  const [passengerProfile, setPassengerProfile] = useState<Student | null>(null);
  
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
            
            // Save to local storage
            await StorageService.saveAppState({
              userRole: userProfile.role,
              userName: userProfile.displayName,
              userId: firebaseUser.uid,
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

  useEffect(() => {
    if (userRole === 'student') {
      const profile = MockData.ensurePassengerProfile(userId || 'student-1', userName || undefined);
      setPassengerProfile(profile);
    } else {
      setPassengerProfile(null);
    }
  }, [userRole, userId, userName]);

  const refreshTripState = useCallback(() => {
    const tripState = MockData.getActiveTrip();
    setActiveTrip(tripState);
    setStopStatuses(MockData.getStopStatuses());
    setCurrentStopStatus(MockData.getCurrentStopStatus());
  }, []);

  useEffect(() => {
    refreshTripState();
    const interval = setInterval(() => {
      refreshTripState();
    }, 1000);
    return () => clearInterval(interval);
  }, [refreshTripState]);

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

  const requestWaitForStop = useCallback((): ActionResult => {
    if (!passengerProfile) {
      return { success: false, reason: 'Passenger profile unavailable' };
    }
    const result = MockData.createWaitRequest(passengerProfile.id);
    refreshTripState();
    return result;
  }, [passengerProfile, refreshTripState]);

  const markAbsentForTrip = useCallback((): ActionResult => {
    if (!passengerProfile) {
      return { success: false, reason: 'Passenger profile unavailable' };
    }
    const result = MockData.markPassengerAbsent(passengerProfile.id);
    refreshTripState();
    return result;
  }, [passengerProfile, refreshTripState]);

  const advanceToNextStop = useCallback(() => {
    MockData.advanceToNextStop();
    refreshTripState();
  }, [refreshTripState]);

  const sendNotification = useCallback((
    type: 'wait' | 'skip' | 'running_late' | 'ready',
    message?: string
  ) => {
    if (!userId) return;
    
    try {
      const studentId = 'student-1';
      MockData.sendStudentNotification(studentId, type, message);
      setNotifications(MockData.getNotifications());
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
  const passengerPreferredStopId = passengerProfile?.preferredStopId || null;
  const passengerPreferredStopName = passengerProfile?.stopName || null;
  const passengerCanRequestWait = passengerProfile
    ? MockData.canPassengerRequestWait(passengerProfile.id).success
    : false;
  const hasMarkedAbsence = passengerProfile ? MockData.hasPassengerAbsent(passengerProfile.id) : false;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        authUser,
        userRole,
        userName,
        userId,
        isLoading,
        isTracking,
        currentLocation,
        busLocation,
        isDriverActive,
        activeTrip,
        stopStatuses,
        currentStopStatus,
        passengerPreferredStopId,
        passengerPreferredStopName,
        passengerCanRequestWait,
        hasMarkedAbsence,
        notifications,
        unreadCount,
        students,
        login,
        register,
        signOut,
        setRole,
        startTracking,
        stopTracking,
        requestWaitForStop,
        markAbsentForTrip,
        advanceToNextStop,
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
