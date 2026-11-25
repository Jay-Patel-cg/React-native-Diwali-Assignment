import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

export function SkeletonBox({ height = 20, width = '100%', rounded = 'rounded-2xl', className = '' }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-ink-200 ${rounded} ${className}`}
      style={{ height, width, opacity }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View className="py-2 gap-5">
      {/* Top Greeting & Avatar */}
      <View className="flex-row items-center justify-between mb-1">
        <View className="gap-2">
          <SkeletonBox height={16} width={120} />
          <SkeletonBox height={28} width={200} />
        </View>
        <SkeletonBox height={44} width={44} rounded="rounded-full" />
      </View>

      {/* Search Bar Skeleton */}
      <SkeletonBox height={48} width="100%" rounded="rounded-2xl" />

      {/* Quick Actions (4 buttons) */}
      <View className="flex-row justify-between gap-3">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="items-center flex-1 gap-1.5">
            <SkeletonBox height={54} width={54} rounded="rounded-2xl" />
            <SkeletonBox height={12} width={48} />
          </View>
        ))}
      </View>

      {/* Upcoming Trip Card Skeleton */}
      <View className="gap-2">
        <SkeletonBox height={20} width={150} />
        <SkeletonBox height={200} width="100%" rounded="rounded-3xl" />
      </View>

      {/* AI Copilot Banner Skeleton */}
      <SkeletonBox height={110} width="100%" rounded="rounded-3xl" />

      {/* Budget Summary Skeleton */}
      <View className="gap-2">
        <SkeletonBox height={20} width={140} />
        <SkeletonBox height={160} width="100%" rounded="rounded-3xl" />
      </View>

      {/* Popular Destinations Skeleton */}
      <View className="gap-2">
        <SkeletonBox height={20} width={180} />
        <View className="flex-row gap-3 overflow-hidden">
          <SkeletonBox height={180} width={220} rounded="rounded-3xl" />
          <SkeletonBox height={180} width={220} rounded="rounded-3xl" />
        </View>
      </View>
    </View>
  );
}

export default DashboardSkeleton;
