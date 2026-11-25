import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { formatCurrency, formatDateRange } from '../../utils/formatters';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';

const STATUS_TONES = {
  planning: 'ocean',
  active: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

export function TripCard({
  trip,
  onPress = null,
  showBudget = true,
  className = '',
}) {
  if (!trip) return null;

  const {
    _id,
    title,
    destination,
    origin,
    startDate,
    endDate,
    status = 'planning',
    budget = 0,
    currency = 'INR',
    travelers = 1,
    coverImage,
    description,
  } = trip;

  // Calculate days remaining or duration
  const getDepartureLabel = () => {
    if (status === 'active') return 'Active Now';
    if (status === 'completed') return 'Completed';
    if (!startDate) return null;

    const start = new Date(startDate);
    const now = new Date();
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Past Trip';
    if (diffDays === 0) return 'Starts Today!';
    if (diffDays === 1) return 'Departs Tomorrow';
    return `In ${diffDays} days`;
  };

  const departureLabel = getDepartureLabel();
  const dateLabel = startDate ? formatDateRange(startDate, endDate) : null;
  const statusTone = STATUS_TONES[status] || 'ocean';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`bg-white rounded-3xl overflow-hidden border border-ink-200 shadow-sm ${className}`}
      style={({ pressed }) => [
        SHADOWS.card,
        pressed && onPress ? { opacity: 0.94, transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      {/* Visual Header / Cover Image */}
      <View className="relative h-44 w-full bg-ocean-900 justify-end">
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            className="w-full h-full absolute inset-0"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full absolute inset-0 bg-ocean-800 items-center justify-center">
            <Ionicons name="boat" size={54} color={COLORS.secondarySoft} />
          </View>
        )}

        {/* Gradient / Overlay scrim */}
        <View className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top Floating Badges */}
        <View className="absolute top-3.5 left-3.5 right-3.5 flex-row items-center justify-between">
          <Badge
            label={status.toUpperCase()}
            tone={statusTone}
          />
          {departureLabel ? (
            <View className="flex-row items-center bg-black/60 px-2.5 py-1 rounded-full gap-1">
              <Ionicons name="time-outline" size={12} color="#FFF" />
              <Typography variant="caption" color="inverse" style={{ fontWeight: '600' }}>
                {departureLabel}
              </Typography>
            </View>
          ) : null}
        </View>

        {/* Bottom Image Overlay Text */}
        <View className="p-4 z-10">
          <Typography variant="h2" color="inverse" numberOfLines={1} className="mb-0.5">
            {title || destination}
          </Typography>

          <View className="flex-row items-center gap-1.5">
            <Ionicons name="location" size={14} color={COLORS.secondarySoft} />
            <Typography variant="bodySmall" color="#CCFBF1" numberOfLines={1}>
              {destination}
              {origin ? ` • from ${origin}` : ''}
            </Typography>
          </View>
        </View>
      </View>

      {/* Card Content & Details */}
      <View className="p-4 bg-white">
        {dateLabel ? (
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="calendar-outline" size={15} color={COLORS.textSecondary} />
            <Typography variant="bodySmall" color="secondary" style={{ fontWeight: '500' }}>
              {dateLabel}
            </Typography>
          </View>
        ) : null}

        {/* Trip Meta Chips */}
        <View className="flex-row items-center justify-between pt-2 border-t border-ink-100">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Typography variant="bodySmall" style={{ fontWeight: '600' }}>
              {travelers} {travelers === 1 ? 'Traveler' : 'Travelers'}
            </Typography>
          </View>

          {showBudget && budget > 0 ? (
            <View className="items-end">
              <Typography variant="caption" color="muted">
                Trip Budget
              </Typography>
              <Typography variant="bodySmall" color="ocean" style={{ fontWeight: '700' }}>
                {formatCurrency(budget, currency)}
              </Typography>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default TripCard;
