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
  lat: number;
  lng: number;
}

// Legacy location structure for backward compatibility
export interface LocationWithTimestamp extends Location {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number | null; // in m/s
  heading?: number | null; // direction in degrees
}

// Stop color states (derived client-side only)
export type StopColorState = 'GREY' | 'RED' | 'YELLOW' | 'GREEN';

// Trip status
export type TripStatus = 'IN_TRANSIT' | 'AT_STOP';

// Stop definition in bus route
export interface Stop {
  stopId: string;
  name: string;
  lat: number;
  lng: number;
  scheduledTime: string; // "HH:MM" format
}

// User profile in Firestore users collection
export interface UserProfile {
  role: 'driver' | 'passenger';
  busId: string;
  preferredStopId?: string; // passengers only
}

// Bus document in Firestore buses collection
export interface Bus {
  busNumber: string;
  driverId: string;
  activeTripId: string | null;
  stops: Stop[];
}

// Trip document in Firestore trips collection
export interface Trip {
  busId: string;
  driverId: string;
  startedAt: any; // Firestore Timestamp
  currentStopId: string | null;
  stopArrivedAt: any | null; // Firestore Timestamp
  status: TripStatus;
  location: Location;
}

// Wait request in trips/{tripId}/waitRequests subcollection
export interface WaitRequest {
  passengerId: string;
  stopId: string;
  requestedAt: any; // Firestore Timestamp
}

// Absence in trips/{tripId}/absences subcollection
export interface Absence {
  passengerId: string;
  stopId: string;
  markedAt: any; // Firestore Timestamp
}

// Derived stop status for UI (computed client-side)
export interface StopStatus {
  stopId: string;
  name: string;
  color: StopColorState;
  waitRequestCount: number;
  allPassengersAbsent: boolean;
  elapsedSeconds: number | null;
  totalPassengers: number;
  absentCount: number;
}

// Legacy types for backward compatibility
export type StudentStatus = 'waiting' | 'boarding' | 'skipping' | 'onboard' | 'unknown';
export type NotificationType = 'wait' | 'skip' | 'running_late' | 'ready';

export interface Student {
  id: string;
  name: string;
  stopName: string;
  stopLocation: LocationWithTimestamp;
  phoneNumber?: string;
  status: StudentStatus;
  notificationMessage?: string;
  lastNotificationTime?: number;
}

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

// App state stored locally
export interface AppState {
  userRole: UserRole;
  userId: string | null;
  userName: string | null;
  busRouteId: string | null;
  onboardingComplete: boolean;
}
