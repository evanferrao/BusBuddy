/**
 * Sign Up Screen
 * 
 * Registration form for new users with role selection.
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_NAME, BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAuthErrorMessage } from '@/services/auth';
import { UserRole } from '@/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SignUpScreen() {
  const router = useRouter();
  const { register, isAuthenticated } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Navigate when auth state changes to authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated]);

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!selectedRole) {
      setError('Please select your role (Driver or Passenger).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register(email.trim(), password, selectedRole, displayName.trim());
      // Navigation handled by useEffect watching isAuthenticated
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.busIcon}>🚌</Text>
          <Text style={[styles.title, { color: textColor }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
            Join {APP_NAME} today
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: textColor }]}>Your Name</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: cardColor, color: textColor },
              ]}
              placeholder="Enter your name"
              placeholderTextColor={secondaryTextColor}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: textColor }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: cardColor, color: textColor },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={secondaryTextColor}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: textColor }]}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  { backgroundColor: cardColor, color: textColor },
                ]}
                placeholder="Enter your password"
                placeholderTextColor={secondaryTextColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={[styles.eyeButton, { backgroundColor: cardColor }]}
                onPress={() => setShowPassword(!showPassword)}
              >
                <IconSymbol
                  name={showPassword ? 'eye.slash' : 'eye'}
                  size={20}
                  color={secondaryTextColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: textColor }]}>
              Confirm Password
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: cardColor, color: textColor },
              ]}
              placeholder="Confirm your password"
              placeholderTextColor={secondaryTextColor}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* Role Selection */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: textColor }]}>I am a...</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  { backgroundColor: cardColor },
                  selectedRole === 'driver' && styles.roleCardSelected,
                ]}
                onPress={() => setSelectedRole('driver')}
              >
                <Text style={styles.roleEmoji}>🚗</Text>
                <Text style={[styles.roleTitle, { color: textColor }]}>Driver</Text>
                {selectedRole === 'driver' && (
                  <View style={styles.checkmark}>
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={20}
                      color={BUS_COLORS.success}
                    />
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
              >
                <Text style={styles.roleEmoji}>🎒</Text>
                <Text style={[styles.roleTitle, { color: textColor }]}>Passenger</Text>
                {selectedRole === 'student' && (
                  <View style={styles.checkmark}>
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={20}
                      color={BUS_COLORS.success}
                    />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <IconSymbol name="exclamationmark.circle" size={16} color={BUS_COLORS.danger} />
              <Text style={[styles.errorText, { color: BUS_COLORS.danger }]}>{error}</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: BUS_COLORS.primary },
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.switchContainer}>
            <Text style={[styles.switchText, { color: secondaryTextColor }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/signin')}>
              <Text style={[styles.switchLink, { color: BUS_COLORS.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  busIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    height: 50,
  },
  passwordInput: {
    flex: 1,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeButton: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  roleCardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  roleEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  submitButton: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  switchText: {
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
