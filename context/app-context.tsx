/**
 * App Context
 * 
 * Global state management for the Bus Buddy app.
 * Provides user role, tracking state, and notifications across all screens.
 */

import * as LocationService from '@/services/location';
import * as MockData from '@/services/mock-data';
import * as StorageService from '@/services/storage';
import { Location, Student, StudentNotification, UserRole } from '@/types';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface AppContextType {
  // User state
  userRole: UserRole;
  userName: string | null;
  userId: string | null;
  isLoading: boolean;
  
  // Location tracking (driver)
  isTracking: boolean;
  currentLocation: Location | null;
  
  // Bus location (student view)
  busLocation: Location | null;
  isDriverActive: boolean;
  
  // Notifications
  notifications: StudentNotification[];
  unreadCount: number;
  
  // Students list (for driver)
  students: Student[];
  
  // Actions
  setRole: (role: UserRole, name: string) => Promise<void>;
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  sendNotification: (type: 'wait' | 'skip' | 'running_late' | 'ready', message?: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  refreshBusLocation: () => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // User state
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Location state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [busLocation, setBusLocation] = useState<Location | null>(null);
  const [isDriverActive, setIsDriverActive] = useState(false);
  
  // Notifications
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  
  // Students
  const [students, setStudents] = useState<Student[]>([]);

  // Load initial state from storage
  useEffect(() => {
    loadAppState();
  }, []);

  // Poll for bus location updates (for students)
  useEffect(() => {
    if (userRole === 'student') {
      const interval = setInterval(() => {
        refreshBusLocation();
        // Also refresh notifications for student to see their sent notifications
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  // Poll for notifications (for driver)
  useEffect(() => {
    if (userRole === 'driver') {
      const interval = setInterval(() => {
        const newNotifications = MockData.getNotifications();
        setNotifications(newNotifications);
        setStudents(MockData.getStudents());
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const loadAppState = async () => {
    try {
      const state = await StorageService.getAppState();
      setUserRole(state.userRole);
      setUserName(state.userName);
      setUserId(state.userId);
      
      // Load initial data
      setStudents(MockData.getStudents());
      setIsDriverActive(MockData.isDriverTracking());
      setBusLocation(MockData.getBusLocation());
    } catch (error) {
      console.error('Error loading app state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setRole = async (role: UserRole, name: string) => {
    try {
      const id = `${role}-${Date.now()}`;
      await StorageService.saveAppState({
        userRole: role,
        userName: name,
        userId: id,
        onboardingComplete: true,
      });
      setUserRole(role);
      setUserName(name);
      setUserId(id);
    } catch (error) {
      console.error('Error setting role:', error);
      throw error;
    }
  };

  const startTracking = async (): Promise<boolean> => {
    const success = await LocationService.startLocationTracking(
      (location) => {
        setCurrentLocation(location);
        MockData.updateBusLocation(location);
      },
      (error) => {
        console.error('Location error:', error);
      }
    );
    
    if (success) {
      setIsTracking(true);
      MockData.setDriverActive(true);
      setIsDriverActive(true);
    }
    
    return success;
  };

  const stopTracking = () => {
    LocationService.stopLocationTracking();
    setIsTracking(false);
    setCurrentLocation(null);
    MockData.setDriverActive(false);
    setIsDriverActive(false);
  };

  const sendNotification = useCallback((
    type: 'wait' | 'skip' | 'running_late' | 'ready',
    message?: string
  ) => {
    if (!userId) return;
    
    try {
      // Use a mock student ID for demo purposes
      const studentId = 'student-1';
      MockData.sendStudentNotification(studentId, type, message);
      
      // Update local notifications state
      setNotifications(MockData.getNotifications());
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [userId]);

  const markNotificationRead = useCallback((id: string) => {
    MockData.markNotificationRead(id);
    setNotifications(MockData.getNotifications());
  }, []);

  const clearAllNotifications = useCallback(() => {
    MockData.clearNotifications();
    setNotifications([]);
  }, []);

  const refreshBusLocation = useCallback(() => {
    const location = MockData.getBusLocation();
    setBusLocation(location);
    setIsDriverActive(MockData.isDriverTracking());
  }, []);

  const logout = async () => {
    // Stop any active tracking
    if (isTracking) {
      stopTracking();
    }
    
    // Clear storage
    await StorageService.clearAppData();
    
    // Reset state
    setUserRole(null);
    setUserName(null);
    setUserId(null);
    setCurrentLocation(null);
    setBusLocation(null);
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        userRole,
        userName,
        userId,
        isLoading,
        isTracking,
        currentLocation,
        busLocation,
        isDriverActive,
        notifications,
        unreadCount,
        students,
        setRole,
        startTracking,
        stopTracking,
        sendNotification,
        markNotificationRead,
        clearAllNotifications,
        refreshBusLocation,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
