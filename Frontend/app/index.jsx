import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Button } from '../components/ui';
import { COLORS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { useAuthStore } from '../store/useAuthStore';

export default function SplashScreen() {
  const router = useRouter();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isHydrated) return;

    // Small delay for smooth splash presentation
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/welcome');
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [isHydrated, isAuthenticated, router]);

  return (
    <View
      style={{ backgroundColor: COLORS.primary }}
      className="flex-1 items-center justify-center px-8"
    >
      {/* Ocean Logo Badge */}
      <View className="w-24 h-24 rounded-3xl bg-ocean-700/80 border border-ocean-600 items-center justify-center mb-6 shadow-lg">
        <Ionicons name="boat" size={48} color={COLORS.secondarySoft} />
      </View>

      {/* Brand Title */}
      <Typography variant="display" color="inverse" align="center" className="mb-2 text-3xl">
        {APP_CONFIG.appName}
      </Typography>

      <Typography variant="body" color="#CCFBF1" align="center" className="mb-8">
        AI-Powered Coastal Travel & Expense Management
      </Typography>

      {/* Loading Indicator */}
      <View className="flex-row items-center gap-3 py-4">
        <ActivityIndicator size="small" color={COLORS.secondarySoft} />
        <Typography variant="caption" color="#E2E8F0">
          {!isHydrated ? 'Hydrating session...' : 'Setting sail...'}
        </Typography>
      </View>

      {/* Manual Fallback Action if needed */}
      {isHydrated ? (
        <View className="mt-6 w-full max-w-[240px]">
          <Button
            title="Continue"
            variant="secondary"
            size="md"
            onPress={() => {
              if (isAuthenticated) {
                router.replace('/(tabs)');
              } else {
                router.replace('/(auth)/welcome');
              }
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
