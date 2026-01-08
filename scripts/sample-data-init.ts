/**
 * Sample Data Initializer
 * 
 * This script helps initialize sample data in Firestore for testing the BusBuddy system.
 * Run this from your Firebase console or a Node.js environment with Firebase Admin SDK.
 * 
 * Sample data includes:
 * - A bus with route stops
 * - A driver user
 * - Multiple passenger users
 * - Assignment of passengers to stops
 */

// This is a template - adapt based on your Firebase setup

export const SAMPLE_BUS_ID = 'bus_1';
export const SAMPLE_DRIVER_UID = 'driver_uid_1'; // Replace with actual Firebase Auth UID
export const SAMPLE_PASSENGER_UIDS = [
  'passenger_uid_1', // Replace with actual Firebase Auth UIDs
  'passenger_uid_2',
  'passenger_uid_3',
  'passenger_uid_4',
];

export const SAMPLE_BUS = {
  busNumber: 'MH-01-1234',
  driverId: SAMPLE_DRIVER_UID,
  activeTripId: null,
  stops: [
    {
      stopId: 'stop_1',
      name: 'Shivaji Nagar',
      lat: 19.123,
      lng: 72.321,
      scheduledTime: '07:45',
    },
    {
      stopId: 'stop_2',
      name: 'Ganesh Nagar',
      lat: 19.145,
      lng: 72.335,
      scheduledTime: '07:55',
    },
    {
      stopId: 'stop_3',
      name: 'City Center',
      lat: 19.167,
      lng: 72.349,
      scheduledTime: '08:05',
    },
    {
      stopId: 'stop_4',
      name: 'School Gate',
      lat: 19.189,
      lng: 72.363,
      scheduledTime: '08:15',
    },
  ],
};

export const SAMPLE_DRIVER = {
  uid: SAMPLE_DRIVER_UID,
  email: 'driver@example.com',
  displayName: 'John Driver',
  role: 'driver',
  busId: SAMPLE_BUS_ID,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const SAMPLE_PASSENGERS = [
  {
    uid: SAMPLE_PASSENGER_UIDS[0],
    email: 'passenger1@example.com',
    displayName: 'Alice Student',
    role: 'passenger',
    busId: SAMPLE_BUS_ID,
    preferredStopId: 'stop_1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    uid: SAMPLE_PASSENGER_UIDS[1],
    email: 'passenger2@example.com',
    displayName: 'Bob Student',
    role: 'passenger',
    busId: SAMPLE_BUS_ID,
    preferredStopId: 'stop_1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    uid: SAMPLE_PASSENGER_UIDS[2],
    email: 'passenger3@example.com',
    displayName: 'Charlie Student',
    role: 'passenger',
    busId: SAMPLE_BUS_ID,
    preferredStopId: 'stop_2',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    uid: SAMPLE_PASSENGER_UIDS[3],
    email: 'passenger4@example.com',
    displayName: 'Diana Student',
    role: 'passenger',
    busId: SAMPLE_BUS_ID,
    preferredStopId: 'stop_3',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * Initialize sample data in Firestore
 * 
 * Usage with Firebase Admin SDK:
 * 
 * ```javascript
 * const admin = require('firebase-admin');
 * const { initializeSampleData } = require('./sample-data-init');
 * 
 * admin.initializeApp();
 * const db = admin.firestore();
 * 
 * initializeSampleData(db).then(() => {
 *   console.log('Sample data initialized');
 * });
 * ```
 */
export async function initializeSampleData(db: any) {
  try {
    console.log('Initializing sample data...');

    // Create bus
    await db.collection('buses').doc(SAMPLE_BUS_ID).set(SAMPLE_BUS);
    console.log('✓ Bus created');

    // Create driver user
    await db.collection('users').doc(SAMPLE_DRIVER.uid).set(SAMPLE_DRIVER);
    console.log('✓ Driver user created');

    // Create passenger users
    for (const passenger of SAMPLE_PASSENGERS) {
      await db.collection('users').doc(passenger.uid).set(passenger);
    }
    console.log('✓ Passenger users created');

    console.log('✓ Sample data initialization complete!');
    console.log('\nNext steps:');
    console.log('1. Create Firebase Auth accounts for the users with the same UIDs');
    console.log('2. Sign in as the driver and start a trip');
    console.log('3. Sign in as passengers and test wait requests and absences');
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
}

/**
 * Clean up sample data
 */
export async function cleanupSampleData(db: any) {
  try {
    console.log('Cleaning up sample data...');

    // Delete users
    await db.collection('users').doc(SAMPLE_DRIVER.uid).delete();
    for (const passenger of SAMPLE_PASSENGERS) {
      await db.collection('users').doc(passenger.uid).delete();
    }
    console.log('✓ Users deleted');

    // Delete bus
    await db.collection('buses').doc(SAMPLE_BUS_ID).delete();
    console.log('✓ Bus deleted');

    console.log('✓ Sample data cleanup complete!');
  } catch (error) {
    console.error('Error cleaning up sample data:', error);
    throw error;
  }
}

// Instructions for manual setup via Firebase Console:
export const MANUAL_SETUP_INSTRUCTIONS = `
# Manual Setup Instructions (via Firebase Console)

## 1. Create a Bus

Go to Firestore > buses collection > Add Document

Document ID: bus_1

Fields:
- busNumber: "MH-01-1234" (string)
- driverId: "YOUR_DRIVER_UID" (string) - Replace with actual Firebase Auth UID
- activeTripId: null
- stops: (array)
  [0]:
    - stopId: "stop_1" (string)
    - name: "Shivaji Nagar" (string)
    - lat: 19.123 (number)
    - lng: 72.321 (number)
    - scheduledTime: "07:45" (string)
  [1]:
    - stopId: "stop_2" (string)
    - name: "Ganesh Nagar" (string)
    - lat: 19.145 (number)
    - lng: 72.335 (number)
    - scheduledTime: "07:55" (string)
  [2]:
    - stopId: "stop_3" (string)
    - name: "City Center" (string)
    - lat: 19.167 (number)
    - lng: 72.349 (number)
    - scheduledTime: "08:05" (string)

## 2. Create a Driver User

First, create a Firebase Auth account (via Authentication in Firebase Console)
Then add to Firestore > users collection > Add Document

Document ID: [Same as Firebase Auth UID]

Fields:
- uid: [Same as Firebase Auth UID] (string)
- email: "driver@example.com" (string)
- displayName: "John Driver" (string)
- role: "driver" (string)
- busId: "bus_1" (string)
- createdAt: [Current timestamp] (number)
- updatedAt: [Current timestamp] (number)

## 3. Create Passenger Users

For each passenger:
1. Create Firebase Auth account
2. Add to Firestore > users collection

Example:
Document ID: [Firebase Auth UID]

Fields:
- uid: [Same as Firebase Auth UID] (string)
- email: "passenger1@example.com" (string)
- displayName: "Alice Student" (string)
- role: "passenger" (string)
- busId: "bus_1" (string)
- preferredStopId: "stop_1" (string)
- createdAt: [Current timestamp] (number)
- updatedAt: [Current timestamp] (number)

Create at least 2-3 passengers assigned to different stops for testing.

## 4. Testing

1. Sign in as the driver and tap "Start Trip"
2. Sign in as a passenger and try marking absent or sending wait request
3. As driver, tap "Arrive" at a stop to test the color state machine
4. Observe color changes: RED (0-5 min), YELLOW (5-7 min with wait requests), GREEN (after 7 min or in transit)
`;

console.log('Sample data template loaded. See MANUAL_SETUP_INSTRUCTIONS for manual setup via Firebase Console.');
