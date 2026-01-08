// App-wide constants for School Bus Tracker

export const APP_NAME = 'Bus Buddy';
export const APP_TAGLINE = 'Never miss your school bus again!';

// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  APP_STATE: '@bus_buddy_app_state',
  USER_ROLE: '@bus_buddy_user_role',
  USER_ID: '@bus_buddy_user_id',
  USER_NAME: '@bus_buddy_user_name',
  BUS_ROUTE_ID: '@bus_buddy_bus_route_id',
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
  WAITING_TIME: 120, // Wait 2 minutes at stop by default (in seconds)
} as const;

// Stop color timing constants (in seconds)
export const STOP_COLOR_TIMING = {
  RED_DURATION: 300,    // 5 minutes - standard waiting window
  YELLOW_END: 420,      // 7 minutes - extended wait limit
} as const;

// Stop color configuration
export const STOP_COLOR_CONFIG = {
  GREY: {
    backgroundColor: '#8E8E93',
    textColor: '#FFFFFF',
    label: 'All Absent',
    description: 'All passengers marked absent - may skip stop',
    emoji: '⬜',
  },
  RED: {
    backgroundColor: '#FF3B30',
    textColor: '#FFFFFF',
    label: 'Waiting',
    description: 'Standard waiting window (0-5 min)',
    emoji: '🔴',
  },
  YELLOW: {
    backgroundColor: '#FFCC00',
    textColor: '#000000',
    label: 'Extended Wait',
    description: 'Wait request received (5-7 min)',
    emoji: '🟡',
  },
  GREEN: {
    backgroundColor: '#34C759',
    textColor: '#FFFFFF',
    label: 'Ready',
    description: 'In transit or stop complete',
    emoji: '🟢',
  },
} as const;

// Notification types with labels and colors
export const NOTIFICATION_CONFIG = {
  wait: {
    label: 'Please Wait',
    description: "I'm coming, please wait a moment!",
    color: '#FF9500',
    icon: 'clock.fill',
  },
  skip: {
    label: 'Skip Me Today',
    description: "I won't be taking the bus today",
    color: '#FF3B30',
    icon: 'xmark.circle.fill',
  },
  running_late: {
    label: 'Running Late',
    description: "I'm running a few minutes late",
    color: '#FFCC00',
    icon: 'figure.run',
  },
  ready: {
    label: 'Ready & Waiting',
    description: "I'm at the stop, ready to board",
    color: '#34C759',
    icon: 'checkmark.circle.fill',
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
    label: 'Skipping',
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
  grey: '#8E8E93', // Grey for absent status
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
