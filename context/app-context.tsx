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
import * as TripService from '@/services/trip-service';
import { AuthUserData, Location, NotificationType, Passenger, PassengerNotification, RouteStop, StopState, Trip, UserRole } from '@/types';
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
  routeStops: RouteStop[];
  currentStopIndex: number;
  
  // Bus location (passenger view)
  busLocation: Location | null;
  isDriverActive: boolean;
  
  // Passenger state
  hasMarkedAbsence: boolean;
  hasSentWaitRequest: boolean;
  hasBusDeparted: boolean;  // True if bus has already passed the passenger's stop
  
  // Notifications
  notifications: PassengerNotification[];
  unreadCount: number;
  
  // Passengers list (for driver)
  passengers: Passenger[];
  
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
  const [busId, setBusId] = useState<string | null>('bus_1'); // Default bus ID for demo
  const [preferredStopId, setPreferredStopId] = useState<string | null>('stop_dadar_tt'); // Default stop for demo
  const [isLoading, setIsLoading] = useState(true);
  
  // Location state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [busLocation, setBusLocation] = useState<Location | null>(null);
  const [isDriverActive, setIsDriverActive] = useState(false);
  
  // Trip state
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [currentStopState, setCurrentStopState] = useState<StopState | null>(null);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  
  // Passenger action state (per spec: trip-scoped)
  const [hasMarkedAbsence, setHasMarkedAbsence] = useState(false);
  const [hasSentWaitRequest, setHasSentWaitRequest] = useState(false);
  
  // Notifications
  const [notifications, setNotifications] = useState<PassengerNotification[]>([]);
  
  // Passengers
  const [passengers, setPassengers] = useState<Passenger[]>([]);

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
              displayName: userProfile.name || firebaseUser.displayName,
              role: userProfile.role,
            };
            setAuthUser(userData);
            setIsAuthenticated(true);
            setUserRole(userProfile.role);
            setUserName(userProfile.name);
            setUserId(firebaseUser.uid);
            setBusId(userProfile.busId || 'bus_1');
            if (userProfile.preferredStopId) {
              setPreferredStopId(userProfile.preferredStopId);
            }
            
            // Save to local storage
            await StorageService.saveAppState({
              userRole: userProfile.role,
              userName: userProfile.name,
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
    setPassengers(MockData.getPassengers());

    return unsubscribe;
  }, []);

  // Track previous trip ID to detect new trips
  const previousTripIdRef = React.useRef<string | null>(null);

  // Subscribe to active trip for the user's bus
  useEffect(() => {
    if (!busId || !isAuthenticated) return;

    // Subscribe to active trip for this bus (queries for trips where endedAt is null)
    const unsubscribeTrip = TripService.subscribeToActiveTripForBus(busId, (trip) => {
      // Detect if this is a new/different trip
      const isNewTrip = trip && trip.tripId !== previousTripIdRef.current;
      
      if (isNewTrip && userRole === 'passenger') {
        // New trip detected - reset passenger notification states
        setHasSentWaitRequest(false);
        setHasMarkedAbsence(false);
        setNotifications([]);
        console.log('New trip detected via subscription, resetting notification states');
      }
      
      // Update the previous trip ID ref
      previousTripIdRef.current = trip?.tripId || null;
      
      setActiveTrip(trip);
      
      if (trip && !trip.endedAt) {
        // Trip is active
        setIsDriverActive(true);
        setIsTracking(userRole === 'driver' && trip.driverId === userId);
        
        // Update bus location from trip
        if (trip.location) {
          setBusLocation({
            latitude: trip.location.lat,
            longitude: trip.location.lng,
            timestamp: Date.now(),
          });
        }
        
        // Find current stop index from routeStops
        if (trip.currentStopId && routeStops.length > 0) {
          const idx = routeStops.findIndex(s => s.stopId === trip.currentStopId);
          if (idx >= 0) {
            setCurrentStopIndex(idx);
          }
        }
      } else {
        // No active trip
        setIsDriverActive(false);
        if (userRole === 'driver') {
          setIsTracking(false);
        }
      }
    });

    return () => {
      unsubscribeTrip();
    };
  }, [busId, isAuthenticated, userId, userRole]);

  // Fetch route stops separately - runs once when busId is available
  useEffect(() => {
    if (!busId) return;

    const fetchRoute = async () => {
      try {
        // Route ID follows pattern: route_1 for bus_1
        const routeNumber = busId.replace('bus_', '');
        const routeId = `route_${routeNumber}`;
        console.log('Fetching route:', routeId);
        const route = await TripService.getRoute(routeId);
        if (route) {
          console.log('Route fetched with stops:', route.stops.length);
          setRouteStops(route.stops);
        } else {
          console.log('No route found, using mock data');
          // Fallback to mock data if no route in Firestore
          const mockRoute = MockData.getMockRoute();
          setRouteStops(mockRoute.stops);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        // Fallback to mock data
        const mockRoute = MockData.getMockRoute();
        setRouteStops(mockRoute.stops);
      }
    };
    fetchRoute();
  }, [busId]);

  // Poll for bus location updates (for passengers) - now using trip data
  useEffect(() => {
    if (userRole === 'passenger' && activeTrip) {
      // Bus location is now updated via trip subscription
      // Just keep the refresh for manual pull-to-refresh
    }
  }, [userRole, activeTrip]);

  // Subscribe to wait requests and absences for driver
  useEffect(() => {
    if (userRole !== 'driver' || !activeTrip) return;

    // Clear notifications when subscribing to a new trip
    // This ensures old notifications from previous trips are flushed
    setNotifications([]);
    MockData.clearNotifications();

    // Subscribe to wait requests
    const unsubscribeWait = TripService.subscribeToWaitRequests(
      activeTrip.tripId,
      async (waitRequests) => {
        console.log('Wait requests updated:', waitRequests.length);
        
        // Convert wait requests to notifications format
        const waitNotifications: PassengerNotification[] = await Promise.all(
          waitRequests.map(async (req) => {
            // Fetch passenger info
            const passenger = await FirestoreService.getUserData(req.passengerId);
            const stop = routeStops.find(s => s.stopId === req.stopId);
            return {
              id: `wait-${req.passengerId}`,
              passengerId: req.passengerId,
              passengerName: passenger?.name || 'Unknown',
              stopId: req.stopId,
              stopName: stop?.name || 'Unknown Stop',
              type: 'wait' as NotificationType,
              timestamp: req.requestedAt,
              isRead: false,
            };
          })
        );
        
        // Merge with absence notifications
        setNotifications(prev => {
          const absenceNotifs = prev.filter(n => n.type === 'skip');
          return [...waitNotifications, ...absenceNotifs];
        });
      }
    );

    // Subscribe to absences
    const unsubscribeAbsence = TripService.subscribeToAbsences(
      activeTrip.tripId,
      async (absences) => {
        console.log('Absences updated:', absences.length);
        
        // Convert absences to notifications format
        const absenceNotifications: PassengerNotification[] = await Promise.all(
          absences.map(async (absence) => {
            // Fetch passenger info
            const passenger = await FirestoreService.getUserData(absence.passengerId);
            const stop = routeStops.find(s => s.stopId === absence.stopId);
            return {
              id: `absence-${absence.passengerId}`,
              passengerId: absence.passengerId,
              passengerName: passenger?.name || 'Unknown',
              stopId: absence.stopId,
              stopName: stop?.name || 'Unknown Stop',
              type: 'skip' as NotificationType,
              timestamp: absence.markedAt,
              isRead: false,
            };
          })
        );
        
        // Merge with wait notifications
        setNotifications(prev => {
          const waitNotifs = prev.filter(n => n.type === 'wait');
          return [...waitNotifs, ...absenceNotifications];
        });
      }
    );

    return () => {
      unsubscribeWait();
      unsubscribeAbsence();
    };
  }, [userRole, activeTrip, routeStops]);

  // Subscribe to own notifications for passengers
  useEffect(() => {
    if (userRole !== 'passenger' || !activeTrip || !userId) return;

    // Clear notifications when subscribing to a new trip
    setNotifications([]);

    // Subscribe to this passenger's wait requests
    const unsubscribeWait = TripService.subscribeToWaitRequests(
      activeTrip.tripId,
      async (waitRequests) => {
        // Filter to only this passenger's requests
        const myWaitRequests = waitRequests.filter(req => req.passengerId === userId);
        
        // Convert to notifications format
        const waitNotifications: PassengerNotification[] = myWaitRequests.map(req => {
          const stop = routeStops.find(s => s.stopId === req.stopId);
          return {
            id: `wait-${req.passengerId}-${req.requestedAt}`,
            passengerId: req.passengerId,
            passengerName: 'You',
            stopId: req.stopId,
            stopName: stop?.name || 'Unknown Stop',
            type: 'wait' as NotificationType,
            timestamp: req.requestedAt,
            isRead: true, // Mark as read for own notifications
          };
        });
        
        // Merge with absence notifications
        setNotifications(prev => {
          const absenceNotifs = prev.filter(n => n.type === 'skip');
          return [...waitNotifications, ...absenceNotifs];
        });
      }
    );

    // Subscribe to this passenger's absences
    const unsubscribeAbsence = TripService.subscribeToAbsences(
      activeTrip.tripId,
      async (absences) => {
        // Filter to only this passenger's absences
        const myAbsences = absences.filter(absence => absence.passengerId === userId);
        
        // Convert to notifications format
        const absenceNotifications: PassengerNotification[] = myAbsences.map(absence => {
          const stop = routeStops.find(s => s.stopId === absence.stopId);
          return {
            id: `absence-${absence.passengerId}-${absence.markedAt}`,
            passengerId: absence.passengerId,
            passengerName: 'You',
            stopId: absence.stopId,
            stopName: stop?.name || 'Unknown Stop',
            type: 'skip' as NotificationType,
            timestamp: absence.markedAt,
            isRead: true, // Mark as read for own notifications
          };
        });
        
        // Merge with wait notifications
        setNotifications(prev => {
          const waitNotifs = prev.filter(n => n.type === 'wait');
          return [...waitNotifs, ...absenceNotifications];
        });
      }
    );

    return () => {
      unsubscribeWait();
      unsubscribeAbsence();
    };
  }, [userRole, activeTrip, userId, routeStops]);

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
    if (!busId || !userId) return false;
    
    const success = await LocationService.startLocationTracking(
      async (location) => {
        setCurrentLocation(location);
        
        // Update trip location in Firestore
        if (activeTrip) {
          try {
            await TripService.updateTripLocation(activeTrip.tripId, {
              lat: location.latitude,
              lng: location.longitude,
            });
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
      try {
        // Clear any notifications from previous trips
        MockData.clearNotifications();
        setNotifications([]);
        
        // Reset passenger action states for new trip
        setHasMarkedAbsence(false);
        setHasSentWaitRequest(false);
        
        // Create a new trip in Firestore
        const routeNumber = busId.replace('bus_', '');
        const routeId = `route_${routeNumber}`;
        const initialLocation = currentLocation 
          ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
          : { lat: 0, lng: 0 };
        
        const trip = await TripService.startTrip(busId, routeId, userId, initialLocation);
        setActiveTrip(trip);
        setIsTracking(true);
        setIsDriverActive(true);
        setCurrentStopIndex(0);
        
        // Arrive at first stop automatically
        if (routeStops.length > 0) {
          await TripService.arriveAtStop(trip.tripId, routeStops[0].stopId);
        }
      } catch (error) {
        console.error('Error starting trip:', error);
        LocationService.stopLocationTracking();
        return false;
      }
    }
    
    return success;
  };

  const stopTracking = async () => {
    LocationService.stopLocationTracking();
    
    // End trip in Firestore
    if (activeTrip) {
      try {
        await TripService.endTrip(activeTrip.tripId);
      } catch (error) {
        console.error('Error ending trip:', error);
      }
    }
    
    setIsTracking(false);
    setCurrentLocation(null);
    setActiveTrip(null);
    setIsDriverActive(false);
    setCurrentStopIndex(0);
    
    // Clear notifications from previous trip
    MockData.clearNotifications();
    setNotifications([]);
    
    // Reset passenger action states for new trip
    setHasMarkedAbsence(false);
    setHasSentWaitRequest(false);
  };

  /**
   * Driver arrives at a stop
   */
  const arriveAtStop = async (stopId: string): Promise<void> => {
    if (!activeTrip) return;
    
    try {
      await TripService.arriveAtStop(activeTrip.tripId, stopId);
    } catch (error) {
      console.error('Error arriving at stop:', error);
      throw error;
    }
  };

  /**
   * Driver departs from current stop
   */
  const departFromStop = async (): Promise<void> => {
    if (!activeTrip) return;
    
    try {
      await TripService.departFromStop(activeTrip.tripId);
      
      // Move to next stop index (but don't arrive yet - driver must press "Arrive at Stop")
      const nextIndex = currentStopIndex + 1;
      if (nextIndex < routeStops.length) {
        setCurrentStopIndex(nextIndex);
        // Driver is now EN_ROUTE to next stop - they will press "Arrive at Stop" when they get there
      }
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
      console.log('Cannot send notification: missing userId, activeTrip, or preferredStopId');
      return;
    }
    
    try {
      if (type === 'wait') {
        // Prevent wait request if already marked absent
        if (hasMarkedAbsence) {
          console.log('Cannot send wait request: already marked absent');
          return;
        }
        // Send wait request to Firestore
        await TripService.sendWaitRequest(activeTrip.tripId, userId, preferredStopId);
        setHasSentWaitRequest(true);
        console.log('Wait request sent to Firestore');
      } else if (type === 'skip') {
        // Mark absence in Firestore
        await TripService.markAbsence(activeTrip.tripId, userId, preferredStopId);
        setHasMarkedAbsence(true);
        
        // Absence takes precedence - remove any existing wait request
        await TripService.removeWaitRequest(activeTrip.tripId, userId);
        setHasSentWaitRequest(false);
        console.log('Absence marked in Firestore, wait request removed');
      }
      
      // Note: Driver notifications are now handled via Firestore subscriptions
      // (subscribeToWaitRequests and subscribeToAbsences in the driver effect)
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [userId, activeTrip, preferredStopId, hasMarkedAbsence]);

  const markNotificationRead = useCallback((id: string) => {
    MockData.markNotificationRead(id);
    setNotifications(MockData.getNotifications());
  }, []);

  const clearAllNotifications = useCallback(() => {
    MockData.clearNotifications();
    setNotifications([]);
  }, []);

  const refreshBusLocation = useCallback(async () => {
    // Manual pull-to-refresh - fetches the latest active trip for the bus
    if (busId) {
      try {
        // Use getActiveTripForBus to find any active trip for this bus
        // This queries for trips where endedAt is null, regardless of trip ID
        const trip = await TripService.getActiveTripForBus(busId);
        
        if (trip && !trip.endedAt) {
          // Check if this is a different trip than what we had before
          const isNewTrip = !activeTrip || activeTrip.tripId !== trip.tripId;
          
          setActiveTrip(trip);
          setIsDriverActive(true);
          
          if (trip.location) {
            setBusLocation({
              latitude: trip.location.lat,
              longitude: trip.location.lng,
              timestamp: Date.now(),
            });
          }
          
          // If it's a new trip, reset passenger notification states
          if (isNewTrip && userRole === 'passenger') {
            setHasSentWaitRequest(false);
            setHasMarkedAbsence(false);
            setNotifications([]);
            console.log('New trip detected on refresh, resetting notification states');
          }
        } else {
          setActiveTrip(null);
          setIsDriverActive(false);
          setBusLocation(null);
        }
      } catch (error) {
        console.error('Error refreshing bus location:', error);
      }
    }
  }, [busId, activeTrip, userRole]);

  const logout = async () => {
    await signOut();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Check if bus has already passed the passenger's preferred stop
  const hasBusDeparted = React.useMemo(() => {
    if (!isDriverActive || !activeTrip || !preferredStopId || routeStops.length === 0) {
      return false;
    }
    
    // Find the index of the passenger's preferred stop
    const preferredStopIndex = routeStops.findIndex(s => s.stopId === preferredStopId);
    if (preferredStopIndex === -1) {
      return false;
    }
    
    // Bus has departed if current stop index is greater than preferred stop index
    return currentStopIndex > preferredStopIndex;
  }, [isDriverActive, activeTrip, preferredStopId, routeStops, currentStopIndex]);

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
        routeStops,
        currentStopIndex,
        busLocation,
        isDriverActive,
        hasMarkedAbsence,
        hasSentWaitRequest,
        hasBusDeparted,
        notifications,
        unreadCount,
        passengers,
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
