# 🚌 Bus Buddy

**Never miss your school bus again!**

Bus Buddy is a cross-platform mobile app built with React Native and Expo that connects school bus drivers with students. It solves a common problem in rural India and other areas where buses don't have GPS tracking hardware.

## 📐 Architecture

Bus Buddy uses a **real-time, multi-user, event-driven** architecture built on Firebase/Firestore.

### Core Principle

> **We store only atomic facts. We never store computed summaries (counts, yes/no arrays, colors).**

All totals, yes/no states, and colors are **derived on the client**.

### Firestore Data Model

```
├── users/{uid}                          # User profiles with role and bus assignment
├── buses/{busId}                        # Bus info with static route stops
├── trips/{tripId}                       # Live trip state (location, current stop)
│   ├── waitRequests/{uid}               # Wait request documents (atomic facts)
│   └── absences/{uid}                   # Absence documents (atomic facts)
```

### Stop Color Logic (Derived Client-Side)

Colors are **never stored** in the database. They are computed from timestamps and counts:

| Color  | Condition | Driver Action |
|--------|-----------|---------------|
| GREY   | All passengers at stop are absent | Can skip |
| RED    | Standard waiting window (0-5 min) | Must wait |
| YELLOW | Extended wait with requests (5-7 min) | Should wait |
| GREEN  | In transit or stop passed | Proceed |

### Key Files

- `types/index.ts` - Type definitions for the data model
- `services/trip-service.ts` - Trip lifecycle, wait requests, absences, color computation
- `services/route-service.ts` - Static route data operations
- `firestore.rules` - Security rules for role-based access
- `firestore.indexes.json` - Required indexes for queries

## 🎭 Features

### For Drivers
- **Live Location Sharing**: Share your real-time location with students using your phone's GPS
- **Stop Status Display**: See color-coded stop status (RED/YELLOW/GREY/GREEN) with countdown timers
- **Student Notifications**: Receive instant notifications for wait requests and absences
- **Student Status Overview**: See which students are waiting or absent at each stop
- **Route Management**: View all stops and students on your route

### For Students (Passengers)
- **Real-time Bus Tracking**: See the bus location, distance, and ETA on a beautiful dashboard
- **Quick Actions**:
  - ⏳ **Wait for Me** - Request the driver to wait (extends waiting to 7 minutes)
  - ❌ **Absent Today** - Mark yourself as absent for the trip
- **Route Information**: View all stops on your route

## 🛠 Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Backend**: Firebase (Firestore, Authentication)
- **Navigation**: Expo Router (file-based routing)
- **Location**: expo-location
- **Storage**: @react-native-async-storage/async-storage
- **Language**: TypeScript

## 🚀 Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

## 📁 Project Structure

```
BusBuddy/
├── app/                          # Screens (Expo Router)
│   ├── _layout.tsx              # Root layout with providers
│   ├── role-selection.tsx       # Initial role selection screen
│   ├── (driver)/                # Driver-specific screens
│   ├── (passenger)/             # Passenger-specific screens
│   └── (tabs)/                  # Tab-based navigation
├── components/
│   ├── driver-dashboard.tsx     # Driver's main screen with stop status
│   ├── student-dashboard.tsx    # Student's main screen with quick actions
├── constants/
│   └── bus-tracker.ts           # Stop timing, colors, notification config
├── context/
│   └── app-context.tsx          # Global state management
├── services/
│   ├── trip-service.ts          # Trip operations, wait/absence, color logic
│   ├── route-service.ts         # Static route data operations
│   ├── firestore.ts             # User profile operations
│   ├── location.ts              # GPS tracking service
│   ├── mock-data.ts             # Mock backend for development
│   └── storage.ts               # Async storage service
├── types/
│   └── index.ts                 # TypeScript type definitions
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Required Firestore indexes
```

## 💡 How It Works

### For Drivers
1. Open the app and select "Driver" role
2. Tap "Start Trip" to begin sharing your location
3. At each stop, see the color-coded status and countdown timer
4. Wait for RED (5 min) or YELLOW (7 min with wait requests)
5. Skip GREY stops (all students absent)
6. Tap "End Trip" when finished

### For Students  
1. Open the app and select "Student" role
2. View the bus status (live/offline, distance, ETA)
3. Use "Wait for Me" if you need extra time
4. Use "Absent Today" if you won't take the bus
5. Plan your time based on the ETA

## 🗺 Roadmap

- [x] Firebase/Firestore integration for real-time data sync
- [x] User authentication
- [x] Stop color logic with time-based states
- [x] Wait requests and absence tracking
- [ ] Push notifications
- [ ] Map view with bus route visualization
- [ ] Multiple bus routes support
- [ ] Parent mode (track child's bus)
- [ ] Offline support

---

Made with ❤️ for students who never want to miss their school bus again!

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
