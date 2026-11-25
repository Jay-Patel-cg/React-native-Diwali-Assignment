import React, { useState, useEffect } from 'react';
import { View, Pressable, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  LoadingState,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { Card, EXPENSE_CATEGORY_CONFIG } from '../../components/cards';
import { FormInput } from '../../components/forms';
import { COLORS } from '../../constants/theme';
import { EXPENSE_CATEGORIES } from '../../constants/config';
import { expenseService, tripService } from '../../services';

export default function EditExpenseScreen() {
  const { tripId, expenseId } = useLocalSearchParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('miscellaneous');
  const [expenseDate, setExpenseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const loadExpense = async () => {
      try {
        const [expRes, memRes] = await Promise.all([
          expenseService.getExpenseById(tripId, expenseId),
          tripService.getTripMembers(tripId),
        ]);

        const exp = expRes.data;
        setTitle(exp.title || '');
        setAmount(String(exp.amount || ''));
        setCategory(exp.category || 'miscellaneous');
        setExpenseDate(exp.expenseDate ? exp.expenseDate.split('T')[0] : '');
        setNotes(exp.notes || '');
        setPaidBy(exp.paidBy?._id || exp.paidBy || '');
        setMembers(memRes.data || []);
      } catch (err) {
        setServerError(err.message || 'Failed to load expense details');
      } finally {
        setIsLoading(false);
      }
    };

    if (tripId && expenseId) {
      loadExpense();
    }
  }, [tripId, expenseId]);

  const handleUpdate = async () => {
    setServerError(null);
    if (!title.trim()) {
      setServerError('Title is required');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setServerError('Valid positive amount is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await expenseService.updateExpense(tripId, expenseId, {
        title: title.trim(),
        amount: Number(amount),
        category,
        expenseDate: new Date(expenseDate).toISOString(),
        notes: notes.trim(),
        paidBy: paidBy || undefined,
      });

      router.back();
    } catch (err) {
      setServerError(err.message || 'Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${title}"? This will recalculate group balances and settlements.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await expenseService.deleteExpense(tripId, expenseId);
              router.back();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete expense');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading expense details..." fullScreen />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable keyboardAware padded edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Edit Expense"
        subtitle="Modify cost, category or payer"
        showBack
        rightAction={
          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            accessibilityLabel="Delete Expense"
            className="w-10 h-10 rounded-full bg-red-50 border border-red-200 items-center justify-center shadow-xs"
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </Pressable>
        }
      />

      {serverError ? (
        <View className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex-row items-center gap-2.5">
          <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
          <Typography variant="bodySmall" color="danger" className="flex-1">
            {serverError}
          </Typography>
        </View>
      ) : null}

      <Card className="mb-6">
        <FormInput
          label="Expense Title"
          value={title}
          onChangeText={setTitle}
        />

        <FormInput
          label="Amount (INR)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        {/* Category Selector */}
        <View className="mb-4">
          <Typography variant="label" color="secondary" className="mb-2 ml-0.5">
            Category
          </Typography>
          <View className="flex-row flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((catKey) => {
              const cfg = EXPENSE_CATEGORY_CONFIG[catKey] || EXPENSE_CATEGORY_CONFIG.miscellaneous;
              const isSelected = category === catKey;

              return (
                <Pressable
                  key={catKey}
                  onPress={() => setCategory(catKey)}
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-2xl border ${
                    isSelected
                      ? 'bg-ocean-800 border-ocean-800 shadow-xs'
                      : 'bg-white border-ink-200'
                  }`}
                >
                  <Ionicons
                    name={cfg.icon}
                    size={15}
                    color={isSelected ? '#FFF' : cfg.color}
                  />
                  <Typography
                    variant="caption"
                    color={isSelected ? 'inverse' : 'primary'}
                    style={{ fontWeight: isSelected ? '700' : '500' }}
                  >
                    {cfg.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </View>

        <FormInput
          label="Expense Date"
          value={expenseDate}
          onChangeText={setExpenseDate}
        />

        {/* Paid By Selector */}
        {members.length > 0 ? (
          <View className="mb-4">
            <Typography variant="label" color="secondary" className="mb-2 ml-0.5">
              Paid By
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {members.map((m) => {
                const uid = m.userId?._id;
                const isPayer = paidBy === uid;
                const name = m.userId?.name || 'Member';

                return (
                  <Pressable
                    key={m._id}
                    onPress={() => setPaidBy(uid)}
                    className={`px-3 py-1.5 rounded-xl border flex-row items-center gap-1 ${
                      isPayer
                        ? 'bg-seafoam-500 border-seafoam-500'
                        : 'bg-white border-ink-200'
                    }`}
                  >
                    <Typography
                      variant="caption"
                      color={isPayer ? 'inverse' : 'secondary'}
                      style={{ fontWeight: isPayer ? '700' : '500' }}
                    >
                      {name}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <FormInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        <Button
          title="Save Changes"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleUpdate}
          isLoading={isSubmitting}
        />
      </Card>
    </ScreenContainer>
  );
}
