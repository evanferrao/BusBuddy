# 🚌 Bus Buddy

**Never miss your school bus again!**

Bus Buddy is a cross-platform mobile app built with React Native and Expo that connects school bus drivers with students. It solves a common problem in rural India and other areas where buses don't have GPS tracking hardware.

## � Features

### For Drivers
- **Live Location Sharing**: Share your real-time location with students using your phone's GPS
- **Student Notifications**: Receive instant notifications when students want you to wait, skip, or are ready
- **Student Status Overview**: See which students are waiting, running late, or skipping for the day
- **Route Management**: View all stops and students on your route

### For Students
- **Real-time Bus Tracking**: See the bus location, distance, and ETA on a beautiful dashboard
- **Quick Notifications**: Send one-tap notifications to the driver:
  - ⏳ **Wait for Me** - "I'm coming, please wait!"
  - ❌ **Skip Today** - "I won't be taking the bus today"
  - 🏃 **Running Late** - "I'm a few minutes behind"
  - ✅ **Ready** - "I'm at the stop, ready to board"
- **Route Information**: View all stops on your route

## 🛠 Tech Stack

- **Framework**: React Native with Expo SDK 54
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
myApp/
├── app/                          # Screens (Expo Router)
│   ├── _layout.tsx              # Root layout with providers
│   ├── role-selection.tsx       # Initial role selection screen
│   └── (tabs)/                  # Tab-based navigation
│       ├── index.tsx            # Home (shows dashboard based on role)
│       ├── notifications.tsx    # Notifications/Activity tab
│       └── settings.tsx         # Settings tab
├── components/
│   ├── driver-dashboard.tsx     # Driver's main screen
│   ├── student-dashboard.tsx    # Student's main screen
├── constants/
│   └── bus-tracker.ts           # App-specific constants
├── context/
│   └── app-context.tsx          # Global state management
├── services/
│   ├── location.ts              # GPS tracking service
│   ├── mock-data.ts             # Mock backend (replace with real API)
│   └── storage.ts               # Async storage service
├── types/
│   └── index.ts                 # TypeScript type definitions
```

## 💡 How It Works

### For Drivers
1. Open the app and select "Driver" role
2. Tap "Start" to begin sharing your location
3. Students on your route will see your real-time location
4. Receive notifications when students send messages
5. Tap "Stop" when you're done with the route

### For Students  
1. Open the app and select "Student" role
2. View the bus status (live/offline, distance, ETA)
3. Send quick notifications to the driver as needed
4. Plan your time based on the ETA

## 🗺 Roadmap / Future Enhancements

- [ ] Firebase/Supabase integration for real-time data sync
- [ ] User authentication
- [ ] Push notifications
- [ ] Map view with bus route visualization
- [ ] Multiple bus routes support
- [ ] Parent mode (track child's bus)
- [ ] Offline support

---

Made with ❤️ for students who never want to miss their school bus again!

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
