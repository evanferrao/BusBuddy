/**
 * App Context
 * 
 * Global state management for the Bus Buddy app.
 * Provides user authentication, role, tracking state, and notifications across all screens.
 * Includes trip management for driver-passenger coordination.
 */

import * as AuthService from '@/services/auth';
import * as FirestoreService from '@/services/firestore';
import * as LocationService from '@/services/location';
import * as MockData from '@/services/mock-data';
import * as StopColorService from '@/services/stop-color';
import * as StorageService from '@/services/storage';
import {
    Absence,
    AuthUserData,
    FirestoreBus,
    FirestoreTrip,
    Location,
    StopStatus,
    Student,
    StudentNotification,
    UserRole,
    WaitRequest,
} from '@/types';
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
  
  // User profile state
  userBusId: string | null;
  userPreferredStopId: string | null;
  
  // Location tracking (driver)
  isTracking: boolean;
  currentLocation: Location | null;
  
  // Bus location (passenger view)
  busLocation: Location | null;
  isDriverActive: boolean;
  
  // Trip state
  currentTrip: FirestoreTrip | null;
  currentBus: FirestoreBus | null;
  activeTripId: string | null;
  
  // Wait requests and absences
  waitRequests: WaitRequest[];
  absences: Absence[];
  hasSubmittedWaitRequest: boolean;
  hasMarkedAbsent: boolean;
  
  // Stop status (for driver UI)
  currentStopStatus: StopStatus | null;
  
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
  sendNotification: (type: 'wait' | 'skip' | 'running_late' | 'ready', message?: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  refreshBusLocation: () => void;
  logout: () => Promise<void>;
  
  // Trip actions (driver)
  startTrip: () => Promise<void>;
  endTrip: () => Promise<void>;
  arriveAtStop: (stopId: string) => Promise<void>;
  departFromStop: () => Promise<void>;
  
  // Passenger actions
  submitWaitRequest: () => Promise<void>;
  markAbsent: () => Promise<void>;
  
  // Utility functions
  canSubmitWaitRequest: () => boolean;
  canMarkAbsent: () => boolean;
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
  
  // User profile state
  const [userBusId, setUserBusId] = useState<string | null>(null);
  const [userPreferredStopId, setUserPreferredStopId] = useState<string | null>(null);
  
  // Location state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [busLocation, setBusLocation] = useState<Location | null>(null);
  const [isDriverActive, setIsDriverActive] = useState(false);
  
  // Trip state
  const [currentTrip, setCurrentTrip] = useState<FirestoreTrip | null>(null);
  const [currentBus, setCurrentBus] = useState<FirestoreBus | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  
  // Wait requests and absences
  const [waitRequests, setWaitRequests] = useState<WaitRequest[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [hasSubmittedWaitRequest, setHasSubmittedWaitRequest] = useState(false);
  const [hasMarkedAbsent, setHasMarkedAbsent] = useState(false);
  
  // Current stop status
  const [currentStopStatus, setCurrentStopStatus] = useState<StopStatus | null>(null);
  
  // Passengers at current stop (for driver)
  const [passengersAtCurrentStop, setPassengersAtCurrentStop] = useState<FirestoreService.UserProfile[]>([]);
  
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
            setUserBusId(userProfile.busId || null);
            setUserPreferredStopId(userProfile.preferredStopId || null);
            
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
        setUserBusId(null);
        setUserPreferredStopId(null);
      }
      setIsLoading(false);
    });

    // Load initial data
    setStudents(MockData.getStudents());
    setIsDriverActive(MockData.isDriverTracking());
    setBusLocation(MockData.getBusLocation());

    return unsubscribe;
  }, []);

  // Subscribe to bus data when user has a bus assigned
  useEffect(() => {
    if (!userBusId) return;

    const unsubscribe = FirestoreService.subscribeToBus(userBusId, (bus) => {
      setCurrentBus(bus);
      if (bus?.activeTripId) {
        setActiveTripId(bus.activeTripId);
      } else {
        setActiveTripId(null);
        setCurrentTrip(null);
      }
    });

    return unsubscribe;
  }, [userBusId]);

  // Subscribe to trip data when there's an active trip
  useEffect(() => {
    if (!activeTripId) {
      setCurrentTrip(null);
      setWaitRequests([]);
      setAbsences([]);
      return;
    }

    const unsubTrip = FirestoreService.subscribeToTrip(activeTripId, (trip) => {
      setCurrentTrip(trip);
      setIsDriverActive(trip !== null);
      if (trip?.location) {
        setBusLocation({
          latitude: trip.location.lat,
          longitude: trip.location.lng,
          timestamp: Date.now(),
        });
      }
    });

    const unsubWaitRequests = FirestoreService.subscribeToWaitRequests(activeTripId, (requests) => {
      setWaitRequests(requests);
      // Check if current user has a wait request
      if (userId) {
        setHasSubmittedWaitRequest(requests.some(r => r.passengerId === userId));
      }
    });

    const unsubAbsences = FirestoreService.subscribeToAbsences(activeTripId, (abs) => {
      setAbsences(abs);
      // Check if current user has marked absence
      if (userId) {
        setHasMarkedAbsent(abs.some(a => a.passengerId === userId));
      }
    });

    return () => {
      unsubTrip();
      unsubWaitRequests();
      unsubAbsences();
    };
  }, [activeTripId, userId]);

  // Update stop status when trip state changes (for driver)
  useEffect(() => {
    if (userRole !== 'driver' || !currentTrip || !currentBus) {
      setCurrentStopStatus(null);
      return;
    }

    const updateStopStatus = async () => {
      if (!currentTrip.currentStopId) {
        setCurrentStopStatus(null);
        return;
      }

      // Find the current stop
      const currentStop = currentBus.stops.find(s => s.stopId === currentTrip.currentStopId);
      if (!currentStop) {
        setCurrentStopStatus(null);
        return;
      }

      // Get passengers at the current stop
      try {
        const passengers = await FirestoreService.getPassengersForStop(
          currentBus.busNumber,
          currentTrip.currentStopId
        );
        setPassengersAtCurrentStop(passengers);

        // Compute stop status
        const status = StopColorService.getStopStatus(
          currentTrip.currentStopId,
          currentStop.name,
          currentTrip,
          passengers,
          waitRequests,
          absences
        );
        setCurrentStopStatus(status);
      } catch (error) {
        console.error('Error updating stop status:', error);
      }
    };

    updateStopStatus();
    
    // Update every second for countdown timer
    const interval = setInterval(updateStopStatus, 1000);
    return () => clearInterval(interval);
  }, [userRole, currentTrip, currentBus, waitRequests, absences]);

  // Poll for bus location updates (for passengers)
  useEffect(() => {
    if (userRole === 'passenger') {
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
  const signOutUser = async (): Promise<void> => {
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
        
        // Update trip location if there's an active trip
        if (activeTripId) {
          FirestoreService.updateTripLocation(activeTripId, {
            lat: location.latitude,
            lng: location.longitude,
          }).catch(console.error);
        }
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
    await signOutUser();
  };

  // =====================================================
  // Trip Management Functions (Driver)
  // =====================================================

  /**
   * Start a new trip (driver action)
   */
  const startTrip = async (): Promise<void> => {
    if (!userId || !userBusId || userRole !== 'driver') {
      throw new Error('Only drivers can start trips');
    }

    if (!currentLocation) {
      throw new Error('Location not available');
    }

    try {
      const tripId = FirestoreService.generateTripId(userBusId);
      await FirestoreService.createTrip(
        tripId,
        userBusId,
        userId,
        { lat: currentLocation.latitude, lng: currentLocation.longitude }
      );
      setActiveTripId(tripId);
      console.log('Trip started:', tripId);
    } catch (error) {
      console.error('Error starting trip:', error);
      throw error;
    }
  };

  /**
   * End the current trip (driver action)
   */
  const endTrip = async (): Promise<void> => {
    if (!activeTripId || !userBusId || userRole !== 'driver') {
      throw new Error('No active trip to end');
    }

    try {
      await FirestoreService.updateBusData(userBusId, { activeTripId: null });
      setActiveTripId(null);
      setCurrentTrip(null);
      console.log('Trip ended');
    } catch (error) {
      console.error('Error ending trip:', error);
      throw error;
    }
  };

  /**
   * Arrive at a stop (driver action)
   */
  const arriveAtStopAction = async (stopId: string): Promise<void> => {
    if (!activeTripId || userRole !== 'driver') {
      throw new Error('No active trip or not a driver');
    }

    try {
      await FirestoreService.arriveAtStop(activeTripId, stopId);
      console.log('Arrived at stop:', stopId);
    } catch (error) {
      console.error('Error arriving at stop:', error);
      throw error;
    }
  };

  /**
   * Depart from current stop (driver action)
   */
  const departFromStop = async (): Promise<void> => {
    if (!activeTripId || userRole !== 'driver') {
      throw new Error('No active trip or not a driver');
    }

    try {
      await FirestoreService.departFromStop(activeTripId);
      console.log('Departed from stop');
    } catch (error) {
      console.error('Error departing from stop:', error);
      throw error;
    }
  };

  // =====================================================
  // Passenger Actions
  // =====================================================

  /**
   * Submit a wait request (passenger action)
   */
  const submitWaitRequest = async (): Promise<void> => {
    if (!userId || !activeTripId || !userPreferredStopId || userRole !== 'passenger') {
      throw new Error('Cannot submit wait request');
    }

    if (hasMarkedAbsent) {
      throw new Error('Cannot submit wait request after marking absent');
    }

    try {
      await FirestoreService.createWaitRequest(activeTripId, userId, userPreferredStopId);
      setHasSubmittedWaitRequest(true);
      console.log('Wait request submitted');
    } catch (error) {
      console.error('Error submitting wait request:', error);
      throw error;
    }
  };

  /**
   * Mark as absent for today (passenger action)
   */
  const markAbsentAction = async (): Promise<void> => {
    if (!userId || !activeTripId || !userPreferredStopId || userRole !== 'passenger') {
      throw new Error('Cannot mark absent');
    }

    if (hasMarkedAbsent) {
      throw new Error('Already marked absent');
    }

    try {
      await FirestoreService.markAbsent(activeTripId, userId, userPreferredStopId);
      setHasMarkedAbsent(true);
      console.log('Marked as absent');
    } catch (error) {
      console.error('Error marking absent:', error);
      throw error;
    }
  };

  // =====================================================
  // Utility Functions
  // =====================================================

  /**
   * Check if passenger can submit a wait request
   */
  const canSubmitWaitRequestCheck = (): boolean => {
    if (!currentTrip) return false;
    
    const elapsedSeconds = StopColorService.calculateElapsedSeconds(currentTrip.stopArrivedAt);
    
    return StopColorService.canSubmitWaitRequest(
      userPreferredStopId || undefined,
      currentTrip.currentStopId,
      currentTrip.status,
      elapsedSeconds,
      hasMarkedAbsent,
      hasSubmittedWaitRequest
    );
  };

  /**
   * Check if passenger can mark absent
   */
  const canMarkAbsentCheck = (): boolean => {
    return StopColorService.canMarkAbsent(activeTripId !== null, hasMarkedAbsent);
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
        isLoading,
        userBusId,
        userPreferredStopId,
        isTracking,
        currentLocation,
        busLocation,
        isDriverActive,
        currentTrip,
        currentBus,
        activeTripId,
        waitRequests,
        absences,
        hasSubmittedWaitRequest,
        hasMarkedAbsent,
        currentStopStatus,
        notifications,
        unreadCount,
        students,
        login,
        register,
        signOut: signOutUser,
        setRole,
        startTracking,
        stopTracking,
        sendNotification,
        markNotificationRead,
        clearAllNotifications,
        refreshBusLocation,
        logout,
        startTrip,
        endTrip,
        arriveAtStop: arriveAtStopAction,
        departFromStop,
        submitWaitRequest,
        markAbsent: markAbsentAction,
        canSubmitWaitRequest: canSubmitWaitRequestCheck,
        canMarkAbsent: canMarkAbsentCheck,
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
