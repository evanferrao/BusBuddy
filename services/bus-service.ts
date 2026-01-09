/**
 * Bus Service
 * 
 * Handles bus route and stop management
 * Per specification:
 * - Bus routes are static data (loaded once)
 * - Each bus has a list of stops with schedule
 * - Buses track their active trip
 */

import { Bus, BusStopDefinition } from '@/types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase-config';

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
 * Get all buses
 */
export async function getAllBuses(): Promise<Bus[]> {
  try {
    const busesRef = collection(db, 'buses');
    const snapshot = await getDocs(busesRef);
    return snapshot.docs.map(doc => doc.data() as Bus);
  } catch (error) {
    console.error('Error fetching buses:', error);
    return [];
  }
}

/**
 * Create or update a bus
 */
export async function saveBus(bus: Bus): Promise<void> {
  try {
    const busRef = doc(db, 'buses', bus.busId);
    await setDoc(busRef, bus);
    console.log('Bus saved:', bus.busId);
  } catch (error) {
    console.error('Error saving bus:', error);
    throw error;
  }
}

/**
 * Update bus active trip
 */
export async function updateBusActiveTripId(
  busId: string,
  activeTripId: string | null
): Promise<void> {
  try {
    const busRef = doc(db, 'buses', busId);
    await updateDoc(busRef, { activeTripId });
    console.log('Bus active trip updated:', busId, activeTripId);
  } catch (error) {
    console.error('Error updating bus active trip:', error);
    throw error;
  }
}

// ============================================
// DEFAULT DATA SEEDING
// ============================================

/**
 * Default bus route data for demo/testing
 * In production, this would be managed by admin panel
 */
export const DEFAULT_BUSES: Bus[] = [
  {
    busId: 'bus_1',
    busNumber: 'Bus 1',
    driverId: '',  // Empty until driver is assigned (will be set via admin or when driver logs in)
    activeTripId: null,
    stops: [
      {
        stopId: 'stop_1',
        name: 'Ganesh Nagar',
        lat: 26.9124,
        lng: 75.7873,
        scheduledTime: '07:00',
      },
      {
        stopId: 'stop_2',
        name: 'Malviya Nagar',
        lat: 26.8523,
        lng: 75.8154,
        scheduledTime: '07:15',
      },
      {
        stopId: 'stop_3',
        name: 'Jawahar Circle',
        lat: 26.8912,
        lng: 75.7834,
        scheduledTime: '07:30',
      },
      {
        stopId: 'stop_4',
        name: 'C-Scheme',
        lat: 26.9156,
        lng: 75.7890,
        scheduledTime: '07:45',
      },
      {
        stopId: 'stop_5',
        name: 'MI Road',
        lat: 26.9188,
        lng: 75.7881,
        scheduledTime: '08:00',
      },
    ],
  },
];

/**
 * Seed database with default bus data
 * Call this once to initialize the database
 */
export async function seedBusData(): Promise<void> {
  try {
    console.log('Seeding bus data...');
    for (const bus of DEFAULT_BUSES) {
      await saveBus(bus);
    }
    console.log('Bus data seeded successfully');
  } catch (error) {
    console.error('Error seeding bus data:', error);
    throw error;
  }
}

/**
 * Check if bus data exists, seed if not
 */
export async function ensureBusDataExists(): Promise<void> {
  try {
    const buses = await getAllBuses();
    if (buses.length === 0) {
      console.log('No bus data found, seeding...');
      await seedBusData();
    } else {
      console.log('Bus data already exists');
    }
  } catch (error) {
    console.error('Error ensuring bus data:', error);
    throw error;
  }
}
