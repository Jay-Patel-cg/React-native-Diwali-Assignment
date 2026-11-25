import React from 'react';
import { Pressable, View } from 'react-native';
import { SHADOWS } from '../../constants/theme';

export function Card({
  children,
  onPress = null,
  elevated = false,
  className = '',
  style,
}) {
  const shadowStyle = elevated ? SHADOWS.elevated : SHADOWS.card;
  const baseClass = `bg-white rounded-3xl border border-ink-200 p-4 ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={baseClass}
        style={({ pressed }) => [
          shadowStyle,
          pressed ? { opacity: 0.92, transform: [{ scale: 0.99 }] } : null,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={baseClass} style={[shadowStyle, style]}>
      {children}
    </View>
  );
}

export default Card;

