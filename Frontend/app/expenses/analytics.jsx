import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Image } from 'react-native';
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
import { Card, EXPENSE_CATEGORY_CONFIG } from '../../components/cards';
import { COLORS } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { expenseService } from '../../services';

export default function ExpenseAnalyticsScreen() {
  const { tripId } = useLocalSearchParams();
  const router = useRouter();

  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(
    async (isRefresh = false) => {
      if (!tripId) return;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await expenseService.getAnalytics(tripId);
        setAnalytics(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load expense analytics');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [tripId]
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading && !isRefreshing) {
    return (
      <ScreenContainer>
        <LoadingState message="Generating visual expense analytics..." fullScreen />
      </ScreenContainer>
    );
  }

  const {
    totalExpenses = 0,
    currency = 'INR',
    categoryBreakdown = [],
    payerStatistics = [],
  } = analytics || {};

  return (
    <ScreenContainer
      scrollable
      padded
      refreshing={isRefreshing}
      onRefresh={() => loadAnalytics(true)}
      edges={['top', 'left', 'right']}
    >
      <ScreenHeader
        title="Expense Analytics"
        subtitle="Spending breakdown & contributor metrics"
        showBack
      />

      {error ? (
        <ErrorState message={error} onRetry={loadAnalytics} retryLabel="Retry" className="mb-4" />
      ) : null}

      {/* Hero Overview Card */}
      <View className="mb-5 p-5 rounded-3xl bg-ocean-800 shadow-sm">
        <Typography variant="caption" color="#CCFBF1">
          Total Analyzed Expenditure
        </Typography>
        <Typography variant="display" color="inverse" style={{ fontWeight: '800' }} className="my-1">
          {formatCurrency(totalExpenses, currency)}
        </Typography>
        <Typography variant="caption" color="#E2E8F0">
          Across {categoryBreakdown.length} active categories and {payerStatistics.length} contributors
        </Typography>
      </View>

      {/* 1. Category-Wise Expense Breakdown */}
      <Card className="mb-5 p-5 bg-white border border-ink-200">
        <View className="flex-row items-center justify-between mb-4">
          <Typography variant="h3">Category Breakdown</Typography>
          <Badge label={`${categoryBreakdown.length} Categories`} tone="ocean" />
        </View>

        {categoryBreakdown.length > 0 ? (
          <View className="gap-4">
            {categoryBreakdown.map((cat) => {
              const cfg =
                EXPENSE_CATEGORY_CONFIG[cat.category] ||
                EXPENSE_CATEGORY_CONFIG.miscellaneous;
              const percent = Math.min(Math.max(cat.percentageOfTotal, 0), 100);

              return (
                <View key={cat.category}>
                  <View className="flex-row items-center justify-between mb-1.5">
                    <View className="flex-row items-center gap-2.5">
                      <View className={`w-8 h-8 rounded-xl items-center justify-center ${cfg.bg}`}>
                        <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                      </View>
                      <View>
                        <Typography variant="bodySmall" style={{ fontWeight: '700' }}>
                          {cfg.label}
                        </Typography>
                        <Typography variant="caption" color="muted">
                          {cat.transactionCount} {cat.transactionCount === 1 ? 'entry' : 'entries'}
                        </Typography>
                      </View>
                    </View>

                    <View className="items-end">
                      <Typography variant="body" color="ocean" style={{ fontWeight: '800' }}>
                        {formatCurrency(cat.totalAmount, currency)}
                      </Typography>
                      <Typography variant="caption" color="secondary" style={{ fontWeight: '600' }}>
                        {percent.toFixed(1)}% of total
                      </Typography>
                    </View>
                  </View>

                  {/* Horizontal Bar Chart representation */}
                  <View className="h-2.5 w-full bg-ink-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: cfg.color,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Typography variant="caption" color="muted" align="center" className="py-4">
            No category expenditures recorded yet.
          </Typography>
        )}
      </Card>

      {/* 2. Per-Person Spending Contributions */}
      <Card className="mb-6 p-5 bg-white border border-ink-200">
        <View className="flex-row items-center justify-between mb-4">
          <Typography variant="h3">Crew Contributions</Typography>
          <Badge label={`${payerStatistics.length} Payers`} tone="seafoam" />
        </View>

        {payerStatistics.length > 0 ? (
          <View className="gap-3.5">
            {payerStatistics.map((payerStat, idx) => {
              const u = payerStat.user || {};
              const initial = u.name ? u.name.charAt(0).toUpperCase() : '?';
              const percentPaid =
                totalExpenses > 0
                  ? Math.round((payerStat.totalPaid / totalExpenses) * 100)
                  : 0;

              return (
                <View
                  key={u._id || idx}
                  className="p-3 bg-ink-50 rounded-2xl border border-ink-100"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                      {u.profileImage ? (
                        <Image
                          source={{ uri: u.profileImage }}
                          className="w-10 h-10 rounded-full border border-ocean-200"
                        />
                      ) : (
                        <View className="w-10 h-10 rounded-full bg-ocean-800 items-center justify-center">
                          <Typography variant="body" color="inverse" style={{ fontWeight: '700' }}>
                            {initial}
                          </Typography>
                        </View>
                      )}

                      <View className="flex-1">
                        <Typography variant="bodySmall" numberOfLines={1} style={{ fontWeight: '700' }}>
                          {u.name || 'Member'}
                        </Typography>
                        <Typography variant="caption" color="secondary" numberOfLines={1}>
                          Paid for {payerStat.transactionsPaid} {payerStat.transactionsPaid === 1 ? 'bill' : 'bills'}
                        </Typography>
                      </View>
                    </View>

                    <View className="items-end">
                      <Typography variant="bodySmall" color="ocean" style={{ fontWeight: '800' }}>
                        {formatCurrency(payerStat.totalPaid, currency)}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {percentPaid}% of group
                      </Typography>
                    </View>
                  </View>

                  <View className="h-2 w-full bg-ink-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-seafoam-500 rounded-full"
                      style={{ width: `${percentPaid}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Typography variant="caption" color="muted" align="center" className="py-4">
            No contributor records available.
          </Typography>
        )}
      </Card>
    </ScreenContainer>
  );
}
