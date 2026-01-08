/**
 * Firebase Configuration
 * 
 * Initialize Firebase with the JS SDK for Expo compatibility.
 * Replace the placeholder values with your actual Firebase config.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5jBmx-VCZ8HGTk2YeruzyfQqoqh-30Ts",
  authDomain: "busbuddy-d93ae.firebaseapp.com",
  projectId: "busbuddy-d93ae",
  storageBucket: "busbuddy-d93ae.firebasestorage.app",
  messagingSenderId: "844598876102",
  appId: "1:844598876102:web:ed1e2fca7ceb58ecbc04c7"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
