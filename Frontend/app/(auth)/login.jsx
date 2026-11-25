import React, { useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  Divider,
} from '../../components/ui';
import { Card } from '../../components/cards';
import { FormInput } from '../../components/forms';
import { COLORS } from '../../constants/theme';
import { isValidEmail } from '../../utils/validators';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!isValidEmail(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    setServerError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
      // Auth state will trigger navigation in RootLayout or router.replace
      router.replace('/(tabs)');
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setServerError(null);
    try {
      // In native production, this uses GoogleSignin.signIn() to obtain the idToken.
      // Here we alert guidance or prompt test token if on simulator/dev:
      Alert.prompt
        ? Alert.prompt(
            'Google Sign-In',
            'Enter Google ID Token to authenticate with backend:',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign In',
                onPress: async (testToken) => {
                  if (!testToken) return;
                  setIsSubmitting(true);
                  try {
                    await loginWithGoogle(testToken);
                    router.replace('/(tabs)');
                  } catch (err) {
                    setServerError(err.message || 'Google authentication failed');
                  } finally {
                    setIsSubmitting(false);
                  }
                },
              },
            ],
            'plain-text'
          )
        : Alert.alert(
            'Google Sign-In',
            'Google OAuth requires an OAuth client ID configured on native devices. You can also sign in with email and password.',
            [{ text: 'OK' }]
          );
    } catch (err) {
      setServerError(err.message || 'Google authentication failed');
    }
  };

  return (
    <ScreenContainer scrollable keyboardAware padded edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Navigation */}
      <View className="flex-row items-center justify-between py-2 mb-4">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'))}
          hitSlop={8}
          accessibilityLabel="Go back"
          className="w-10 h-10 rounded-full bg-white border border-ink-200 items-center justify-center shadow-xs"
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </Pressable>

        <View className="flex-row items-center gap-1.5">
          <Ionicons name="boat" size={18} color={COLORS.primary} />
          <Typography variant="bodySmall" color="ocean" style={{ fontWeight: '700' }}>
            Samundar Ke Sath
          </Typography>
        </View>

        <View className="w-10" />
      </View>

      {/* Screen Header */}
      <View className="mb-6">
        <Typography variant="display" className="mb-1.5">
          Welcome Back
        </Typography>
        <Typography variant="body" color="secondary">
          Sign in to access your ocean journeys, AI itineraries, and expense splits.
        </Typography>
      </View>

      {/* Server Error Banner */}
      {serverError ? (
        <View className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex-row items-center gap-2.5">
          <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
          <Typography variant="bodySmall" color="danger" className="flex-1">
            {serverError}
          </Typography>
        </View>
      ) : null}

      {/* Login Form */}
      <Card className="mb-6">
        <FormInput
          label="Email Address"
          placeholder="e.g. traveller@samundar.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            if (serverError) setServerError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          error={errors.email}
          leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />}
        />

        <FormInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            if (serverError) setServerError(null);
          }}
          secureTextEntry
          error={errors.password}
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />}
        />

        {/* Forgot Password link */}
        <View className="flex-row justify-end mb-4 -mt-1">
          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            hitSlop={8}
            accessibilityRole="link"
          >
            <Typography variant="bodySmall" color="ocean" style={{ fontWeight: '600' }}>
              Forgot Password?
            </Typography>
          </Pressable>
        </View>

        {/* Submit Button */}
        <Button
          title="Sign In"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleLogin}
          isLoading={isSubmitting}
          rightIcon={<Ionicons name="log-in-outline" size={18} color={COLORS.textInverse} />}
        />

        <Divider label="OR CONTINUE WITH" />

        {/* Google Sign In Button */}
        <Button
          title="Sign in with Google"
          variant="outline"
          size="lg"
          fullWidth
          onPress={handleGoogleSignIn}
          disabled={isSubmitting}
          leftIcon={<Ionicons name="logo-google" size={18} color="#EA4335" />}
        />
      </Card>

      {/* Bottom Switch to Register */}
      <View className="flex-row items-center justify-center gap-1 py-4">
        <Typography variant="bodySmall" color="secondary">
          Don't have an account?
        </Typography>
        <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8}>
          <Typography variant="bodySmall" color="ocean" style={{ fontWeight: '700' }}>
            Sign Up
          </Typography>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
