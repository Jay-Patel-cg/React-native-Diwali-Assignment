import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  Badge,
  EmptyState,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation/ScreenHeader';
import { AiPlanDayCard } from '../../components/ai';
import { COLORS } from '../../constants/theme';
import { useAiStore } from '../../store/useAiStore';
import { aiService } from '../../services/aiService';
import { tripService } from '../../services/tripService';

export default function AiGeneratedItineraryScreen() {
  const router = useRouter();
  const currentPlan = useAiStore((state) => state.currentPlan);
  const preferences = useAiStore((state) => state.preferences);
  const setCurrentPlan = useAiStore((state) => state.setCurrentPlan);
  const updatePlanDay = useAiStore((state) => state.updatePlanDay);
  const addActivityToDay = useAiStore((state) => state.addActivityToDay);
  const removeActivityFromDay = useAiStore((state) => state.removeActivityFromDay);
  const updateActivityInDay = useAiStore((state) => state.updateActivityInDay);
  const clearCurrentPlan = useAiStore((state) => state.clearCurrentPlan);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [optimizeModalVisible, setOptimizeModalVisible] = useState(false);
  const [selectedPace, setSelectedPace] = useState('relaxed');

  if (!currentPlan) {
    return (
      <ScreenContainer padded edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title="AI Itinerary" showBack />
        <EmptyState
          icon="compass-outline"
          title="No Active AI Itinerary"
          description="You haven't generated an AI travel plan yet. Enter your preferences to build a custom journey."
          actionLabel="Plan New Trip"
          onAction={() => router.push('/ai/preferences')}
        />
      </ScreenContainer>
    );
  }

  const {
    tripTitle,
    destination,
    destinationSummary,
    estimatedTotalCost,
    totalEstimatedCost,
    currency = 'INR',
    dayWiseItinerary = [],
    budgetBreakdown,
    foodRecommendations = [],
    travelTips = [],
    packingSuggestions = [],
    optimizationNotes,
  } = currentPlan;

  const displayTotalCost =
    budgetBreakdown?.totalEstimatedCost ||
    estimatedTotalCost ||
    totalEstimatedCost ||
    0;

  const resolvedPackingList =
    Array.isArray(packingSuggestions) && packingSuggestions.length > 0
      ? packingSuggestions
      : Array.isArray(travelTips)
        ? travelTips.slice(0, 5)
        : [];

  // Handle Itinerary Optimization
  const handleOptimize = async () => {
    setOptimizeModalVisible(false);
    setIsOptimizing(true);
    try {
      const payload = {
        destination: destination || preferences.destination || 'Coastal Journey',
        itinerary: dayWiseItinerary.map((d, idx) => ({
          dayNumber: d.dayNumber || idx + 1,
          date: d.date || '',
          theme: d.title || d.theme || '',
          activities: (d.activities || []).map((act) => ({
            title: act.title,
            time: act.time || '',
            description: act.description || '',
            location: act.location || '',
            estimatedCost: act.estimatedCost || 0,
            category: act.category || 'sightseeing',
          })),
        })),
        pace: selectedPace,
        budget: estimatedTotalCost || preferences.budget,
      };

      const res = await aiService.optimizeItinerary(payload);
      if (res && res.data) {
        // Update current plan with optimized itinerary
        const updated = {
          ...currentPlan,
          dayWiseItinerary: res.data.optimizedItinerary || res.data.itinerary || dayWiseItinerary,
          optimizationNotes: res.data.optimizationNotes || 'Itinerary optimized for smoother pacing.',
          estimatedTotalCost: res.data.estimatedTotalCost || estimatedTotalCost,
        };
        setCurrentPlan(updated);
        Alert.alert('Itinerary Optimized', updated.optimizationNotes);
      }
    } catch (err) {
      Alert.alert('Optimization Failed', err.message || 'Could not optimize itinerary.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Save to My Expeditions with User Confirmation
  const handleSaveToTrips = () => {
    Alert.alert(
      'Save to My Expeditions?',
      `Confirm saving "${tripTitle || destination}" to your account. This will create a real trip with ${dayWiseItinerary.length} scheduled itinerary days and ${packingSuggestions.length} packing suggestions.`,
      [
        { text: 'Review Plan More', style: 'cancel' },
        {
          text: 'Confirm & Save',
          style: 'default',
          onPress: performTripSave,
        },
      ]
    );
  };

  const performTripSave = async () => {
    setIsSaving(true);
    try {
      // 1. Create Core Trip
      const createPayload = {
        title: tripTitle || `${destination} Expedition`,
        destination: destination || preferences.destination,
        startDate: preferences.startDate || new Date().toISOString().split('T')[0],
        endDate:
          preferences.endDate ||
          new Date(Date.now() + dayWiseItinerary.length * 86400000).toISOString().split('T')[0],
        budget: estimatedTotalCost || (preferences.budget ? Number(preferences.budget) : undefined),
        currency: currency || 'INR',
        travelers: preferences.travelers || 1,
        status: 'planning',
      };

      const tripRes = await tripService.createTrip(createPayload);
      const newTrip = tripRes.data?.trip || tripRes.data;
      const tripId = newTrip?._id || newTrip?.id;

      if (!tripId) {
        throw new Error('Trip created but no trip ID was returned by backend.');
      }

      // 2. Create Itinerary Days sequentially
      for (const day of dayWiseItinerary) {
        const dayNumber = day.dayNumber || day.day || 1;
        const sanitizedActivities = (day.activities || []).map((a) => ({
          title: a.title,
          category: a.category || 'sightseeing',
          time: a.time || undefined,
          description: a.description || undefined,
          estimatedCost: a.estimatedCost ? Number(a.estimatedCost) : 0,
        }));

        await tripService.createItinerary(tripId, {
          dayNumber,
          date: day.date || createPayload.startDate,
          activities: sanitizedActivities,
        });
      }

      // 3. Add Packing list suggestions if any
      if (Array.isArray(packingSuggestions) && packingSuggestions.length > 0) {
        const packingItems = packingSuggestions.map((item) => ({
          itemName: typeof item === 'string' ? item : item.name || item.itemName,
          category: 'clothing',
        }));
        await tripService.addPackingItems(tripId, { items: packingItems }).catch(() => {});
      }

      // 4. Success alert and navigate
      Alert.alert(
        'Expedition Saved! ⛵',
        `"${tripTitle || destination}" has been successfully saved to your expeditions.`,
        [
          {
            text: 'View Trip Details',
            onPress: () => {
              clearCurrentPlan();
              router.replace(`/trips/${tripId}`);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Unable to save trip to account.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title="AI Itinerary"
        subtitle={destination}
        showBack
      />

      {/* Overview Card */}
      <View className="rounded-3xl bg-ocean-900 p-5 mb-4 shadow-sm border border-ocean-800">
        <View className="flex-row items-center justify-between mb-2">
          <Badge label="AI Draft Plan" tone="seafoam" />
          <Typography variant="caption" color="#A7F3D0">
            {dayWiseItinerary.length} Days • {preferences.travelers || 1} Travelers
          </Typography>
        </View>

        <Typography variant="h2" color="inverse" className="mb-1.5">
          {tripTitle || `${destination} Coastal Expedition`}
        </Typography>

        {destinationSummary ? (
          <Typography variant="bodySmall" color="#E2E8F0" className="mb-3 leading-5">
            {destinationSummary}
          </Typography>
        ) : null}

        <View className="flex-row items-baseline gap-2 pt-3 border-t border-white/10">
          <Typography variant="caption" color="#CBD5E1">
            Estimated Total Budget:
          </Typography>
          <Typography variant="h3" color="#34D399" style={{ fontWeight: '800' }}>
            {currency} {Number(displayTotalCost || 0).toLocaleString('en-IN')}
          </Typography>
        </View>
      </View>

      {/* Optimization Notes Banner if any */}
      {optimizationNotes ? (
        <View className="bg-seafoam-50 border border-seafoam-300 rounded-2xl p-3.5 mb-4 flex-row items-start gap-2.5">
          <Ionicons name="sparkles" size={18} color={COLORS.secondary} className="mt-0.5" />
          <View className="flex-1">
            <Typography variant="caption" color="seafoam" style={{ fontWeight: '700' }} className="mb-0.5">
              AI OPTIMIZATION APPLIED
            </Typography>
            <Typography variant="caption" color="secondary" className="leading-4">
              {optimizationNotes}
            </Typography>
          </View>
        </View>
      ) : null}

      {/* Draft Disclaimer */}
      <View className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-5 flex-row items-center gap-2.5">
        <Ionicons name="information-circle-outline" size={18} color="#D97706" />
        <Typography variant="caption" color="#92400E" className="flex-1 leading-4">
          This is an AI draft proposal. You can edit activities, add new stops, or optimize pacing before saving.
        </Typography>
      </View>

      {/* Action Bar: Optimize & Chat Copilot */}
      <View className="flex-row gap-2 mb-5">
        <Pressable
          onPress={() => setOptimizeModalVisible(true)}
          disabled={isOptimizing}
          className="flex-1 flex-row items-center justify-center bg-white border border-ocean-300 py-2.5 px-3 rounded-xl active:bg-ocean-50"
        >
          {isOptimizing ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="git-branch-outline" size={16} color={COLORS.primary} className="mr-1.5" />
              <Typography variant="caption" color="ocean" style={{ fontWeight: '700' }} className="ml-1">
                Optimize Route
              </Typography>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/ai/chat',
              params: {
                destination,
                tripTitle,
              },
            })
          }
          className="flex-1 flex-row items-center justify-center bg-white border border-ink-200 py-2.5 px-3 rounded-xl active:bg-ink-50"
        >
          <Ionicons name="chatbubbles-outline" size={16} color={COLORS.textPrimary} className="mr-1.5" />
          <Typography variant="caption" color="primary" style={{ fontWeight: '700' }} className="ml-1">
            Ask Copilot
          </Typography>
        </Pressable>
      </View>

      {/* Day-Wise Timeline */}
      <Typography variant="h3" className="mb-3">
        Day-by-Day Journey
      </Typography>

      {dayWiseItinerary.map((day, idx) => (
        <AiPlanDayCard
          key={idx}
          day={day}
          dayIndex={idx}
          onUpdateDay={updatePlanDay}
          onAddActivity={addActivityToDay}
          onDeleteActivity={removeActivityFromDay}
          onUpdateActivity={updateActivityInDay}
        />
      ))}

      {/* Budget Breakdown Card */}
      {budgetBreakdown && typeof budgetBreakdown === 'object' && (
        <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
          <View className="flex-row items-center justify-between mb-3">
            <Typography variant="h3">Budget Breakdown</Typography>
            <Badge label="Approximate" tone="neutral" />
          </View>

          <View className="gap-2.5">
            {Array.isArray(budgetBreakdown.categories)
              ? budgetBreakdown.categories.map((c, idx) => (
                  <View
                    key={c.category || idx}
                    className="flex-row items-center justify-between pb-2 border-b border-ink-100"
                  >
                    <View>
                      <Typography variant="bodySmall" className="capitalize">
                        {c.category}
                      </Typography>
                      {c.notes ? (
                        <Typography variant="caption" color="muted">
                          {c.notes}
                        </Typography>
                      ) : null}
                    </View>
                    <Typography variant="bodySmall" style={{ fontWeight: '700' }} color="ocean">
                      {currency} {Number(c.estimatedAmount || 0).toLocaleString('en-IN')}
                    </Typography>
                  </View>
                ))
              : Object.entries(budgetBreakdown).map(([category, amount]) => (
                  <View
                    key={category}
                    className="flex-row items-center justify-between pb-2 border-b border-ink-100"
                  >
                    <Typography variant="bodySmall" className="capitalize">
                      {category}
                    </Typography>
                    <Typography variant="bodySmall" style={{ fontWeight: '700' }} color="ocean">
                      {currency} {Number(amount || 0).toLocaleString('en-IN')}
                    </Typography>
                  </View>
                ))}
          </View>
        </View>
      )}

      {/* Food Recommendations */}
      {foodRecommendations.length > 0 && (
        <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="restaurant-outline" size={18} color={COLORS.accent} />
            <Typography variant="h3">Coastal Culinary Picks</Typography>
          </View>

          <View className="gap-2">
            {foodRecommendations.map((item, idx) => (
              <View key={idx} className="flex-row items-start gap-2">
                <Ionicons name="checkmark-circle" size={14} color={COLORS.secondary} className="mt-0.5" />
                <Typography variant="caption" color="secondary" className="flex-1 leading-4">
                  {typeof item === 'string' ? item : item.name || item.recommendation}
                </Typography>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Travel Tips & Packing Suggestions */}
      {(travelTips.length > 0 || packingSuggestions.length > 0) && (
        <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-6 shadow-xs">
          {travelTips.length > 0 && (
            <View className="mb-4">
              <Typography variant="h3" className="mb-2">
                Copilot Travel Tips
              </Typography>
              <View className="gap-1.5">
                {travelTips.map((tip, idx) => (
                  <View key={idx} className="flex-row items-start gap-2">
                    <Ionicons name="bulb-outline" size={14} color={COLORS.primary} className="mt-0.5" />
                    <Typography variant="caption" color="secondary" className="flex-1 leading-4">
                      {tip}
                    </Typography>
                  </View>
                ))}
              </View>
            </View>
          )}

          {packingSuggestions.length > 0 && (
            <View>
              <Typography variant="h3" className="mb-2">
                Packing Suggestions
              </Typography>
              <View className="flex-row flex-wrap gap-1.5">
                {packingSuggestions.map((item, idx) => (
                  <Badge
                    key={idx}
                    label={typeof item === 'string' ? item : item.itemName}
                    tone="neutral"
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Save to My Expeditions CTA */}
      <View className="mb-8">
        {isSaving ? (
          <View className="bg-ocean-900 rounded-2xl p-5 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.secondarySoft} className="mb-2" />
            <Typography variant="body" color="inverse" style={{ fontWeight: '700' }}>
              Saving Expedition to Your Account...
            </Typography>
            <Typography variant="caption" color="#A7F3D0">
              Creating trip schedule, itinerary days, and packing list
            </Typography>
          </View>
        ) : (
          <Button
            title="Save to My Expeditions ⛵"
            variant="primary"
            size="lg"
            onPress={handleSaveToTrips}
            leftIcon={<Ionicons name="bookmark-outline" size={20} color={COLORS.textInverse} />}
          />
        )}
      </View>

      {/* Optimize Pace Modal */}
      <Modal
        visible={optimizeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOptimizeModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-3xl p-5 border border-ink-100 shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <Typography variant="h3">Optimize Itinerary</Typography>
              <Pressable onPress={() => setOptimizeModalVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            <Typography variant="bodySmall" color="secondary" className="mb-4">
              Choose your preferred pacing. Gemini AI will recalculate transit times and balance your stops.
            </Typography>

            <View className="gap-2.5 mb-5">
              {[
                { id: 'relaxed', label: 'Relaxed Pace', desc: 'More downtime, scenic sunsets, 1-2 stops/day' },
                { id: 'moderate', label: 'Moderate Pace', desc: 'Balanced sightseeing and relaxation, 3-4 stops/day' },
                { id: 'packed', label: 'Packed Pace', desc: 'Action-packed, maximizing spots & water activities' },
              ].map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setSelectedPace(p.id)}
                  className={`p-3.5 rounded-2xl border ${
                    selectedPace === p.id
                      ? 'bg-ocean-50 border-ocean-600'
                      : 'bg-white border-ink-200'
                  }`}
                >
                  <Typography
                    variant="body"
                    style={{ fontWeight: '700' }}
                    color={selectedPace === p.id ? 'ocean' : 'primary'}
                  >
                    {p.label}
                  </Typography>
                  <Typography variant="caption" color="secondary" className="mt-0.5">
                    {p.desc}
                  </Typography>
                </Pressable>
              ))}
            </View>

            <View className="flex-row justify-end gap-2">
              <Button
                title="Cancel"
                variant="ghost"
                size="sm"
                onPress={() => setOptimizeModalVisible(false)}
              />
              <Button
                title="Run Optimization"
                variant="primary"
                size="sm"
                onPress={handleOptimize}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
