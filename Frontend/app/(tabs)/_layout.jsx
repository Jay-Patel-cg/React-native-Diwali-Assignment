import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarLabel: 'Trips',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'boat' : 'boat-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Planner',
          tabBarLabel: 'AI Copilot',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={23}
              color={focused ? COLORS.secondary : color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarLabel: 'Expenses',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
