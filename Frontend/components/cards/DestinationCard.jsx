import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { formatCurrency, formatTitleCase } from '../../utils/formatters';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';

export function DestinationCard({
  destination,
  onPress = null,
  compact = false,
  className = '',
}) {
  const {
    name,
    stateOrRegion,
    country,
    shortDescription,
    category,
    averageDailyBudget,
    currency = 'INR',
    rating = 4.7,
    coverImage,
  } = destination || {};

  const locationLabel = [stateOrRegion, country].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`bg-white rounded-3xl overflow-hidden border border-ink-200 ${
        compact ? 'w-64 mr-3' : 'w-full'
      } ${className}`}
      style={({ pressed }) => [
        SHADOWS.card,
        pressed && onPress ? { opacity: 0.94, transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      <View className={`relative w-full bg-ocean-900 ${compact ? 'h-36' : 'h-48'}`}>
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center bg-ocean-800">
            <Ionicons name="boat" size={32} color={COLORS.secondarySoft} />
          </View>
        )}

        <View className="absolute top-3 left-3">
          <Badge label={formatTitleCase(category || 'coastal')} tone="ocean" />
        </View>

        <View className="absolute top-3 right-3 flex-row items-center bg-ocean-950/80 px-2 py-0.5 rounded-full gap-1">
          <Ionicons name="star" size={12} color={COLORS.coral} />
          <Typography variant="caption" color="inverse" style={{ fontWeight: '700' }}>
            {Number(rating).toFixed(1)}
          </Typography>
        </View>
      </View>

      <View className="p-3.5">
        <View className="flex-row items-start justify-between gap-2 mb-1">
          <View className="flex-1">
            <Typography variant={compact ? 'body' : 'h3'} numberOfLines={1} style={{ fontWeight: '700' }}>
              {name}
            </Typography>
            {locationLabel ? (
              <View className="flex-row items-center gap-1 mt-0.5">
                <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
                <Typography variant="caption" color="secondary" numberOfLines={1}>
                  {locationLabel}
                </Typography>
              </View>
            ) : null}
          </View>

          {averageDailyBudget !== undefined ? (
            <View className="items-end">
              <Typography variant="bodySmall" color="ocean" style={{ fontWeight: '700' }}>
                {formatCurrency(averageDailyBudget, currency)}
              </Typography>
              <Typography variant="caption" color="muted">
                est. / day
              </Typography>
            </View>
          ) : null}
        </View>

        {!compact && shortDescription ? (
          <Typography
            variant="bodySmall"
            color="secondary"
            numberOfLines={2}
            className="mt-2"
          >
            {shortDescription}
          </Typography>
        ) : null}
      </View>
    </Pressable>
  );
}

export default DestinationCard;
