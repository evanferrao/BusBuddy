/**
 * Role Selection Screen
 * 
 * First screen users see when they open the app.
 * Allows them to choose between Driver and Student roles.
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_NAME, APP_TAGLINE, BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { setRole } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [selectedRole, setSelectedRole] = useState<'driver' | 'student' | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert('Select Role', 'Please select whether you are a Driver or Student');
      return;
    }
    
    if (!name.trim()) {
      Alert.alert('Enter Name', 'Please enter your name to continue');
      return;
    }

    setIsLoading(true);
    try {
      await setRole(selectedRole, name.trim());
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to save your selection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.busIcon}>🚌</Text>
          <Text style={[styles.title, { color: BUS_COLORS.primary }]}>{APP_NAME}</Text>
          <Text style={[styles.tagline, { color: secondaryTextColor }]}>{APP_TAGLINE}</Text>
        </View>

        {/* Role Selection */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>I am a...</Text>
        
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              { backgroundColor: cardColor },
              selectedRole === 'driver' && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole('driver')}
            activeOpacity={0.8}
          >
            <Text style={styles.roleEmoji}>🚗</Text>
            <Text style={[styles.roleTitle, { color: textColor }]}>Driver</Text>
            <Text style={[styles.roleDescription, { color: secondaryTextColor }]}>
              Share your location with students
            </Text>
            {selectedRole === 'driver' && (
              <View style={styles.checkmark}>
                <IconSymbol name="checkmark.circle.fill" size={24} color={BUS_COLORS.success} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              { backgroundColor: cardColor },
              selectedRole === 'student' && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole('student')}
            activeOpacity={0.8}
          >
            <Text style={styles.roleEmoji}>🎒</Text>
            <Text style={[styles.roleTitle, { color: textColor }]}>Student</Text>
            <Text style={[styles.roleDescription, { color: secondaryTextColor }]}>
              Track your bus & notify driver
            </Text>
            {selectedRole === 'student' && (
              <View style={styles.checkmark}>
                <IconSymbol name="checkmark.circle.fill" size={24} color={BUS_COLORS.success} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: textColor }]}>Your Name</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: cardColor, 
                color: textColor,
                borderColor: name ? BUS_COLORS.primary : 'transparent',
              },
            ]}
            placeholder="Enter your name"
            placeholderTextColor={secondaryTextColor}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: BUS_COLORS.primary },
            (!selectedRole || !name.trim()) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isLoading || !selectedRole || !name.trim()}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={[styles.infoText, { color: secondaryTextColor }]}>
          You can change your role later in Settings
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  busIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  roleCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  roleCardSelected: {
    borderWidth: 2,
    borderColor: BUS_COLORS.primary,
  },
  roleEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
  },
  continueButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    textAlign: 'center',
    fontSize: 14,
  },
});
