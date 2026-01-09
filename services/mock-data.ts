/**
 * Mock Data Service
 * 
 * This service simulates backend functionality for the Bus Buddy app.
 * In production, this would be replaced with actual Firestore operations.
 * 
 * Data model follows the specification:
 * - routes collection with stops array
 * - trips collection for live state
 * - waitRequests and absences subcollections
 */

import {
  BusRoute,
  BusStop,
  Driver,
  Location,
  NotificationType,
  Route,
  RouteStop,
  Student,
  StudentNotification,
} from '@/types';

// Mock students data (with stopId added per spec)
const mockStudents: Student[] = [
  {
    id: 'student-1',
    name: 'Rahul Sharma',
    busNo: '1',
    stopName: 'Ganesh Nagar',
    stopId: 'stop_1',
    stopLocation: { latitude: 26.9124, longitude: 75.7873, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'student-2',
    name: 'Priya Patel',
    busNo: '1',
    stopName: 'Shanti Colony',
    stopId: 'stop_2',
    stopLocation: { latitude: 26.9134, longitude: 75.7893, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'student-3',
    name: 'Amit Kumar',
    busNo: '1',
    stopName: 'Ram Nagar',
    stopId: 'stop_3',
    stopLocation: { latitude: 26.9144, longitude: 75.7913, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'student-4',
    name: 'Sneha Gupta',
    busNo: '1',
    stopName: 'Nehru Park',
    stopId: 'stop_4',
    stopLocation: { latitude: 26.9154, longitude: 75.7933, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'student-5',
    name: 'Vikram Singh',
    busNo: '1',
    stopName: 'Station Road',
    stopId: 'stop_5',
    stopLocation: { latitude: 26.9164, longitude: 75.7953, timestamp: Date.now() },
    status: 'waiting',
  },
];

// Mock bus stops (legacy format for backward compatibility - no student lists stored)
const mockStops: BusStop[] = [
  {
    id: 'stop_1',
    name: 'Ganesh Nagar',
    location: { latitude: 26.9124, longitude: 75.7873, timestamp: Date.now() },
    order: 1,
    scheduledTime: '07:30',
  },
  {
    id: 'stop_2',
    name: 'Shanti Colony',
    location: { latitude: 26.9134, longitude: 75.7893, timestamp: Date.now() },
    order: 2,
    scheduledTime: '07:35',
  },
  {
    id: 'stop_3',
    name: 'Ram Nagar',
    location: { latitude: 26.9144, longitude: 75.7913, timestamp: Date.now() },
    order: 3,
    scheduledTime: '07:40',
  },
  {
    id: 'stop_4',
    name: 'Nehru Park',
    location: { latitude: 26.9154, longitude: 75.7933, timestamp: Date.now() },
    order: 4,
    scheduledTime: '07:45',
  },
  {
    id: 'stop_5',
    name: 'Station Road',
    location: { latitude: 26.9164, longitude: 75.7953, timestamp: Date.now() },
    order: 5,
    scheduledTime: '07:50',
  },
];

// Mock route (per Firestore spec: routes/{routeId})
const mockRouteDefinition: Route = {
  routeId: 'route_1',
  busNo: '1',
  stops: mockStops.map<RouteStop>((stop) => ({
    stopId: stop.id,
    name: stop.name,
    time: stop.scheduledTime || '07:30',
    scheduledTime: stop.scheduledTime || '07:30',
    lat: stop.location.latitude,
    lng: stop.location.longitude,
  })),
};

// Mock driver
const mockDriver: Driver = {
  id: 'driver-1',
  name: 'Ramesh Ji',
  busNumber: 'RJ-14-SB-1234',
  phoneNumber: '+91-9876543210',
  isActive: false,
};

// Mock bus route (legacy format)
const mockRoute: BusRoute = {
  id: 'route-1',
  name: 'Morning Route - Village Road',
  driverId: 'driver-1',
  stops: mockStops,
  isActive: false,
};

// In-memory store for notifications (simulates real-time updates)
let notifications: StudentNotification[] = [];
let currentBusLocation: Location | null = null;
let isDriverActive = false;

/**
 * Get all students on a route
 */
export function getStudents(): Student[] {
  return [...mockStudents];
}

/**
 * Get a specific student by ID
 */
export function getStudentById(id: string): Student | undefined {
  return mockStudents.find(s => s.id === id);
}

/**
 * Get the bus route
 */
export function getBusRoute(): BusRoute {
  return { ...mockRoute, isActive: isDriverActive };
}

/**
 * Get the driver info
 */
export function getDriver(): Driver {
  return { ...mockDriver, isActive: isDriverActive };
}

/**
 * Get all bus stops
 */
export function getBusStops(): BusStop[] {
  return [...mockStops];
}

/**
 * Get the mock route (per Firestore spec)
 */
export function getMockRoute(): Route {
  return { ...mockRouteDefinition };
}

/**
 * Get stop definition by ID
 */
export function getStopById(stopId: string): RouteStop | undefined {
  return mockRouteDefinition.stops.find((s) => s.stopId === stopId);
}

/**
 * Send a notification from student to driver
 */
export function sendStudentNotification(
  studentId: string,
  type: NotificationType,
  message?: string
): StudentNotification {
  const student = getStudentById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  const notification: StudentNotification = {
    id: `notif-${Date.now()}`,
    studentId,
    studentName: student.name,
    stopId: student.stopId,
    stopName: student.stopName,
    type,
    message,
    timestamp: Date.now(),
    isRead: false,
  };

  notifications.unshift(notification);
  
  // Update student status based on notification type (per spec: wait or skip only)
  const studentIndex = mockStudents.findIndex(s => s.id === studentId);
  if (studentIndex !== -1) {
    if (type === 'skip') {
      mockStudents[studentIndex].status = 'skipping';
    } else if (type === 'wait') {
      mockStudents[studentIndex].status = 'waiting';
    }
    mockStudents[studentIndex].notificationMessage = message;
    mockStudents[studentIndex].lastNotificationTime = Date.now();
  }

  return notification;
}

/**
 * Get all notifications for driver
 */
export function getNotifications(): StudentNotification[] {
  return [...notifications];
}

/**
 * Mark notification as read
 */
export function markNotificationRead(notificationId: string): void {
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    notifications[index].isRead = true;
  }
}

/**
 * Clear all notifications
 */
export function clearNotifications(): void {
  notifications = [];
}

/**
 * Update bus location (called by driver)
 */
export function updateBusLocation(location: Location): void {
  currentBusLocation = location;
}

/**
 * Get current bus location (called by students)
 */
export function getBusLocation(): Location | null {
  return currentBusLocation;
}

/**
 * Set driver active status
 */
export function setDriverActive(active: boolean): void {
  isDriverActive = active;
  mockDriver.isActive = active;
  mockRoute.isActive = active;
  
  if (!active) {
    currentBusLocation = null;
  }
}

/**
 * Check if driver is currently active/tracking
 */
export function isDriverTracking(): boolean {
  return isDriverActive;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get estimated time of arrival based on distance and average speed
 * Returns ETA in minutes
 */
export function getEstimatedArrival(
  busLocation: Location,
  stopLocation: Location,
  averageSpeedKmh: number = 30
): number {
  const distance = calculateDistance(
    busLocation.latitude,
    busLocation.longitude,
    stopLocation.latitude,
    stopLocation.longitude
  );
  
  // Convert to km and calculate time
  const distanceKm = distance / 1000;
  const timeHours = distanceKm / averageSpeedKmh;
  const timeMinutes = timeHours * 60;
  
  return Math.round(timeMinutes);
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Format ETA for display
 */
export function formatETA(minutes: number): string {
  if (minutes < 1) {
    return 'Arriving now';
  }
  if (minutes === 1) {
    return '1 minute';
  }
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
