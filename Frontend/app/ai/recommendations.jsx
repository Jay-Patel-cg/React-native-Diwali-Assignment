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

const REGIONS = [
  'All Coastal Regions',
  'Goa & Konkan Coast',
  'Kerala Malabar Coast',
  'Andaman & Nicobar Islands',
  'Tamil Nadu & Pondicherry',
  'Lakshadweep Islands',
  'Gujarat Arabian Coast',
];

const SEASONS = [
  'Winter (Nov - Feb)',
  'Monsoon (Jun - Sep)',
  'Summer (Mar - May)',
  'October Shoulder Season',
];

const STYLES = [
  { id: 'coastal', label: 'Beaches & Ocean' },
  { id: 'relaxing', label: 'Relaxed & Serene' },
  { id: 'adventure', label: 'Scuba & Water Sports' },
  { id: 'cultural', label: 'History & Forts' },
  { id: 'romantic', label: 'Romantic Sunset' },
  { id: 'budget', label: 'Backpacker Budget' },
];

export default function DestinationRecommendationsScreen() {
  const router = useRouter();
  const setPreferences = useAiStore((state) => state.setPreferences);
  const recommendations = useAiStore((state) => state.recommendations);
  const setRecommendations = useAiStore((state) => state.setRecommendations);

  const [origin, setOrigin] = useState('Mumbai');
  const [selectedRegion, setSelectedRegion] = useState('All Coastal Regions');
  const [selectedSeason, setSelectedSeason] = useState('Winter (Nov - Feb)');
  const [durationDays, setDurationDays] = useState(5);
  const [budget, setBudget] = useState('35000');
  const [selectedStyle, setSelectedStyle] = useState('coastal');
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const payload = {
        origin: origin.trim() || undefined,
        region: selectedRegion === 'All Coastal Regions' ? undefined : selectedRegion,
        season: selectedSeason,
        durationDays: Number(durationDays) || 5,
        budget: budget.trim() ? Number(budget) : undefined,
        travelStyle: [selectedStyle],
        count: 5,
      };

      const res = await aiService.recommendDestinations(payload);
      if (res && res.data) {
        const list = res.data.recommendations || [];
        setRecommendations(list, payload);
      }
    } catch (err) {
      Alert.alert('Recommendation Error', err.message || 'Could not fetch destination recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDestination = (dest) => {
    const destName = dest.destinationName || dest.destination || dest.name;
    const highlightsList = dest.topHighlights || dest.highlights || ['Beaches', 'Seafood'];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 14);
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays - 1);

    setPreferences({
      destination: destName,
      origin,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      travelers: 2,
      budget: budget ? Number(budget) : undefined,
      travelStyle: [selectedStyle, 'coastal'],
      interests: Array.isArray(highlightsList) ? highlightsList.slice(0, 4) : ['Beaches', 'Seafood'],
    });

    router.push('/ai/preferences');
  };

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title="Destination Finder"
        subtitle="AI-Curated Coastal Spots"
        showBack
      />

      {/* Filter / Preference Controls */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
        <Typography variant="h3" className="mb-1">
          Tell Gemini Your Travel Vibe
        </Typography>
        <Typography variant="caption" color="secondary" className="mb-4">
          Select region, season, and budget to find matches
        </Typography>

        {/* Origin */}
        <View className="mb-3">
          <Typography variant="caption" color="secondary" className="mb-1">
            Departing From (Origin)
          </Typography>
          <View className="flex-row items-center bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5">
            <Ionicons name="airplane-outline" size={16} color={COLORS.primary} className="mr-2" />
            <TextInput
              value={origin}
              onChangeText={setOrigin}
              placeholder="e.g. Mumbai, Delhi, Bangalore"
              placeholderTextColor={COLORS.textMuted}
              className="flex-1 text-ink-900 text-sm ml-2"
            />
          </View>
        </View>

        {/* Region */}
        <View className="mb-3">
          <Typography variant="caption" color="secondary" className="mb-1.5">
            Region Preference
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {REGIONS.map((reg) => (
              <Pressable
                key={reg}
                onPress={() => setSelectedRegion(reg)}
                className={`px-3 py-1.5 rounded-full border mr-2 ${
                  selectedRegion === reg
                    ? 'bg-ocean-700 border-ocean-700'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Typography
                  variant="caption"
                  color={selectedRegion === reg ? 'inverse' : 'primary'}
                  style={{ fontWeight: selectedRegion === reg ? '700' : '500' }}
                >
                  {reg}
                </Typography>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Season */}
        <View className="mb-3">
          <Typography variant="caption" color="secondary" className="mb-1.5">
            Travel Season
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {SEASONS.map((sea) => (
              <Pressable
                key={sea}
                onPress={() => setSelectedSeason(sea)}
                className={`px-3 py-1.5 rounded-full border mr-2 ${
                  selectedSeason === sea
                    ? 'bg-seafoam-600 border-seafoam-600'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Typography
                  variant="caption"
                  color={selectedSeason === sea ? 'inverse' : 'primary'}
                  style={{ fontWeight: selectedSeason === sea ? '700' : '500' }}
                >
                  {sea}
                </Typography>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Duration & Budget Row */}
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
                {durationDays} Days
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
              Max Budget (₹)
            </Typography>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              placeholder="35000"
              placeholderTextColor={COLORS.textMuted}
              className="bg-ink-50 border border-ink-200 rounded-xl px-3 py-2 text-ink-900 text-sm"
            />
          </View>
        </View>

        {/* Travel Style */}
        <View className="mb-4">
          <Typography variant="caption" color="secondary" className="mb-1.5">
            Primary Vibe
          </Typography>
          <View className="flex-row flex-wrap gap-2">
            {STYLES.map((st) => (
              <Pressable
                key={st.id}
                onPress={() => setSelectedStyle(st.id)}
                className={`px-3 py-1.5 rounded-xl border ${
                  selectedStyle === st.id
                    ? 'bg-ocean-600 border-ocean-600'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Typography
                  variant="caption"
                  color={selectedStyle === st.id ? 'inverse' : 'primary'}
                  style={{ fontWeight: selectedStyle === st.id ? '700' : '500' }}
                >
                  {st.label}
                </Typography>
              </Pressable>
            ))}
          </View>
        </View>

        <Button
          title={isLoading ? 'Gemini is searching coastlines...' : 'Find Destination Matches'}
          variant="primary"
          size="md"
          onPress={handleFetchRecommendations}
          disabled={isLoading}
          leftIcon={<Ionicons name="sparkles" size={16} color={COLORS.textInverse} />}
        />
      </View>

      {/* Results Section */}
      <View className="flex-row items-center justify-between mb-3 px-1">
        <Typography variant="h3">
          Recommended Spots {recommendations.length > 0 ? `(${recommendations.length})` : ''}
        </Typography>
        {recommendations.length > 0 && (
          <Badge label="Personalized" tone="seafoam" />
        )}
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} className="mb-3" />
          <Typography variant="bodySmall" color="secondary">
            Scanning coastal climates, seasonal tides, and pricing...
          </Typography>
        </View>
      ) : recommendations.length === 0 ? (
        <View className="bg-white border border-ink-200 rounded-2xl p-6 items-center text-center">
          <View className="w-12 h-12 rounded-full bg-ocean-50 items-center justify-center mb-2.5">
            <Ionicons name="navigate-outline" size={24} color={COLORS.primary} />
          </View>
          <Typography variant="body" style={{ fontWeight: '700' }} className="mb-1">
            No Destinations Yet
          </Typography>
          <Typography variant="caption" color="secondary" align="center">
            Tap "Find Destination Matches" above to generate AI recommendations tailored to your vibe.
          </Typography>
        </View>
      ) : (
        <View className="gap-4 mb-6">
          {recommendations.map((dest, idx) => {
            const destName = dest.destinationName || dest.destination || dest.name || 'Coastal Gem';
            const locationStr = [dest.regionOrCountry || dest.region, dest.country].filter(Boolean).join(', ') || 'India';
            const bestSeason = dest.bestSeason || dest.bestTimeToVisit;
            const matchReason = dest.whyItFits || dest.matchReason || dest.tagline;
            const highlights = dest.topHighlights || dest.highlights || [];
            const dailyBudget =
              dest.estimatedDailyBudget ||
              (dest.estimatedTotalBudgetMin
                ? Math.round(dest.estimatedTotalBudgetMin / (durationDays || 1))
                : 3000);

            return (
              <View
                key={idx}
                className="bg-white border border-ink-200 rounded-3xl p-5 shadow-xs"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Typography variant="h3">{destName}</Typography>
                    <Typography variant="caption" color="secondary">
                      {locationStr}
                    </Typography>
                  </View>
                  {bestSeason ? (
                    <Badge label={bestSeason} tone="ocean" />
                  ) : null}
                </View>

                {matchReason ? (
                  <View className="bg-ocean-50/70 border border-ocean-100 rounded-xl p-3 my-2.5">
                    <Typography variant="caption" color="ocean" style={{ fontWeight: '700' }} className="mb-0.5">
                      WHY IT MATCHES:
                    </Typography>
                    <Typography variant="caption" color="secondary" className="leading-4">
                      {matchReason}
                    </Typography>
                  </View>
                ) : null}

                {/* Highlights */}
                {Array.isArray(highlights) && highlights.length > 0 && (
                  <View className="mb-3">
                    <Typography variant="caption" color="muted" className="mb-1">
                      Highlights:
                    </Typography>
                    <View className="flex-row flex-wrap gap-1.5">
                      {highlights.map((h, hIdx) => (
                        <Badge key={hIdx} label={h} tone="neutral" />
                      ))}
                    </View>
                  </View>
                )}

                {/* Footer with Daily Budget & Action */}
                <View className="flex-row items-center justify-between pt-3 border-t border-ink-100 mt-1">
                  <View>
                    <Typography variant="caption" color="muted">
                      Daily Est. Budget
                    </Typography>
                    <Typography variant="body" style={{ fontWeight: '700' }} color="ocean">
                      ₹{Number(dailyBudget).toLocaleString('en-IN')}/day
                    </Typography>
                  </View>

                  <Button
                    title="Plan Trip Here"
                    variant="primary"
                    size="sm"
                    onPress={() => handleSelectDestination(dest)}
                    rightIcon={<Ionicons name="arrow-forward" size={14} color={COLORS.textInverse} />}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}
