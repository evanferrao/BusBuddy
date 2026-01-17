/**
 * Settings Tab
 * 
 * App settings including:
 * - User profile info
 * - Role switching
 * - App info
 * - Logout
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_NAME, BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
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

export default function SettingsScreen() {
  const router = useRouter();
  const { userRole, userName, authUser, signOut } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

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
              // Navigate to home screen to show login
              router.replace('/(tabs)');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSwitchRole = () => {
    Alert.alert(
      'Switch Role',
      `You are currently a ${userRole === 'driver' ? 'Driver' : 'Passenger'}. To switch roles, you need to sign out and register with a different role.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigate to home screen to show login
              router.replace('/(tabs)');
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
          <IconSymbol name={userRole === 'driver' ? 'car.fill' : 'person.fill'} size={32} color="#fff" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userName || 'User'}</Text>
          <Text style={styles.profileRole}>
            {userRole === 'driver' ? 'Bus Driver' : 'Passenger'}
          </Text>
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
          <TouchableOpacity style={styles.menuItem} onPress={handleSwitchRole}>
            <View style={[styles.menuIcon, { backgroundColor: BUS_COLORS.info + '20' }]}>
              <IconSymbol name="arrow.triangle.2.circlepath" size={20} color={BUS_COLORS.info} />
            </View>
            <Text style={[styles.menuLabel, { color: textColor }]}>Switch Role</Text>
            <IconSymbol name="chevron.right" size={16} color={secondaryTextColor} />
          </TouchableOpacity>
          
          <View style={[styles.menuDivider, { backgroundColor: secondaryTextColor + '20' }]} />
          
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
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: BUS_COLORS.success + '20' }]}>
              <IconSymbol name="hand.raised" size={20} color={BUS_COLORS.success} />
            </View>
            <Text style={[styles.menuLabel, { color: textColor }]}>Privacy Policy</Text>
            <IconSymbol name="chevron.right" size={16} color={secondaryTextColor} />
          </TouchableOpacity>
          
          <View style={[styles.menuDivider, { backgroundColor: secondaryTextColor + '20' }]} />
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: BUS_COLORS.warning + '20' }]}>
              <IconSymbol name="doc.text" size={20} color={BUS_COLORS.warning} />
            </View>
            <Text style={[styles.menuLabel, { color: textColor }]}>Terms of Service</Text>
            <IconSymbol name="chevron.right" size={16} color={secondaryTextColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
          HOW IT WORKS
        </Text>
        
        <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
          {userRole === 'driver' ? (
            <>
              <InfoItem
                icon="location.fill"
                title="Share Your Location"
                description="Start tracking to share your real-time location with passengers on your route."
                textColor={textColor}
                secondaryTextColor={secondaryTextColor}
              />
              <InfoItem
                icon="bell.fill"
                title="Receive Notifications"
                description="Get notified when passengers want you to wait or skip their stop."
                textColor={textColor}
                secondaryTextColor={secondaryTextColor}
              />
              <InfoItem
                icon="person.2.fill"
                title="View Passenger Status"
                description="See which passengers are waiting, running late, or skipping today."
                textColor={textColor}
                secondaryTextColor={secondaryTextColor}
              />
            </>
          ) : (
            <>
              <InfoItem
                icon="bus"
                title="Track Your Bus"
                description="See real-time location, distance, and ETA for your bus."
                textColor={textColor}
                secondaryTextColor={secondaryTextColor}
              />
              <InfoItem
                icon="megaphone.fill"
                title="Notify the Driver"
                description="Send quick updates: Wait for me, Skip today, Running late, or Ready."
                textColor={textColor}
                secondaryTextColor={secondaryTextColor}
              />
              <InfoItem
                icon="clock.fill"
                title="Never Miss Your Bus"
                description="Get accurate arrival times so you're always ready when the bus comes."
                textColor={textColor}
                secondaryTextColor={secondaryTextColor}
              />
            </>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <IconSymbol name="bus" size={24} color={BUS_COLORS.primary} />
        <Text style={[styles.footerText, { color: secondaryTextColor }]}>
          {APP_NAME}
        </Text>
        <Text style={[styles.footerSubtext, { color: secondaryTextColor }]}>
          Never miss your school bus again!
        </Text>
      </View>
    </ScrollView>
  );
}

// Info Item Component
function InfoItem({
  icon,
  title,
  description,
  textColor,
  secondaryTextColor,
}: {
  icon: string;
  title: string;
  description: string;
  textColor: string;
  secondaryTextColor: string;
}) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIconContainer}>
        <IconSymbol name={icon as any} size={24} color={BUS_COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoTitle, { color: textColor }]}>{title}</Text>
        <Text style={[styles.infoDescription, { color: secondaryTextColor }]}>
          {description}
        </Text>
      </View>
    </View>
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileEmoji: {
    fontSize: 30,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
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
    alignItems: 'center',
    justifyContent: 'center',
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
  infoCard: {
    borderRadius: 16,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 32,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
  },
});
