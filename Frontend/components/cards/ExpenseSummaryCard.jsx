import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import Card from './Card';

const CATEGORY_ICONS = {
  transport: 'boat-outline',
  accommodation: 'bed-outline',
  food: 'restaurant-outline',
  activities: 'compass-outline',
  shopping: 'bag-handle-outline',
  fuel: 'speedometer-outline',
  tickets: 'ticket-outline',
  miscellaneous: 'receipt-outline',
};

export function ExpenseSummaryCard({
  budgetSummary,
  recentExpenses = [],
  tripTitle = 'Active Trip',
  onViewAll = null,
  onAddExpense = null,
  className = '',
}) {
  const {
    totalBudget = 0,
    totalSpent = 0,
    budgetRemaining = 0,
    percentageSpent = 0,
    isOverBudget = false,
    currency = 'INR',
  } = budgetSummary || {};

  // Color logic for budget health
  const progressPercent = Math.min(Math.max(percentageSpent, 0), 100);
  const progressBarColor = isOverBudget
    ? COLORS.danger
    : progressPercent > 80
      ? COLORS.accent
      : COLORS.secondary;

  const budgetTone = isOverBudget
    ? 'danger'
    : progressPercent > 80
      ? 'coral'
      : 'success';

  return (
    <Card className={`p-4 border border-ink-200 bg-white shadow-sm ${className}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-seafoam-50 items-center justify-center">
            <Ionicons name="wallet-outline" size={18} color={COLORS.secondary} />
          </View>
          <View>
            <Typography variant="h3" numberOfLines={1}>
              Trip Budget
            </Typography>
            <Typography variant="caption" color="secondary" numberOfLines={1}>
              {tripTitle}
            </Typography>
          </View>
        </View>

        <Badge
          label={
            isOverBudget
              ? 'Over Budget'
              : totalBudget > 0
                ? `${Math.round(percentageSpent)}% spent`
                : 'No Limit'
          }
          tone={budgetTone}
        />
      </View>

      {/* Numerical Stats Row */}
      <View className="flex-row items-center justify-between bg-ink-50 rounded-2xl p-3 mb-3">
        <View>
          <Typography variant="caption" color="muted">
            Spent
          </Typography>
          <Typography variant="body" color="primary" style={{ fontWeight: '700' }}>
            {formatCurrency(totalSpent, currency)}
          </Typography>
        </View>

        <View className="h-7 w-[1px] bg-ink-200" />

        <View className="items-center">
          <Typography variant="caption" color="muted">
            Total Budget
          </Typography>
          <Typography variant="body" style={{ fontWeight: '600' }}>
            {totalBudget > 0 ? formatCurrency(totalBudget, currency) : '—'}
          </Typography>
        </View>

        <View className="h-7 w-[1px] bg-ink-200" />

        <View className="items-end">
          <Typography variant="caption" color="muted">
            Remaining
          </Typography>
          <Typography
            variant="body"
            color={budgetRemaining < 0 ? 'danger' : 'success'}
            style={{ fontWeight: '700' }}
          >
            {formatCurrency(budgetRemaining, currency)}
          </Typography>
        </View>
      </View>

      {/* Progress Bar (if budget is set) */}
      {totalBudget > 0 ? (
        <View className="mb-4">
          <View className="h-2 w-full bg-ink-200 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: progressBarColor,
              }}
            />
          </View>
        </View>
      ) : null}

      {/* Recent Expenses List */}
      <View className="pt-2 border-t border-ink-100">
        <View className="flex-row items-center justify-between mb-2">
          <Typography variant="label" color="secondary">
            Recent Expenses
          </Typography>
          {onViewAll ? (
            <Pressable onPress={onViewAll} hitSlop={6}>
              <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
                View All
              </Typography>
            </Pressable>
          ) : null}
        </View>

        {recentExpenses.length > 0 ? (
          <View className="gap-2">
            {recentExpenses.slice(0, 3).map((expense) => {
              const iconName =
                CATEGORY_ICONS[expense.category] || CATEGORY_ICONS.miscellaneous;
              const payerName = expense.paidBy?.name || 'Someone';

              return (
                <View
                  key={expense._id}
                  className="flex-row items-center justify-between py-1.5"
                >
                  <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                    <View className="w-8 h-8 rounded-full bg-ink-100 items-center justify-center">
                      <Ionicons
                        name={iconName}
                        size={16}
                        color={COLORS.primary}
                      />
                    </View>
                    <View className="flex-1">
                      <Typography variant="bodySmall" numberOfLines={1} style={{ fontWeight: '600' }}>
                        {expense.title}
                      </Typography>
                      <Typography variant="caption" color="muted" numberOfLines={1}>
                        {formatDate(expense.expenseDate)} • paid by {payerName}
                      </Typography>
                    </View>
                  </View>

                  <Typography
                    variant="bodySmall"
                    color="ocean"
                    style={{ fontWeight: '700' }}
                  >
                    {formatCurrency(expense.amount, expense.currency || currency)}
                  </Typography>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="py-2 items-center justify-center">
            <Typography variant="caption" color="muted" align="center">
              No expenses recorded yet.
            </Typography>
          </View>
        )}
      </View>

      {/* Add Expense Quick Trigger */}
      {onAddExpense ? (
        <Pressable
          onPress={onAddExpense}
          className="mt-3 py-2.5 rounded-xl bg-seafoam-50 border border-seafoam-200 flex-row items-center justify-center gap-1.5"
        >
          <Ionicons name="add-circle" size={16} color={COLORS.secondary} />
          <Typography variant="bodySmall" color="secondary" style={{ fontWeight: '600' }}>
            Add Expense
          </Typography>
        </Pressable>
      ) : null}
    </Card>
  );
}

export default ExpenseSummaryCard;
