import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import Typography from './Typography';

/**
 * Centered ocean-themed loading state for screen fetches or async transitions.
 */
export function LoadingState({ message = 'Loading your coastal journey...', fullScreen = false }) {
  return (
    <View
      className={`items-center justify-center px-6 ${
        fullScreen ? 'flex-1 py-20' : 'py-10'
      }`}
    >
      <View className="w-14 h-14 rounded-2xl bg-ocean-50 items-center justify-center mb-3">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
      <Typography variant="bodySmall" color="secondary" className="text-center">
        {message}
      </Typography>
    </View>
  );
}

/**
 * Smooth animated shimmer placeholder card for list skeletons.
 */
export function SkeletonCard({ height = 112, className = '' }) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`w-full rounded-2xl bg-ink-200 mb-3 ${className}`}
      style={{ height, opacity }}
    />
  );
}

export default LoadingState;

