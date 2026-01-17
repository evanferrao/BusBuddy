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
  apiKey: "AIzaSyDieByOV-ZVTegS-wfmDx0prk9Mkmpra6A",
  authDomain: "busbuddy-b8641.firebaseapp.com",
  projectId: "busbuddy-b8641",
  storageBucket: "busbuddy-b8641.firebasestorage.app",
  messagingSenderId: "886333758452",
  appId: "1:886333758452:web:4d6a04fc8e54da54bfb7a1"
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
