import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  Badge,
  LoadingState,
  ErrorState,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { Card } from '../../components/cards';
import { COLORS } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { expenseService } from '../../services';

export default function BudgetOverviewScreen() {
  const { tripId } = useLocalSearchParams();
  const router = useRouter();

  const [budget, setBudget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadBudget = useCallback(
    async (isRefresh = false) => {
      if (!tripId) return;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await expenseService.getTripBudget(tripId);
        setBudget(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load budget overview');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [tripId]
  );

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  if (isLoading && !isRefreshing) {
    return (
      <ScreenContainer>
        <LoadingState message="Calculating budget tracking..." fullScreen />
      </ScreenContainer>
    );
  }

  const {
    tripTitle = 'Trip',
    currency = 'INR',
    totalBudget = 0,
    totalSpent = 0,
    budgetRemaining = 0,
    percentageSpent = 0,
    isOverBudget = false,
    totalTransactions = 0,
  } = budget || {};

  const clampedPercent = Math.min(Math.max(percentageSpent, 0), 100);
  const progressBarColor = isOverBudget
    ? COLORS.danger
    : clampedPercent > 80
      ? COLORS.accent
      : COLORS.secondary;

  const averagePerTxn =
    totalTransactions > 0 ? Math.round(totalSpent / totalTransactions) : 0;

  return (
    <ScreenContainer
      scrollable
      padded
      refreshing={isRefreshing}
      onRefresh={() => loadBudget(true)}
      edges={['top', 'left', 'right']}
    >
      <ScreenHeader
        title="Budget Overview"
        subtitle={tripTitle}
        showBack
      />

      {error ? (
        <ErrorState message={error} onRetry={loadBudget} retryLabel="Retry" className="mb-4" />
      ) : null}

      {/* Over-budget Warning Banner */}
      {isOverBudget ? (
        <View className="mb-4 p-4 rounded-3xl bg-red-50 border border-red-200 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-2xl bg-red-100 items-center justify-center">
            <Ionicons name="alert" size={20} color={COLORS.danger} />
          </View>
          <View className="flex-1">
            <Typography variant="body" color="danger" style={{ fontWeight: '700' }}>
              Budget Exceeded!
            </Typography>
            <Typography variant="caption" color="secondary">
              Spending has exceeded allocated budget by {formatCurrency(Math.abs(budgetRemaining), currency)}.
            </Typography>
          </View>
        </View>
      ) : null}

      {/* Main Budget Health Card */}
      <Card className="mb-5 p-5 bg-white border border-ink-200 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Typography variant="caption" color="muted">
              Remaining Budget
            </Typography>
            <Typography
              variant="display"
              color={budgetRemaining < 0 ? 'danger' : 'primary'}
              style={{ fontWeight: '800' }}
            >
              {formatCurrency(budgetRemaining, currency)}
            </Typography>
          </View>

          <Badge
            label={isOverBudget ? 'Deficit' : `${Math.round(percentageSpent)}% spent`}
            tone={isOverBudget ? 'danger' : clampedPercent > 80 ? 'coral' : 'success'}
          />
        </View>

        {/* Progress Bar */}
        <View className="h-3 w-full bg-ink-100 rounded-full overflow-hidden mb-4">
          <View
            className="h-full rounded-full"
            style={{ width: `${clampedPercent}%`, backgroundColor: progressBarColor }}
          />
        </View>

        {/* Financial Metrics Row */}
        <View className="flex-row items-center justify-between pt-3 border-t border-ink-100">
          <View>
            <Typography variant="caption" color="muted">
              Total Budget
            </Typography>
            <Typography variant="body" style={{ fontWeight: '700' }}>
              {formatCurrency(totalBudget, currency)}
            </Typography>
          </View>

          <View className="h-8 w-[1px] bg-ink-200" />

          <View className="items-center">
            <Typography variant="caption" color="muted">
              Total Spent
            </Typography>
            <Typography variant="body" color="ocean" style={{ fontWeight: '700' }}>
              {formatCurrency(totalSpent, currency)}
            </Typography>
          </View>

          <View className="h-8 w-[1px] bg-ink-200" />

          <View className="items-end">
            <Typography variant="caption" color="muted">
              Avg / Txn
            </Typography>
            <Typography variant="body" style={{ fontWeight: '700' }}>
              {formatCurrency(averagePerTxn, currency)}
            </Typography>
          </View>
        </View>
      </Card>

      {/* Spending Breakdown Statistics */}
      <Card className="mb-5 p-4 bg-white border border-ink-200">
        <Typography variant="h3" className="mb-3">
          Spending Breakdown
        </Typography>

        <View className="gap-3">
          <View className="flex-row items-center justify-between py-1.5 border-b border-ink-100">
            <View className="flex-row items-center gap-2">
              <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
              <Typography variant="bodySmall" color="secondary">
                Total Transactions Logged
              </Typography>
            </View>
            <Typography variant="bodySmall" style={{ fontWeight: '700' }}>
              {totalTransactions}
            </Typography>
          </View>

          <View className="flex-row items-center justify-between py-1.5 border-b border-ink-100">
            <View className="flex-row items-center gap-2">
              <Ionicons name="speedometer-outline" size={16} color={COLORS.secondary} />
              <Typography variant="bodySmall" color="secondary">
                Budget Consumption Rate
              </Typography>
            </View>
            <Typography variant="bodySmall" style={{ fontWeight: '700' }}>
              {percentageSpent}%
            </Typography>
          </View>

          <View className="flex-row items-center justify-between py-1.5">
            <View className="flex-row items-center gap-2">
              <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.accent} />
              <Typography variant="bodySmall" color="secondary">
                Financial Status
              </Typography>
            </View>
            <Badge
              label={
                isOverBudget
                  ? 'Action Needed'
                  : clampedPercent > 80
                    ? 'Watch Expenses'
                    : 'Within Safe Limits'
              }
              tone={isOverBudget ? 'danger' : clampedPercent > 80 ? 'coral' : 'success'}
            />
          </View>
        </View>
      </Card>

      {/* Action CTA Buttons */}
      <View className="gap-3 mb-6">
        <Button
          title="+ Add New Expense"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() =>
            router.push({
              pathname: '/expenses/create',
              params: { tripId },
            })
          }
        />

        <Button
          title="Adjust Trip Budget"
          variant="outline"
          size="md"
          fullWidth
          onPress={() => router.push(`/trips/${tripId}/edit`)}
        />
      </View>
    </ScreenContainer>
  );
}
