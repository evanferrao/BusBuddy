// User roles in the app
export type UserRole = 'driver' | 'passenger' | null;

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUserData | null;
}

// Authenticated user data
export interface AuthUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

// Location data structure
export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number | null; // in m/s
  heading?: number | null; // direction in degrees
}

// =====================================================
// Firestore Data Model Types (from specification)
// =====================================================

/**
 * User profile stored in Firestore users/{uid}
 */
export interface FirestoreUser {
  role: 'driver' | 'passenger';
  busId: string;
  preferredStopId?: string; // passengers only
}

/**
 * Bus stop definition (static route data)
 */
export interface FirestoreStop {
  stopId: string;
  name: string;
  lat: number;
  lng: number;
  scheduledTime: string; // e.g. "07:45"
}

/**
 * Bus document stored in Firestore buses/{busId}
 */
export interface FirestoreBus {
  busNumber: string;
  driverId: string;
  activeTripId: string | null;
  stops: FirestoreStop[];
}

/**
 * Trip status enum
 */
export type TripStatus = 'IN_TRANSIT' | 'AT_STOP';

/**
 * Trip location
 */
export interface TripLocation {
  lat: number;
  lng: number;
}

/**
 * Trip document stored in Firestore trips/{tripId}
 * This is the single source of truth for real-time state
 */
export interface FirestoreTrip {
  busId: string;
  driverId: string;
  startedAt: number; // Timestamp in milliseconds
  currentStopId: string | null;
  stopArrivedAt: number | null; // Timestamp in milliseconds
  status: TripStatus;
  location: TripLocation;
}

/**
 * Wait request stored in trips/{tripId}/waitRequests/{uid}
 */
export interface WaitRequest {
  passengerId: string;
  stopId: string;
  requestedAt: number; // Timestamp in milliseconds
}

/**
 * Absence record stored in trips/{tripId}/absences/{uid}
 */
export interface Absence {
  passengerId: string;
  stopId: string;
  markedAt: number; // Timestamp in milliseconds
}

/**
 * Stop color state derived on client-side
 * No colors are stored in the database
 */
export type StopColor = 'GREY' | 'RED' | 'YELLOW' | 'GREEN';

/**
 * Stop status for display in driver UI
 */
export interface StopStatus {
  stopId: string;
  name: string;
  color: StopColor;
  elapsedSeconds: number;
  waitRequestCount: number;
  allPassengersAbsent: boolean;
  totalPassengers: number;
  absentCount: number;
}

// Student status for a given trip
export type StudentStatus = 'waiting' | 'boarding' | 'skipping' | 'onboard' | 'unknown';

// Notification types students can send
export type NotificationType = 'wait' | 'skip' | 'running_late' | 'ready';

// Student information
export interface Student {
  id: string;
  name: string;
  stopName: string;
  stopLocation: Location;
  phoneNumber?: string;
  status: StudentStatus;
  notificationMessage?: string;
  lastNotificationTime?: number;
}

// Bus stop information
export interface BusStop {
  id: string;
  name: string;
  location: Location;
  estimatedArrival?: number; // timestamp
  students: string[]; // student IDs
  order: number; // order in route
}

// Driver information
export interface Driver {
  id: string;
  name: string;
  phoneNumber?: string;
  busNumber: string;
  isActive: boolean;
}

// Bus route information
export interface BusRoute {
  id: string;
  name: string;
  driverId: string;
  stops: BusStop[];
  isActive: boolean;
}

// Student notification to driver
export interface StudentNotification {
  id: string;
  studentId: string;
  studentName: string;
  stopName: string;
  type: NotificationType;
  message?: string;
  timestamp: number;
  isRead: boolean;
}

// Driver broadcast to students
export interface DriverBroadcast {
  id: string;
  driverId: string;
  message: string;
  timestamp: number;
}

// App state stored locally
export interface AppState {
  userRole: UserRole;
  userId: string | null;
  userName: string | null;
  busRouteId: string | null;
  onboardingComplete: boolean;
}

// Bus tracking state (shared between driver and students)
export interface BusTrackingState {
  currentLocation: Location | null;
  isTracking: boolean;
  routeId: string | null;
  currentStopIndex: number;
  notifications: StudentNotification[];
  lastUpdate: number;
}
