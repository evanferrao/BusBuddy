/**
 * Home Tab - Main Dashboard
 * 
 * Shows the appropriate dashboard based on user role:
 * - Driver: DriverDashboard
 * - Student: StudentDashboard
 * - Not set: Redirects to role selection
 */

import DriverDashboard from '@/components/driver-dashboard';
import StudentDashboard from '@/components/student-dashboard';
import { BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { userRole, isLoading } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Show loading state while checking stored role
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light }]}>
        <ActivityIndicator size="large" color={BUS_COLORS.primary} />
      </View>
    );
  }

  // Redirect to role selection if no role is set
  if (!userRole) {
    return <Redirect href="/role-selection" />;
  }

  // Show appropriate dashboard based on role
  return userRole === 'driver' ? <DriverDashboard /> : <StudentDashboard />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
