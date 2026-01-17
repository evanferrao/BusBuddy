/**
 * Location Service
 * 
 * Handles GPS location tracking for the Bus Buddy app.
 * Used by drivers to share their location with passengers.
 */

import { LOCATION_CONFIG } from '@/constants/bus-tracker';
import { Location as AppLocation } from '@/types';
import * as Location from 'expo-location';

export type LocationCallback = (location: AppLocation) => void;
export type ErrorCallback = (error: string) => void;

let locationSubscription: Location.LocationSubscription | null = null;
let isTracking = false;

/**
 * Request location permissions
 * Returns true if permissions are granted
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    // First check if we already have permissions
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return true;
    }

    // Request foreground permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
}

/**
 * Request background location permissions (for tracking when app is minimized)
 */
export async function requestBackgroundLocationPermissions(): Promise<boolean> {
  try {
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      const granted = await requestLocationPermissions();
      if (!granted) return false;
    }

    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting background location permissions:', error);
    return false;
  }
}

/**
 * Check if location services are enabled on the device
 */
export async function isLocationServicesEnabled(): Promise<boolean> {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    return enabled;
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
}

/**
 * Get current location once
 */
export async function getCurrentLocation(): Promise<AppLocation | null> {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      speed: location.coords.speed,
      heading: location.coords.heading,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Start continuous location tracking
 * Calls the callback function with new location data
 */
export async function startLocationTracking(
  onLocationUpdate: LocationCallback,
  onError?: ErrorCallback
): Promise<boolean> {
  try {
    // Check if already tracking
    if (isTracking) {
      console.log('Location tracking already active');
      return true;
    }

    // Request permissions
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      onError?.('Location permission not granted. Please enable location access in settings.');
      return false;
    }

    // Check if location services are enabled
    const servicesEnabled = await isLocationServicesEnabled();
    if (!servicesEnabled) {
      onError?.('Location services are disabled. Please enable GPS on your device.');
      return false;
    }

    // Start watching location
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_CONFIG.UPDATE_INTERVAL,
        distanceInterval: LOCATION_CONFIG.DISTANCE_FILTER,
      },
      (location) => {
        const appLocation: AppLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          speed: location.coords.speed,
          heading: location.coords.heading,
        };
        onLocationUpdate(appLocation);
      }
    );

    isTracking = true;
    console.log('Location tracking started');
    return true;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    onError?.('Failed to start location tracking. Please try again.');
    return false;
  }
}

/**
 * Stop location tracking
 */
export function stopLocationTracking(): void {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
  isTracking = false;
  console.log('Location tracking stopped');
}

/**
 * Check if currently tracking
 */
export function isCurrentlyTracking(): boolean {
  return isTracking;
}

/**
 * Get human-readable speed from m/s
 */
export function formatSpeed(speedMs: number | null | undefined): string {
  if (speedMs === null || speedMs === undefined || speedMs < 0) {
    return 'N/A';
  }
  // Convert m/s to km/h
  const speedKmh = speedMs * 3.6;
  return `${Math.round(speedKmh)} km/h`;
}

/**
 * Get compass direction from heading degrees
 */
export function formatHeading(heading: number | null | undefined): string {
  if (heading === null || heading === undefined) {
    return 'N/A';
  }

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}
