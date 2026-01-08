/**
 * Sign In Screen
 * 
 * Login form for existing users.
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_NAME, BUS_COLORS } from '@/constants/bus-tracker';
import { useApp } from '@/context/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAuthErrorMessage, sendPasswordReset } from '@/services/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function SignInScreen() {
  const router = useRouter();
  const { login, isAuthenticated } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSignIn = async () => {
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
      // Navigation handled by useEffect watching isAuthenticated
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
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={BUS_COLORS.primary} />
          <Text style={[styles.backText, { color: BUS_COLORS.primary }]}>Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.busIcon}>🚌</Text>
          <Text style={[styles.title, { color: textColor }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
            Sign in to continue to {APP_NAME}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <IconSymbol name="exclamationmark.circle" size={16} color={BUS_COLORS.danger} />
              <Text style={[styles.errorText, { color: BUS_COLORS.danger }]}>{error}</Text>
            </View>
          )}

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: BUS_COLORS.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: BUS_COLORS.primary },
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.switchContainer}>
            <Text style={[styles.switchText, { color: secondaryTextColor }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
              <Text style={[styles.switchLink, { color: BUS_COLORS.primary }]}>
                Register
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
