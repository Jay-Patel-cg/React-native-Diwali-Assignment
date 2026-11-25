import React, { useState, useEffect } from 'react';
import { View, Pressable, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  Badge,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { Card, EXPENSE_CATEGORY_CONFIG } from '../../components/cards';
import { FormInput, FormSelect } from '../../components/forms';
import { COLORS } from '../../constants/theme';
import { EXPENSE_CATEGORIES } from '../../constants/config';
import { useAuthStore } from '../../store/useAuthStore';
import { expenseService, tripService } from '../../services';

export default function AddExpenseScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(params.tripId || null);
  const [members, setMembers] = useState([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState(currentUser?._id || '');
  const [splitType, setSplitType] = useState('equal');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Load Trips
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await tripService.getTrips();
        const userTrips = res.data?.trips || [];
        setTrips(userTrips);
        if (!selectedTripId && userTrips.length > 0) {
          setSelectedTripId(userTrips[0]._id);
        }
      } catch {
        // trips fetch failed
      }
    };
    fetchTrips();
  }, [selectedTripId]);

  // Load Members for selected trip
  useEffect(() => {
    if (!selectedTripId) return;

    const fetchMembers = async () => {
      try {
        const res = await tripService.getTripMembers(selectedTripId);
        const memberList = res.data || [];
        setMembers(memberList);

        // Preselect all members for equal split
        const ids = memberList.map((m) => m.userId?._id).filter(Boolean);
        setSelectedParticipantIds(ids);

        // Default paidBy to current user if member, else first member
        if (currentUser?._id && ids.includes(currentUser._id)) {
          setPaidBy(currentUser._id);
        } else if (ids.length > 0) {
          setPaidBy(ids[0]);
        }
      } catch {
        // members fetch failed
      }
    };
    fetchMembers();
  }, [selectedTripId, currentUser]);

  const toggleParticipant = (userId) => {
    setSelectedParticipantIds((prev) => {
      if (prev.includes(userId)) {
        if (prev.length <= 1) {
          Alert.alert('Notice', 'At least one participant must be included in the split');
          return prev;
        }
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const validate = () => {
    const errs = {};
    if (!selectedTripId) errs.trip = 'Please select a trip';
    if (!title.trim()) errs.title = 'Expense title is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      errs.amount = 'Please enter a valid positive amount';
    }
    if (!paidBy) errs.paidBy = 'Please select who paid';
    if (selectedParticipantIds.length === 0) {
      errs.participants = 'Select at least one participant for the split';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setServerError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        amount: Number(amount),
        currency: 'INR',
        category,
        expenseDate: new Date(expenseDate).toISOString(),
        paidBy,
        splitType: 'equal',
        participants: selectedParticipantIds.map((uid) => ({ userId: uid })),
        notes: notes.trim() || undefined,
      };

      await expenseService.createExpense(selectedTripId, payload);
      router.replace({
        pathname: '/expenses',
        params: { tripId: selectedTripId },
      });
    } catch (err) {
      setServerError(err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable keyboardAware padded edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Add Expense"
        subtitle="Log group costs, splits & payments"
        showBack
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
        {/* Trip Picker if multiple trips exist */}
        {trips.length > 1 ? (
          <View className="mb-4">
            <Typography variant="label" color="secondary" className="mb-1.5 ml-0.5">
              Expedition
            </Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {trips.map((t) => {
                const isSelected = t._id === selectedTripId;
                return (
                  <Pressable
                    key={t._id}
                    onPress={() => setSelectedTripId(t._id)}
                    className={`mr-2 px-3 py-1.5 rounded-xl border ${
                      isSelected
                        ? 'bg-ocean-800 border-ocean-800'
                        : 'bg-white border-ink-200'
                    }`}
                  >
                    <Typography
                      variant="caption"
                      color={isSelected ? 'inverse' : 'secondary'}
                      style={{ fontWeight: isSelected ? '700' : '500' }}
                    >
                      {t.title}
                    </Typography>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Title */}
        <FormInput
          label="What was this expense for?"
          placeholder="e.g. Fisherman Shack Dinner, Speedboat to Anjuna"
          value={title}
          onChangeText={(val) => {
            setTitle(val);
            if (errors.title) setErrors((e) => ({ ...e, title: null }));
          }}
          error={errors.title}
          leftIcon={<Ionicons name="receipt-outline" size={18} color={COLORS.textSecondary} />}
        />

        {/* Amount */}
        <FormInput
          label="Amount (INR)"
          placeholder="e.g. 3500"
          value={amount}
          onChangeText={(val) => {
            setAmount(val);
            if (errors.amount) setErrors((e) => ({ ...e, amount: null }));
          }}
          keyboardType="numeric"
          error={errors.amount}
          leftIcon={<Ionicons name="cash-outline" size={18} color={COLORS.textSecondary} />}
        />

        {/* Category Picker with Visual Chips */}
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

        {/* Expense Date */}
        <FormInput
          label="Date of Payment"
          placeholder="YYYY-MM-DD"
          value={expenseDate}
          onChangeText={setExpenseDate}
          leftIcon={<Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />}
        />

        {/* Paid By Selection */}
        {members.length > 0 ? (
          <View className="mb-4">
            <Typography variant="label" color="secondary" className="mb-2 ml-0.5">
              Who paid for this?
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
                    <Ionicons
                      name="person"
                      size={13}
                      color={isPayer ? '#FFF' : COLORS.textSecondary}
                    />
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

        {/* Split Among Members */}
        {members.length > 0 ? (
          <View className="mb-4 p-3.5 bg-ink-50 rounded-2xl border border-ink-100">
            <View className="flex-row items-center justify-between mb-2">
              <Typography variant="label" color="secondary">
                Split equally among:
              </Typography>
              <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
                {selectedParticipantIds.length} of {members.length} included
              </Typography>
            </View>

            <View className="gap-2">
              {members.map((m) => {
                const uid = m.userId?._id;
                const isIncluded = selectedParticipantIds.includes(uid);
                const name = m.userId?.name || 'Member';

                return (
                  <Pressable
                    key={m._id}
                    onPress={() => toggleParticipant(uid)}
                    className="flex-row items-center justify-between py-1"
                  >
                    <Typography variant="bodySmall" style={{ fontWeight: '500' }}>
                      {name}
                    </Typography>

                    <View
                      className={`w-5 h-5 rounded-md items-center justify-center border ${
                        isIncluded
                          ? 'bg-ocean-800 border-ocean-800'
                          : 'border-ink-300 bg-white'
                      }`}
                    >
                      {isIncluded ? (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Notes */}
        <FormInput
          label="Optional Notes"
          placeholder="e.g. Receipt saved on WhatsApp, Includes tip"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        <Button
          title="Save Expense"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          isLoading={isSubmitting}
          rightIcon={<Ionicons name="checkmark-circle" size={18} color="#FFF" />}
        />
      </Card>
    </ScreenContainer>
  );
}
