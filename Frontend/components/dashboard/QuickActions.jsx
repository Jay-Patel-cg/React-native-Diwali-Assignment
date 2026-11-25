import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import Typography from '../ui/Typography';

const ACTIONS = [
  {
    id: 'create_trip',
    title: 'Create Trip',
    icon: 'airplane-outline',
    bgColor: 'bg-ocean-50',
    iconColor: COLORS.primary,
    borderColor: 'border-ocean-200',
    route: '/trips/create',
  },
  {
    id: 'add_expense',
    title: 'Add Expense',
    icon: 'wallet-outline',
    bgColor: 'bg-seafoam-50',
    iconColor: COLORS.secondary,
    borderColor: 'border-seafoam-200',
    route: '/expenses/create',
  },
  {
    id: 'ai_planner',
    title: 'AI Planner',
    icon: 'sparkles',
    bgColor: 'bg-coral-50',
    iconColor: COLORS.accent,
    borderColor: 'border-coral-200',
    route: '/ai',
  },
  {
    id: 'explore',
    title: 'Explore',
    icon: 'compass-outline',
    bgColor: 'bg-sky-50',
    iconColor: '#0284C7',
    borderColor: 'border-sky-200',
    route: '/destinations',
  },
];

export function QuickActionButton({
  action,
  onPress,
  className = '',
}) {
  const { title, icon, bgColor, iconColor, borderColor } = action;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className={`items-center flex-1 min-w-[70px] ${className}`}
      style={({ pressed }) => [
        pressed ? { opacity: 0.8, transform: [{ scale: 0.96 }] } : null,
      ]}
    >
      <View
        className={`w-14 h-14 rounded-2xl items-center justify-center border mb-1.5 shadow-xs ${bgColor} ${borderColor}`}
      >
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Typography variant="caption" color="primary" align="center" style={{ fontWeight: '600' }}>
        {title}
      </Typography>
    </Pressable>
  );
}

export function QuickActions({
  onActionPress = null,
  className = '',
}) {
  const router = useRouter();

  const handlePress = (action) => {
    if (onActionPress) {
      onActionPress(action.id);
      return;
    }
    if (action.route) {
      router.push(action.route);
    }
  };

  return (
    <View className={`flex-row items-center justify-between gap-2 ${className}`}>
      {ACTIONS.map((action) => (
        <QuickActionButton
          key={action.id}
          action={action}
          onPress={() => handlePress(action)}
        />
      ))}
    </View>
  );
}

export default QuickActions;
