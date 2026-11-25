import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function TripsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="create"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/edit" />
      <Stack.Screen name="[id]/itinerary" />
      <Stack.Screen name="[id]/activities" />
      <Stack.Screen name="[id]/members" />
      <Stack.Screen name="[id]/packing-list" />
      <Stack.Screen name="[id]/expenses" />
    </Stack>
  );
}
