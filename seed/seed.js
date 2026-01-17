const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// Test password for all dummy accounts
const TEST_PASSWORD = "test123456";

/* -----------------------------
   HARD DELETE HELPERS
--------------------------------*/

async function deleteCollection(collectionPath, batchSize = 50) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.limit(batchSize).get();

  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  return deleteCollection(collectionPath, batchSize);
}

async function deleteTripsWithSubcollections() {
  const trips = await db.collection("trips").get();

  for (const trip of trips.docs) {
    await deleteCollection(`trips/${trip.id}/waitRequests`);
    await deleteCollection(`trips/${trip.id}/absences`);
    await trip.ref.delete();
  }
}

/**
 * Delete a Firebase Auth user if they exist
 */
async function deleteAuthUserIfExists(email) {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.deleteUser(user.uid);
    console.log(`  Deleted auth user: ${email}`);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      console.error(`  Error checking user ${email}:`, error.message);
    }
  }
}

/**
 * Create a Firebase Auth user and return the UID
 */
async function createAuthUser(email, password, displayName) {
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true, // Skip email verification for test accounts
    });
    console.log(`  Created auth user: ${email} (${userRecord.uid})`);
    return userRecord.uid;
  } catch (error) {
    console.error(`  Error creating user ${email}:`, error.message);
    throw error;
  }
}

/* -----------------------------
   RESET DATABASE
--------------------------------*/

async function resetDatabase() {
  console.log("[DELETING] Firestore users...");
  await deleteCollection("users");

  console.log("[DELETING] Routes...");
  await deleteCollection("routes");

  console.log("[DELETING] Trips (with subcollections)...");
  await deleteTripsWithSubcollections();

  console.log("[DELETING] Firebase Auth users...");
  const testEmails = [
    "driver1@test.com",
    "adam@test.com",
    "bob@test.com",
    "carol@test.com",
    "david@test.com",
    "emma@test.com",
    "frank@test.com",
  ];
  for (const email of testEmails) {
    await deleteAuthUserIfExists(email);
  }

  console.log("[OK] Database cleared");
}

/* -----------------------------
   SEED ROUTES
--------------------------------*/

async function seedRoutes() {
  const routeRef = db.collection("routes").doc("route_1");

  await routeRef.set({
    routeId: "route_1",
    busId: "bus_1",
    routeName: "Bus 1 – Dadar to Juhu",
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stops: [
      {
        stopId: "stop_dadar_tt",
        name: "Dadar TT",
        time: "08:00",
        lat: 19.0191,
        lng: 72.8465,
      },
      {
        stopId: "stop_shivaji_park",
        name: "Shivaji Park",
        time: "08:15",
        lat: 19.0283,
        lng: 72.8382,
      },
      {
        stopId: "stop_mahim",
        name: "Mahim Junction",
        time: "08:30",
        lat: 19.0426,
        lng: 72.8400,
      },
      {
        stopId: "stop_bandra",
        name: "Bandra Station",
        time: "08:45",
        lat: 19.0544,
        lng: 72.8402,
      },
      {
        stopId: "stop_santacruz",
        name: "Santacruz East",
        time: "09:00",
        lat: 19.0815,
        lng: 72.8411,
      },
      {
        stopId: "stop_juhu",
        name: "Juhu Beach",
        time: "09:15",
        lat: 19.0988,
        lng: 72.8267,
      },
    ],
  });

  console.log("[OK] Routes seeded (6 stops)");
}

/* -----------------------------
   SEED USERS (Auth + Firestore)
--------------------------------*/

// Store created user UIDs for reference in trip seeding
const createdUsers = {
  driver: null,
  passenger1: null,
  passenger2: null,
  passenger3: null,
  passenger4: null,
  passenger5: null,
  passenger6: null,
};

async function seedUsers() {
  const users = [
    {
      key: "driver",
      email: "driver1@test.com",
      name: "Ramesh",
      role: "driver",
      busId: "bus_1",
    },
    // 6 passengers spread across 6 stops (1 per stop)
    {
      key: "passenger1",
      email: "adam@test.com",
      name: "Adam",
      role: "passenger",
      busId: "bus_1",
      preferredStopId: "stop_dadar_tt",
    },
    {
      key: "passenger2",
      email: "bob@test.com",
      name: "Bob",
      role: "passenger",
      busId: "bus_1",
      preferredStopId: "stop_shivaji_park",
    },
    {
      key: "passenger3",
      email: "carol@test.com",
      name: "Carol",
      role: "passenger",
      busId: "bus_1",
      preferredStopId: "stop_mahim",
    },
    {
      key: "passenger4",
      email: "david@test.com",
      name: "David",
      role: "passenger",
      busId: "bus_1",
      preferredStopId: "stop_bandra",
    },
    {
      key: "passenger5",
      email: "emma@test.com",
      name: "Emma",
      role: "passenger",
      busId: "bus_1",
      preferredStopId: "stop_santacruz",
    },
    {
      key: "passenger6",
      email: "frank@test.com",
      name: "Frank",
      role: "passenger",
      busId: "bus_1",
      preferredStopId: "stop_juhu",
    },
  ];

  console.log("[...] Creating Firebase Auth users...");
  for (const user of users) {
    // Create Firebase Auth user and get the real UID
    const uid = await createAuthUser(user.email, TEST_PASSWORD, user.name);
    
    // Store the UID for later use
    createdUsers[user.key] = uid;
    
    // Create Firestore user profile with the real UID
    await db.collection("users").doc(uid).set({
      uid,
      email: user.email,
      name: user.name,
      role: user.role,
      busId: user.busId,
      ...(user.preferredStopId ? { preferredStopId: user.preferredStopId } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  console.log("[OK] Users seeded (Auth + Firestore)");
  console.log(`\nTest accounts created with password: ${TEST_PASSWORD}`);
  console.log("   - driver1@test.com (Driver)");
  console.log("   - adam@test.com (Passenger @ Dadar TT)");
  console.log("   - bob@test.com (Passenger @ Shivaji Park)");
  console.log("   - carol@test.com (Passenger @ Mahim Junction)");
  console.log("   - david@test.com (Passenger @ Bandra Station)");
  console.log("   - emma@test.com (Passenger @ Santacruz East)");
  console.log("   - frank@test.com (Passenger @ Juhu Beach)\n");
}

/* -----------------------------
   SEED ACTIVE TRIP
--------------------------------*/

/**
 * Generate a trip ID based on bus number and date (same logic as app)
 * Format: trip_{busId}_{YYYY_MM_DD}
 */
function generateTripId(busId, date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `trip_${busId}_${year}_${month}_${day}`;
}

async function seedTrip() {
  // Use date-based trip ID that matches the app's format
  const tripId = generateTripId("bus_1");
  const tripRef = db.collection("trips").doc(tripId);

  await tripRef.set({
    tripId: tripId,
    busId: "bus_1",
    routeId: "route_1",
    driverId: createdUsers.driver, // Use real driver UID
    startedAt: Date.now(),
    endedAt: null,
    currentStopId: "stop_dadar_tt",
    stopArrivedAt: Date.now(),
    status: "AT_STOP",
    location: {
      lat: 19.0192,
      lng: 72.8466,
    },
  });

  console.log(`[OK] Trip seeded: ${tripId}`);

  // Dummy wait request from Adam at first stop
  await tripRef.collection("waitRequests").doc(createdUsers.passenger1).set({
    passengerId: createdUsers.passenger1,
    stopId: "stop_dadar_tt",
    requestedAt: Date.now(),
  });

  // Dummy absence from Bob at second stop
  await tripRef.collection("absences").doc(createdUsers.passenger2).set({
    passengerId: createdUsers.passenger2,
    stopId: "stop_shivaji_park",
    markedAt: Date.now(),
  });

  console.log("[OK] Wait requests & absences seeded");
}

/* -----------------------------
   RUN
--------------------------------*/

async function run() {
  await resetDatabase();
  await seedRoutes();
  await seedUsers();
  await seedTrip();

  console.log("[DONE] Seeding complete");
  process.exit();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
