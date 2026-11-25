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
import { COLORS } from '../../constants/theme';
import { useAiStore } from '../../store/useAiStore';
import { aiService } from '../../services/aiService';

const TRAVEL_STYLES = [
  { id: 'coastal', label: 'Coastal Vibe', icon: 'sunny-outline' },
  { id: 'relaxing', label: 'Relaxing', icon: 'cafe-outline' },
  { id: 'adventure', label: 'Adventure', icon: 'compass-outline' },
  { id: 'cultural', label: 'Cultural', icon: 'library-outline' },
  { id: 'romantic', label: 'Romantic', icon: 'heart-outline' },
  { id: 'budget', label: 'Budget/Backpacker', icon: 'wallet-outline' },
  { id: 'luxury', label: 'Luxury', icon: 'diamond-outline' },
  { id: 'family', label: 'Family Friendly', icon: 'people-outline' },
];

const INTEREST_OPTIONS = [
  'Beaches',
  'Seafood',
  'Sunsets',
  'Scuba Diving',
  'Water Sports',
  'Heritage Forts',
  'Cliff Walks',
  'Nightlife',
  'Photography',
  'Lighthouses',
  'Yoga & Wellness',
  'Boat Cruises',
];

const ACCOMMODATIONS = [
  'Resort',
  'Boutique Hotel',
  'Beach Shack',
  'Homestay',
  'Hostel',
  'Private Villa',
];

const TRANSPORTS = [
  'Rental Car',
  'Rental Scooter / Bike',
  'Flight',
  'Train',
  'Ferry / Boat',
  'Private Taxi',
];

const PACES = [
  { id: 'relaxed', label: 'Relaxed (1-2 stops/day)' },
  { id: 'moderate', label: 'Moderate (3-4 stops/day)' },
  { id: 'packed', label: 'Packed (Action-packed)' },
];

export default function TripPreferencesScreen() {
  const router = useRouter();
  const preferences = useAiStore((state) => state.preferences);
  const setPreferences = useAiStore((state) => state.setPreferences);
  const setCurrentPlan = useAiStore((state) => state.setCurrentPlan);

  // Form local state
  const [destination, setDestination] = useState(preferences.destination || '');
  const [origin, setOrigin] = useState(preferences.origin || 'Mumbai');
  const [startDate, setStartDate] = useState(
    preferences.startDate ||
      new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    preferences.endDate ||
      new Date(Date.now() + 11 * 86400000).toISOString().split('T')[0]
  );
  const [travelers, setTravelers] = useState(preferences.travelers || 2);
  const [budget, setBudget] = useState(preferences.budget ? String(preferences.budget) : '');
  const [currency, setCurrency] = useState(preferences.currency || 'INR');
  const [selectedStyles, setSelectedStyles] = useState(preferences.travelStyle || ['coastal']);
  const [selectedInterests, setSelectedInterests] = useState(
    preferences.interests || ['Beaches', 'Seafood', 'Sunsets']
  );
  const [accommodation, setAccommodation] = useState(
    preferences.accommodationPreferences || 'Resort'
  );
  const [transport, setTransport] = useState(
    preferences.transportPreferences || 'Rental Car'
  );
  const [pace, setPace] = useState(preferences.pace || 'moderate');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Quick helper to set date offsets
  const applyDatePreset = (daysFromNow, durationDays) => {
    const start = new Date(Date.now() + daysFromNow * 86400000);
    const end = new Date(start.getTime() + (durationDays - 1) * 86400000);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const toggleStyle = (id) => {
    setSelectedStyles((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((s) => s !== id)
          : prev
        : [...prev, id]
    );
  };

  const toggleInterest = (item) => {
    setSelectedInterests((prev) =>
      prev.includes(item)
        ? prev.length > 1
          ? prev.filter((i) => i !== item)
          : prev
        : [...prev, item]
    );
  };

  const calculateDays = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleGenerate = async () => {
    setErrorMsg(null);

    // Validation
    if (!destination.trim() || destination.trim().length < 2) {
      Alert.alert('Required', 'Please enter a valid destination (e.g. Goa, India).');
      return;
    }

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      Alert.alert('Invalid Date', 'Please enter dates in YYYY-MM-DD format.');
      return;
    }

    if (e < s) {
      Alert.alert('Invalid Range', 'End date must be on or after start date.');
      return;
    }

    const days = calculateDays();
    if (days > 30) {
      Alert.alert('Trip Too Long', 'AI trip planning is limited to a maximum of 30 days per request.');
      return;
    }

    const payload = {
      destination: destination.trim(),
      origin: origin.trim() || undefined,
      startDate,
      endDate,
      travelers: Number(travelers) || 1,
      budget: budget.trim() ? Number(budget) : undefined,
      currency,
      travelStyle: selectedStyles,
      interests: selectedInterests,
      accommodationPreferences: accommodation,
      transportPreferences: transport,
      pace,
    };

    // Update store preferences
    setPreferences(payload);

    setIsLoading(true);
    try {
      const res = await aiService.planTrip(payload);
      if (res && res.data) {
        setCurrentPlan(res.data);
        router.push('/ai/itinerary');
      } else {
        throw new Error('No itinerary returned from AI service');
      }
    } catch (err) {
      const msg = err.message || 'Failed to generate itinerary. Please try again.';
      setErrorMsg(msg);
      Alert.alert('AI Copilot Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const tripDays = calculateDays();

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title="Trip Preferences"
        subtitle="Customize your Gemini AI itinerary"
        showBack
      />

      {errorMsg ? (
        <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
          <Typography variant="caption" color="#B91C1C">
            {errorMsg}
          </Typography>
        </View>
      ) : null}

      {/* 1. Destination & Origin */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-4 shadow-xs">
        <Typography variant="h3" className="mb-3">
          Where & When
        </Typography>

        <View className="mb-3">
          <Typography variant="caption" color="secondary" className="mb-1">
            Destination *
          </Typography>
          <View className="flex-row items-center bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5">
            <Ionicons name="location-outline" size={18} color={COLORS.primary} className="mr-2" />
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="e.g. South Goa, Havelock Island, Varkala"
              placeholderTextColor={COLORS.textMuted}
              className="flex-1 text-ink-900 text-sm ml-2"
            />
          </View>
        </View>

        <View className="mb-4">
          <Typography variant="caption" color="secondary" className="mb-1">
            Departing From (Origin)
          </Typography>
          <View className="flex-row items-center bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5">
            <Ionicons name="airplane-outline" size={18} color={COLORS.textSecondary} className="mr-2" />
            <TextInput
              value={origin}
              onChangeText={setOrigin}
              placeholder="e.g. Mumbai, Delhi, Bengaluru"
              placeholderTextColor={COLORS.textMuted}
              className="flex-1 text-ink-900 text-sm ml-2"
            />
          </View>
        </View>

        {/* Dates */}
        <View className="flex-row gap-3 mb-2">
          <View className="flex-1">
            <Typography variant="caption" color="secondary" className="mb-1">
              Start Date (YYYY-MM-DD) *
            </Typography>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2026-12-01"
              placeholderTextColor={COLORS.textMuted}
              className="bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5 text-ink-900 text-sm"
            />
          </View>

          <View className="flex-1">
            <Typography variant="caption" color="secondary" className="mb-1">
              End Date (YYYY-MM-DD) *
            </Typography>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2026-12-05"
              placeholderTextColor={COLORS.textMuted}
              className="bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5 text-ink-900 text-sm"
            />
          </View>
        </View>

        {/* Date presets */}
        <View className="flex-row items-center justify-between mt-1 mb-2">
          <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
            Duration: {tripDays > 0 ? `${tripDays} Days` : 'Invalid Range'}
          </Typography>
          <View className="flex-row gap-1">
            <Pressable
              onPress={() => applyDatePreset(7, 4)}
              className="px-2 py-1 bg-ink-100 rounded-md"
            >
              <Typography variant="caption" color="secondary">
                4-Day
              </Typography>
            </Pressable>
            <Pressable
              onPress={() => applyDatePreset(14, 7)}
              className="px-2 py-1 bg-ink-100 rounded-md"
            >
              <Typography variant="caption" color="secondary">
                1-Week
              </Typography>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 2. Group Size & Budget */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-4 shadow-xs">
        <Typography variant="h3" className="mb-3">
          Travelers & Budget
        </Typography>

        {/* Stepper */}
        <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-ink-100">
          <View>
            <Typography variant="body" style={{ fontWeight: '700' }}>
              Number of Travelers
            </Typography>
            <Typography variant="caption" color="secondary">
              {travelers === 1 ? 'Solo Expedition' : travelers === 2 ? 'Couple / Duo' : 'Group Trip'}
            </Typography>
          </View>

          <View className="flex-row items-center bg-ink-50 border border-ink-200 rounded-xl p-1">
            <Pressable
              onPress={() => setTravelers(Math.max(1, travelers - 1))}
              className="w-8 h-8 rounded-lg bg-white items-center justify-center border border-ink-200"
            >
              <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
            </Pressable>
            <Typography variant="body" style={{ fontWeight: '700' }} className="mx-3.5 min-w-[20px] text-center">
              {travelers}
            </Typography>
            <Pressable
              onPress={() => setTravelers(Math.min(50, travelers + 1))}
              className="w-8 h-8 rounded-lg bg-white items-center justify-center border border-ink-200"
            >
              <Ionicons name="add" size={16} color={COLORS.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Budget */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Typography variant="caption" color="secondary" className="mb-1">
              Estimated Total Budget
            </Typography>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              placeholder="e.g. 40000"
              placeholderTextColor={COLORS.textMuted}
              className="bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5 text-ink-900 text-sm"
            />
          </View>

          <View className="w-24">
            <Typography variant="caption" color="secondary" className="mb-1">
              Currency
            </Typography>
            <View className="flex-row bg-ink-50 border border-ink-200 rounded-xl px-2 py-2.5 items-center justify-center">
              <Typography variant="bodySmall" style={{ fontWeight: '700' }} color="ocean">
                {currency}
              </Typography>
            </View>
          </View>
        </View>
      </View>

      {/* 3. Travel Style */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-4 shadow-xs">
        <Typography variant="h3" className="mb-1">
          Travel Style
        </Typography>
        <Typography variant="caption" color="secondary" className="mb-3">
          Select all vibes that match your journey
        </Typography>

        <View className="flex-row flex-wrap gap-2">
          {TRAVEL_STYLES.map((st) => {
            const isSelected = selectedStyles.includes(st.id);
            return (
              <Pressable
                key={st.id}
                onPress={() => toggleStyle(st.id)}
                className={`flex-row items-center px-3.5 py-2 rounded-xl border ${
                  isSelected
                    ? 'bg-ocean-700 border-ocean-700'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Ionicons
                  name={st.icon}
                  size={14}
                  color={isSelected ? COLORS.textInverse : COLORS.textPrimary}
                  className="mr-1.5"
                />
                <Typography
                  variant="caption"
                  color={isSelected ? 'inverse' : 'primary'}
                  style={{ fontWeight: isSelected ? '700' : '500' }}
                  className="ml-1"
                >
                  {st.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 4. Interests */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-4 shadow-xs">
        <Typography variant="h3" className="mb-1">
          Interests & Activities
        </Typography>
        <Typography variant="caption" color="secondary" className="mb-3">
          Gemini will focus the daily itinerary around these
        </Typography>

        <View className="flex-row flex-wrap gap-2">
          {INTEREST_OPTIONS.map((item) => {
            const isSelected = selectedInterests.includes(item);
            return (
              <Pressable
                key={item}
                onPress={() => toggleInterest(item)}
                className={`px-3 py-1.5 rounded-full border ${
                  isSelected
                    ? 'bg-seafoam-600 border-seafoam-600'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Typography
                  variant="caption"
                  color={isSelected ? 'inverse' : 'secondary'}
                  style={{ fontWeight: isSelected ? '700' : '500' }}
                >
                  {item}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 5. Stay & Transport Preferences */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
        <Typography variant="h3" className="mb-3">
          Stay & Commute
        </Typography>

        <View className="mb-4">
          <Typography variant="caption" color="secondary" className="mb-1.5">
            Accommodation Preference
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {ACCOMMODATIONS.map((acc) => (
              <Pressable
                key={acc}
                onPress={() => setAccommodation(acc)}
                className={`px-3.5 py-2 rounded-xl border mr-2 ${
                  accommodation === acc
                    ? 'bg-ocean-600 border-ocean-600'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Typography
                  variant="caption"
                  color={accommodation === acc ? 'inverse' : 'primary'}
                  style={{ fontWeight: accommodation === acc ? '700' : '500' }}
                >
                  {acc}
                </Typography>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View className="mb-4">
          <Typography variant="caption" color="secondary" className="mb-1.5">
            Local Transport Preference
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {TRANSPORTS.map((tr) => (
              <Pressable
                key={tr}
                onPress={() => setTransport(tr)}
                className={`px-3.5 py-2 rounded-xl border mr-2 ${
                  transport === tr
                    ? 'bg-ocean-600 border-ocean-600'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Typography
                  variant="caption"
                  color={transport === tr ? 'inverse' : 'primary'}
                  style={{ fontWeight: transport === tr ? '700' : '500' }}
                >
                  {tr}
                </Typography>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View>
          <Typography variant="caption" color="secondary" className="mb-1.5">
            Itinerary Pace
          </Typography>
          <View className="gap-2">
            {PACES.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setPace(p.id)}
                className={`p-3 rounded-xl border flex-row items-center justify-between ${
                  pace === p.id
                    ? 'bg-ocean-50 border-ocean-500'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Typography
                  variant="bodySmall"
                  color={pace === p.id ? 'ocean' : 'primary'}
                  style={{ fontWeight: pace === p.id ? '700' : '500' }}
                >
                  {p.label}
                </Typography>
                {pace === p.id ? (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Generate Action Button */}
      <View className="mb-8">
        {isLoading ? (
          <View className="bg-ocean-900 rounded-2xl p-5 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.secondarySoft} className="mb-3" />
            <Typography variant="body" color="inverse" style={{ fontWeight: '700' }} className="mb-1">
              Gemini AI is crafting your coastal expedition...
            </Typography>
            <Typography variant="caption" color="#A7F3D0" align="center">
              Curating beaches, sunrise points, local seafood, and transit times
            </Typography>
          </View>
        ) : (
          <Button
            title="Generate AI Itinerary"
            variant="primary"
            size="lg"
            onPress={handleGenerate}
            leftIcon={<Ionicons name="sparkles" size={18} color={COLORS.textInverse} />}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
