import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import Typography from './Typography';
import Button from './Button';

export function EmptyState({
  icon = 'compass-outline',
  title = 'Nothing here yet',
  subtitle = 'Start exploring destinations or plan your next coastal escape.',
  actionLabel = null,
  onAction = null,
  className = '',
}) {
  return (
    <View
      className={`items-center justify-center bg-white border border-ink-200 rounded-3xl px-6 py-9 my-4 ${className}`}
    >
      <View className="w-14 h-14 rounded-2xl bg-ocean-50 items-center justify-center mb-3">
        <Ionicons name={icon} size={28} color={COLORS.primary} />
      </View>
      <Typography variant="h3" className="text-center mb-1">
        {title}
      </Typography>
      <Typography variant="bodySmall" color="secondary" className="text-center mb-5">
        {subtitle}
      </Typography>
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="primary" size="sm" onPress={onAction} />
      ) : null}
    </View>
  );
}

export default EmptyState;

