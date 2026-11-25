import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
} from '../../components/ui';
import { Card } from '../../components/cards';
import { FormInput } from '../../components/forms';
import { COLORS } from '../../constants/theme';
import { isValidEmail } from '../../utils/validators';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    // Simulate sending recovery email / reset instructions
    try {
      await new Promise((res) => setTimeout(res, 900));
      setSubmitted(true);
    } catch {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable keyboardAware padded edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Navigation */}
      <View className="flex-row items-center justify-between py-2 mb-4">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
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
      <View className="items-center mb-6 mt-2">
        <View className="w-16 h-16 rounded-3xl bg-ocean-50 border border-ocean-100 items-center justify-center mb-3">
          <Ionicons name="key-outline" size={32} color={COLORS.primary} />
        </View>
        <Typography variant="display" align="center" className="mb-2">
          Forgot Password?
        </Typography>
        <Typography variant="body" color="secondary" align="center" className="px-4">
          No worries! Enter your registered account email and we will send you password reset
          instructions.
        </Typography>
      </View>

      {submitted ? (
        /* Success State Card */
        <Card className="mb-6 p-6 border border-emerald-200 bg-emerald-50/40 items-center">
          <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center mb-3">
            <Ionicons name="checkmark-circle" size={28} color="#059669" />
          </View>
          <Typography variant="h3" color="success" align="center" className="mb-2">
            Reset Instructions Sent
          </Typography>
          <Typography variant="bodySmall" color="secondary" align="center" className="mb-4 leading-5">
            We have sent password recovery instructions to{' '}
            <Typography variant="bodySmall" style={{ fontWeight: '700' }}>
              {email}
            </Typography>
            . Please check your inbox and spam folder.
          </Typography>

          <Button
            title="Back to Sign In"
            variant="primary"
            size="md"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          />
        </Card>
      ) : (
        /* Form Card */
        <Card className="mb-6">
          <FormInput
            label="Email Address"
            placeholder="e.g. traveller@samundar.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            error={error}
            leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />}
          />

          <Button
            title="Send Recovery Instructions"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSubmit}
            isLoading={isSubmitting}
            rightIcon={<Ionicons name="paper-plane-outline" size={18} color={COLORS.textInverse} />}
          />
        </Card>
      )}

      {/* Back to Login link */}
      {!submitted ? (
        <View className="flex-row items-center justify-center gap-1 py-4">
          <Typography variant="bodySmall" color="secondary">
            Remembered your password?
          </Typography>
          <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8}>
            <Typography variant="bodySmall" color="ocean" style={{ fontWeight: '700' }}>
              Sign In
            </Typography>
          </Pressable>
        </View>
      ) : null}
    </ScreenContainer>
  );
}
