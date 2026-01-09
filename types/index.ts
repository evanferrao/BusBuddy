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
//
// Architecture Overview:
// 1. routes/{routeId} (alias: buses/{busId}) - Static route data with stops
// 2. users/{uid} - User profiles with role and bus assignment
// 3. trips/{tripId} - Live trip state
// 4. trips/{tripId}/waitRequests/{uid} - Wait request documents
// 5. trips/{tripId}/absences/{uid} - Absence documents
//
// Key Principles:
// - Store only atomic facts (never computed summaries)
// - All totals, yes/no states, and colors are derived client-side
// - Wait requests and absences are trip-scoped
// ============================================

// User profile stored in Firestore users/{uid}
// Per spec: Individual passenger assignment replaces "names of kids per stop"
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  busId: string;                    // Bus assigned to user (maps to Bus.busId)
  preferredStopId?: string;         // Passengers only - their pickup stop
  createdAt: number;
  updatedAt: number;
}

// Bus stop definition (static, stored in routes/buses collection)
// Per spec: Part of the static route data loaded once
export interface BusStopDefinition {
  stopId: string;
  name: string;
  lat: number;
  lng: number;
  scheduledTime: string;            // e.g., "07:45"
}

// Route document stored in Firestore routes/{routeId}
// Per spec: This is the "Main Table" equivalent with static stop definitions
// Note: In current implementation, we use "buses" collection which serves the same purpose
export interface Route {
  routeId: string;
  busNo: string;                    // Bus number for display
  stops: BusStopDefinition[];       // Ordered list of stops with times and locations
}

// Bus document stored in Firestore buses/{busId}
// This extends the Route concept with operational data (driver, active trip)
export interface Bus {
  busId: string;
  busNumber: string;                // e.g., "MH-01-1234"
  driverId: string;                 // UID of assigned driver
  activeTripId: string | null;      // Current trip ID if active
  stops: BusStopDefinition[];       // Static route definition
}

// Trip status
export type TripStatus = 'IN_TRANSIT' | 'AT_STOP';

// Trip document stored in Firestore trips/{tripId}
// Per spec: Live data that changes during a trip
// tripId format: trip_{busId}_{YYYY_MM_DD}
export interface Trip {
  tripId: string;
  busId: string;
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
// Per spec: Atomic fact - "This kid pressed wait"
// Document ID is the passenger's UID to prevent duplicates
export interface WaitRequest {
  passengerId: string;
  stopId: string;
  requestedAt: number;              // Timestamp
}

// Absence stored in trips/{tripId}/absences/{uid}
// Per spec: Atomic fact - "This kid marked absent"
// Document ID is the passenger's UID to prevent duplicates
// Once created, cannot be modified (absence is final for the trip)
export interface Absence {
  passengerId: string;
  stopId: string;
  markedAt: number;                 // Timestamp
}

// ============================================
// STOP COLOR LOGIC (Derived Client-Side)
// ============================================
//
// Per spec: Colors are NEVER stored in the database.
// They are computed client-side from timestamps and counts.
//
// Computation Priority Order:
// 1. GREY – all passengers at stop are absent → can skip
// 2. RED – standard waiting window (0-5 min)
// 3. YELLOW – extended wait due to requests (5-7 min with wait requests)
// 4. GREEN – in transit or stop passed
//
// Time Windows (in seconds):
// - RED_DURATION: 300 (5 minutes)
// - YELLOW_DURATION: 420 (7 minutes, only if wait requests exist)
// ============================================

// Stop colors - derived on client, NEVER stored in database
export type StopColor = 'GREY' | 'RED' | 'YELLOW' | 'GREEN';

// Stop state for driver UI (computed client-side)
// Combines static stop info with dynamic trip state
export interface StopState {
  stopId: string;
  name: string;
  color: StopColor;                 // Computed from timestamps + counts
  elapsedSeconds: number;           // Time since arrival at this stop
  waitRequestCount: number;         // COUNT(waitRequests where stopId == this)
  totalPassengers: number;          // COUNT(users where preferredStopId == this)
  absentCount: number;              // COUNT(absences where stopId == this)
  allAbsent: boolean;               // True if absentCount == totalPassengers
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
  students: string[]; // student IDs
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
  busId: string | null;
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
