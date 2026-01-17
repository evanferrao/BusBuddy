/**
 * Context Types
 * 
 * Shared types for context providers and hooks.
 */

import { AuthUserData, Location, NotificationType, Passenger, PassengerNotification, RouteStop, StopState, Trip, UserRole } from '@/types';

// ============================================
// AUTH CONTEXT TYPES
// ============================================

export interface AuthContextType {
  isAuthenticated: boolean;
  authUser: AuthUserData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ============================================
// USER CONTEXT TYPES
// ============================================

export interface UserContextType {
  userRole: UserRole;
  userName: string | null;
  userId: string | null;
  busId: string | null;
  preferredStopId: string | null;
  setRole: (role: UserRole, name: string) => Promise<void>;
}

// ============================================
// TRIP CONTEXT TYPES
// ============================================

export interface TripContextType {
  activeTrip: Trip | null;
  currentStopState: StopState | null;
  routeStops: RouteStop[];
  currentStopIndex: number;
  isTracking: boolean;
  currentLocation: Location | null;
  busLocation: Location | null;
  isDriverActive: boolean;
  hasBusDeparted: boolean;
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  arriveAtStop: (stopId: string) => Promise<void>;
  departFromStop: () => Promise<void>;
  refreshBusLocation: () => void;
}

// ============================================
// NOTIFICATIONS CONTEXT TYPES
// ============================================

export interface NotificationsContextType {
  notifications: PassengerNotification[];
  unreadCount: number;
  hasMarkedAbsence: boolean;
  hasSentWaitRequest: boolean;
  sendNotification: (type: NotificationType, message?: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
}

// ============================================
// PASSENGERS CONTEXT TYPES
// ============================================

export interface PassengersContextType {
  passengers: Passenger[];
}

// ============================================
// COMBINED APP CONTEXT TYPE
// ============================================

export interface AppContextType extends 
  AuthContextType, 
  UserContextType, 
  TripContextType, 
  NotificationsContextType, 
  PassengersContextType {
  logout: () => Promise<void>;
}
