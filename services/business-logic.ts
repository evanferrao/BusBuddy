/**
 * Business Logic Service
 * 
 * Implements the core business logic for the BusBuddy system:
 * - Stop color state machine (GREY, RED, YELLOW, GREEN)
 * - Validation rules for wait requests and absences
 * - Helper functions for time calculations
 */

import { StopColorState, Trip, WaitRequest, Absence, Stop, UserProfileDoc } from '@/types';
import { Timestamp } from 'firebase/firestore';

// Time constants (in seconds)
const RED_DURATION = 300; // 5 minutes
const YELLOW_DURATION = 420; // 7 minutes

/**
 * Calculate elapsed time since stop arrival in seconds
 */
export const getElapsedSeconds = (stopArrivedAt: any): number | null => {
  if (!stopArrivedAt) return null;
  
  const arrivedTimestamp = stopArrivedAt instanceof Timestamp 
    ? stopArrivedAt.toMillis() 
    : stopArrivedAt;
  
  const now = Date.now();
  return Math.floor((now - arrivedTimestamp) / 1000);
};

/**
 * Compute stop color state based on the specification
 * 
 * Priority Order:
 * 1. GREY - all passengers at stop are absent
 * 2. RED - from arrival until 5 minutes (300 seconds)
 * 3. YELLOW - from 5 to 7 minutes (300-420 seconds) only if wait requests exist
 * 4. GREEN - in transit or stop passed
 */
export const computeStopColor = (
  stopId: string,
  trip: Trip,
  allPassengersAbsent: boolean,
  hasWaitRequests: boolean
): StopColorState => {
  // GREY: All passengers are absent
  if (allPassengersAbsent) {
    return 'GREY';
  }

  // GREEN: Not at this stop or in transit
  if (trip.status !== 'AT_STOP' || trip.currentStopId !== stopId) {
    return 'GREEN';
  }

  // Calculate elapsed time since arrival
  const elapsed = getElapsedSeconds(trip.stopArrivedAt);
  
  if (elapsed === null) {
    return 'GREEN';
  }

  // RED: 0-5 minutes
  if (elapsed <= RED_DURATION) {
    return 'RED';
  }

  // YELLOW: 5-7 minutes with wait requests
  if (hasWaitRequests && elapsed <= YELLOW_DURATION) {
    return 'YELLOW';
  }

  // GREEN: Time exceeded
  return 'GREEN';
};

/**
 * Check if all passengers at a stop are absent
 */
export const checkAllPassengersAbsent = (
  stopId: string,
  passengersAtStop: UserProfileDoc[],
  absences: Absence[]
): boolean => {
  if (passengersAtStop.length === 0) {
    return false; // No passengers means no color change
  }

  const absentCount = absences.filter(a => a.stopId === stopId).length;
  return absentCount > 0 && absentCount === passengersAtStop.length;
};

/**
 * Validate if passenger can send a wait request
 * 
 * Rules:
 * - Passenger has NOT marked absence
 * - Passenger's preferredStopId === currentStopId
 * - Trip status = AT_STOP
 * - Time elapsed since arrival <= 420 seconds (7 minutes)
 */
export const canSendWaitRequest = (
  passenger: UserProfileDoc,
  trip: Trip,
  hasMarkedAbsence: boolean
): { allowed: boolean; reason?: string } => {
  // Check if passenger has marked absence
  if (hasMarkedAbsence) {
    return { allowed: false, reason: 'You have marked yourself as absent for this trip' };
  }

  // Check if trip is at passenger's stop
  if (trip.currentStopId !== passenger.preferredStopId) {
    return { allowed: false, reason: 'Bus is not at your stop' };
  }

  // Check if trip is at a stop
  if (trip.status !== 'AT_STOP') {
    return { allowed: false, reason: 'Bus is not at a stop' };
  }

  // Check elapsed time
  const elapsed = getElapsedSeconds(trip.stopArrivedAt);
  if (elapsed === null || elapsed > YELLOW_DURATION) {
    return { allowed: false, reason: 'Wait request window has closed' };
  }

  return { allowed: true };
};

/**
 * Validate if passenger can mark absence
 * 
 * Rules:
 * - Trip is active
 * - Passenger has not already marked absence
 */
export const canMarkAbsence = (
  hasMarkedAbsence: boolean,
  tripExists: boolean
): { allowed: boolean; reason?: string } => {
  if (!tripExists) {
    return { allowed: false, reason: 'No active trip' };
  }

  if (hasMarkedAbsence) {
    return { allowed: false, reason: 'You have already marked yourself as absent' };
  }

  return { allowed: true };
};

/**
 * Format elapsed time for display
 */
export const formatElapsedTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get remaining time in seconds for current color state
 */
export const getRemainingSeconds = (
  colorState: StopColorState,
  elapsedSeconds: number
): number | null => {
  if (colorState === 'RED') {
    return RED_DURATION - elapsedSeconds;
  } else if (colorState === 'YELLOW') {
    return YELLOW_DURATION - elapsedSeconds;
  }
  return null;
};

/**
 * Generate a trip ID based on date
 */
export const generateTripId = (busId: string, date?: Date): string => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `trip_${busId}_${year}_${month}_${day}`;
};
