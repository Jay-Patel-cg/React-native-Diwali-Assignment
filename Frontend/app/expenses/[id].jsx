import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Badge,
  Button,
  LoadingState,
  ErrorState,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { EXPENSE_CATEGORY_CONFIG } from '../../components/cards/ExpenseCard';
import { COLORS } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { expenseService } from '../../services';

export default function ExpenseDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const expenseId = params.id;
  const tripId = params.tripId;

  const [expense, setExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      if (!expenseId || !tripId) {
        setIsLoading(false);
        setError('Missing expense or trip ID.');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const res = await expenseService.getTripExpenses(tripId, { limit: 50 });
        const list = res.data?.expenses || [];
        const found = list.find((e) => (e._id || e.id) === expenseId);
        if (found) {
          setExpense(found);
        } else {
          setError('Expense record not found.');
        }
      } catch (err) {
        setError(err.message || 'Could not load expense details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenseDetails();
  }, [expenseId, tripId]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to permanently delete this expense? Split balances will be recalculated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await expenseService.deleteExpense(tripId, expenseId);
              Alert.alert('Deleted', 'Expense record deleted.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err) {
              Alert.alert('Delete Failed', err.message || 'Could not delete expense.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const config =
    EXPENSE_CATEGORY_CONFIG[expense?.category?.toLowerCase()] ||
    EXPENSE_CATEGORY_CONFIG.miscellaneous;

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title="Expense Details"
        subtitle={expense?.tripTitle || 'Expedition Expense'}
        showBack
        rightAction={
          expense ? (
            <View className="flex-row items-center gap-1.5">
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/expenses/edit',
                    params: { id: expenseId, tripId },
                  })
                }
                hitSlop={6}
                className="w-9 h-9 rounded-full bg-white border border-ink-200 items-center justify-center shadow-xs"
              >
                <Ionicons name="pencil" size={16} color={COLORS.primary} />
              </Pressable>
              <Pressable
                onPress={handleDelete}
                hitSlop={6}
                disabled={isDeleting}
                className="w-9 h-9 rounded-full bg-white border border-red-200 items-center justify-center shadow-xs"
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.error} />
              </Pressable>
            </View>
          ) : null
        }
      />

      {isLoading ? (
        <LoadingState message="Loading expense details..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => router.back()} />
      ) : expense ? (
        <>
          {/* Main Amount Card */}
          <View className="bg-white border border-ink-200 rounded-3xl p-6 mb-5 items-center shadow-xs">
            <View
              className={`w-14 h-14 rounded-2xl ${config.bg} items-center justify-center mb-3`}
            >
              <Ionicons name={config.icon} size={28} color={config.color} />
            </View>

            <Typography variant="caption" color="secondary" className="mb-0.5 capitalize">
              {config.label}
            </Typography>

            <Typography variant="h1" color="ocean" style={{ fontWeight: '800' }} className="mb-2">
              {formatCurrency(expense.amount, expense.currency || 'INR')}
            </Typography>

            <Typography variant="h3" align="center" className="mb-1">
              {expense.description || expense.title}
            </Typography>

            <Typography variant="caption" color="muted">
              {formatDate(expense.date)}
            </Typography>
          </View>

          {/* Paid By Card */}
          <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
            <Typography variant="h3" className="mb-3">
              Payment Information
            </Typography>

            <View className="flex-row items-center justify-between pb-3 border-b border-ink-100">
              <Typography variant="bodySmall" color="secondary">
                Paid By
              </Typography>
              <View className="flex-row items-center gap-2">
                <View className="w-7 h-7 rounded-full bg-ocean-700 items-center justify-center">
                  <Typography variant="caption" color="inverse" style={{ fontWeight: '700' }}>
                    {(expense.paidBy?.name || 'User').charAt(0).toUpperCase()}
                  </Typography>
                </View>
                <Typography variant="bodySmall" style={{ fontWeight: '700' }}>
                  {expense.paidBy?.name || 'You'}
                </Typography>
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-3">
              <Typography variant="bodySmall" color="secondary">
                Split Type
              </Typography>
              <Badge
                label={expense.splitType ? expense.splitType.toUpperCase() : 'EQUAL SPLIT'}
                tone="seafoam"
              />
            </View>
          </View>

          {/* Split Breakdown */}
          {Array.isArray(expense.splitWith) && expense.splitWith.length > 0 && (
            <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-8 shadow-xs">
              <Typography variant="h3" className="mb-3">
                Participants Split ({expense.splitWith.length})
              </Typography>

              <View className="gap-2.5">
                {expense.splitWith.map((split, idx) => {
                  const participantName =
                    split.user?.name || split.userId?.name || split.name || `Member ${idx + 1}`;
                  const splitAmount = split.amount || (expense.amount / expense.splitWith.length);

                  return (
                    <View
                      key={idx}
                      className="flex-row items-center justify-between pb-2 border-b border-ink-100"
                    >
                      <View className="flex-row items-center gap-2">
                        <View className="w-7 h-7 rounded-full bg-ink-100 items-center justify-center">
                          <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
                        </View>
                        <Typography variant="bodySmall" style={{ fontWeight: '600' }}>
                          {participantName}
                        </Typography>
                      </View>

                      <Typography variant="bodySmall" style={{ fontWeight: '700' }} color="ocean">
                        {formatCurrency(splitAmount, expense.currency || 'INR')}
                      </Typography>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </>
      ) : null}
    </ScreenContainer>
  );
}
