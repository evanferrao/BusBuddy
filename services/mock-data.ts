/**
 * Mock Data Service
 * 
 * This service simulates backend functionality for the Bus Buddy app.
 * In production, this would be replaced with actual API calls to a backend server.
 * 
 * For a real implementation, you would use:
 * - Firebase Realtime Database or Firestore for real-time data sync
 * - Socket.io or similar for real-time location updates
 * - Push notifications for alerts
 */

import {
    BusRoute,
    BusStop,
    Driver,
    Location,
    NotificationType,
    Student,
    StudentNotification,
} from '@/types';

// Mock students data
const mockStudents: Student[] = [
  {
    id: 'student-1',
    name: 'Rahul Sharma',
    stopName: 'Ganesh Nagar',
    stopLocation: { latitude: 26.9124, longitude: 75.7873, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'student-2',
    name: 'Priya Patel',
    stopName: 'Shanti Colony',
    stopLocation: { latitude: 26.9134, longitude: 75.7893, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'student-3',
    name: 'Amit Kumar',
    stopName: 'Ram Nagar',
    stopLocation: { latitude: 26.9144, longitude: 75.7913, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'student-4',
    name: 'Sneha Gupta',
    stopName: 'Nehru Park',
    stopLocation: { latitude: 26.9154, longitude: 75.7933, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'student-5',
    name: 'Vikram Singh',
    stopName: 'Station Road',
    stopLocation: { latitude: 26.9164, longitude: 75.7953, timestamp: Date.now() },
    status: 'waiting',
  },
];

// Mock bus stops
const mockStops: BusStop[] = [
  {
    id: 'stop-1',
    name: 'Ganesh Nagar',
    location: { latitude: 26.9124, longitude: 75.7873, timestamp: Date.now() },
    students: ['student-1'],
    order: 1,
  },
  {
    id: 'stop-2',
    name: 'Shanti Colony',
    location: { latitude: 26.9134, longitude: 75.7893, timestamp: Date.now() },
    students: ['student-2'],
    order: 2,
  },
  {
    id: 'stop-3',
    name: 'Ram Nagar',
    location: { latitude: 26.9144, longitude: 75.7913, timestamp: Date.now() },
    students: ['student-3'],
    order: 3,
  },
  {
    id: 'stop-4',
    name: 'Nehru Park',
    location: { latitude: 26.9154, longitude: 75.7933, timestamp: Date.now() },
    students: ['student-4'],
    order: 4,
  },
  {
    id: 'stop-5',
    name: 'Station Road',
    location: { latitude: 26.9164, longitude: 75.7953, timestamp: Date.now() },
    students: ['student-5'],
    order: 5,
  },
];

// Mock driver
const mockDriver: Driver = {
  id: 'driver-1',
  name: 'Ramesh Ji',
  busNumber: 'RJ-14-SB-1234',
  phoneNumber: '+91-9876543210',
  isActive: false,
};

// Mock bus route
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
    stopName: student.stopName,
    type,
    message,
    timestamp: Date.now(),
    isRead: false,
  };

  notifications.unshift(notification);
  
  // Update student status based on notification type
  const studentIndex = mockStudents.findIndex(s => s.id === studentId);
  if (studentIndex !== -1) {
    if (type === 'skip') {
      mockStudents[studentIndex].status = 'skipping';
    } else if (type === 'ready') {
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
