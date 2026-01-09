/**
 * Trip Service
 * 
 * Handles all trip-related Firestore operations including:
 * - Trip lifecycle management (start, update, end)
 * - Wait requests
 * - Absence marking
 * - Stop color computation
 * 
 * IMPORTANT: Colors are NEVER stored in the database.
 * All colors are derived client-side using timestamps and counts.
 */

import {
    Absence,
    Bus,
    BusStopDefinition,
    StopColor,
    StopState,
    Trip,
    TripStatus,
    UserProfile,
    WaitRequest,
} from '@/types';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    Unsubscribe,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase-config';

// ============================================
// CONSTANTS (Per Specification)
// ============================================

// Time thresholds in seconds
export const STOP_TIMING = {
  RED_DURATION: 300,        // 5 minutes - standard waiting window
  YELLOW_DURATION: 420,     // 7 minutes - extended wait with requests
} as const;

// ============================================
// TRIP ID GENERATION
// ============================================

/**
 * Generate a trip ID based on bus and date
 * Format: trip_{busId}_{YYYY_MM_DD}
 */
export function generateTripId(busId: string, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `trip_${busId}_${year}_${month}_${day}`;
}

// ============================================
// BUS OPERATIONS
// ============================================

/**
 * Get bus by ID
 */
export async function getBus(busId: string): Promise<Bus | null> {
  try {
    const busRef = doc(db, 'buses', busId);
    const busDoc = await getDoc(busRef);
    if (busDoc.exists()) {
      return busDoc.data() as Bus;
    }
    return null;
  } catch (error) {
    console.error('Error fetching bus:', error);
    throw error;
  }
}

/**
 * Subscribe to bus updates
 */
export function subscribeToBus(
  busId: string,
  callback: (bus: Bus | null) => void
): Unsubscribe {
  const busRef = doc(db, 'buses', busId);
  return onSnapshot(busRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Bus);
    } else {
      callback(null);
    }
  });
}

// ============================================
// TRIP OPERATIONS
// ============================================

/**
 * Start a new trip (Driver only)
 */
export async function startTrip(
  busId: string,
  driverId: string,
  initialLocation: { lat: number; lng: number }
): Promise<Trip> {
  const tripId = generateTripId(busId);
  const now = Date.now();

  const trip: Trip = {
    tripId,
    busId,
    driverId,
    startedAt: now,
    currentStopId: null,
    stopArrivedAt: null,
    status: 'IN_TRANSIT',
    location: initialLocation,
  };

  try {
    // Create trip document
    const tripRef = doc(db, 'trips', tripId);
    await setDoc(tripRef, trip);

    // Update bus with active trip
    const busRef = doc(db, 'buses', busId);
    await updateDoc(busRef, { activeTripId: tripId });

    console.log('Trip started:', tripId);
    return trip;
  } catch (error) {
    console.error('Error starting trip:', error);
    throw error;
  }
}

/**
 * End a trip (Driver only)
 */
export async function endTrip(tripId: string, busId: string): Promise<void> {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      endedAt: Date.now(),
      status: 'IN_TRANSIT',
      currentStopId: null,
      stopArrivedAt: null,
    });

    // Clear active trip from bus
    const busRef = doc(db, 'buses', busId);
    await updateDoc(busRef, { activeTripId: null });

    console.log('Trip ended:', tripId);
  } catch (error) {
    console.error('Error ending trip:', error);
    throw error;
  }
}

/**
 * Update trip location (Driver only)
 */
export async function updateTripLocation(
  tripId: string,
  location: { lat: number; lng: number }
): Promise<void> {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, { location });
  } catch (error) {
    console.error('Error updating trip location:', error);
    throw error;
  }
}

/**
 * Arrive at a stop (Driver only)
 * Sets currentStopId, stopArrivedAt, and status to AT_STOP
 */
export async function arriveAtStop(
  tripId: string,
  stopId: string
): Promise<void> {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      currentStopId: stopId,
      stopArrivedAt: Date.now(),
      status: 'AT_STOP' as TripStatus,
    });
    console.log('Arrived at stop:', stopId);
  } catch (error) {
    console.error('Error arriving at stop:', error);
    throw error;
  }
}

/**
 * Depart from current stop (Driver only)
 * Sets status to IN_TRANSIT
 */
export async function departFromStop(tripId: string): Promise<void> {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      status: 'IN_TRANSIT' as TripStatus,
      // Keep currentStopId for reference, clear arrival time
      stopArrivedAt: null,
    });
    console.log('Departed from stop');
  } catch (error) {
    console.error('Error departing from stop:', error);
    throw error;
  }
}

/**
 * Get current trip by ID
 */
export async function getTrip(tripId: string): Promise<Trip | null> {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);
    if (tripDoc.exists()) {
      return tripDoc.data() as Trip;
    }
    return null;
  } catch (error) {
    console.error('Error fetching trip:', error);
    throw error;
  }
}

/**
 * Subscribe to trip updates
 */
export function subscribeToTrip(
  tripId: string,
  callback: (trip: Trip | null) => void
): Unsubscribe {
  const tripRef = doc(db, 'trips', tripId);
  return onSnapshot(tripRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Trip);
    } else {
      callback(null);
    }
  });
}

// ============================================
// WAIT REQUEST OPERATIONS
// ============================================

/**
 * Send a wait request (Passenger only)
 * Creates or overwrites document in waitRequests subcollection
 */
export async function sendWaitRequest(
  tripId: string,
  passengerId: string,
  stopId: string
): Promise<WaitRequest> {
  const waitRequest: WaitRequest = {
    passengerId,
    stopId,
    requestedAt: Date.now(),
  };

  try {
    const waitRef = doc(db, 'trips', tripId, 'waitRequests', passengerId);
    await setDoc(waitRef, waitRequest);
    console.log('Wait request sent');
    return waitRequest;
  } catch (error) {
    console.error('Error sending wait request:', error);
    throw error;
  }
}

/**
 * Check if passenger has a wait request for this trip
 */
export async function hasWaitRequest(
  tripId: string,
  passengerId: string
): Promise<boolean> {
  try {
    const waitRef = doc(db, 'trips', tripId, 'waitRequests', passengerId);
    const waitDoc = await getDoc(waitRef);
    return waitDoc.exists();
  } catch (error) {
    console.error('Error checking wait request:', error);
    return false;
  }
}

/**
 * Get all wait requests for a stop
 */
export async function getWaitRequestsForStop(
  tripId: string,
  stopId: string
): Promise<WaitRequest[]> {
  try {
    const waitRequestsRef = collection(db, 'trips', tripId, 'waitRequests');
    const q = query(waitRequestsRef, where('stopId', '==', stopId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as WaitRequest);
  } catch (error) {
    console.error('Error fetching wait requests:', error);
    return [];
  }
}

/**
 * Subscribe to wait requests for a trip
 */
export function subscribeToWaitRequests(
  tripId: string,
  callback: (requests: WaitRequest[]) => void
): Unsubscribe {
  const waitRequestsRef = collection(db, 'trips', tripId, 'waitRequests');
  return onSnapshot(waitRequestsRef, (snapshot) => {
    const requests = snapshot.docs.map(doc => doc.data() as WaitRequest);
    callback(requests);
  });
}

// ============================================
// ABSENCE OPERATIONS
// ============================================

/**
 * Mark absence (Passenger only)
 * Creates document in absences subcollection
 * Note: Absence is final for the trip
 */
export async function markAbsence(
  tripId: string,
  passengerId: string,
  stopId: string
): Promise<Absence> {
  const absence: Absence = {
    passengerId,
    stopId,
    markedAt: Date.now(),
  };

  try {
    const absenceRef = doc(db, 'trips', tripId, 'absences', passengerId);
    await setDoc(absenceRef, absence);
    console.log('Absence marked');
    return absence;
  } catch (error) {
    console.error('Error marking absence:', error);
    throw error;
  }
}

/**
 * Check if passenger has marked absence for this trip
 */
export async function hasMarkedAbsence(
  tripId: string,
  passengerId: string
): Promise<boolean> {
  try {
    const absenceRef = doc(db, 'trips', tripId, 'absences', passengerId);
    const absenceDoc = await getDoc(absenceRef);
    return absenceDoc.exists();
  } catch (error) {
    console.error('Error checking absence:', error);
    return false;
  }
}

/**
 * Get all absences for a stop
 */
export async function getAbsencesForStop(
  tripId: string,
  stopId: string
): Promise<Absence[]> {
  try {
    const absencesRef = collection(db, 'trips', tripId, 'absences');
    const q = query(absencesRef, where('stopId', '==', stopId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Absence);
  } catch (error) {
    console.error('Error fetching absences:', error);
    return [];
  }
}

/**
 * Subscribe to absences for a trip
 */
export function subscribeToAbsences(
  tripId: string,
  callback: (absences: Absence[]) => void
): Unsubscribe {
  const absencesRef = collection(db, 'trips', tripId, 'absences');
  return onSnapshot(absencesRef, (snapshot) => {
    const absences = snapshot.docs.map(doc => doc.data() as Absence);
    callback(absences);
  });
}

// ============================================
// PASSENGER QUERIES
// ============================================

/**
 * Get all passengers for a bus
 */
export async function getPassengersForBus(busId: string): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('busId', '==', busId),
      where('role', '==', 'student')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error fetching passengers:', error);
    return [];
  }
}

/**
 * Get passengers for a specific stop on a bus
 */
export async function getPassengersForStop(
  busId: string,
  stopId: string
): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('busId', '==', busId),
      where('preferredStopId', '==', stopId),
      where('role', '==', 'student')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error fetching passengers for stop:', error);
    return [];
  }
}

// ============================================
// STOP COLOR COMPUTATION (Client-Side Only)
// ============================================

/**
 * Compute stop color based on the specification:
 * 
 * Priority Order (Highest to Lowest):
 * 1. GREY – all passengers at stop are absent
 * 2. RED – normal stop waiting window (0-5 min)
 * 3. YELLOW – extended wait due to requests (5-7 min with wait requests)
 * 4. GREEN – in transit or stop passed
 * 
 * IMPORTANT: This is computed client-side only, NEVER stored in database
 */
export function computeStopColor(
  tripStatus: TripStatus,
  isCurrentStop: boolean,
  stopArrivedAt: number | null,
  totalPassengers: number,
  absentCount: number,
  waitRequestCount: number
): StopColor {
  // If not at this stop, it's GREEN
  if (tripStatus !== 'AT_STOP' || !isCurrentStop || !stopArrivedAt) {
    return 'GREEN';
  }

  // Check if all passengers are absent
  const allAbsent = totalPassengers > 0 && absentCount === totalPassengers;
  if (allAbsent) {
    return 'GREY';
  }

  // Calculate elapsed time since arrival
  const elapsed = Math.floor((Date.now() - stopArrivedAt) / 1000);

  // RED: 0-5 minutes (standard waiting window)
  if (elapsed <= STOP_TIMING.RED_DURATION) {
    return 'RED';
  }

  // YELLOW: 5-7 minutes with wait requests
  if (waitRequestCount > 0 && elapsed <= STOP_TIMING.YELLOW_DURATION) {
    return 'YELLOW';
  }

  // GREEN: Time exceeded or no wait requests
  return 'GREEN';
}

/**
 * Compute full stop state for driver UI
 */
export function computeStopState(
  stop: BusStopDefinition,
  trip: Trip,
  passengers: UserProfile[],
  absences: Absence[],
  waitRequests: WaitRequest[]
): StopState {
  const isCurrentStop = trip.currentStopId === stop.stopId;
  const stopPassengers = passengers.filter(p => p.preferredStopId === stop.stopId);
  const stopAbsences = absences.filter(a => a.stopId === stop.stopId);
  const stopWaitRequests = waitRequests.filter(w => w.stopId === stop.stopId);

  const totalPassengers = stopPassengers.length;
  const absentCount = stopAbsences.length;
  const waitRequestCount = stopWaitRequests.length;
  const allAbsent = totalPassengers > 0 && absentCount === totalPassengers;

  const elapsed = isCurrentStop && trip.stopArrivedAt
    ? Math.floor((Date.now() - trip.stopArrivedAt) / 1000)
    : 0;

  const color = computeStopColor(
    trip.status,
    isCurrentStop,
    trip.stopArrivedAt,
    totalPassengers,
    absentCount,
    waitRequestCount
  );

  return {
    stopId: stop.stopId,
    name: stop.name,
    color,
    elapsedSeconds: elapsed,
    waitRequestCount,
    totalPassengers,
    absentCount,
    allAbsent,
  };
}

/**
 * Get remaining time in seconds for current stop state
 * Returns null if not applicable
 */
export function getRemainingTime(stopState: StopState): number | null {
  if (stopState.color === 'GREY' || stopState.color === 'GREEN') {
    return null;
  }

  if (stopState.color === 'RED') {
    return Math.max(0, STOP_TIMING.RED_DURATION - stopState.elapsedSeconds);
  }

  if (stopState.color === 'YELLOW') {
    return Math.max(0, STOP_TIMING.YELLOW_DURATION - stopState.elapsedSeconds);
  }

  return null;
}

/**
 * Format remaining time as MM:SS
 */
export function formatRemainingTime(seconds: number | null): string {
  if (seconds === null) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
