// User roles in the app - stored as 'passenger' in Firestore
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

// ============================================
// FIRESTORE DATA MODEL (Per Specification)
// ============================================

// User profile stored in Firestore users/{uid}
export interface UserProfile {
  uid: string;
  email: string;
  name: string;                       // User's display name
  role: UserRole;
  busId: string;                      // Bus ID assigned to user (e.g., "bus_1")
  preferredStopId?: string;           // Passengers only - their pickup stop
  createdAt: number;
  updatedAt: number;
}

// Stop definition within a route
export interface RouteStop {
  stopId: string;
  name: string;
  time: string;                       // Scheduled time e.g., "09:30"
  lat: number;
  lng: number;
}

// Route document stored in Firestore routes/{routeId}
export interface Route {
  routeId: string;
  busId: string;                      // e.g., "bus_1"
  routeName: string;                  // e.g., "Bus 1 – Dadar to Juhu"
  stops: RouteStop[];                 // Static route definition
  active: boolean;                    // Whether route is active
  createdAt: number;
  updatedAt: number;
}

// Trip status
export type TripStatus = 'IN_TRANSIT' | 'AT_STOP';

// Trip document stored in Firestore trips/{tripId}
export interface Trip {
  tripId: string;
  busId: string;
  routeId: string;                    // Reference to /routes/{routeId}
  driverId: string;
  startedAt: number;                  // Timestamp
  endedAt?: number | null;            // Timestamp when trip ended
  currentStopId: string | null;       // Current stop ID
  stopArrivedAt: number | null;       // Timestamp when arrived at current stop
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
  requestedAt: number;                // Timestamp
}

// Absence stored in trips/{tripId}/absences/{uid}
export interface Absence {
  passengerId: string;
  stopId: string;
  markedAt: number;                   // Timestamp
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

// Passenger notification to driver (for UI display)
export interface PassengerNotification {
  id: string;
  passengerId: string;
  passengerName: string;
  stopId: string;
  stopName: string;
  type: NotificationType;
  message?: string;
  timestamp: number;
  isRead: boolean;
}

// ============================================
// PASSENGER TYPES
// ============================================

// Passenger status for a given trip
export type PassengerStatus = 'waiting' | 'boarding' | 'skipping' | 'onboard' | 'unknown';

// Passenger information
export interface Passenger {
  id: string;
  name: string;
  stopName: string;
  stopId: string;
  stopLocation: Location;
  phoneNumber?: string;
  status: PassengerStatus;
  notificationMessage?: string;
  lastNotificationTime?: number;
}

// Bus stop information
export interface BusStop {
  id: string;
  name: string;
  location: Location;
  estimatedArrival?: number; // timestamp
  passengers: string[]; // passenger IDs
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

// Driver broadcast to passengers
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
  busId: string | null;
  preferredStopId: string | null;
  onboardingComplete: boolean;
}

// Bus tracking state (shared between driver and passengers)
export interface BusTrackingState {
  currentLocation: Location | null;
  isTracking: boolean;
  tripId: string | null;
  currentStopId: string | null;
  notifications: PassengerNotification[];
  lastUpdate: number;
}
