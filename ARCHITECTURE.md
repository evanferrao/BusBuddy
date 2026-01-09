# BusBuddy Architecture

This document describes the real-time Firebase architecture implemented in BusBuddy, following the technical specification for a production-grade school bus coordination system.

## Core Principle

**Store only atomic facts. Never store computed summaries.**

All totals, status indicators, and colors are **derived on the client**. This ensures:
- No race conditions
- No data inconsistencies
- Real-time safety
- Offline tolerance

## Data Model

### 1. Static Route Data

**Collection:** `buses/{busId}`

Stores permanent bus route information that doesn't change during trips.

```typescript
{
  busId: "bus_1",
  busNumber: "Bus 1",
  driverId: "uid_driver",
  activeTripId: "trip_bus_1_2026_01_09" | null,
  stops: [
    {
      stopId: "stop_1",
      name: "Ganesh Nagar",
      lat: 26.9124,
      lng: 75.7873,
      scheduledTime: "07:00"
    },
    // ... more stops
  ]
}
```

### 2. User Profiles

**Collection:** `users/{uid}`

Each user (driver or passenger) has a profile.

```typescript
{
  uid: "user_123",
  email: "student@example.com",
  displayName: "John Doe",
  role: "student" | "driver",
  busId: "bus_1",
  preferredStopId: "stop_1",  // Passengers only
  createdAt: 1234567890,
  updatedAt: 1234567890
}
```

### 3. Trip State (Live Data)

**Collection:** `trips/{tripId}`

Active trip information, updated in real-time.

```typescript
{
  tripId: "trip_bus_1_2026_01_09",
  busId: "bus_1",
  driverId: "uid_driver",
  startedAt: 1234567890,
  endedAt: 1234567890 | undefined,
  currentStopId: "stop_2" | null,
  stopArrivedAt: 1234567890 | null,
  status: "IN_TRANSIT" | "AT_STOP",
  location: {
    lat: 26.9124,
    lng: 75.7873
  }
}
```

### 4. Wait Requests

**Collection:** `trips/{tripId}/waitRequests/{passengerId}`

Atomic facts: "This passenger requested to wait"

```typescript
{
  passengerId: "uid_123",
  stopId: "stop_1",
  requestedAt: 1234567890
}
```

### 5. Absences

**Collection:** `trips/{tripId}/absences/{passengerId}`

Atomic facts: "This passenger is absent"

```typescript
{
  passengerId: "uid_123",
  stopId: "stop_1",
  markedAt: 1234567890
}
```

## Stop Color Logic (Client-Side Computation)

Colors are **NEVER stored** in the database. They are computed in real-time based on:

1. **GREY** – All passengers at stop are absent (can skip)
2. **RED** – Standard waiting period (0-5 minutes)
3. **YELLOW** – Extended wait due to requests (5-7 minutes with wait requests)
4. **GREEN** – In transit or stop completed

### Computation Logic

```typescript
function computeStopColor(
  tripStatus: TripStatus,
  isCurrentStop: boolean,
  stopArrivedAt: number | null,
  totalPassengers: number,
  absentCount: number,
  waitRequestCount: number
): StopColor {
  // Not at stop = GREEN
  if (tripStatus !== 'AT_STOP' || !isCurrentStop || !stopArrivedAt) {
    return 'GREEN';
  }

  // All passengers absent = GREY
  if (totalPassengers > 0 && absentCount === totalPassengers) {
    return 'GREY';
  }

  // Calculate elapsed time
  const elapsed = Math.floor((Date.now() - stopArrivedAt) / 1000);

  // RED: 0-5 minutes (standard wait)
  if (elapsed <= 300) {
    return 'RED';
  }

  // YELLOW: 5-7 minutes with wait requests
  if (waitRequestCount > 0 && elapsed <= 420) {
    return 'YELLOW';
  }

  // GREEN: Time exceeded
  return 'GREEN';
}
```

## Key Services

### bus-service.ts

- `getBus(busId)` - Get bus route data
- `saveBus(bus)` - Create/update bus
- `ensureBusDataExists()` - Auto-seed database with default routes

### trip-service.ts

**Trip Management:**
- `startTrip(busId, driverId, location)` - Start new trip
- `endTrip(tripId, busId)` - End trip
- `updateTripLocation(tripId, location)` - Update GPS location
- `arriveAtStop(tripId, stopId)` - Mark arrival at stop
- `departFromStop(tripId)` - Depart from current stop

**Passenger Actions:**
- `sendWaitRequest(tripId, passengerId, stopId)` - Request wait
- `markAbsence(tripId, passengerId, stopId)` - Mark absent

**Real-Time Subscriptions:**
- `subscribeToTrip(tripId, callback)` - Listen to trip updates
- `subscribeToWaitRequests(tripId, callback)` - Listen to wait requests
- `subscribeToAbsences(tripId, callback)` - Listen to absences

**Client-Side Computation:**
- `computeStopColor(...)` - Calculate stop color
- `computeStopState(...)` - Calculate full stop state
- `getRemainingTime(stopState)` - Get countdown time

### firestore.ts

- User profile management
- Role and preferences management

## Application Flow

### Driver Flow

1. **Start Trip:**
   - Press "Start Trip"
   - Request location permissions
   - Call `startTracking()` → creates trip in Firebase
   - GPS location updates every few seconds

2. **At Each Stop:**
   - Press "Arrive at Next Stop" → `arriveAtStop(stopId)`
   - System computes stop color:
     - Shows RED (5 min countdown)
     - If wait requests, extends to YELLOW (7 min)
     - If all absent, shows GREY
   - Press "Depart" → `departFromStop()`

3. **End Trip:**
   - Press "End Trip"
   - Stops GPS tracking
   - Marks trip as ended in Firebase

### Passenger Flow

1. **View Bus Status:**
   - See real-time bus location
   - See distance and ETA to their stop
   - Updates every second via subscriptions

2. **Send Wait Request:**
   - Press "Wait for Me"
   - Creates document in `waitRequests` subcollection
   - Driver sees notification immediately
   - Enables YELLOW state for extended wait

3. **Mark Absence:**
   - Press "Absent Today"
   - Creates document in `absences` subcollection
   - Driver sees notification immediately
   - Disables "Wait for Me" button for rest of trip
   - If all at stop are absent, stop shows GREY

## Real-Time Updates

The system uses Firebase's real-time listeners (`onSnapshot`) for:

- **Trip location** - Updates bus position on student's map
- **Wait requests** - Notifies driver immediately
- **Absences** - Notifies driver immediately
- **Stop state** - Recomputes colors every second when at stop

## Security Considerations

1. **Firestore Rules:** Currently open for development. Should be restricted to:
   - Users can only read/write their own profile
   - Drivers can only write to their bus's trips
   - Passengers can only write wait/absence for themselves

2. **Data Validation:** All inputs should be validated server-side using Firebase Security Rules or Cloud Functions

3. **Authentication:** Firebase Authentication ensures only authenticated users can access the system

## Database Initialization

On first run, the system automatically:

1. Checks if buses exist in the database
2. If not, seeds with default bus data (5 stops in Jaipur area)
3. Creates bus documents with route information

To manually seed: Call `BusService.seedBusData()`

## Testing Locally

1. Start the app: `npm start`
2. Sign up as a driver or student
3. Driver: Start trip, arrive at stops, see notifications
4. Student: Send wait requests, mark absence
5. Verify real-time updates between driver and student views

## Architecture Benefits

✅ **Real-time safe** - No race conditions from concurrent updates
✅ **Scalable** - Works with any number of passengers/drivers
✅ **Offline-tolerant** - Firebase handles offline state
✅ **Firebase-native** - Uses best practices for Firestore
✅ **No computed data stored** - All summaries derived on client
✅ **Uber-like architecture** - Proven pattern for real-time tracking

## Future Enhancements

- Push notifications (FCM)
- Map view with route visualization
- Multiple trips per day
- Historical trip data
- Admin panel for route management
- Parent mode (track child's bus)
