import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import Typography from './Typography';

const VARIANT_CLASSES = {
  primary: 'bg-ocean-800 border border-ocean-800',
  secondary: 'bg-seafoam-500 border border-seafoam-500',
  coral: 'bg-coral-500 border border-coral-500',
  outline: 'bg-white border border-ocean-800',
  ghost: 'bg-transparent border border-transparent',
  danger: 'bg-red-500 border border-red-500',
};

const TEXT_COLORS = {
  primary: 'inverse',
  secondary: 'inverse',
  coral: 'inverse',
  outline: 'ocean',
  ghost: 'ocean',
  danger: 'inverse',
};

const SIZE_CLASSES = {
  sm: 'px-4 py-2.5 rounded-xl',
  md: 'px-5 py-3.5 rounded-2xl',
  lg: 'px-6 py-4 rounded-2xl',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  style,
}) {
  const isDisabled = disabled || isLoading;
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const textColor = TEXT_COLORS[variant] || 'inverse';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      className={`flex-row items-center justify-center ${variantClass} ${sizeClass} ${
        fullWidth ? 'w-full' : ''
      } ${isDisabled ? 'opacity-50' : ''} ${className}`}
      style={({ pressed }) => [
        pressed && !isDisabled ? { opacity: 0.86, transform: [{ scale: 0.99 }] } : null,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={textColor === 'inverse' ? COLORS.textInverse : COLORS.primary}
        />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {leftIcon}
          <Typography
            variant={size === 'sm' ? 'bodySmall' : 'bodyMedium'}
            color={textColor}
            style={{ fontWeight: '600' }}
          >
            {title}
          </Typography>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

export default Button;

