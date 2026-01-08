/**
 * Login Screen
 * 
 * Firebase authentication screen with:
 * - Email/password login
 * - Registration with role selection
 * - Password reset functionality
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_NAME, APP_TAGLINE, BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAuthErrorMessage, sendPasswordReset } from '@/services/auth';
import { UserRole } from '@/types';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type AuthMode = 'login' | 'register';

const LoginScreen = () => {
  const { login, register } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const backgroundColor = isDark ? BUS_COLORS.background.dark : BUS_COLORS.background.light;
  const cardColor = isDark ? BUS_COLORS.card.dark : BUS_COLORS.card.light;
  const textColor = isDark ? BUS_COLORS.text.dark : BUS_COLORS.text.light;
  const secondaryTextColor = isDark ? BUS_COLORS.textSecondary.dark : BUS_COLORS.textSecondary.light;

  const resetForm = () => {
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
      // Navigation will be handled by auth state change
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
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
      // Navigation will be handled by auth state change
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      await sendPasswordReset(email.trim());
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email for a link to reset your password.'
      );
    } catch (err: any) {
      Alert.alert('Error', getAuthErrorMessage(err.code));
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
          <Text style={[styles.title, { color: BUS_COLORS.primary }]}>{APP_NAME}</Text>
          <Text style={[styles.tagline, { color: secondaryTextColor }]}>{APP_TAGLINE}</Text>
        </View>

        {/* Mode Selector */}
        <View style={[styles.modeSelector, { backgroundColor: cardColor }]}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'login' && { backgroundColor: BUS_COLORS.primary },
            ]}
            onPress={() => switchMode('login')}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: mode === 'login' ? '#fff' : secondaryTextColor },
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'register' && { backgroundColor: BUS_COLORS.primary },
            ]}
            onPress={() => switchMode('register')}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: mode === 'register' ? '#fff' : secondaryTextColor },
              ]}
            >
              Register
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Input (Register only) */}
          {mode === 'register' && (
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
          )}

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

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
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
          )}

          {/* Role Selection (Register only) */}
          {mode === 'register' && (
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
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <IconSymbol name="exclamationmark.circle" size={16} color={BUS_COLORS.danger} />
              <Text style={[styles.errorText, { color: BUS_COLORS.danger }]}>{error}</Text>
            </View>
          )}

          {/* Forgot Password (Login only) */}
          {mode === 'login' && (
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: BUS_COLORS.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: BUS_COLORS.primary },
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch Mode Link */}
          <View style={styles.switchContainer}>
            <Text style={[styles.switchText, { color: secondaryTextColor }]}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={[styles.switchLink, { color: BUS_COLORS.primary }]}>
                {mode === 'login' ? 'Register' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  busIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
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

export default LoginScreen;