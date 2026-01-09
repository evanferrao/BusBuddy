/**
 * Route Service
 * 
 * Handles static route data operations per specification:
 * - Routes contain stops array with static schedule/location data
 * - Route data is loaded once and never changes during a trip
 * - Drives maps, schedules, and UI
 * 
 * Collection: routes/{routeId}
 */

import { Route, BusStopDefinition } from '@/types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase-config';

// ============================================
// ROUTE OPERATIONS
// ============================================

/**
 * Get route by ID
 */
export async function getRoute(routeId: string): Promise<Route | null> {
  try {
    const routeRef = doc(db, 'routes', routeId);
    const routeDoc = await getDoc(routeRef);
    if (routeDoc.exists()) {
      return routeDoc.data() as Route;
    }
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    throw error;
  }
}

/**
 * Get all routes
 */
export async function getAllRoutes(): Promise<Route[]> {
  try {
    const routesRef = collection(db, 'routes');
    const snapshot = await getDocs(routesRef);
    return snapshot.docs.map(doc => doc.data() as Route);
  } catch (error) {
    console.error('Error fetching all routes:', error);
    return [];
  }
}

/**
 * Subscribe to route updates
 */
export function subscribeToRoute(
  routeId: string,
  callback: (route: Route | null) => void
): Unsubscribe {
  const routeRef = doc(db, 'routes', routeId);
  return onSnapshot(routeRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Route);
    } else {
      callback(null);
    }
  });
}

/**
 * Create or update a route
 */
export async function saveRoute(route: Route): Promise<void> {
  try {
    const routeRef = doc(db, 'routes', route.routeId);
    await setDoc(routeRef, route);
    console.log('Route saved:', route.routeId);
  } catch (error) {
    console.error('Error saving route:', error);
    throw error;
  }
}

/**
 * Get a specific stop from a route
 */
export async function getStopFromRoute(
  routeId: string,
  stopId: string
): Promise<BusStopDefinition | null> {
  try {
    const route = await getRoute(routeId);
    if (route) {
      return route.stops.find(s => s.stopId === stopId) || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting stop from route:', error);
    return null;
  }
}

/**
 * Get all stops for a route
 */
export async function getStopsForRoute(routeId: string): Promise<BusStopDefinition[]> {
  try {
    const route = await getRoute(routeId);
    return route?.stops || [];
  } catch (error) {
    console.error('Error getting stops for route:', error);
    return [];
  }
}

// ============================================
// DEFAULT/DEMO ROUTE DATA
// ============================================

/**
 * Default route data for demo/seeding
 * Per specification format: routes/{routeId}
 */
export const DEFAULT_ROUTE: Route = {
  routeId: 'route_1',
  busNo: '1',
  stops: [
    {
      stopId: 'stop_1',
      name: 'Ganesh Nagar',
      lat: 26.9124,
      lng: 75.7873,
      scheduledTime: '07:30',
    },
    {
      stopId: 'stop_2',
      name: 'Shanti Colony',
      lat: 26.9134,
      lng: 75.7893,
      scheduledTime: '07:35',
    },
    {
      stopId: 'stop_3',
      name: 'Ram Nagar',
      lat: 26.9144,
      lng: 75.7913,
      scheduledTime: '07:40',
    },
    {
      stopId: 'stop_4',
      name: 'Nehru Park',
      lat: 26.9154,
      lng: 75.7933,
      scheduledTime: '07:45',
    },
    {
      stopId: 'stop_5',
      name: 'Station Road',
      lat: 26.9164,
      lng: 75.7953,
      scheduledTime: '07:50',
    },
  ],
};

/**
 * Initialize default route in Firestore if it doesn't exist.
 * 
 * This utility function can be called during app initialization or
 * from a setup script to seed the database with default route data.
 * 
 * Usage:
 * - Call once during initial app setup or from admin dashboard
 * - Safe to call multiple times (checks for existing data first)
 * 
 * @example
 * // In app initialization or setup script
 * await initializeDefaultRoute();
 */
export async function initializeDefaultRoute(): Promise<void> {
  try {
    const existingRoute = await getRoute(DEFAULT_ROUTE.routeId);
    if (!existingRoute) {
      await saveRoute(DEFAULT_ROUTE);
      console.log('Default route initialized');
    }
  } catch (error) {
    console.error('Error initializing default route:', error);
  }
}
