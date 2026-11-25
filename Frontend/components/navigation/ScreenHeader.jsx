import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import Typography from '../ui/Typography';

export function ScreenHeader({
  title,
  subtitle = null,
  showBack = false,
  onBack = null,
  rightAction = null,
  className = '',
}) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View className={`flex-row items-center justify-between py-3 mb-2 ${className}`}>
      <View className="flex-row items-center flex-1 gap-3">
        {showBack ? (
          <Pressable
            onPress={handleBack}
            accessibilityLabel="Go back"
            className="w-10 h-10 rounded-full bg-white border border-ink-200 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
          </Pressable>
        ) : null}

        <View className="flex-1">
          <Typography variant="h2" numberOfLines={1}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" color="secondary" numberOfLines={1}>
              {subtitle}
            </Typography>
          ) : null}
        </View>
      </View>

      {rightAction ? <View className="ml-3">{rightAction}</View> : null}
    </View>
  );
}

export default ScreenHeader;

