import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  Badge,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { Card, ExpenseCard, EXPENSE_CATEGORY_CONFIG } from '../../components/cards';
import { SkeletonBox } from '../../components/dashboard/DashboardSkeleton';
import { COLORS } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { expenseService, tripService } from '../../services';

export default function ExpensesTabScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(params.tripId || null);
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlementsData, setSettlementsData] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // 1. Initial Trips Fetch & Selection
  useEffect(() => {
    const initTrips = async () => {
      try {
        const res = await tripService.getTrips({ limit: 10, sort: 'asc' });
        const userTrips = res.data?.trips || [];
        setTrips(userTrips);

        if (!selectedTripId && userTrips.length > 0) {
          const activeOrUpcoming =
            userTrips.find((t) => t.status === 'active') ||
            userTrips.find((t) => t.status === 'planning') ||
            userTrips[0];
          setSelectedTripId(activeOrUpcoming._id);
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize trips');
      }
    };
    initTrips();
  }, []);

  // 2. Fetch Trip Financial Data
  const fetchFinancials = useCallback(async (tripId, isRefresh = false) => {
    if (!tripId) {
      setIsLoading(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [budgetRes, expensesRes, settlementsRes, analyticsRes] =
        await Promise.all([
          expenseService.getTripBudget(tripId).catch(() => ({ data: null })),
          expenseService.getTripExpenses(tripId, { limit: 8 }).catch(() => ({ data: { expenses: [] } })),
          expenseService.getTripSettlements(tripId).catch(() => ({ data: null })),
          expenseService.getTripAnalytics(tripId).catch(() => ({ data: null })),
        ]);

      setBudget(budgetRes.data);
      setExpenses(expensesRes.data?.expenses || []);
      setSettlementsData(settlementsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load expense records');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      fetchFinancials(selectedTripId);
    }
  }, [selectedTripId, fetchFinancials]);

  const onRefresh = useCallback(() => {
    if (selectedTripId) {
      fetchFinancials(selectedTripId, true);
    }
  }, [selectedTripId, fetchFinancials]);

  const selectedTrip = trips.find((t) => t._id === selectedTripId);

  // Quick Action navigation
  const handleAddExpense = () => {
    router.push({
      pathname: '/expenses/create',
      params: { tripId: selectedTripId },
    });
  };

  const handleOpenAnalytics = () => {
    router.push({
      pathname: '/expenses/analytics',
      params: { tripId: selectedTripId },
    });
  };

  const handleOpenBudget = () => {
    router.push({
      pathname: '/expenses/budget',
      params: { tripId: selectedTripId },
    });
  };

  const handleOpenSettlements = () => {
    router.push({
      pathname: '/expenses/settlements',
      params: { tripId: selectedTripId },
    });
  };

  const handleOpenHistory = () => {
    router.push({
      pathname: '/expenses/history',
      params: { tripId: selectedTripId },
    });
  };

  return (
    <ScreenContainer
      scrollable
      padded
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      edges={['top', 'left', 'right']}
    >
      <ScreenHeader
        title="Expense Tracker"
        subtitle="Shared budgets & coastal spending"
        rightAction={
          selectedTripId ? (
            <Pressable
              onPress={handleAddExpense}
              className="flex-row items-center bg-ocean-700 px-3 py-1.5 rounded-xl active:bg-ocean-800 shadow-xs"
            >
              <Ionicons name="add" size={16} color={COLORS.textInverse} />
              <Typography variant="caption" color="inverse" style={{ fontWeight: '700' }} className="ml-1">
                Add
              </Typography>
            </Pressable>
          ) : null
        }
      />

      {/* Trip Selector Chips */}
      {trips.length > 0 ? (
        <View className="mb-4">
          <Typography variant="caption" color="secondary" className="mb-1.5">
            Select Active Voyage:
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {trips.map((t) => {
              const isSelected = t._id === selectedTripId;
              return (
                <Pressable
                  key={t._id}
                  onPress={() => setSelectedTripId(t._id)}
                  className={`px-3.5 py-2 rounded-xl border mr-2 flex-row items-center gap-1.5 ${
                    isSelected
                      ? 'bg-ocean-800 border-ocean-800 shadow-xs'
                      : 'bg-white border-ink-200'
                  }`}
                >
                  <Ionicons
                    name="boat"
                    size={14}
                    color={isSelected ? COLORS.textInverse : COLORS.primary}
                  />
                  <Typography
                    variant="caption"
                    color={isSelected ? 'inverse' : 'primary'}
                    style={{ fontWeight: isSelected ? '700' : '500' }}
                  >
                    {t.title || t.destination}
                  </Typography>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Error State */}
      {error && !isLoading ? (
        <ErrorState
          message={error}
          onRetry={() => fetchFinancials(selectedTripId)}
          className="mb-4"
        />
      ) : null}

      {/* No Trips State */}
      {!isLoading && trips.length === 0 ? (
        <EmptyState
          icon="boat-outline"
          title="No Active Expeditions"
          description="Create a trip first to start tracking shared expenses, food receipts, and group splits."
          actionLabel="Create Trip"
          onAction={() => router.push('/trips/create')}
        />
      ) : isLoading && !isRefreshing ? (
        /* Loading Skeleton */
        <View className="gap-4">
          <SkeletonBox height={160} className="rounded-3xl" />
          <SkeletonBox height={80} className="rounded-2xl" />
          <SkeletonBox height={140} className="rounded-2xl" />
        </View>
      ) : (
        <>
          {/* Main Budget Progress Card */}
          {budget ? (
            <View className="bg-ocean-900 rounded-3xl p-5 mb-5 shadow-sm border border-ocean-800">
              <View className="flex-row items-center justify-between mb-2">
                <Badge
                  label={budget.status || 'Active Budget'}
                  tone={budget.status === 'exceeded' ? 'coral' : 'seafoam'}
                />
                <Typography variant="caption" color="#A7F3D0">
                  {selectedTrip?.destination || 'Coastal Journey'}
                </Typography>
              </View>

              <Typography variant="caption" color="#CBD5E1">
                Total Expenses Logged:
              </Typography>
              <Typography variant="h1" color="inverse" style={{ fontWeight: '800' }} className="mb-2">
                {formatCurrency(budget.totalSpent || 0, budget.currency || 'INR')}
              </Typography>

              {/* Progress Bar */}
              <View className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden mb-3">
                <View
                  className={`h-full rounded-full ${
                    (budget.percentageUsed || 0) > 90 ? 'bg-amber-400' : 'bg-seafoam-400'
                  }`}
                  style={{ width: `${Math.min(100, budget.percentageUsed || 0)}%` }}
                />
              </View>

              <View className="flex-row items-center justify-between pt-2 border-t border-white/10">
                <View>
                  <Typography variant="caption" color="#CBD5E1">
                    Allocated Budget
                  </Typography>
                  <Typography variant="bodySmall" color="inverse" style={{ fontWeight: '700' }}>
                    {formatCurrency(budget.totalBudget || 0, budget.currency || 'INR')}
                  </Typography>
                </View>

                <View className="items-end">
                  <Typography variant="caption" color="#CBD5E1">
                    Remaining
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    color={(budget.remaining || 0) < 0 ? '#FCA5A5' : '#34D399'}
                    style={{ fontWeight: '700' }}
                  >
                    {formatCurrency(budget.remaining || 0, budget.currency || 'INR')}
                  </Typography>
                </View>
              </View>
            </View>
          ) : null}

          {/* Quick Action Navigation Grid */}
          <Typography variant="h3" className="mb-3">
            Financial Modules
          </Typography>

          <View className="flex-row flex-wrap gap-2.5 mb-5">
            <Pressable
              onPress={handleAddExpense}
              className="flex-1 min-w-[45%] bg-white border border-ink-200 rounded-2xl p-3.5 active:bg-ocean-50 active:border-ocean-300 shadow-xs"
            >
              <View className="w-9 h-9 rounded-xl bg-ocean-50 items-center justify-center mb-2">
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
              </View>
              <Typography variant="bodySmall" style={{ fontWeight: '700' }}>
                Add Expense
              </Typography>
              <Typography variant="caption" color="secondary">
                Log food, stay, or cab
              </Typography>
            </Pressable>

            <Pressable
              onPress={handleOpenAnalytics}
              className="flex-1 min-w-[45%] bg-white border border-ink-200 rounded-2xl p-3.5 active:bg-seafoam-50 active:border-seafoam-300 shadow-xs"
            >
              <View className="w-9 h-9 rounded-xl bg-seafoam-50 items-center justify-center mb-2">
                <Ionicons name="pie-chart-outline" size={20} color={COLORS.secondary} />
              </View>
              <Typography variant="bodySmall" style={{ fontWeight: '700' }}>
                Analytics
              </Typography>
              <Typography variant="caption" color="secondary">
                Category spending %
              </Typography>
            </Pressable>

            <Pressable
              onPress={handleOpenSettlements}
              className="flex-1 min-w-[45%] bg-white border border-ink-200 rounded-2xl p-3.5 active:bg-coral-50 active:border-coral-300 shadow-xs"
            >
              <View className="w-9 h-9 rounded-xl bg-coral-50 items-center justify-center mb-2">
                <Ionicons name="people-outline" size={20} color={COLORS.accent} />
              </View>
              <Typography variant="bodySmall" style={{ fontWeight: '700' }}>
                Settlements
              </Typography>
              <Typography variant="caption" color="secondary">
                Who owes whom
              </Typography>
            </Pressable>

            <Pressable
              onPress={handleOpenHistory}
              className="flex-1 min-w-[45%] bg-white border border-ink-200 rounded-2xl p-3.5 active:bg-ink-50 shadow-xs"
            >
              <View className="w-9 h-9 rounded-xl bg-ink-50 items-center justify-center mb-2">
                <Ionicons name="receipt-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <Typography variant="bodySmall" style={{ fontWeight: '700' }}>
                History
              </Typography>
              <Typography variant="caption" color="secondary">
                View all receipts
              </Typography>
            </Pressable>
          </View>

          {/* Recent Expenses List */}
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Typography variant="h3">Recent Expenses</Typography>
            {expenses.length > 0 ? (
              <Pressable onPress={handleOpenHistory} hitSlop={6}>
                <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
                  View All ({expenses.length})
                </Typography>
              </Pressable>
            ) : null}
          </View>

          {expenses.length === 0 ? (
            <View className="bg-white border border-ink-200 rounded-2xl p-5 items-center mb-8">
              <Typography variant="caption" color="muted" align="center" className="mb-3">
                No expenses logged for this expedition yet.
              </Typography>
              <Button
                title="Add First Expense"
                variant="primary"
                size="sm"
                onPress={handleAddExpense}
              />
            </View>
          ) : (
            <View className="gap-2.5 pb-8">
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense._id}
                  expense={expense}
                  onPress={() =>
                    router.push({
                      pathname: '/expenses/edit',
                      params: {
                        id: expense._id,
                        tripId: selectedTripId,
                      },
                    })
                  }
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScreenContainer>
  );
}
