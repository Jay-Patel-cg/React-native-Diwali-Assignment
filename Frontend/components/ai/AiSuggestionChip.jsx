import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import Typography from '../ui/Typography';

export function AiSuggestionChip({
  label,
  icon = 'sparkles-outline',
  onPress,
  disabled = false,
  className = '',
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center bg-white border border-ocean-200 rounded-full px-3.5 py-2 mr-2 mb-2 active:bg-ocean-50 active:border-ocean-400 ${className}`}
      style={({ pressed }) => [
        pressed && !disabled ? { transform: [{ scale: 0.98 }] } : null,
      ]}
      accessibilityRole="button"
    >
      <View className="mr-1.5">
        <Ionicons name={icon} size={14} color={COLORS.primary} />
      </View>
      <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
        {label}
      </Typography>
    </Pressable>
  );
}

export default AiSuggestionChip;
