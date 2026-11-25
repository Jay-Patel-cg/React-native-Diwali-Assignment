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
import { FormInput, FormSelect } from '../../components/forms';
import { COLORS } from '../../constants/theme';
import { TRAVEL_STYLES } from '../../constants/config';
import { isValidEmail } from '../../utils/validators';
import { useAuthStore } from '../../store/useAuthStore';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [travelStyles, setTravelStyles] = useState(['coastal', 'relaxation']);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

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

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your password';
    } else if (confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    setServerError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        preferences: {
          travelStyles: travelStyles.length > 0 ? travelStyles : ['coastal'],
          currency: 'INR',
        },
      });
      router.replace('/(tabs)');
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setServerError(null);
    try {
      Alert.prompt
        ? Alert.prompt(
            'Google Sign-Up',
            'Enter Google ID Token to authenticate with backend:',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Continue',
                onPress: async (testToken) => {
                  if (!testToken) return;
                  setIsSubmitting(true);
                  try {
                    await loginWithGoogle(testToken);
                    router.replace('/(tabs)');
                  } catch (err) {
                    setServerError(err.message || 'Google registration failed');
                  } finally {
                    setIsSubmitting(false);
                  }
                },
              },
            ],
            'plain-text'
          )
        : Alert.alert(
            'Google Sign-Up',
            'Google OAuth requires an OAuth client ID configured on native devices. You can also sign up with email and password.',
            [{ text: 'OK' }]
          );
    } catch (err) {
      setServerError(err.message || 'Google registration failed');
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
      <View className="mb-5">
        <Typography variant="display" className="mb-1.5">
          Create Account
        </Typography>
        <Typography variant="body" color="secondary">
          Join fellow explorers and plan breathtaking seaside journeys powered by AI.
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

      {/* Registration Form Card */}
      <Card className="mb-6">
        <FormInput
          label="Full Name"
          placeholder="e.g. Maya Sharma"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
            if (serverError) setServerError(null);
          }}
          autoCapitalize="words"
          error={errors.name}
          leftIcon={<Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />}
        />

        <FormInput
          label="Email Address"
          placeholder="e.g. maya@example.com"
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
          placeholder="At least 6 characters"
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

        <FormInput
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
            if (serverError) setServerError(null);
          }}
          secureTextEntry
          error={errors.confirmPassword}
          leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textSecondary} />}
        />

        {/* Travel Style Preferences */}
        <FormSelect
          label="Your Travel Style (Pick your vibes)"
          options={TRAVEL_STYLES.slice(0, 6)}
          value={travelStyles}
          onChange={setTravelStyles}
          multi
          helperText="Helps Gemini AI tailor custom coastlines & activities"
        />

        {/* Submit Button */}
        <Button
          title="Create Account"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleRegister}
          isLoading={isSubmitting}
          rightIcon={<Ionicons name="sparkles" size={18} color={COLORS.textInverse} />}
        />

        <Divider label="OR CONTINUE WITH" />

        {/* Google Sign In Button */}
        <Button
          title="Sign up with Google"
          variant="outline"
          size="lg"
          fullWidth
          onPress={handleGoogleSignIn}
          disabled={isSubmitting}
          leftIcon={<Ionicons name="logo-google" size={18} color="#EA4335" />}
        />
      </Card>

      {/* Bottom Switch to Login */}
      <View className="flex-row items-center justify-center gap-1 py-4">
        <Typography variant="bodySmall" color="secondary">
          Already have an account?
        </Typography>
        <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={8}>
          <Typography variant="bodySmall" color="ocean" style={{ fontWeight: '700' }}>
            Sign In
          </Typography>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
