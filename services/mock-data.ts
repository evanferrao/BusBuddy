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
  ActionResult,
  Absence,
  BusRoute,
  BusStop,
  Driver,
  Location,
  NotificationType,
  StopStatus,
  Student,
  StudentNotification,
  TripState,
  WaitRequest,
} from '@/types';

const BUS_ID = 'bus_1';
const DRIVER_ID = 'driver-1';

// Mock students data
const mockStudents: Student[] = [
  {
    id: 'student-1',
    name: 'Rahul Sharma',
    stopName: 'Ganesh Nagar',
    stopLocation: { latitude: 26.9124, longitude: 75.7873, timestamp: Date.now() },
    status: 'waiting',
    busId: BUS_ID,
    preferredStopId: 'stop-1',
  },
  {
    id: 'student-2',
    name: 'Priya Patel',
    stopName: 'Shanti Colony',
    stopLocation: { latitude: 26.9134, longitude: 75.7893, timestamp: Date.now() },
    status: 'waiting',
    busId: BUS_ID,
    preferredStopId: 'stop-2',
  },
  {
    id: 'student-3',
    name: 'Amit Kumar',
    stopName: 'Ram Nagar',
    stopLocation: { latitude: 26.9144, longitude: 75.7913, timestamp: Date.now() },
    status: 'waiting',
    busId: BUS_ID,
    preferredStopId: 'stop-3',
  },
  {
    id: 'student-4',
    name: 'Sneha Gupta',
    stopName: 'Nehru Park',
    stopLocation: { latitude: 26.9154, longitude: 75.7933, timestamp: Date.now() },
    status: 'waiting',
    busId: BUS_ID,
    preferredStopId: 'stop-4',
  },
  {
    id: 'student-5',
    name: 'Vikram Singh',
    stopName: 'Station Road',
    stopLocation: { latitude: 26.9164, longitude: 75.7953, timestamp: Date.now() },
    status: 'waiting',
    busId: BUS_ID,
    preferredStopId: 'stop-5',
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
    scheduledTime: '07:40',
  },
  {
    id: 'stop-2',
    name: 'Shanti Colony',
    location: { latitude: 26.9134, longitude: 75.7893, timestamp: Date.now() },
    students: ['student-2'],
    order: 2,
    scheduledTime: '07:45',
  },
  {
    id: 'stop-3',
    name: 'Ram Nagar',
    location: { latitude: 26.9144, longitude: 75.7913, timestamp: Date.now() },
    students: ['student-3'],
    order: 3,
    scheduledTime: '07:50',
  },
  {
    id: 'stop-4',
    name: 'Nehru Park',
    location: { latitude: 26.9154, longitude: 75.7933, timestamp: Date.now() },
    students: ['student-4'],
    order: 4,
    scheduledTime: '07:55',
  },
  {
    id: 'stop-5',
    name: 'Station Road',
    location: { latitude: 26.9164, longitude: 75.7953, timestamp: Date.now() },
    students: ['student-5'],
    order: 5,
    scheduledTime: '08:00',
  },
];

// Mock driver
const mockDriver: Driver = {
  id: DRIVER_ID,
  name: 'Ramesh Ji',
  busNumber: 'RJ-14-SB-1234',
  phoneNumber: '+91-9876543210',
  isActive: false,
};

// Mock bus route
const mockRoute: BusRoute = {
  id: 'route-1',
  name: 'Morning Route - Village Road',
  driverId: DRIVER_ID,
  stops: mockStops,
  isActive: false,
};

const buildTripId = (timestamp: number = Date.now()) => {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `trip_${yyyy}_${mm}_${dd}`;
};

const createTrip = (): TripState => {
  const now = Date.now();
  const firstStop = mockStops[0];
  return {
    id: buildTripId(now),
    busId: BUS_ID,
    driverId: DRIVER_ID,
    startedAt: now,
    currentStopId: firstStop.id,
    stopArrivedAt: now,
    status: 'AT_STOP',
    location: {
      lat: firstStop.location.latitude,
      lng: firstStop.location.longitude,
    },
  };
};

// In-memory store for notifications (simulates real-time updates)
let notifications: StudentNotification[] = [];
let currentBusLocation: Location | null = null;
let isDriverActive = false;
let activeTrip: TripState = createTrip();
let waitRequests: Record<string, WaitRequest> = {};
let absences: Record<string, Absence> = {};

const ensureTripForToday = () => {
  const todayTripId = buildTripId();
  if (activeTrip.id !== todayTripId) {
    activeTrip = createTrip();
    waitRequests = {};
    absences = {};
  }
};

export function getStopById(stopId: string): BusStop | undefined {
  return mockStops.find((stop) => stop.id === stopId);
}

export function ensurePassengerProfile(passengerId: string, displayName?: string): Student {
  const existing = mockStudents.find((student) => student.id === passengerId);
  if (existing) {
    return existing;
  }

  const defaultStop = mockStops[0];
  const newStudent: Student = {
    id: passengerId,
    name: displayName || `Passenger ${passengerId}`,
    stopName: defaultStop.name,
    stopLocation: defaultStop.location,
    status: 'waiting',
    busId: BUS_ID,
    preferredStopId: defaultStop.id,
  };
  mockStudents.push(newStudent);
  return newStudent;
}

export function getPassengersForStop(stopId: string): Student[] {
  return mockStudents.filter(
    (student) => student.busId === BUS_ID && student.preferredStopId === stopId
  );
}

export function getWaitRequestsForStop(stopId: string): WaitRequest[] {
  return Object.values(waitRequests).filter((request) => request.stopId === stopId);
}

export function getAbsencesForStop(stopId: string): Absence[] {
  return Object.values(absences).filter((absence) => absence.stopId === stopId);
}

const computeStopStatus = (stopId: string, now: number = Date.now()): StopStatus => {
  ensureTripForToday();
  const stop = getStopById(stopId);
  const passengers = getPassengersForStop(stopId);
  const absenceList = getAbsencesForStop(stopId);
  const waiters = getWaitRequestsForStop(stopId);
  const allPassengersAbsent = passengers.length > 0 && absenceList.length === passengers.length;

  const isCurrentStop = activeTrip.currentStopId === stopId && activeTrip.status === 'AT_STOP';
  const elapsedSeconds = isCurrentStop ? Math.floor((now - activeTrip.stopArrivedAt) / 1000) : 0;

  let color: StopStatus['color'] = 'GREEN';
  let windowRemainingSeconds: number | null = null;

  if (isCurrentStop) {
    if (allPassengersAbsent) {
      color = 'GREY';
    } else if (elapsedSeconds <= 300) {
      color = 'RED';
      windowRemainingSeconds = Math.max(0, 300 - elapsedSeconds);
    } else if (waiters.length > 0 && elapsedSeconds <= 420) {
      color = 'YELLOW';
      windowRemainingSeconds = Math.max(0, 420 - elapsedSeconds);
    } else {
      color = 'GREEN';
    }
  }

  return {
    stopId,
    name: stop?.name || stopId,
    color,
    waitRequestCount: waiters.length,
    allPassengersAbsent,
    elapsedSeconds,
    windowRemainingSeconds,
  };
};

export function getStopStatuses(now: number = Date.now()): StopStatus[] {
  ensureTripForToday();
  return mockStops.map((stop) => computeStopStatus(stop.id, now));
}

export function getCurrentStopStatus(now: number = Date.now()): StopStatus {
  ensureTripForToday();
  return computeStopStatus(activeTrip.currentStopId, now);
}

export function getActiveTrip(): TripState {
  ensureTripForToday();
  return { ...activeTrip };
}

export function canPassengerRequestWait(passengerId: string): ActionResult {
  ensureTripForToday();
  const passenger = mockStudents.find((student) => student.id === passengerId);
  if (!passenger) {
    return { success: false, reason: 'Passenger not found' };
  }
  if (absences[passengerId]) {
    return { success: false, reason: 'Marked absent for this trip' };
  }
  if (passenger.preferredStopId !== activeTrip.currentStopId) {
    return { success: false, reason: 'Bus is not at your stop' };
  }
  if (activeTrip.status !== 'AT_STOP') {
    return { success: false, reason: 'Bus is not stopped' };
  }
  const elapsedSeconds = Math.floor((Date.now() - activeTrip.stopArrivedAt) / 1000);
  if (elapsedSeconds > 420) {
    return { success: false, reason: 'Waiting window closed' };
  }
  return { success: true };
}

export function createWaitRequest(passengerId: string): ActionResult {
  ensureTripForToday();
  const eligibility = canPassengerRequestWait(passengerId);
  if (!eligibility.success) {
    return eligibility;
  }
  const passenger = ensurePassengerProfile(passengerId);
  waitRequests[passengerId] = {
    passengerId,
    stopId: passenger.preferredStopId || activeTrip.currentStopId,
    requestedAt: Date.now(),
  };
  return { success: true };
}

export function hasPassengerAbsent(passengerId: string): boolean {
  ensureTripForToday();
  return Boolean(absences[passengerId]);
}

export function markPassengerAbsent(passengerId: string): ActionResult {
  ensureTripForToday();
  if (absences[passengerId]) {
    return { success: false, reason: 'Already marked absent for this trip' };
  }
  const passenger = ensurePassengerProfile(passengerId);
  absences[passengerId] = {
    passengerId,
    stopId: passenger.preferredStopId || activeTrip.currentStopId,
    markedAt: Date.now(),
  };
  return { success: true };
}

export function arriveAtStop(stopId: string, timestamp: number = Date.now()): StopStatus {
  ensureTripForToday();
  activeTrip = {
    ...activeTrip,
    currentStopId: stopId,
    stopArrivedAt: timestamp,
    status: 'AT_STOP',
  };
  return computeStopStatus(stopId, timestamp);
}

export function advanceToNextStop(): StopStatus {
  ensureTripForToday();
  const currentIndex = mockStops.findIndex((stop) => stop.id === activeTrip.currentStopId);
  const nextStop = mockStops[(currentIndex + 1) % mockStops.length];
  return arriveAtStop(nextStop.id, Date.now());
}

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
  activeTrip = {
    ...activeTrip,
    location: {
      lat: location.latitude,
      lng: location.longitude,
    },
    status: activeTrip.status === 'AT_STOP' ? 'AT_STOP' : 'IN_TRANSIT',
  };
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
