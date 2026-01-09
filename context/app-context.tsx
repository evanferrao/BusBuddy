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

import { DEFAULT_IDS } from '@/constants/bus-tracker';
import * as AuthService from '@/services/auth';
import * as FirestoreService from '@/services/firestore';
import * as LocationService from '@/services/location';
import * as MockData from '@/services/mock-data';
import * as StorageService from '@/services/storage';
import * as TripService from '@/services/trip-service';
import * as RouteService from '@/services/route-service';
import { Absence, AuthUserData, Location, NotificationType, Route, StopState, Student, StudentNotification, Trip, UserRole, WaitRequest } from '@/types';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface AppContextType {
  // Auth state
  isAuthenticated: boolean;
  authUser: AuthUserData | null;
  
  // User state
  userRole: UserRole;
  userName: string | null;
  userId: string | null;
  busId: string | null;
  preferredStopId: string | null;
  isLoading: boolean;
  
  // Location tracking (driver)
  isTracking: boolean;
  currentLocation: Location | null;
  
  // Trip state (real-time from Firestore)
  activeTrip: Trip | null;
  currentStopState: StopState | null;
  route: Route | null;
  waitRequests: WaitRequest[];
  absences: Absence[];
  
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
  sendWaitRequest: () => Promise<void>;
  markAbsent: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  refreshBusLocation: () => void;
  logout: () => Promise<void>;
  // Trip management for drivers
  startTrip: () => Promise<Trip | null>;
  endTrip: () => Promise<void>;
  arriveAtStop: (stopId: string) => Promise<void>;
  departFromStop: () => Promise<void>;
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
  const [busId, setBusId] = useState<string | null>(DEFAULT_IDS.BUS_ID);
  const [preferredStopId, setPreferredStopId] = useState<string | null>(DEFAULT_IDS.STOP_ID);
  const [isLoading, setIsLoading] = useState(true);
  
  // Location state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [busLocation, setBusLocation] = useState<Location | null>(null);
  const [isDriverActive, setIsDriverActive] = useState(false);
  
  // Trip state (real-time from Firestore)
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [currentStopState, setCurrentStopState] = useState<StopState | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [waitRequests, setWaitRequests] = useState<WaitRequest[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  
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
            setBusId(userProfile.busId || DEFAULT_IDS.BUS_ID);
            setPreferredStopId(userProfile.preferredStopId || DEFAULT_IDS.STOP_ID);
            
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
    
    // Load route data (uses user's associated route, falls back to default)
    RouteService.getRoute(DEFAULT_IDS.ROUTE_ID).then((r) => {
      if (r) setRoute(r);
    });

    return unsubscribe;
  }, []);

  // Subscribe to active trip and related data
  useEffect(() => {
    if (!busId || !isAuthenticated) return;

    const tripId = TripService.generateTripId(busId);
    
    // Subscribe to trip updates
    const unsubscribeTrip = TripService.subscribeToTrip(tripId, (trip) => {
      setActiveTrip(trip);
      if (trip) {
        setIsDriverActive(true);
        // Update bus location from trip
        setBusLocation({
          latitude: trip.location.lat,
          longitude: trip.location.lng,
          timestamp: Date.now(),
        });
      } else {
        setIsDriverActive(false);
      }
    });

    // Subscribe to wait requests
    const unsubscribeWaitRequests = TripService.subscribeToWaitRequests(tripId, (requests) => {
      setWaitRequests(requests);
      // Check if current user has sent a wait request
      if (userId) {
        setHasSentWaitRequest(requests.some(r => r.passengerId === userId));
      }
    });

    // Subscribe to absences
    const unsubscribeAbsences = TripService.subscribeToAbsences(tripId, (abs) => {
      setAbsences(abs);
      // Check if current user has marked absence
      if (userId) {
        setHasMarkedAbsence(abs.some(a => a.passengerId === userId));
      }
    });

    return () => {
      unsubscribeTrip();
      unsubscribeWaitRequests();
      unsubscribeAbsences();
    };
  }, [busId, isAuthenticated, userId]);

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

  // ============================================
  // TRIP MANAGEMENT FUNCTIONS (Per Specification)
  // ============================================

  /**
   * Start a new trip (Driver only)
   * Per spec: Creates trip document in trips/{tripId}
   */
  const startTripAction = useCallback(async (): Promise<Trip | null> => {
    if (!userId || !busId || userRole !== 'driver') return null;
    
    const initialLocation = currentLocation || { latitude: 0, longitude: 0 };
    
    try {
      const trip = await TripService.startTrip(busId, userId, {
        lat: initialLocation.latitude,
        lng: initialLocation.longitude,
      });
      setActiveTrip(trip);
      return trip;
    } catch (error) {
      console.error('Error starting trip:', error);
      return null;
    }
  }, [userId, busId, userRole, currentLocation]);

  /**
   * End the current trip (Driver only)
   */
  const endTripAction = useCallback(async (): Promise<void> => {
    if (!activeTrip || !busId) return;
    
    try {
      await TripService.endTrip(activeTrip.tripId, busId);
      setActiveTrip(null);
      setWaitRequests([]);
      setAbsences([]);
    } catch (error) {
      console.error('Error ending trip:', error);
    }
  }, [activeTrip, busId]);

  /**
   * Arrive at a stop (Driver only)
   * Per spec: Sets currentStopId, stopArrivedAt, and status to AT_STOP
   */
  const arriveAtStopAction = useCallback(async (stopId: string): Promise<void> => {
    if (!activeTrip) return;
    
    try {
      await TripService.arriveAtStop(activeTrip.tripId, stopId);
    } catch (error) {
      console.error('Error arriving at stop:', error);
    }
  }, [activeTrip]);

  /**
   * Depart from current stop (Driver only)
   * Per spec: Sets status to IN_TRANSIT
   */
  const departFromStopAction = useCallback(async (): Promise<void> => {
    if (!activeTrip) return;
    
    try {
      await TripService.departFromStop(activeTrip.tripId);
    } catch (error) {
      console.error('Error departing from stop:', error);
    }
  }, [activeTrip]);

  // ============================================
  // PASSENGER ACTION FUNCTIONS (Per Specification)
  // ============================================

  /**
   * Send wait request (Passenger only)
   * Per spec: Creates document in trips/{tripId}/waitRequests/{uid}
   */
  const sendWaitRequestAction = useCallback(async (): Promise<void> => {
    if (!userId || !preferredStopId || !busId || hasMarkedAbsence) return;
    
    const tripId = TripService.generateTripId(busId);
    
    try {
      await TripService.sendWaitRequest(tripId, userId, preferredStopId);
      setHasSentWaitRequest(true);
      
      // Send mock notification for UI display (uses first mock student for demo)
      // In production, notifications would be derived from Firestore waitRequests
      MockData.sendStudentNotification('student-1', 'wait');
      setNotifications(MockData.getNotifications());
    } catch (error) {
      console.error('Error sending wait request:', error);
    }
  }, [userId, preferredStopId, busId, hasMarkedAbsence]);

  /**
   * Mark absence (Passenger only)
   * Per spec: Creates document in trips/{tripId}/absences/{uid}
   * Note: Absence is final for the trip and disables wait requests
   */
  const markAbsentAction = useCallback(async (): Promise<void> => {
    if (!userId || !preferredStopId || !busId || hasMarkedAbsence) return;
    
    const tripId = TripService.generateTripId(busId);
    
    try {
      await TripService.markAbsence(tripId, userId, preferredStopId);
      setHasMarkedAbsence(true);
      setHasSentWaitRequest(false); // Per spec: Absence disables wait requests
      
      // Send mock notification for UI display (uses first mock student for demo)
      // In production, notifications would be derived from Firestore absences
      MockData.sendStudentNotification('student-1', 'skip');
      setNotifications(MockData.getNotifications());
    } catch (error) {
      console.error('Error marking absence:', error);
    }
  }, [userId, preferredStopId, busId, hasMarkedAbsence]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        authUser,
        userRole,
        userName,
        userId,
        busId,
        preferredStopId,
        isLoading,
        isTracking,
        currentLocation,
        activeTrip,
        currentStopState,
        route,
        waitRequests,
        absences,
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
        sendWaitRequest: sendWaitRequestAction,
        markAbsent: markAbsentAction,
        markNotificationRead,
        clearAllNotifications,
        refreshBusLocation,
        logout,
        startTrip: startTripAction,
        endTrip: endTripAction,
        arriveAtStop: arriveAtStopAction,
        departFromStop: departFromStopAction,
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
