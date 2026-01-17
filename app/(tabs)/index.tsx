/**
 * Home Tab - Main Dashboard
 * 
 * Shows the appropriate view based on authentication and user role:
 * - Not authenticated: Redirects to auth screens
 * - Authenticated as Driver: DriverDashboard
 * - Authenticated as Passenger: PassengerDashboard
 * - Authenticated but no role: Redirects to role selection
 */

import DriverDashboard from '@/components/driver-dashboard';
import PassengerDashboard from '@/components/passenger-dashboard';
import { BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { isAuthenticated, userRole, isLoading } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Show loading state while checking auth state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light }]}>
        <ActivityIndicator size="large" color={BUS_COLORS.primary} />
      </View>
    );
  }

  // Redirect to auth screens if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Redirect to role selection if authenticated but no role is set
  if (!userRole) {
    return <Redirect href="/role-selection" />;
  }

  // Show appropriate dashboard based on role
  return userRole === 'driver' ? <DriverDashboard /> : <PassengerDashboard />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
