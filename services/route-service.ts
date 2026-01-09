/**
 * Route Service
 * 
 * Provides operations for route data as defined in the specification.
 * 
 * Per specification:
 * - routes/{routeId} contains static route data (busNo, stops)
 * - This data is loaded once and never changes during a trip
 * - Drives maps, schedules, and UI
 * 
 * Implementation Note:
 * In the current implementation, we use the "buses" collection which contains
 * the same data structure. This service provides a route-oriented API that
 * maps to the underlying buses collection.
 */

import { Bus, BusStopDefinition, Route } from '@/types';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase-config';

// ============================================
// ROUTE OPERATIONS
// ============================================

/**
 * Get route by ID
 * Maps to buses/{busId} in Firestore
 */
export async function getRoute(routeId: string): Promise<Route | null> {
  try {
    // Routes are stored in the buses collection
    const busRef = doc(db, 'buses', routeId);
    const busDoc = await getDoc(busRef);
    
    if (busDoc.exists()) {
      const bus = busDoc.data() as Bus;
      // Map Bus to Route format per specification
      return {
        routeId: bus.busId,
        busNo: bus.busNumber,
        stops: bus.stops,
      };
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
    const busesRef = collection(db, 'buses');
    const snapshot = await getDocs(busesRef);
    
    return snapshot.docs.map(doc => {
      const bus = doc.data() as Bus;
      return {
        routeId: bus.busId,
        busNo: bus.busNumber,
        stops: bus.stops,
      };
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
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
  const busRef = doc(db, 'buses', routeId);
  return onSnapshot(busRef, (doc) => {
    if (doc.exists()) {
      const bus = doc.data() as Bus;
      callback({
        routeId: bus.busId,
        busNo: bus.busNumber,
        stops: bus.stops,
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Get stop definition by ID from a route
 */
export function getStopFromRoute(
  route: Route,
  stopId: string
): BusStopDefinition | undefined {
  return route.stops.find(stop => stop.stopId === stopId);
}

/**
 * Get ordered stops for a route
 * Returns stops in the order they should be visited
 */
export function getOrderedStops(route: Route): readonly BusStopDefinition[] {
  // Stops are already ordered in the route definition
  return route.stops;
}

/**
 * Get next stop in the route after the given stop
 * Returns null if at the last stop
 */
export function getNextStop(
  route: Route,
  currentStopId: string
): BusStopDefinition | null {
  const currentIndex = route.stops.findIndex(s => s.stopId === currentStopId);
  if (currentIndex === -1 || currentIndex >= route.stops.length - 1) {
    return null;
  }
  return route.stops[currentIndex + 1];
}

/**
 * Get previous stop in the route before the given stop
 * Returns null if at the first stop
 */
export function getPreviousStop(
  route: Route,
  currentStopId: string
): BusStopDefinition | null {
  const currentIndex = route.stops.findIndex(s => s.stopId === currentStopId);
  if (currentIndex <= 0) {
    return null;
  }
  return route.stops[currentIndex - 1];
}

/**
 * Check if a stop is the last stop on the route
 */
export function isLastStop(route: Route, stopId: string): boolean {
  if (route.stops.length === 0) return false;
  return route.stops[route.stops.length - 1].stopId === stopId;
}

/**
 * Get stop index in the route (0-based)
 * Returns -1 if stop not found
 */
export function getStopIndex(route: Route, stopId: string): number {
  return route.stops.findIndex(s => s.stopId === stopId);
}
