# BusBuddy Implementation Guide

## Overview

This implementation follows the technical specification for a real-time driver-passenger coordination system. The system allows:

- **Drivers**: Track location, manage trips, see stop-specific status with color codes
- **Passengers**: Request wait time, mark absence, view bus status

## Key Design Principles

1. **Authentication ≠ Authorization**: Firebase Auth for identity, Firestore for roles
2. **No colors in database**: All colors derived client-side from timestamps
3. **Trip-scoped actions**: Absences and wait requests reset per trip/day
4. **Deterministic time logic**: Based only on server timestamps
5. **Driver's phone as GPS**: No dedicated hardware needed

## Data Model

### Collections

#### `users/{uid}`
```typescript
{
  role: "driver" | "passenger",
  busId: "bus_1",
  preferredStopId: "stop_2", // passengers only
  displayName: string,
  email: string,
  createdAt: number,
  updatedAt: number
}
```

#### `buses/{busId}`
```typescript
{
  busNumber: "MH-01-1234",
  driverId: "uid_driver",
  activeTripId: "trip_2026_01_08" | null,
  stops: [
    {
      stopId: "stop_1",
      name: "Shivaji Nagar",
      lat: 19.123,
      lng: 72.321,
      scheduledTime: "07:45"
    }
  ]
}
```

#### `trips/{tripId}`
```typescript
{
  busId: "bus_1",
  driverId: "uid_driver",
  startedAt: Timestamp,
  currentStopId: "stop_2" | null,
  stopArrivedAt: Timestamp | null,
  status: "IN_TRANSIT" | "AT_STOP",
  location: { lat: number, lng: number }
}
```

#### `trips/{tripId}/waitRequests/{passengerId}`
```typescript
{
  passengerId: "uid_passenger",
  stopId: "stop_2",
  requestedAt: Timestamp
}
```

#### `trips/{tripId}/absences/{passengerId}`
```typescript
{
  passengerId: "uid_passenger",
  stopId: "stop_2",
  markedAt: Timestamp
}
```

## Business Logic

### Color State Machine

Computed client-side only, never stored:

```typescript
if (allPassengersAbsent) {
  color = "GREY";
} else if (elapsed <= 300) {
  color = "RED";
} else if (hasWaitRequests && elapsed <= 420) {
  color = "YELLOW";
} else {
  color = "GREEN";
}
```

**Color Meanings:**
- **GREY**: All passengers at stop are absent (skip available)
- **RED**: Standard waiting window (0-5 minutes)
- **YELLOW**: Extended wait due to requests (5-7 minutes)
- **GREEN**: In transit or wait time exceeded

### Wait Request Rules

Enabled only if:
- Passenger has NOT marked absence
- Passenger's preferredStopId === currentStopId
- Trip status = AT_STOP
- Time elapsed since arrival ≤ 420 seconds (7 minutes)

### Absence Rules

- Can be marked once per trip
- Final and cannot be undone
- Disables wait requests for that trip
- Automatically resets on next trip

## Setup Instructions

### 1. Firebase Configuration

The Firebase config is already set up in `services/firebase-config.ts`. Make sure your Firebase project has:

- Authentication enabled (Email/Password)
- Firestore database created
- Security rules deployed (from `firestore.rules`)

### 2. Initialize Sample Data

See `scripts/sample-data-init.ts` for:
- Sample data structure
- Manual setup instructions via Firebase Console
- TypeScript helper functions (if using Firebase Admin SDK)

### 3. Create Test Users

**Driver:**
1. Create Firebase Auth account
2. Add to Firestore `users` collection with `role: "driver"` and `busId`

**Passengers:**
1. Create Firebase Auth accounts
2. Add to Firestore `users` collection with `role: "passenger"`, `busId`, and `preferredStopId`

### 4. Create a Bus

Add to Firestore `buses` collection with:
- Driver assignment
- Route stops with coordinates and scheduled times

## Testing the System

### Driver Flow

1. **Sign in** as driver
2. **Start Trip** - Creates a trip document and begins location tracking
3. **Arrive at Stop** - Tap "Arrive" button for a stop
   - Sets `currentStopId` and `stopArrivedAt`
   - Changes status to "AT_STOP"
4. **Monitor Stop Status**:
   - See color indicator (RED → YELLOW → GREEN)
   - View countdown timer
   - Check wait request count
   - See if all students absent (GREY)
5. **Leave Stop** - Continue to next stop
6. **Stop Trip** - End the trip when route is complete

### Passenger Flow

1. **Sign in** as passenger
2. **View Bus Status**:
   - See if bus is active
   - Check distance to your stop
   - See stop color state
3. **Mark Absent** (if not coming):
   - One-time action per trip
   - Final and cannot be undone
4. **Send Wait Request** (when bus arrives):
   - Only available when bus is at your stop
   - Can only send within 7-minute window
   - Cannot send if already marked absent

### Color State Testing

**Test GREY State:**
1. Have all passengers at a stop mark themselves absent
2. Driver arrives at that stop
3. Should see GREY color and "All students absent" message

**Test RED → YELLOW → GREEN:**
1. Driver arrives at stop with passengers
2. Initially shows RED (0-5 minutes)
3. If passenger sends wait request after 5 minutes, shows YELLOW
4. After 7 minutes, shows GREEN regardless

## File Structure

```
services/
  ├── buses.ts              # Bus CRUD operations
  ├── trips.ts              # Trip lifecycle management
  ├── wait-requests.ts      # Wait request subcollection
  ├── absences.ts           # Absence subcollection
  ├── business-logic.ts     # Color state machine & validations
  └── firestore.ts          # User management

components/
  ├── new-driver-dashboard.tsx    # Driver UI
  └── new-passenger-dashboard.tsx # Passenger UI

types/
  └── index.ts              # TypeScript type definitions

firestore.rules               # Security rules
```

## Security Rules

The security rules ensure:
- Users can only read/write their own data
- Only drivers can update trips
- Only passengers can create wait requests and absences for themselves
- Role verification happens via Firestore, not client claims

## Common Issues & Solutions

### "No bus assigned"
- Make sure user document has `busId` field
- Passengers need `preferredStopId` as well

### "Cannot send wait request"
- Check if passenger marked absent
- Verify bus is at passenger's preferred stop
- Ensure trip status is "AT_STOP"
- Check if within 7-minute window

### Color not updating
- Colors are computed client-side from timestamps
- Auto-refresh runs every 1-2 seconds when at stop
- Pull to refresh manually if needed

### Trip not starting
- Verify location permissions are granted
- Check that driver has a bus assigned
- Ensure bus document exists in Firestore

## Architecture Decisions

### Why no backend server?
- Firestore real-time updates handle all synchronization
- Client-side computation keeps costs low
- No cron jobs or timers needed
- Scales automatically with Firestore

### Why store timestamps not colors?
- Deterministic: anyone can compute the same color from same data
- No race conditions
- Offline-safe
- Easy to reason about

### Why trip-scoped data?
- Automatic daily reset
- No cleanup jobs needed
- Clear data lifecycle
- Easy to audit

## Performance Considerations

- Real-time subscriptions are scoped to single trip document
- Subcollection queries are indexed by stopId
- Location updates throttled to 5 seconds / 10 meters
- Stop status updates throttled to 1-2 seconds

## Future Enhancements

Possible additions (not in current scope):
- Push notifications
- Historical trip analytics
- Route optimization
- Parent/guardian mode
- Offline support improvements
- Map visualization
