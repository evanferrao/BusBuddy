/**
 * Welcome Screen
 * 
 * Landing page for new users with options to sign in or register.
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_NAME, APP_TAGLINE, BUS_COLORS } from '@/constants/bus-tracker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.busIcon}>🚌</Text>
        <Text style={[styles.title, { color: BUS_COLORS.primary }]}>{APP_NAME}</Text>
        <Text style={[styles.tagline, { color: secondaryTextColor }]}>{APP_TAGLINE}</Text>
      </View>

      {/* Features */}
      <View style={styles.featuresSection}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: BUS_COLORS.primary + '20' }]}>
            <IconSymbol name="location.fill" size={24} color={BUS_COLORS.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: textColor }]}>Real-time Tracking</Text>
            <Text style={[styles.featureDescription, { color: secondaryTextColor }]}>
              Track your bus location in real-time
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: BUS_COLORS.success + '20' }]}>
            <IconSymbol name="bell.fill" size={24} color={BUS_COLORS.success} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: textColor }]}>Instant Notifications</Text>
            <Text style={[styles.featureDescription, { color: secondaryTextColor }]}>
              Get alerts when bus is approaching
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: BUS_COLORS.info + '20' }]}>
            <IconSymbol name="person.2.fill" size={24} color={BUS_COLORS.info} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: textColor }]}>Driver & Passenger</Text>
            <Text style={[styles.featureDescription, { color: secondaryTextColor }]}>
              Works for both drivers and passengers
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: BUS_COLORS.primary }]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 80,
  },
  busIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
  },
  featuresSection: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
  },
  actionSection: {
    gap: 16,
    paddingBottom: 40,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
