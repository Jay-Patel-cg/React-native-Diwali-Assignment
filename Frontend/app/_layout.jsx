import '../global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const hydrate = useAuthStore((state) => state.hydrate);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup =
      segments[0] === '(tabs)' ||
      segments[0] === 'trips' ||
      segments[0] === 'expenses' ||
      segments[0] === 'ai' ||
      segments[0] === 'profile' ||
      segments[0] === 'notifications';

    if (isAuthenticated && inAuthGroup) {
      // User is logged in, redirect away from auth screens
      router.replace('/(tabs)');
    } else if (!isAuthenticated && inProtectedGroup) {
      // User is logged out, redirect to onboarding/login
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, isHydrated, segments, router]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={COLORS.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trips" />
        <Stack.Screen name="expenses" />
        <Stack.Screen name="ai" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="destinations" />
        <Stack.Screen
          name="notifications"
          options={{
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
