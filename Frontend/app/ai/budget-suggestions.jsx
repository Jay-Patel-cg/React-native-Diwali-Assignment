import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  Badge,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation/ScreenHeader';
import { AiBudgetTierCard } from '../../components/ai';
import { COLORS } from '../../constants/theme';
import { useAiStore } from '../../store/useAiStore';
import { aiService } from '../../services/aiService';

export default function AiBudgetSuggestionsScreen() {
  const router = useRouter();
  const preferences = useAiStore((state) => state.preferences);
  const setPreferences = useAiStore((state) => state.setPreferences);
  const budgetSuggestions = useAiStore((state) => state.budgetSuggestions);
  const setBudgetSuggestions = useAiStore((state) => state.setBudgetSuggestions);

  const [destination, setDestination] = useState(preferences.destination || 'Goa, India');
  const [origin, setOrigin] = useState(preferences.origin || 'Mumbai');
  const [durationDays, setDurationDays] = useState(4);
  const [travelers, setTravelers] = useState(preferences.travelers || 2);
  const [targetBudget, setTargetBudget] = useState(
    preferences.budget ? String(preferences.budget) : ''
  );
  const [selectedTier, setSelectedTier] = useState('moderate');
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchBudget = async () => {
    if (!destination.trim() || destination.trim().length < 2) {
      Alert.alert('Required', 'Please enter a valid destination.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        destination: destination.trim(),
        origin: origin.trim() || undefined,
        durationDays: Number(durationDays) || 4,
        travelers: Number(travelers) || 1,
        totalBudget: targetBudget.trim() ? Number(targetBudget) : undefined,
        currency: 'INR',
      };

      const res = await aiService.getBudgetSuggestions(payload);
      if (res && res.data) {
        setBudgetSuggestions(res.data);
      }
    } catch (err) {
      Alert.alert('Budget Error', err.message || 'Could not fetch budget suggestions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyBudgetToPlan = () => {
    if (!budgetSuggestions) return;

    const tierData = budgetSuggestions.tierEstimates?.[selectedTier];
    const amount =
      typeof tierData === 'object'
        ? tierData.total || tierData.estimatedTotal
        : tierData || targetBudget;

    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 14);
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays - 1);

    setPreferences({
      destination,
      origin,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      travelers,
      budget: amount ? Number(amount) : undefined,
      travelStyle: [selectedTier === 'luxury' ? 'luxury' : selectedTier === 'budget' ? 'budget' : 'coastal'],
    });

    router.push('/ai/preferences');
  };

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title="Budget Forecaster"
        subtitle="AI Spending Estimates"
        showBack
      />

      {/* Form Card */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
        <Typography variant="h3" className="mb-1">
          Estimate Trip Expenses
        </Typography>
        <Typography variant="caption" color="secondary" className="mb-4">
          Forecast costs for accommodation, seafood dining, water sports, and travel
        </Typography>

        <View className="mb-3">
          <Typography variant="caption" color="secondary" className="mb-1">
            Destination *
          </Typography>
          <View className="flex-row items-center bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5">
            <Ionicons name="location-outline" size={16} color={COLORS.primary} className="mr-2" />
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="e.g. South Goa, Varkala, Havelock"
              placeholderTextColor={COLORS.textMuted}
              className="flex-1 text-ink-900 text-sm ml-2"
            />
          </View>
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Typography variant="caption" color="secondary" className="mb-1">
              Duration (Days)
            </Typography>
            <View className="flex-row items-center bg-ink-50 border border-ink-200 rounded-xl p-1">
              <Pressable
                onPress={() => setDurationDays(Math.max(1, durationDays - 1))}
                className="w-7 h-7 rounded bg-white items-center justify-center border border-ink-200"
              >
                <Ionicons name="remove" size={14} color={COLORS.textPrimary} />
              </Pressable>
              <Typography variant="bodySmall" style={{ fontWeight: '700' }} className="flex-1 text-center">
                {durationDays}d
              </Typography>
              <Pressable
                onPress={() => setDurationDays(Math.min(30, durationDays + 1))}
                className="w-7 h-7 rounded bg-white items-center justify-center border border-ink-200"
              >
                <Ionicons name="add" size={14} color={COLORS.textPrimary} />
              </Pressable>
            </View>
          </View>

          <View className="flex-1">
            <Typography variant="caption" color="secondary" className="mb-1">
              Travelers
            </Typography>
            <View className="flex-row items-center bg-ink-50 border border-ink-200 rounded-xl p-1">
              <Pressable
                onPress={() => setTravelers(Math.max(1, travelers - 1))}
                className="w-7 h-7 rounded bg-white items-center justify-center border border-ink-200"
              >
                <Ionicons name="remove" size={14} color={COLORS.textPrimary} />
              </Pressable>
              <Typography variant="bodySmall" style={{ fontWeight: '700' }} className="flex-1 text-center">
                {travelers}
              </Typography>
              <Pressable
                onPress={() => setTravelers(Math.min(50, travelers + 1))}
                className="w-7 h-7 rounded bg-white items-center justify-center border border-ink-200"
              >
                <Ionicons name="add" size={14} color={COLORS.textPrimary} />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mb-4">
          <Typography variant="caption" color="secondary" className="mb-1">
            Optional Target Budget (₹)
          </Typography>
          <TextInput
            value={targetBudget}
            onChangeText={setTargetBudget}
            keyboardType="numeric"
            placeholder="e.g. 50000 (leave blank for general forecast)"
            placeholderTextColor={COLORS.textMuted}
            className="bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5 text-ink-900 text-sm"
          />
        </View>

        <Button
          title={isLoading ? 'Calculating with Gemini...' : 'Forecast Budget'}
          variant="primary"
          size="md"
          onPress={handleFetchBudget}
          disabled={isLoading}
          leftIcon={<Ionicons name="calculator-outline" size={16} color={COLORS.textInverse} />}
        />
      </View>

      {/* Loading state */}
      {isLoading && (
        <View className="py-10 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.accent} className="mb-3" />
          <Typography variant="bodySmall" color="secondary">
            Gemini AI is factoring seasonal rates, stays, and transit...
          </Typography>
        </View>
      )}

      {/* Results View */}
      {budgetSuggestions && !isLoading && (
        <View className="mb-6">
          {/* Estimated Budget Range Header */}
          <View className="bg-ocean-900 rounded-3xl p-5 mb-5 border border-ocean-800 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Badge label="AI Estimated Range" tone="seafoam" />
              <Typography variant="caption" color="#A7F3D0">
                {durationDays} Days • {travelers} Travelers
              </Typography>
            </View>

            <Typography variant="h2" color="inverse" className="mb-1">
              {budgetSuggestions.destination || destination}
            </Typography>

            {budgetSuggestions.estimatedBudgetRange ? (
              <Typography variant="h3" color="#34D399" style={{ fontWeight: '800' }}>
                {budgetSuggestions.estimatedBudgetRange}
              </Typography>
            ) : null}

            {budgetSuggestions.perPersonPerDay ? (
              <Typography variant="caption" color="#CBD5E1" className="mt-1">
                Avg. Per Person / Day: ₹{Number(budgetSuggestions.perPersonPerDay).toLocaleString('en-IN')}
              </Typography>
            ) : null}
          </View>

          {/* Tier Estimates */}
          {budgetSuggestions.tierEstimates ? (
            <View className="mb-5">
              <Typography variant="h3" className="mb-2">
                Budget Tiers Comparison
              </Typography>
              <Typography variant="caption" color="secondary" className="mb-3">
                Tap a tier to use it for your upcoming itinerary
              </Typography>

              {Object.entries(budgetSuggestions.tierEstimates).map(([tierKey, tierVal]) => (
                <AiBudgetTierCard
                  key={tierKey}
                  tierName={tierKey}
                  tierData={tierVal}
                  isSelected={selectedTier === tierKey}
                  onSelect={() => setSelectedTier(tierKey)}
                />
              ))}
            </View>
          ) : budgetSuggestions.estimatedTotalBudget ? (
            <View className="mb-5">
              <Typography variant="h3" className="mb-2">
                Recommended Tier
              </Typography>
              <AiBudgetTierCard
                tierName={budgetSuggestions.budgetTier || 'Moderate'}
                tierData={{
                  total: budgetSuggestions.estimatedTotalBudget,
                  perDay: budgetSuggestions.estimatedDailyBudget,
                  description: `Estimated ~₹${Number(budgetSuggestions.estimatedDailyBudget || 0).toLocaleString('en-IN')}/day for ${travelers} travelers.`,
                }}
                isSelected={true}
                onSelect={() => {}}
              />
            </View>
          ) : null}

          {/* Category Breakdown */}
          {budgetSuggestions.categoryBreakdown && (
            <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
              <Typography variant="h3" className="mb-3">
                Spending by Category
              </Typography>
              <View className="gap-2.5">
                {Array.isArray(budgetSuggestions.categoryBreakdown)
                  ? budgetSuggestions.categoryBreakdown.map((catItem, idx) => (
                      <View
                        key={catItem.category || idx}
                        className="flex-row items-center justify-between pb-2 border-b border-ink-100"
                      >
                        <View className="flex-1 mr-2">
                          <Typography variant="bodySmall" className="capitalize">
                            {catItem.category} {catItem.percentage ? `(${catItem.percentage}%)` : ''}
                          </Typography>
                          {catItem.rationale ? (
                            <Typography variant="caption" color="muted">
                              {catItem.rationale}
                            </Typography>
                          ) : null}
                        </View>
                        <Typography variant="bodySmall" style={{ fontWeight: '700' }} color="ocean">
                          ₹{Number(catItem.estimatedAmount || 0).toLocaleString('en-IN')}
                        </Typography>
                      </View>
                    ))
                  : Object.entries(budgetSuggestions.categoryBreakdown).map(([cat, val]) => (
                      <View
                        key={cat}
                        className="flex-row items-center justify-between pb-2 border-b border-ink-100"
                      >
                        <Typography variant="bodySmall" className="capitalize">
                          {cat}
                        </Typography>
                        <Typography variant="bodySmall" style={{ fontWeight: '700' }} color="ocean">
                          {typeof val === 'number' ? `₹${val.toLocaleString('en-IN')}` : String(val)}
                        </Typography>
                      </View>
                    ))}
              </View>
            </View>
          )}

          {/* Money Saving Tips */}
          {Array.isArray(budgetSuggestions.moneySavingTips) &&
            budgetSuggestions.moneySavingTips.length > 0 && (
              <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
                <View className="flex-row items-center gap-2 mb-3">
                  <Ionicons name="bulb-outline" size={18} color={COLORS.accent} />
                  <Typography variant="h3">Coastal Money-Saving Tips</Typography>
                </View>
                <View className="gap-2">
                  {budgetSuggestions.moneySavingTips.map((tip, idx) => (
                    <View key={idx} className="flex-row items-start gap-2">
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.secondary} className="mt-0.5" />
                      <Typography variant="caption" color="secondary" className="flex-1 leading-4">
                        {tip}
                      </Typography>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {/* Plan Trip CTA */}
          <Button
            title={`Plan Trip with ${selectedTier.toUpperCase()} Budget ⛵`}
            variant="primary"
            size="lg"
            onPress={handleApplyBudgetToPlan}
            leftIcon={<Ionicons name="sparkles" size={18} color={COLORS.textInverse} />}
          />
        </View>
      )}
    </ScreenContainer>
  );
}
