// App-wide constants for School Bus Tracker

export const APP_NAME = 'Bus Buddy';
export const APP_TAGLINE = 'Never miss your school bus again!';

// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  APP_STATE: '@bus_buddy_app_state',
  USER_ROLE: '@bus_buddy_user_role',
  USER_ID: '@bus_buddy_user_id',
  USER_NAME: '@bus_buddy_user_name',
  BUS_ID: '@bus_buddy_bus_id',
  PREFERRED_STOP_ID: '@bus_buddy_preferred_stop_id',
  DRIVER_DATA: '@bus_buddy_driver_data',
  STUDENT_DATA: '@bus_buddy_student_data',
} as const;

// Location tracking settings
export const LOCATION_CONFIG = {
  UPDATE_INTERVAL: 5000, // 5 seconds
  DISTANCE_FILTER: 10, // 10 meters minimum movement
  ACCURACY: 'high' as const,
  TIMEOUT: 15000, // 15 seconds timeout
} as const;

// Bus arrival thresholds (in meters)
export const ARRIVAL_THRESHOLDS = {
  APPROACHING: 500, // Show "approaching" when within 500m
  ARRIVED: 50, // Show "arrived" when within 50m
} as const;

// ============================================
// STOP COLOR CONFIGURATION (Per Specification)
// ============================================

// Stop timing thresholds (in seconds)
export const STOP_TIMING = {
  RED_DURATION: 300,        // 5 minutes - standard waiting window
  YELLOW_DURATION: 420,     // 7 minutes - extended wait with requests
} as const;

// Stop color definitions for UI (derived client-side, NEVER stored)
export const STOP_COLOR_CONFIG = {
  GREY: {
    label: 'All Absent',
    description: 'All passengers at this stop are absent',
    color: '#8E8E93',     // System gray
    canSkip: true,
  },
  RED: {
    label: 'Waiting',
    description: 'Standard waiting window (0-5 min)',
    color: '#FF3B30',     // System red
    canSkip: false,
  },
  YELLOW: {
    label: 'Extended Wait',
    description: 'Wait requests active (5-7 min)',
    color: '#FFCC00',     // System yellow
    canSkip: false,
  },
  GREEN: {
    label: 'Ready',
    description: 'In transit or stop completed',
    color: '#34C759',     // System green
    canSkip: true,
  },
} as const;

// Notification types with labels and colors (simplified per spec)
export const NOTIFICATION_CONFIG = {
  wait: {
    label: 'Wait for Me',
    description: "I'm coming, please wait!",
    color: '#FF9500',
    icon: 'clock.fill',
  },
  skip: {
    label: 'Absent Today',
    description: "I won't be taking the bus today",
    color: '#FF3B30',
    icon: 'xmark.circle.fill',
  },
} as const;

// Student status labels and colors
export const STUDENT_STATUS_CONFIG = {
  waiting: {
    label: 'Waiting',
    color: '#007AFF',
  },
  boarding: {
    label: 'Boarding',
    color: '#34C759',
  },
  skipping: {
    label: 'Absent',
    color: '#FF3B30',
  },
  onboard: {
    label: 'On Board',
    color: '#5856D6',
  },
  unknown: {
    label: 'Unknown',
    color: '#8E8E93',
  },
} as const;

// UI Colors specific to Bus Buddy app
export const BUS_COLORS = {
  primary: '#FF9500', // Orange - school bus color
  secondary: '#007AFF', // Blue
  success: '#34C759', // Green
  danger: '#FF3B30', // Red
  warning: '#FFCC00', // Yellow
  info: '#5856D6', // Purple
  grey: '#8E8E93', // Grey for absent stops
  background: {
    light: '#F2F2F7',
    dark: '#1C1C1E',
  },
  card: {
    light: '#FFFFFF',
    dark: '#2C2C2E',
  },
  text: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  textSecondary: {
    light: '#6C6C70',
    dark: '#98989F',
  },
} as const;
