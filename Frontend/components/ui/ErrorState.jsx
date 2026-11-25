import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import Typography from './Typography';
import Button from './Button';

/**
 * Reusable error state with optional retry action (supports compact banner or full block).
 */
export function ErrorState({
  title = 'Unable to load content',
  message = 'Something went wrong while contacting the server.',
  onRetry = null,
  retryLabel = 'Try Again',
  compact = false,
  className = '',
}) {
  if (compact) {
    return (
      <View
        className={`flex-row items-center bg-red-50 border border-red-200 rounded-2xl px-4 py-3 gap-3 ${className}`}
      >
        <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
        <View className="flex-1">
          <Typography variant="bodySmall" color="danger">
            {message}
          </Typography>
        </View>
        {onRetry ? (
          <Button
            title={retryLabel}
            size="sm"
            variant="ghost"
            onPress={onRetry}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View
      className={`items-center justify-center bg-white border border-ink-200 rounded-3xl px-6 py-8 my-4 ${className}`}
    >
      <View className="w-14 h-14 rounded-2xl bg-red-50 items-center justify-center mb-3">
        <Ionicons name="cloud-offline-outline" size={28} color={COLORS.danger} />
      </View>
      <Typography variant="h3" className="text-center mb-1">
        {title}
      </Typography>
      <Typography variant="bodySmall" color="secondary" className="text-center mb-5">
        {message}
      </Typography>
      {onRetry ? (
        <Button title={retryLabel} variant="primary" size="sm" onPress={onRetry} />
      ) : null}
    </View>
  );
}

export default ErrorState;

