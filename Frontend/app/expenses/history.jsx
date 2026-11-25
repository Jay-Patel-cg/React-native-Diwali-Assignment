import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, ScrollView, TextInput, Alert } from 'react-native';
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
import { EXPENSE_CATEGORIES } from '../../constants/config';
import { formatCurrency } from '../../utils/formatters';
import { expenseService } from '../../services';

export default function ExpenseHistoryScreen() {
  const { tripId } = useLocalSearchParams();
  const router = useRouter();

  const [expenses, setExpenses] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadExpenses = useCallback(
    async (isRefresh = false) => {
      if (!tripId) return;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const params = {
          sort: sortOrder,
        };
        if (selectedCategory !== 'all') {
          params.category = selectedCategory;
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const res = await expenseService.getExpenses(tripId, params);
        setExpenses(res.data?.expenses || []);
        setTotalSpent(res.data?.tripTotalExpenditure || 0);
      } catch (err) {
        setError(err.message || 'Failed to load expense history');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [tripId, selectedCategory, searchQuery, sortOrder]
  );

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleDeleteExpense = (expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseService.deleteExpense(tripId, expense._id);
              loadExpenses();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer
      scrollable
      padded
      refreshing={isRefreshing}
      onRefresh={() => loadExpenses(true)}
      edges={['top', 'left', 'right']}
    >
      <ScreenHeader
        title="Expense History"
        subtitle={`${expenses.length} transactions recorded`}
        showBack
        rightAction={
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/expenses/create',
                params: { tripId },
              })
            }
            accessibilityLabel="Add Expense"
            className="w-10 h-10 rounded-full bg-ocean-800 items-center justify-center shadow-xs"
          >
            <Ionicons name="add" size={22} color="#FFF" />
          </Pressable>
        }
      />

      {/* Total Filtered Spent Banner */}
      <View className="mb-4 p-4 rounded-2xl bg-ocean-800 flex-row items-center justify-between shadow-xs">
        <View>
          <Typography variant="caption" color="#CCFBF1">
            Total Trip Expenditure
          </Typography>
          <Typography variant="h2" color="inverse" style={{ fontWeight: '800' }}>
            {formatCurrency(totalSpent, 'INR')}
          </Typography>
        </View>

        <Pressable
          onPress={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-xl gap-1"
        >
          <Ionicons
            name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'}
            size={14}
            color="#FFF"
          />
          <Typography variant="caption" color="inverse" style={{ fontWeight: '600' }}>
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </Typography>
        </Pressable>
      </View>

      {/* Search Input */}
      <View className="mb-3">
        <View className="flex-row items-center bg-white border border-ink-200 rounded-2xl px-3.5 h-12 shadow-xs">
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Search by title, location or notes..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2.5 text-[15px] text-ink-900"
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Category Filter Pills */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          <Pressable
            onPress={() => setSelectedCategory('all')}
            className={`mr-2 px-3.5 py-1.5 rounded-full border ${
              selectedCategory === 'all'
                ? 'bg-ocean-800 border-ocean-800'
                : 'bg-white border-ink-200'
            }`}
          >
            <Typography
              variant="bodySmall"
              color={selectedCategory === 'all' ? 'inverse' : 'secondary'}
              style={{ fontWeight: selectedCategory === 'all' ? '700' : '500' }}
            >
              All Categories
            </Typography>
          </Pressable>

          {EXPENSE_CATEGORIES.map((catKey) => {
            const cfg = EXPENSE_CATEGORY_CONFIG[catKey] || EXPENSE_CATEGORY_CONFIG.miscellaneous;
            const isSelected = selectedCategory === catKey;

            return (
              <Pressable
                key={catKey}
                onPress={() => setSelectedCategory(catKey)}
                className={`mr-2 px-3.5 py-1.5 rounded-full border flex-row items-center gap-1.5 ${
                  isSelected
                    ? 'bg-ocean-800 border-ocean-800'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Ionicons
                  name={cfg.icon}
                  size={14}
                  color={isSelected ? '#FFF' : cfg.color}
                />
                <Typography
                  variant="bodySmall"
                  color={isSelected ? 'inverse' : 'secondary'}
                  style={{ fontWeight: isSelected ? '700' : '500' }}
                >
                  {cfg.label}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {error ? (
        <ErrorState message={error} onRetry={loadExpenses} retryLabel="Retry" className="mb-4" />
      ) : null}

      {/* Expenses List */}
      {isLoading && !isRefreshing ? (
        <View className="gap-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} height={85} width="100%" rounded="rounded-2xl" />
          ))}
        </View>
      ) : expenses.length > 0 ? (
        <View className="pb-8">
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense._id}
              expense={expense}
              onPress={() =>
                router.push({
                  pathname: '/expenses/edit',
                  params: { tripId, expenseId: expense._id },
                })
              }
              onEdit={() =>
                router.push({
                  pathname: '/expenses/edit',
                  params: { tripId, expenseId: expense._id },
                })
              }
              onDelete={() => handleDeleteExpense(expense)}
            />
          ))}
        </View>
      ) : (
        <View className="py-12">
          <EmptyState
            title={searchQuery ? 'No matching expenses' : 'No expenses recorded'}
            message={
              searchQuery
                ? `No transactions match "${searchQuery}".`
                : 'Keep everyone on the same page. Log your first expense for this trip.'
            }
            actionLabel="+ Add Expense"
            onAction={() =>
              router.push({
                pathname: '/expenses/create',
                params: { tripId },
              })
            }
          />
        </View>
      )}
    </ScreenContainer>
  );
}
