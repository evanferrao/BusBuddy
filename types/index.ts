// User roles in the app
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
