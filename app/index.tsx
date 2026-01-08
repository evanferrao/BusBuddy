/**
 * Root Index
 * 
 * Handles initial routing based on authentication state:
 * - Not authenticated: Redirect to (auth)/welcome
 * - Authenticated as Driver: Redirect to (driver)
 * - Authenticated as Passenger/Student: Redirect to (passenger)
 * - Authenticated but no role: Redirect to role selection
 */

import { BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
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

  // Not authenticated - go to welcome screen
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Authenticated but no role - go to role selection
  if (!userRole) {
    return <Redirect href="/role-selection" />;
  }

  // Authenticated with role - go to appropriate dashboard
  if (userRole === 'driver') {
    return <Redirect href="/(driver)" />;
  }

  return <Redirect href="/(passenger)" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
