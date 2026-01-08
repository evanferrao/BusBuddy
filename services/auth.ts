/**
 * Authentication Service
 * 
 * Handles Firebase authentication including:
 * - Email/password sign in and sign up
 * - Auth state management
 * - Sign out functionality
 */

import {
    createUserWithEmailAndPassword,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile,
    User,
} from 'firebase/auth';
import { auth } from './firebase-config';

export type AuthUser = User | null;
export type AuthStateCallback = (user: AuthUser) => void;

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('Login error:', error.code, error.message);
    throw error;
  }
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User registered:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('Registration error:', error.code, error.message);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('User signed out');
  } catch (error: any) {
    console.error('Sign out error:', error.code, error.message);
    throw error;
  }
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = (): AuthUser => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 * Returns an unsubscribe function
 */
export const onAuthStateChanged = (callback: AuthStateCallback) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

/**
 * Update user display name
 */
export const updateUserProfile = async (displayName: string) => {
  const user = auth.currentUser;
  if (user) {
    try {
      await updateProfile(user, { displayName });
      console.log('User profile updated');
    } catch (error: any) {
      console.error('Profile update error:', error.code, error.message);
      throw error;
    }
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent');
  } catch (error: any) {
    console.error('Password reset error:', error.code, error.message);
    throw error;
  }
};

/**
 * Get user-friendly error message from Firebase auth error code
 */
export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please register first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An error occurred. Please try again.';
  }
};