// User roles in the app - 'passenger' is the user-facing term for 'student'
export type UserRole = 'driver' | 'student' | null;

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

// ============================================
// FIRESTORE DATA MODEL (Per Specification)
// ============================================

// User profile stored in Firestore users/{uid}
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  busNo: string;                    // Bus assignment for the user
  preferredStopId?: string;         // Passengers only - their pickup stop
  routeId?: string;                 // Optional route reference
  createdAt: number;
  updatedAt: number;
}

// Bus stop definition (static, stored in routes collection)
export interface RouteStop {
  stopId: string;
  name: string;
  time: string;                     // e.g., "09:30"
  scheduledTime?: string;           // Legacy alias for time
  lat: number;
  lng: number;
}

// Route document stored in Firestore routes/{routeId}
export interface Route {
  routeId: string;
  busNo: string;
  stops: RouteStop[];               // Static route definition
}

// Backward compatibility aliases
export type BusStopDefinition = RouteStop;
export type Bus = Route;

// Trip status
export type TripStatus = 'IN_TRANSIT' | 'AT_STOP';

// Trip document stored in Firestore trips/{tripId}
export interface Trip {
  tripId: string;
  busNo: string;
  routeId?: string;
  driverId: string;
  startedAt: number;                // Timestamp
  endedAt?: number;                 // Timestamp when trip ended
  currentStopId: string | null;     // Current stop ID
  stopArrivedAt: number | null;     // Timestamp when arrived at current stop
  status: TripStatus;
  location: {
    lat: number;
    lng: number;
  };
}

// Wait request stored in trips/{tripId}/waitRequests/{uid}
export interface WaitRequest {
  passengerId: string;
  stopId: string;
  requestedAt: number;              // Timestamp
}

// Absence stored in trips/{tripId}/absences/{uid}
export interface Absence {
  passengerId: string;
  stopId: string;
  markedAt: number;                 // Timestamp
}

// ============================================
// STOP COLOR LOGIC (Derived Client-Side)
// ============================================

// Stop colors - derived on client, NEVER stored in database
export type StopColor = 'GREY' | 'RED' | 'YELLOW' | 'GREEN';

// Stop state for driver UI (computed client-side)
export interface StopState {
  stopId: string;
  name: string;
  color: StopColor;
  elapsedSeconds: number;           // Time since arrival
  waitRequestCount: number;         // Number of wait requests
  totalPassengers: number;          // Total passengers at stop
  absentCount: number;              // Number marked absent
  allAbsent: boolean;               // True if all passengers absent
}

// ============================================
// NOTIFICATION TYPES
// ============================================

// Notification types passengers can send (simplified per spec)
export type NotificationType = 'wait' | 'skip';

// Student notification to driver (for UI display)
export interface StudentNotification {
  id: string;
  studentId: string;
  studentName: string;
  stopId: string;
  stopName: string;
  type: NotificationType;
  message?: string;
  timestamp: number;
  isRead: boolean;
}

// ============================================
// LEGACY TYPES (For backward compatibility)
// ============================================

// Student status for a given trip
export type StudentStatus = 'waiting' | 'boarding' | 'skipping' | 'onboard' | 'unknown';

// Student information (legacy - for mock data compatibility)
export interface Student {
  id: string;
  name: string;
  busNo?: string;
  stopName: string;
  stopId: string;
  stopLocation: Location;
  phoneNumber?: string;
  status: StudentStatus;
  notificationMessage?: string;
  lastNotificationTime?: number;
}

// Bus stop information (legacy - for mock data compatibility)
export interface BusStop {
  id: string;
  name: string;
  location: Location;
  estimatedArrival?: number; // timestamp
  students?: string[]; // student IDs (legacy, counts are derived from users)
  order: number; // order in route
  scheduledTime?: string;
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
  busNo: string | null;
  routeId: string | null;
  preferredStopId: string | null;
  onboardingComplete: boolean;
}

// Bus tracking state (shared between driver and students)
export interface BusTrackingState {
  currentLocation: Location | null;
  isTracking: boolean;
  tripId: string | null;
  currentStopId: string | null;
  notifications: StudentNotification[];
  lastUpdate: number;
}
