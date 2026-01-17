/**
 * Driver Route Tab
 * 
 * Shows route stops for the driver.
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function DriverRouteScreen() {
  const {
    routeStops,
    currentStopIndex,
    isTracking,
  } = useApp();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = React.useState(false);

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Route</Text>
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          View all stops on your route
        </Text>
      </View>

      {/* Route Stops Section */}
      <View style={styles.routeSection}>
        <Text style={[styles.routeTitle, { color: textColor }]}>
          Route Stops ({routeStops.length})
        </Text>

        <View style={[styles.routeCard, { backgroundColor: cardColor }]}>
          {routeStops.map((stop, index) => (
            <View key={stop.stopId} style={styles.stopItem}>
              <View style={styles.stopIndicator}>
                <View
                  style={[
                    styles.stopDot,
                    { 
                      backgroundColor: index === currentStopIndex && isTracking 
                        ? BUS_COLORS.primary 
                        : index < currentStopIndex 
                          ? BUS_COLORS.success 
                          : secondaryTextColor 
                    },
                  ]}
                />
                {index < routeStops.length - 1 && (
                  <View style={[styles.stopLine, { backgroundColor: secondaryTextColor }]} />
                )}
              </View>
              <View style={styles.stopInfo}>
                <Text style={[
                  styles.stopName, 
                  { color: textColor },
                  index === currentStopIndex && isTracking && styles.currentStopText,
                ]}>
                  {stop.name}
                  {index === currentStopIndex && isTracking && (
                    <> <IconSymbol name="mappin" size={14} color={BUS_COLORS.primary} /></>
                  )}
                </Text>
                <Text style={[styles.stopTime, { color: secondaryTextColor }]}>
                  Scheduled: {stop.time}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
        <IconSymbol name="lightbulb.fill" size={24} color={BUS_COLORS.primary} />
        <Text style={[styles.infoText, { color: secondaryTextColor }]}>
          View all route stops with current progress indicated. Your current stop is highlighted with a pin emoji.
        </Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  infoEmoji: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  routeSection: {
    marginTop: 24,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  routeCard: {
    borderRadius: 16,
    padding: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stopIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stopLine: {
    width: 2,
    height: 36,
    marginTop: 4,
  },
  stopInfo: {
    flex: 1,
    paddingBottom: 16,
  },
  stopName: {
    fontSize: 16,
  },
  stopTime: {
    fontSize: 13,
    marginTop: 2,
  },
  currentStopText: {
    fontWeight: '600',
  },
});
