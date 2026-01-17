/**
 * Trip Hook
 * 
 * Manages trip state, location tracking, and route data.
 */

import * as LocationService from '@/services/location';
import * as MockData from '@/services/mock-data';
import * as TripService from '@/services/trip-service';
import { Location, RouteStop, StopState, Trip, UserRole } from '@/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseTripParams {
  busId: string | null;
  userId: string | null;
  userRole: UserRole;
  isAuthenticated: boolean;
  preferredStopId: string | null;
  onTripChange?: (trip: Trip | null, isNewTrip: boolean) => void;
}

interface UseTripReturn {
  activeTrip: Trip | null;
  currentStopState: StopState | null;
  routeStops: RouteStop[];
  currentStopIndex: number;
  isTracking: boolean;
  currentLocation: Location | null;
  busLocation: Location | null;
  isDriverActive: boolean;
  hasBusDeparted: boolean;
  setCurrentStopIndex: (index: number) => void;
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  arriveAtStop: (stopId: string) => Promise<void>;
  departFromStop: () => Promise<void>;
  refreshBusLocation: () => Promise<void>;
}

export function useTrip({
  busId,
  userId,
  userRole,
  isAuthenticated,
  preferredStopId,
  onTripChange,
}: UseTripParams): UseTripReturn {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [currentStopState, setCurrentStopState] = useState<StopState | null>(null);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [busLocation, setBusLocation] = useState<Location | null>(null);
  const [isDriverActive, setIsDriverActive] = useState(false);
  
  const previousTripIdRef = useRef<string | null>(null);

  // Subscribe to active trip for the user's bus
  useEffect(() => {
    if (!busId || !isAuthenticated) return;

    const unsubscribeTrip = TripService.subscribeToActiveTripForBus(busId, (trip) => {
      const isNewTrip = trip && trip.tripId !== previousTripIdRef.current;
      
      if (isNewTrip) {
        onTripChange?.(trip, true);
      }
      
      previousTripIdRef.current = trip?.tripId || null;
      setActiveTrip(trip);
      
      if (trip && !trip.endedAt) {
        setIsDriverActive(true);
        setIsTracking(userRole === 'driver' && trip.driverId === userId);
        
        if (trip.location) {
          setBusLocation({
            latitude: trip.location.lat,
            longitude: trip.location.lng,
            timestamp: Date.now(),
          });
        }
        
        if (trip.currentStopId && routeStops.length > 0) {
          const idx = routeStops.findIndex(s => s.stopId === trip.currentStopId);
          if (idx >= 0) {
            setCurrentStopIndex(idx);
          }
        }
      } else {
        setIsDriverActive(false);
        if (userRole === 'driver') {
          setIsTracking(false);
        }
      }
    });

    return () => unsubscribeTrip();
  }, [busId, isAuthenticated, userId, userRole, routeStops, onTripChange]);

  // Fetch route stops
  useEffect(() => {
    if (!busId) return;

    const fetchRoute = async () => {
      try {
        const routeNumber = busId.replace('bus_', '');
        const routeId = `route_${routeNumber}`;
        const route = await TripService.getRoute(routeId);
        if (route) {
          setRouteStops(route.stops);
        } else {
          const mockRoute = MockData.getMockRoute();
          setRouteStops(mockRoute.stops);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        const mockRoute = MockData.getMockRoute();
        setRouteStops(mockRoute.stops);
      }
    };
    fetchRoute();
  }, [busId]);

  // Check if bus has passed the passenger's preferred stop
  const hasBusDeparted = useMemo(() => {
    if (!isDriverActive || !activeTrip || !preferredStopId || routeStops.length === 0) {
      return false;
    }
    const preferredStopIndex = routeStops.findIndex(s => s.stopId === preferredStopId);
    if (preferredStopIndex === -1) {
      return false;
    }
    return currentStopIndex > preferredStopIndex;
  }, [isDriverActive, activeTrip, preferredStopId, routeStops, currentStopIndex]);

  const startTracking = useCallback(async (): Promise<boolean> => {
    if (!busId || !userId) return false;
    
    const success = await LocationService.startLocationTracking(
      async (location) => {
        setCurrentLocation(location);
        
        if (activeTrip) {
          try {
            await TripService.updateTripLocation(activeTrip.tripId, {
              lat: location.latitude,
              lng: location.longitude,
            });
          } catch (error) {
            console.error('Error updating trip location:', error);
          }
        }
      },
      (error) => {
        console.error('Location error:', error);
      }
    );
    
    if (success) {
      try {
        const routeNumber = busId.replace('bus_', '');
        const routeId = `route_${routeNumber}`;
        const initialLocation = currentLocation 
          ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
          : { lat: 0, lng: 0 };
        
        const trip = await TripService.startTrip(busId, routeId, userId, initialLocation);
        setActiveTrip(trip);
        setIsTracking(true);
        setIsDriverActive(true);
        setCurrentStopIndex(0);
        
        if (routeStops.length > 0) {
          await TripService.arriveAtStop(trip.tripId, routeStops[0].stopId);
        }
        
        return true;
      } catch (error) {
        console.error('Error starting trip:', error);
        LocationService.stopLocationTracking();
        return false;
      }
    }
    
    return success;
  }, [busId, userId, activeTrip, currentLocation, routeStops]);

  const stopTracking = useCallback(async () => {
    LocationService.stopLocationTracking();
    
    if (activeTrip) {
      try {
        await TripService.endTrip(activeTrip.tripId);
      } catch (error) {
        console.error('Error ending trip:', error);
      }
    }
    
    setIsTracking(false);
    setCurrentLocation(null);
    setActiveTrip(null);
    setIsDriverActive(false);
    setCurrentStopIndex(0);
  }, [activeTrip]);

  const arriveAtStop = useCallback(async (stopId: string): Promise<void> => {
    if (!activeTrip) return;
    await TripService.arriveAtStop(activeTrip.tripId, stopId);
  }, [activeTrip]);

  const departFromStop = useCallback(async (): Promise<void> => {
    if (!activeTrip) return;
    
    await TripService.departFromStop(activeTrip.tripId);
    
    const nextIndex = currentStopIndex + 1;
    if (nextIndex < routeStops.length) {
      setCurrentStopIndex(nextIndex);
    }
  }, [activeTrip, currentStopIndex, routeStops.length]);

  const refreshBusLocation = useCallback(async () => {
    if (!busId) return;
    
    try {
      const trip = await TripService.getActiveTripForBus(busId);
      
      if (trip && !trip.endedAt) {
        const isNewTrip = !activeTrip || activeTrip.tripId !== trip.tripId;
        
        setActiveTrip(trip);
        setIsDriverActive(true);
        
        if (trip.location) {
          setBusLocation({
            latitude: trip.location.lat,
            longitude: trip.location.lng,
            timestamp: Date.now(),
          });
        }
        
        if (isNewTrip) {
          onTripChange?.(trip, true);
        }
      } else {
        setActiveTrip(null);
        setIsDriverActive(false);
        setBusLocation(null);
      }
    } catch (error) {
      console.error('Error refreshing bus location:', error);
    }
  }, [busId, activeTrip, onTripChange]);

  return {
    activeTrip,
    currentStopState,
    routeStops,
    currentStopIndex,
    isTracking,
    currentLocation,
    busLocation,
    isDriverActive,
    hasBusDeparted,
    setCurrentStopIndex,
    startTracking,
    stopTracking,
    arriveAtStop,
    departFromStop,
    refreshBusLocation,
  };
}
