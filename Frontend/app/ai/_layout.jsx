import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function AiLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="preferences" />
      <Stack.Screen name="itinerary" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="recommendations" />
      <Stack.Screen name="budget-suggestions" />
    </Stack>
  );
}
