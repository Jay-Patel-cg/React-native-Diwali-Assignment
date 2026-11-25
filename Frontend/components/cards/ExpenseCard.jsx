import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import Card from './Card';

export const EXPENSE_CATEGORY_CONFIG = {
  transport: { label: 'Transport', icon: 'boat-outline', color: '#0284C7', bg: 'bg-sky-50' },
  accommodation: { label: 'Stay', icon: 'bed-outline', color: '#8B5CF6', bg: 'bg-purple-50' },
  food: { label: 'Food', icon: 'restaurant-outline', color: '#F97316', bg: 'bg-orange-50' },
  activities: { label: 'Activity', icon: 'compass-outline', color: '#14B8A6', bg: 'bg-teal-50' },
  shopping: { label: 'Shopping', icon: 'bag-handle-outline', color: '#EC4899', bg: 'bg-pink-50' },
  fuel: { label: 'Fuel', icon: 'speedometer-outline', color: '#EAB308', bg: 'bg-yellow-50' },
  tickets: { label: 'Tickets', icon: 'ticket-outline', color: '#06B6D4', bg: 'bg-cyan-50' },
  miscellaneous: { label: 'Misc', icon: 'receipt-outline', color: '#64748B', bg: 'bg-slate-50' },
};

export function ExpenseCard({
  expense,
  onPress = null,
  onEdit = null,
  onDelete = null,
  className = '',
}) {
  if (!expense) return null;

  const {
    _id,
    title,
    amount,
    currency = 'INR',
    category = 'miscellaneous',
    expenseDate,
    paidBy,
    splitType = 'equal',
    participants = [],
    notes,
  } = expense;

  const catConfig = EXPENSE_CATEGORY_CONFIG[category] || EXPENSE_CATEGORY_CONFIG.miscellaneous;
  const payerName = paidBy?.name || 'A crew member';

  return (
    <Card className={`p-4 bg-white border border-ink-200 mb-2.5 shadow-xs ${className}`}>
      <Pressable onPress={onPress} disabled={!onPress}>
        <View className="flex-row items-center justify-between mb-2">
          {/* Category Icon & Titles */}
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View
              className={`w-11 h-11 rounded-2xl items-center justify-center ${catConfig.bg}`}
            >
              <Ionicons name={catConfig.icon} size={20} color={catConfig.color} />
            </View>

            <View className="flex-1">
              <Typography variant="body" numberOfLines={1} style={{ fontWeight: '700' }}>
                {title}
              </Typography>
              <Typography variant="caption" color="secondary" numberOfLines={1}>
                {formatDate(expenseDate)} • paid by {payerName}
              </Typography>
            </View>
          </View>

          {/* Amount Display */}
          <View className="items-end">
            <Typography variant="h3" color="ocean" style={{ fontWeight: '800' }}>
              {formatCurrency(amount, currency)}
            </Typography>
            <Badge label={catConfig.label} tone="neutral" />
          </View>
        </View>

        {/* Split & Participant Info */}
        <View className="flex-row items-center justify-between pt-2 border-t border-ink-100">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
            <Typography variant="caption" color="secondary">
              Split {splitType} among {participants.length || 1}{' '}
              {participants.length === 1 ? 'person' : 'people'}
            </Typography>
          </View>

          {/* Action Buttons (Edit & Delete) */}
          <View className="flex-row items-center gap-2">
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                hitSlop={8}
                className="w-7 h-7 rounded-lg bg-ink-50 items-center justify-center"
              >
                <Ionicons name="create-outline" size={15} color={COLORS.primary} />
              </Pressable>
            ) : null}

            {onDelete ? (
              <Pressable
                onPress={onDelete}
                hitSlop={8}
                className="w-7 h-7 rounded-lg bg-red-50 items-center justify-center"
              >
                <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {notes ? (
          <Typography variant="caption" color="muted" numberOfLines={1} className="mt-1.5">
            Note: {notes}
          </Typography>
        ) : null}
      </Pressable>
    </Card>
  );
}

export default ExpenseCard;
