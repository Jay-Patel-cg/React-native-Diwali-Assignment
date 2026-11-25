import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';

export function AiBudgetTierCard({
  tierName,
  tierData,
  isSelected = false,
  onSelect,
  currency = 'INR',
}) {
  if (!tierData) return null;

  const isLuxury = tierName.toLowerCase().includes('luxury') || tierName.toLowerCase().includes('premium');
  const isBudget = tierName.toLowerCase().includes('budget') || tierName.toLowerCase().includes('backpacker');

  const badgeTone = isLuxury ? 'coral' : isBudget ? 'seafoam' : 'ocean';
  const iconName = isLuxury ? 'diamond-outline' : isBudget ? 'bicycle-outline' : 'boat-outline';

  const totalEstimate =
    typeof tierData === 'object'
      ? tierData.total || tierData.estimatedTotal || tierData.amount
      : tierData;

  const dailyEstimate =
    typeof tierData === 'object'
      ? tierData.perDay || tierData.daily || tierData.perPersonPerDay
      : null;

  const description =
    typeof tierData === 'object' ? tierData.description || tierData.stayType : null;

  return (
    <Pressable
      onPress={onSelect}
      className={`bg-white rounded-2xl p-4 border mb-3 shadow-xs ${
        isSelected
          ? 'border-ocean-600 bg-ocean-50/20'
          : 'border-ink-200 active:border-ocean-300'
      }`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-lg bg-ink-50 items-center justify-center">
            <Ionicons name={iconName} size={18} color={COLORS.primary} />
          </View>
          <Typography variant="body" style={{ fontWeight: '700' }} className="capitalize">
            {tierName} Tier
          </Typography>
        </View>

        <Badge
          label={isSelected ? 'Selected' : `~₹${Number(totalEstimate || 0).toLocaleString('en-IN')}`}
          tone={badgeTone}
        />
      </View>

      <View className="flex-row items-baseline gap-2 mb-2">
        <Typography variant="h2" color="ocean">
          ₹{Number(totalEstimate || 0).toLocaleString('en-IN')}
        </Typography>
        {dailyEstimate ? (
          <Typography variant="caption" color="secondary">
            (₹{Number(dailyEstimate).toLocaleString('en-IN')}/day)
          </Typography>
        ) : null}
      </View>

      {description ? (
        <Typography variant="caption" color="secondary" className="leading-4">
          {description}
        </Typography>
      ) : null}

      {tierData?.breakdown ? (
        <View className="mt-2 pt-2 border-t border-ink-100 flex-row flex-wrap gap-2">
          {Object.entries(tierData.breakdown).map(([k, v]) => (
            <Badge
              key={k}
              label={`${k}: ₹${Number(v).toLocaleString('en-IN')}`}
              tone="neutral"
            />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export default AiBudgetTierCard;
