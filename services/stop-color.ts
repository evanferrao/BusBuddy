/**
 * Stop Color Service
 * 
 * Derives stop colors client-side based on timestamps and counts.
 * No colors are stored in the database - all derived from real-time data.
 * 
 * Color State Machine (Priority Order - Highest to Lowest):
 * - GREY: All passengers at stop are absent (driver may skip)
 * - RED: Standard waiting window (0-5 minutes since arrival)
 * - YELLOW: Extended wait due to requests (5-7 minutes if wait requests exist)
 * - GREEN: In transit or stop has been passed
 */

import { Absence, FirestoreTrip, StopColor, StopStatus, WaitRequest } from '@/types';
import { UserProfile } from './firestore';

// Time constants in seconds
export const STOP_TIME_CONSTANTS = {
  RED_DURATION: 300,    // 5 minutes - standard waiting window
  YELLOW_END: 420,      // 7 minutes - extended wait limit
} as const;

/**
 * Compute the stop color based on the current state
 * 
 * Color Computation Logic:
 * if (allPassengersAbsent) {
 *   color = "GREY";
 * } else if (elapsed <= 300) {
 *   color = "RED";
 * } else if (hasWaitRequests && elapsed <= 420) {
 *   color = "YELLOW";
 * } else {
 *   color = "GREEN";
 * }
 */
export function computeStopColor(
  elapsedSeconds: number,
  allPassengersAbsent: boolean,
  hasWaitRequests: boolean,
  tripStatus: 'IN_TRANSIT' | 'AT_STOP'
): StopColor {
  // If not at a stop, always GREEN
  if (tripStatus !== 'AT_STOP') {
    return 'GREEN';
  }

  // GREY - all passengers at stop are absent
  if (allPassengersAbsent) {
    return 'GREY';
  }

  // RED - standard waiting window (0-5 minutes)
  if (elapsedSeconds <= STOP_TIME_CONSTANTS.RED_DURATION) {
    return 'RED';
  }

  // YELLOW - extended wait (5-7 minutes) if wait requests exist
  if (hasWaitRequests && elapsedSeconds <= STOP_TIME_CONSTANTS.YELLOW_END) {
    return 'YELLOW';
  }

  // GREEN - time expired or in transit
  return 'GREEN';
}

/**
 * Check if all passengers at a stop are absent
 * 
 * At stop arrival:
 * - Query all passengers where busId == busId and preferredStopId == currentStopId
 * - Query absences where stopId == currentStopId
 * - If counts match and > 0 → All absent
 */
export function areAllPassengersAbsent(
  passengersAtStop: UserProfile[],
  absencesAtStop: Absence[]
): boolean {
  const totalPassengers = passengersAtStop.length;
  const absentCount = absencesAtStop.length;

  // If no passengers at stop, not "all absent"
  if (totalPassengers === 0) {
    return false;
  }

  // All passengers absent if counts match
  return absentCount >= totalPassengers;
}

/**
 * Get wait requests for a specific stop
 */
export function getWaitRequestsForStop(
  waitRequests: WaitRequest[],
  stopId: string
): WaitRequest[] {
  return waitRequests.filter(wr => wr.stopId === stopId);
}

/**
 * Get absences for a specific stop
 */
export function getAbsencesForStop(
  absences: Absence[],
  stopId: string
): Absence[] {
  return absences.filter(absence => absence.stopId === stopId);
}

/**
 * Calculate elapsed time since stop arrival in seconds
 */
export function calculateElapsedSeconds(stopArrivedAt: number | null): number {
  if (!stopArrivedAt) {
    return 0;
  }
  const now = Date.now();
  return Math.floor((now - stopArrivedAt) / 1000);
}

/**
 * Calculate remaining time in the current state
 */
export function calculateRemainingTime(
  elapsedSeconds: number,
  color: StopColor,
  hasWaitRequests: boolean
): number {
  if (color === 'RED') {
    // Time until RED ends (either to YELLOW or GREEN)
    return Math.max(0, STOP_TIME_CONSTANTS.RED_DURATION - elapsedSeconds);
  }
  
  if (color === 'YELLOW' && hasWaitRequests) {
    // Time until YELLOW ends (goes to GREEN)
    return Math.max(0, STOP_TIME_CONSTANTS.YELLOW_END - elapsedSeconds);
  }

  return 0;
}

/**
 * Get full stop status including color, counts, and timing
 */
export function getStopStatus(
  stopId: string,
  stopName: string,
  trip: FirestoreTrip | null,
  passengersAtStop: UserProfile[],
  waitRequests: WaitRequest[],
  absences: Absence[]
): StopStatus {
  // Default status for no trip
  if (!trip) {
    return {
      stopId,
      name: stopName,
      color: 'GREEN',
      elapsedSeconds: 0,
      waitRequestCount: 0,
      allPassengersAbsent: false,
      totalPassengers: passengersAtStop.length,
      absentCount: 0,
    };
  }

  // Filter to this stop
  const stopWaitRequests = getWaitRequestsForStop(waitRequests, stopId);
  const stopAbsences = getAbsencesForStop(absences, stopId);

  // Check if this is the current stop
  const isCurrentStop = trip.currentStopId === stopId;
  
  // Calculate elapsed time only for current stop
  const elapsedSeconds = isCurrentStop 
    ? calculateElapsedSeconds(trip.stopArrivedAt)
    : 0;

  // Determine if all passengers are absent
  const allPassengersAbsent = areAllPassengersAbsent(passengersAtStop, stopAbsences);

  // Has wait requests
  const hasWaitRequests = stopWaitRequests.length > 0;

  // Compute color
  const color = isCurrentStop
    ? computeStopColor(elapsedSeconds, allPassengersAbsent, hasWaitRequests, trip.status)
    : 'GREEN';

  return {
    stopId,
    name: stopName,
    color,
    elapsedSeconds,
    waitRequestCount: stopWaitRequests.length,
    allPassengersAbsent,
    totalPassengers: passengersAtStop.length,
    absentCount: stopAbsences.length,
  };
}

/**
 * Get color display configuration for UI
 */
export function getColorConfig(color: StopColor): {
  backgroundColor: string;
  textColor: string;
  label: string;
  description: string;
} {
  switch (color) {
    case 'GREY':
      return {
        backgroundColor: '#8E8E93',
        textColor: '#FFFFFF',
        label: 'All Absent',
        description: 'All passengers marked absent - may skip stop',
      };
    case 'RED':
      return {
        backgroundColor: '#FF3B30',
        textColor: '#FFFFFF',
        label: 'Waiting',
        description: 'Standard waiting window (0-5 min)',
      };
    case 'YELLOW':
      return {
        backgroundColor: '#FFCC00',
        textColor: '#000000',
        label: 'Extended Wait',
        description: 'Wait request received (5-7 min)',
      };
    case 'GREEN':
      return {
        backgroundColor: '#34C759',
        textColor: '#FFFFFF',
        label: 'Ready',
        description: 'In transit or stop complete',
      };
    default:
      return {
        backgroundColor: '#8E8E93',
        textColor: '#FFFFFF',
        label: 'Unknown',
        description: 'Unknown status',
      };
  }
}

/**
 * Check if "Wait for Me" button should be enabled for a passenger
 * 
 * Enabled only if:
 * - Passenger has NOT marked absence
 * - Passenger's preferredStopId === currentStopId
 * - Trip status = AT_STOP
 * - Time elapsed since arrival ≤ 420 seconds (7 minutes)
 */
export function canSubmitWaitRequest(
  passengerStopId: string | undefined,
  currentStopId: string | null,
  tripStatus: 'IN_TRANSIT' | 'AT_STOP' | null,
  elapsedSeconds: number,
  hasAbsence: boolean,
  hasExistingWaitRequest: boolean
): boolean {
  // Can't request if already absent
  if (hasAbsence) {
    return false;
  }

  // Can't request if already has a wait request
  if (hasExistingWaitRequest) {
    return false;
  }

  // Must have a preferred stop assigned
  if (!passengerStopId) {
    return false;
  }

  // Trip must be at a stop
  if (tripStatus !== 'AT_STOP') {
    return false;
  }

  // Must be at passenger's preferred stop
  if (passengerStopId !== currentStopId) {
    return false;
  }

  // Must be within time limit (7 minutes)
  if (elapsedSeconds > STOP_TIME_CONSTANTS.YELLOW_END) {
    return false;
  }

  return true;
}

/**
 * Check if "Absent Today" button should be enabled for a passenger
 * 
 * Enabled if:
 * - Trip is active
 * - Passenger has not already marked absence
 */
export function canMarkAbsent(
  tripActive: boolean,
  hasAbsence: boolean
): boolean {
  // Can't mark absent if already marked
  if (hasAbsence) {
    return false;
  }

  // Trip must be active
  return tripActive;
}
