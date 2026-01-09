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
import * as BusService from '@/services/bus-service';
import * as FirestoreService from '@/services/firestore';
import * as LocationService from '@/services/location';
import * as MockData from '@/services/mock-data';
import * as StorageService from '@/services/storage';
import * as TripService from '@/services/trip-service';
import { Absence, AuthUserData, Bus, Location, NotificationType, StopState, Student, StudentNotification, Trip, UserProfile, UserRole, WaitRequest } from '@/types';
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
  arriveAtStop: (stopId: string) => Promise<void>;
  departFromStop: () => Promise<void>;
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
  const [busId, setBusId] = useState<string | null>('bus_1'); // Default bus for demo
  const [preferredStopId, setPreferredStopId] = useState<string | null>('stop_1'); // Default stop for demo
  const [isLoading, setIsLoading] = useState(true);
  
  // Location state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [busLocation, setBusLocation] = useState<Location | null>(null);
  const [isDriverActive, setIsDriverActive] = useState(false);
  
  // Trip state
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [currentStopState, setCurrentStopState] = useState<StopState | null>(null);
  const [bus, setBus] = useState<Bus | null>(null);
  
  // Passenger action state (per spec: trip-scoped)
  const [hasMarkedAbsence, setHasMarkedAbsence] = useState(false);
  const [hasSentWaitRequest, setHasSentWaitRequest] = useState(false);
  
  // Real-time data (for driver view)
  const [passengers, setPassengers] = useState<UserProfile[]>([]);
  const [waitRequests, setWaitRequests] = useState<WaitRequest[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  
  // Notifications
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  
  // Students (legacy - for backward compatibility with existing UI)
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
            setBusId(userProfile.busId);
            setPreferredStopId(userProfile.preferredStopId || null);
            
            // Save to local storage
            await StorageService.saveAppState({
              userRole: userProfile.role,
              userName: userProfile.displayName,
              userId: firebaseUser.uid,
              busId: userProfile.busId,
              preferredStopId: userProfile.preferredStopId,
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

    // Ensure bus data exists in the database
    BusService.ensureBusDataExists().catch(error => {
      console.error('Error ensuring bus data:', error);
    });

    return unsubscribe;
  }, []);

  // Subscribe to bus data when busId changes
  useEffect(() => {
    if (!busId) return;

    const loadBus = async () => {
      try {
        const busData = await BusService.getBus(busId);
        setBus(busData);
        
        // If bus has active trip, subscribe to it
        if (busData?.activeTripId) {
          const trip = await TripService.getTrip(busData.activeTripId);
          setActiveTrip(trip);
          setIsDriverActive(!!trip && !trip.endedAt);
          
          if (trip) {
            setBusLocation({
              latitude: trip.location.lat,
              longitude: trip.location.lng,
              timestamp: Date.now(),
            });
          }
        } else {
          setActiveTrip(null);
          setIsDriverActive(false);
        }
      } catch (error) {
        console.error('Error loading bus:', error);
      }
    };

    loadBus();
  }, [busId]);

  // Subscribe to trip updates when there's an active trip
  useEffect(() => {
    if (!activeTrip?.tripId) return;

    const unsubscribe = TripService.subscribeToTrip(
      activeTrip.tripId,
      (trip) => {
        setActiveTrip(trip);
        if (trip) {
          setIsDriverActive(!trip.endedAt);
          setBusLocation({
            latitude: trip.location.lat,
            longitude: trip.location.lng,
            timestamp: Date.now(),
          });
        }
      }
    );

    return unsubscribe;
  }, [activeTrip?.tripId]);

  // Subscribe to wait requests for active trip (driver view)
  useEffect(() => {
    if (!activeTrip?.tripId || userRole !== 'driver') return;

    const unsubscribe = TripService.subscribeToWaitRequests(
      activeTrip.tripId,
      (requests) => {
        setWaitRequests(requests);
        
        // Generate notifications from wait requests
        const waitNotifications: StudentNotification[] = requests.map((req, index) => ({
          id: `wait-${req.passengerId}-${req.requestedAt}`,
          studentId: req.passengerId,
          studentName: `Student ${index + 1}`, // Would lookup from passengers list
          stopId: req.stopId,
          stopName: bus?.stops.find(s => s.stopId === req.stopId)?.name || req.stopId,
          type: 'wait' as NotificationType,
          timestamp: req.requestedAt,
          isRead: false,
        }));
        
        setNotifications(prev => {
          // Merge with absence notifications
          const absenceNotifications = prev.filter(n => n.type === 'skip');
          return [...waitNotifications, ...absenceNotifications];
        });
      }
    );

    return unsubscribe;
  }, [activeTrip?.tripId, userRole, bus]);

  // Subscribe to absences for active trip (driver view)
  useEffect(() => {
    if (!activeTrip?.tripId || userRole !== 'driver') return;

    const unsubscribe = TripService.subscribeToAbsences(
      activeTrip.tripId,
      (absenceList) => {
        setAbsences(absenceList);
        
        // Generate notifications from absences
        const absenceNotifications: StudentNotification[] = absenceList.map((abs, index) => ({
          id: `absence-${abs.passengerId}-${abs.markedAt}`,
          studentId: abs.passengerId,
          studentName: `Student ${index + 1}`, // Would lookup from passengers list
          stopId: abs.stopId,
          stopName: bus?.stops.find(s => s.stopId === abs.stopId)?.name || abs.stopId,
          type: 'skip' as NotificationType,
          timestamp: abs.markedAt,
          isRead: false,
        }));
        
        setNotifications(prev => {
          // Merge with wait notifications
          const waitNotifications = prev.filter(n => n.type === 'wait');
          return [...waitNotifications, ...absenceNotifications];
        });
      }
    );

    return unsubscribe;
  }, [activeTrip?.tripId, userRole, bus]);

  // Load passengers for the bus (driver view)
  useEffect(() => {
    if (!busId || userRole !== 'driver') return;

    const loadPassengers = async () => {
      try {
        const passengersList = await TripService.getPassengersForBus(busId);
        setPassengers(passengersList);
        
        // Convert to legacy Student format for UI compatibility
        const studentsData: Student[] = passengersList.map(p => ({
          id: p.uid,
          name: p.displayName,
          stopName: bus?.stops.find(s => s.stopId === p.preferredStopId)?.name || 'Unknown',
          stopId: p.preferredStopId || '',
          stopLocation: {
            latitude: bus?.stops.find(s => s.stopId === p.preferredStopId)?.lat || 0,
            longitude: bus?.stops.find(s => s.stopId === p.preferredStopId)?.lng || 0,
            timestamp: Date.now(),
          },
          status: 'unknown',
        }));
        setStudents(studentsData);
      } catch (error) {
        console.error('Error loading passengers:', error);
      }
    };

    loadPassengers();
  }, [busId, userRole, bus]);

  // Check passenger's status for current trip (student view)
  useEffect(() => {
    if (!activeTrip?.tripId || !userId || userRole !== 'student') return;

    const checkStatus = async () => {
      try {
        const hasAbsence = await TripService.hasMarkedAbsence(activeTrip.tripId, userId);
        const hasWait = await TripService.hasWaitRequest(activeTrip.tripId, userId);
        setHasMarkedAbsence(hasAbsence);
        setHasSentWaitRequest(hasWait);
      } catch (error) {
        console.error('Error checking passenger status:', error);
      }
    };

    checkStatus();
  }, [activeTrip?.tripId, userId, userRole]);

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
    if (!userId || !busId) {
      console.error('Cannot start tracking: missing userId or busId');
      return false;
    }

    const success = await LocationService.startLocationTracking(
      async (location) => {
        setCurrentLocation(location);
        
        // Start trip if not already started
        if (!activeTrip) {
          try {
            const trip = await TripService.startTrip(
              busId,
              userId,
              { lat: location.latitude, lng: location.longitude }
            );
            setActiveTrip(trip);
            setIsDriverActive(true);
            setBusLocation(location);
          } catch (error) {
            console.error('Error starting trip:', error);
          }
        } else {
          // Update trip location
          try {
            await TripService.updateTripLocation(
              activeTrip.tripId,
              { lat: location.latitude, lng: location.longitude }
            );
            setBusLocation(location);
          } catch (error) {
            console.error('Error updating trip location:', error);
          }
        }
      },
      (error) => {
        console.error('Location error:', error);
      }
    );
    
    if (success) {
      setIsTracking(true);
    }
    
    return success;
  };

  const stopTracking = async () => {
    LocationService.stopLocationTracking();
    setIsTracking(false);
    setCurrentLocation(null);
    
    // End the trip
    if (activeTrip && busId) {
      try {
        await TripService.endTrip(activeTrip.tripId, busId);
        setActiveTrip(null);
        setIsDriverActive(false);
        setBusLocation(null);
      } catch (error) {
        console.error('Error ending trip:', error);
      }
    }
  };

  const arriveAtStop = async (stopId: string): Promise<void> => {
    if (!activeTrip) {
      console.error('Cannot arrive at stop: no active trip');
      return;
    }

    try {
      await TripService.arriveAtStop(activeTrip.tripId, stopId);
      console.log('Arrived at stop:', stopId);
    } catch (error) {
      console.error('Error arriving at stop:', error);
      throw error;
    }
  };

  const departFromStop = async (): Promise<void> => {
    if (!activeTrip) {
      console.error('Cannot depart from stop: no active trip');
      return;
    }

    try {
      await TripService.departFromStop(activeTrip.tripId);
      console.log('Departed from stop');
    } catch (error) {
      console.error('Error departing from stop:', error);
      throw error;
    }
  };

  const sendNotification = useCallback(async (
    type: NotificationType,
    message?: string
  ) => {
    if (!userId || !activeTrip || !preferredStopId) {
      console.error('Cannot send notification: missing required data');
      return;
    }
    
    try {
      if (type === 'wait') {
        // Send wait request to Firebase
        await TripService.sendWaitRequest(activeTrip.tripId, userId, preferredStopId);
        setHasSentWaitRequest(true);
      } else if (type === 'skip') {
        // Mark absence in Firebase
        await TripService.markAbsence(activeTrip.tripId, userId, preferredStopId);
        setHasMarkedAbsence(true);
        // Per spec: Absence disables wait requests for that trip
        setHasSentWaitRequest(false);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }, [userId, activeTrip, preferredStopId]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const refreshBusLocation = useCallback(async () => {
    if (!busId) return;
    
    try {
      const busData = await BusService.getBus(busId);
      if (busData?.activeTripId) {
        const trip = await TripService.getTrip(busData.activeTripId);
        if (trip) {
          setBusLocation({
            latitude: trip.location.lat,
            longitude: trip.location.lng,
            timestamp: Date.now(),
          });
          setIsDriverActive(!trip.endedAt);
        }
      }
    } catch (error) {
      console.error('Error refreshing bus location:', error);
    }
  }, [busId]);

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
        busId,
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
        arriveAtStop,
        departFromStop,
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
