/**
 * Settings Screen Component
 * 
 * Shared settings screen component used by both driver and passenger.
 * Reduces code duplication by parameterizing role-specific elements.
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_NAME, BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SettingsScreenProps {
  /** User role to customize the display */
  role: 'driver' | 'passenger';
}

interface RoleConfig {
  icon: string;
  roleLabel: string;
  modeLabel: string;
}

const ROLE_CONFIG: Record<'driver' | 'passenger', RoleConfig> = {
  driver: {
    icon: 'car.fill',
    roleLabel: 'Bus Driver',
    modeLabel: 'Driver Mode',
  },
  passenger: {
    icon: 'person.fill',
    roleLabel: 'Passenger',
    modeLabel: 'Passenger Mode',
  },
};

export default function SettingsScreen({ role }: SettingsScreenProps) {
  const router = useRouter();
  const { userName, authUser, signOut } = useApp();
  const { backgroundColor, cardColor, textColor, secondaryTextColor } = useThemeColors();
  
  const config = ROLE_CONFIG[role];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/welcome');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Settings</Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: BUS_COLORS.primary }]}>
        <View style={styles.profileAvatar}>
          <IconSymbol name={config.icon} size={32} color="#fff" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {userName || (role === 'driver' ? 'Driver' : 'Passenger')}
          </Text>
          <Text style={styles.profileRole}>{config.roleLabel}</Text>
          {authUser?.email && (
            <Text style={styles.profileEmail}>{authUser.email}</Text>
          )}
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
          ACCOUNT
        </Text>
        
        <View style={[styles.menuGroup, { backgroundColor: cardColor }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: BUS_COLORS.danger + '20' }]}>
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={BUS_COLORS.danger} />
            </View>
            <Text style={[styles.menuLabel, { color: BUS_COLORS.danger }]}>Sign Out</Text>
            <IconSymbol name="chevron.right" size={16} color={secondaryTextColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
          ABOUT
        </Text>
        
        <View style={[styles.menuGroup, { backgroundColor: cardColor }]}>
          <View style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: BUS_COLORS.primary + '20' }]}>
              <IconSymbol name="info.circle" size={20} color={BUS_COLORS.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: textColor }]}>App Version</Text>
            <Text style={[styles.menuValue, { color: secondaryTextColor }]}>1.0.0</Text>
          </View>
          
          <View style={[styles.menuDivider, { backgroundColor: secondaryTextColor + '20' }]} />
          
          <View style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: BUS_COLORS.success + '20' }]}>
              <IconSymbol name="bus" size={20} color={BUS_COLORS.success} />
            </View>
            <Text style={[styles.menuLabel, { color: textColor }]}>{APP_NAME}</Text>
            <Text style={[styles.menuValue, { color: secondaryTextColor }]}>{config.modeLabel}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuGroup: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  menuValue: {
    fontSize: 14,
  },
  menuDivider: {
    height: 1,
    marginLeft: 64,
  },
});
