/**
 * Auth Layout
 * 
 * Stack navigator for authentication screens:
 * - Welcome
 * - Sign In
 * - Sign Up
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack 
      screenOptions={{ headerShown: false }}
      initialRouteName="welcome"
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
