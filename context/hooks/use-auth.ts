/**
 * Auth Hook
 * 
 * Manages Firebase authentication state and actions.
 */

import * as AuthService from '@/services/auth';
import * as FirestoreService from '@/services/firestore';
import * as StorageService from '@/services/storage';
import { AuthUserData, UserRole } from '@/types';
import { useCallback, useEffect, useState } from 'react';

interface UseAuthReturn {
  isAuthenticated: boolean;
  authUser: AuthUserData | null;
  isLoading: boolean;
  userRole: UserRole;
  userName: string | null;
  userId: string | null;
  busId: string | null;
  preferredStopId: string | null;
  setAuthUser: (user: AuthUserData | null) => void;
  setUserRole: (role: UserRole) => void;
  setUserName: (name: string | null) => void;
  setUserId: (id: string | null) => void;
  setBusId: (busId: string | null) => void;
  setPreferredStopId: (stopId: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [busId, setBusId] = useState<string | null>('bus_1');
  const [preferredStopId, setPreferredStopId] = useState<string | null>('stop_dadar_tt');

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await FirestoreService.getUserData(firebaseUser.uid);
          if (userProfile) {
            const userData: AuthUserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: userProfile.name || firebaseUser.displayName,
              role: userProfile.role,
            };
            setAuthUser(userData);
            setIsAuthenticated(true);
            setUserRole(userProfile.role);
            setUserName(userProfile.name);
            setUserId(firebaseUser.uid);
            setBusId(userProfile.busId || 'bus_1');
            if (userProfile.preferredStopId) {
              setPreferredStopId(userProfile.preferredStopId);
            }
            
            await StorageService.saveAppState({
              userRole: userProfile.role,
              userName: userProfile.name,
              userId: firebaseUser.uid,
              onboardingComplete: true,
            });
          } else {
            // User exists in Auth but not in Firestore (incomplete registration)
            setAuthUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: null,
            });
            setIsAuthenticated(true);
            setUserRole(null);
            setUserId(firebaseUser.uid);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        // User is signed out
        setAuthUser(null);
        setIsAuthenticated(false);
        setUserRole(null);
        setUserName(null);
        setUserId(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    await AuthService.signInWithEmail(email, password);
  }, []);

  const register = useCallback(async (
    email: string, 
    password: string, 
    role: UserRole, 
    displayName: string
  ): Promise<void> => {
    const firebaseUser = await AuthService.signUpWithEmail(email, password);
    await AuthService.updateUserProfile(displayName);
    await FirestoreService.createUserProfile(
      firebaseUser.uid,
      email,
      displayName,
      role
    );
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await AuthService.signOut();
    await StorageService.clearAppData();
  }, []);

  return {
    isAuthenticated,
    authUser,
    isLoading,
    userRole,
    userName,
    userId,
    busId,
    preferredStopId,
    setAuthUser,
    setUserRole,
    setUserName,
    setUserId,
    setBusId,
    setPreferredStopId,
    login,
    register,
    signOut,
  };
}
