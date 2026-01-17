/**
 * Mock Data Service
 * 
 * This service simulates backend functionality for the Bus Buddy app.
 * In production, this would be replaced with actual Firestore operations.
 * 
 * Data model follows the specification:
 * - routes collection with stops array (routes/{routeId})
 * - trips collection for live state
 * - waitRequests and absences subcollections
 */

import {
    BusRoute,
    BusStop,
    Driver,
    Location,
    NotificationType,
    Passenger,
    PassengerNotification,
    Route,
    RouteStop,
} from '@/types';

// Mock passengers data (with stopId added per spec)
const mockPassengers: Passenger[] = [
  {
    id: 'passenger_1',
    name: 'Rahul Sharma',
    stopName: 'Dadar TT',
    stopId: 'stop_dadar_tt',
    stopLocation: { latitude: 19.0191, longitude: 72.8465, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'passenger_2',
    name: 'Priya Patel',
    stopName: 'Shivaji Park',
    stopId: 'stop_shivaji_park',
    stopLocation: { latitude: 19.0283, longitude: 72.8382, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'passenger_3',
    name: 'Amit Kumar',
    stopName: 'Mahim Junction',
    stopId: 'stop_mahim',
    stopLocation: { latitude: 19.0426, longitude: 72.8400, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'passenger_4',
    name: 'Sneha Gupta',
    stopName: 'Bandra Station',
    stopId: 'stop_bandra',
    stopLocation: { latitude: 19.0544, longitude: 72.8402, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'passenger_5',
    name: 'Vikram Singh',
    stopName: 'Santacruz East',
    stopId: 'stop_santacruz',
    stopLocation: { latitude: 19.0815, longitude: 72.8411, timestamp: Date.now() },
    status: 'waiting',
  },
  {
    id: 'passenger_6',
    name: 'Anjali Mehta',
    stopName: 'Juhu Beach',
    stopId: 'stop_juhu',
    stopLocation: { latitude: 19.0988, longitude: 72.8267, timestamp: Date.now() },
    status: 'waiting',
  },
];

// Mock bus stops (6 unique stops with unique coordinates)
const mockStops: BusStop[] = [
  {
    id: 'stop_dadar_tt',
    name: 'Dadar TT',
    location: { latitude: 19.0191, longitude: 72.8465, timestamp: Date.now() },
    passengers: ['passenger_1'],
    order: 1,
    scheduledTime: '08:00',
  },
  {
    id: 'stop_shivaji_park',
    name: 'Shivaji Park',
    location: { latitude: 19.0283, longitude: 72.8382, timestamp: Date.now() },
    passengers: ['passenger_2'],
    order: 2,
    scheduledTime: '08:15',
  },
  {
    id: 'stop_mahim',
    name: 'Mahim Junction',
    location: { latitude: 19.0426, longitude: 72.8400, timestamp: Date.now() },
    passengers: ['passenger_3'],
    order: 3,
    scheduledTime: '08:30',
  },
  {
    id: 'stop_bandra',
    name: 'Bandra Station',
    location: { latitude: 19.0544, longitude: 72.8402, timestamp: Date.now() },
    passengers: ['passenger_4'],
    order: 4,
    scheduledTime: '08:45',
  },
  {
    id: 'stop_santacruz',
    name: 'Santacruz East',
    location: { latitude: 19.0815, longitude: 72.8411, timestamp: Date.now() },
    passengers: ['passenger_5'],
    order: 5,
    scheduledTime: '09:00',
  },
  {
    id: 'stop_juhu',
    name: 'Juhu Beach',
    location: { latitude: 19.0988, longitude: 72.8267, timestamp: Date.now() },
    passengers: ['passenger_6'],
    order: 6,
    scheduledTime: '09:15',
  },
];

// Mock route (per Firestore spec: routes/{routeId})
const mockRoute: Route = {
  routeId: 'route_1',
  busId: 'bus_1',
  routeName: 'Bus 1 – Dadar to Juhu',
  stops: mockStops.map(stop => ({
    stopId: stop.id,
    name: stop.name,
    lat: stop.location.latitude,
    lng: stop.location.longitude,
    time: stop.scheduledTime || '09:30',
  })),
  active: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Mock driver
const mockDriver: Driver = {
  id: 'driver-1',
  name: 'Ramesh Ji',
  busNumber: 'RJ-14-SB-1234',
  phoneNumber: '+91-9876543210',
  isActive: false,
};

// Mock bus route (legacy format for BusRoute type)
const mockBusRoute: BusRoute = {
  id: 'route-1',
  name: 'Morning Route - Village Road',
  driverId: 'driver-1',
  stops: mockStops,
  isActive: false,
};

// In-memory store for notifications (simulates real-time updates)
let notifications: PassengerNotification[] = [];
let currentBusLocation: Location | null = null;
let isDriverActive = false;

/**
 * Get all passengers on a route
 */
export function getPassengers(): Passenger[] {
  return [...mockPassengers];
}

/**
 * Get a specific passenger by ID
 */
export function getPassengerById(id: string): Passenger | undefined {
  return mockPassengers.find(p => p.id === id);
}

/**
 * Get the bus route (legacy format)
 */
export function getBusRoute(): BusRoute {
  return { ...mockBusRoute, isActive: isDriverActive };
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
  return { ...mockRoute };
}

/**
 * Get stop definition by ID
 */
export function getStopById(stopId: string): RouteStop | undefined {
  return mockRoute.stops.find(s => s.stopId === stopId);
}

/**
 * Send a notification from passenger to driver
 */
export function sendPassengerNotification(
  passengerId: string,
  type: NotificationType,
  message?: string
): PassengerNotification {
  const passenger = getPassengerById(passengerId);
  if (!passenger) {
    throw new Error('Passenger not found');
  }

  const notification: PassengerNotification = {
    id: `notif-${Date.now()}`,
    passengerId,
    passengerName: passenger.name,
    stopId: passenger.stopId,
    stopName: passenger.stopName,
    type,
    message,
    timestamp: Date.now(),
    isRead: false,
  };

  notifications.unshift(notification);
  
  // Update passenger status based on notification type (per spec: wait or skip only)
  const passengerIndex = mockPassengers.findIndex(p => p.id === passengerId);
  if (passengerIndex !== -1) {
    if (type === 'skip') {
      mockPassengers[passengerIndex].status = 'skipping';
    } else if (type === 'wait') {
      mockPassengers[passengerIndex].status = 'waiting';
    }
    mockPassengers[passengerIndex].notificationMessage = message;
    mockPassengers[passengerIndex].lastNotificationTime = Date.now();
  }

  return notification;
}

/**
 * Get all notifications for driver
 */
export function getNotifications(): PassengerNotification[] {
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
 * Get current bus location (called by passengers)
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
  mockBusRoute.isActive = active;
  
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
