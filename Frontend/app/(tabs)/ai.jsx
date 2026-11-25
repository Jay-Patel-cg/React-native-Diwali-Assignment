import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Badge,
  Button,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation/ScreenHeader';
import { COLORS } from '../../constants/theme';
import { useAiStore } from '../../store/useAiStore';
import { useAuthStore } from '../../store/useAuthStore';

const INSPIRATION_PROMPTS = [
  {
    title: '4 Days in South Goa',
    desc: 'Unspoiled beaches, cliff sunsets & heritage spice plantations.',
    destination: 'South Goa, India',
    style: ['coastal', 'relaxing'],
    interests: ['Beaches', 'Seafood', 'Sunsets'],
    days: 4,
  },
  {
    title: 'Backpacking Andaman',
    desc: 'Havelock scuba diving, Radhanagar white sand & coral reefs.',
    destination: 'Havelock Island, Andaman',
    style: ['adventure', 'coastal'],
    interests: ['Scuba Diving', 'Water Sports', 'Beaches'],
    days: 5,
  },
  {
    title: 'Weekend in Pondicherry',
    desc: 'French Quarter cafes, Promenade walk & Auroville peace.',
    destination: 'Pondicherry, India',
    style: ['cultural', 'relaxing'],
    interests: ['Heritage', 'Cafes', 'Sunsets'],
    days: 3,
  },
  {
    title: 'Kerala Backwaters & Varkala',
    desc: 'Houseboat cruise in Alleppey and red cliff views in Varkala.',
    destination: 'Varkala & Alleppey, Kerala',
    style: ['romantic', 'coastal'],
    interests: ['Backwaters', 'Sunsets', 'Seafood'],
    days: 5,
  },
];

export default function AiPlannerTabScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const currentPlan = useAiStore((state) => state.currentPlan);
  const setPreferences = useAiStore((state) => state.setPreferences);
  const clearCurrentPlan = useAiStore((state) => state.clearCurrentPlan);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Traveler';

  const handleApplyInspiration = (item) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 14);
    const end = new Date(start);
    end.setDate(start.getDate() + item.days - 1);

    setPreferences({
      destination: item.destination,
      origin: 'Mumbai',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      travelers: 2,
      travelStyle: item.style,
      interests: item.interests,
    });

    router.push('/ai/preferences');
  };

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right']}>
      {/* Header */}
      <ScreenHeader
        title="AI Travel Copilot"
        subtitle="Powered by Google Gemini 3.8"
      />

      {/* Hero Banner */}
      <View className="rounded-3xl bg-ocean-900 p-5 mb-5 shadow-sm overflow-hidden relative border border-ocean-800">
        <View className="flex-row items-center justify-between mb-3">
          <Badge label="Official Google Gen AI" tone="seafoam" />
          <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
            <Ionicons name="sparkles" size={16} color={COLORS.secondarySoft} />
          </View>
        </View>

        <Typography variant="h2" color="inverse" className="mb-1.5">
          Welcome, {firstName} 👋
        </Typography>

        <Typography variant="bodySmall" color="#D1FAE5" className="mb-4 leading-5">
          Your personal ocean expedition copilot. Craft bespoke itineraries, forecast travel budgets, uncover secluded beaches, and optimize your routes in real time.
        </Typography>

        <View className="flex-row items-center gap-2 pt-2 border-t border-white/10">
          <Ionicons name="shield-checkmark-outline" size={14} color="#A7F3D0" />
          <Typography variant="caption" color="#A7F3D0">
            Privacy-safe: Gemini operates securely through the backend
          </Typography>
        </View>
      </View>

      {/* Active Plan Resume Banner if any */}
      {currentPlan && (
        <View className="bg-ocean-50 border border-ocean-300 rounded-2xl p-4 mb-5 shadow-xs">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
              <Typography variant="caption" color="ocean" style={{ fontWeight: '700' }}>
                ACTIVE DRAFT ITINERARY
              </Typography>
            </View>
            <Pressable onPress={clearCurrentPlan} hitSlop={6}>
              <Typography variant="caption" color="muted">
                Discard
              </Typography>
            </Pressable>
          </View>

          <Typography variant="h3" numberOfLines={1} className="mb-1">
            {currentPlan.tripTitle || currentPlan.destination || 'Unsaved AI Plan'}
          </Typography>

          <Typography variant="caption" color="secondary" className="mb-3">
            {currentPlan.dayWiseItinerary?.length || 0} Days • Estimated ~{currentPlan.currency || 'INR'}{' '}
            {Number(currentPlan.estimatedTotalCost || 0).toLocaleString('en-IN')}
          </Typography>

          <View className="flex-row gap-2">
            <Button
              title="Resume Draft Plan"
              variant="primary"
              size="sm"
              onPress={() => router.push('/ai/itinerary')}
              className="flex-1"
            />
          </View>
        </View>
      )}

      {/* 4 Primary AI Modules */}
      <Typography variant="h3" className="mb-3">
        AI Copilot Services
      </Typography>

      <View className="gap-3 mb-6">
        {/* 1. Full Trip Planner */}
        <Pressable
          onPress={() => router.push('/ai/preferences')}
          className="bg-white border border-ink-200 rounded-2xl p-4 active:border-ocean-400 active:bg-ocean-50/20 shadow-xs"
        >
          <View className="flex-row items-start justify-between">
            <View className="w-12 h-12 rounded-2xl bg-ocean-50 border border-ocean-100 items-center justify-center mr-3.5">
              <Ionicons name="compass" size={24} color={COLORS.primary} />
            </View>
            <View className="flex-1 mr-2">
              <View className="flex-row items-center justify-between">
                <Typography variant="body" style={{ fontWeight: '700' }}>
                  Full AI Trip Planner
                </Typography>
                <Badge label="Comprehensive" tone="ocean" />
              </View>
              <Typography variant="caption" color="secondary" className="mt-1 leading-4">
                Input your dates, group, budget and interests. Gemini generates complete day-wise activities, routes, and food recommendations.
              </Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </View>
        </Pressable>

        {/* 2. Destination Recommendations */}
        <Pressable
          onPress={() => router.push('/ai/recommendations')}
          className="bg-white border border-ink-200 rounded-2xl p-4 active:border-seafoam-400 active:bg-seafoam-50/20 shadow-xs"
        >
          <View className="flex-row items-start justify-between">
            <View className="w-12 h-12 rounded-2xl bg-seafoam-50 border border-seafoam-100 items-center justify-center mr-3.5">
              <Ionicons name="navigate-circle" size={24} color={COLORS.secondary} />
            </View>
            <View className="flex-1 mr-2">
              <View className="flex-row items-center justify-between">
                <Typography variant="body" style={{ fontWeight: '700' }}>
                  Destination Finder
                </Typography>
                <Badge label="Discovery" tone="seafoam" />
              </View>
              <Typography variant="caption" color="secondary" className="mt-1 leading-4">
                Not sure where to head? Let AI recommend coastal spots and islands based on season, travel style, and budget.
              </Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </View>
        </Pressable>

        {/* 3. AI Budget Suggestions */}
        <Pressable
          onPress={() => router.push('/ai/budget-suggestions')}
          className="bg-white border border-ink-200 rounded-2xl p-4 active:border-coral-400 active:bg-coral-50/20 shadow-xs"
        >
          <View className="flex-row items-start justify-between">
            <View className="w-12 h-12 rounded-2xl bg-coral-50 border border-coral-100 items-center justify-center mr-3.5">
              <Ionicons name="calculator" size={24} color={COLORS.accent} />
            </View>
            <View className="flex-1 mr-2">
              <View className="flex-row items-center justify-between">
                <Typography variant="body" style={{ fontWeight: '700' }}>
                  Budget Forecaster
                </Typography>
                <Badge label="Smart Estimates" tone="coral" />
              </View>
              <Typography variant="caption" color="secondary" className="mt-1 leading-4">
                Get tiered cost forecasts (Backpacker, Mid-range, Luxury) with category breakdowns and money-saving coastal tips.
              </Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </View>
        </Pressable>

        {/* 4. AI Travel Chat */}
        <Pressable
          onPress={() => router.push('/ai/chat')}
          className="bg-white border border-ink-200 rounded-2xl p-4 active:border-ocean-400 active:bg-ocean-50/20 shadow-xs"
        >
          <View className="flex-row items-start justify-between">
            <View className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 items-center justify-center mr-3.5">
              <Ionicons name="chatbubbles" size={24} color="#0284C7" />
            </View>
            <View className="flex-1 mr-2">
              <View className="flex-row items-center justify-between">
                <Typography variant="body" style={{ fontWeight: '700' }}>
                  Live Travel Chat
                </Typography>
                <Badge label="Interactive" tone="neutral" />
              </View>
              <Typography variant="caption" color="secondary" className="mt-1 leading-4">
                Chat in natural language about ferry timetables, local seafood thalis, packing lists, or cliffside sunrise points.
              </Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </View>
        </Pressable>
      </View>

      {/* Inspiration Presets */}
      <Typography variant="h3" className="mb-3">
        Quick Coastal Inspiration
      </Typography>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-4 px-4 mb-6"
      >
        {INSPIRATION_PROMPTS.map((item, idx) => (
          <Pressable
            key={idx}
            onPress={() => handleApplyInspiration(item)}
            className="w-64 bg-white border border-ink-200 rounded-2xl p-4 mr-3 active:border-ocean-400 active:bg-ocean-50/30 shadow-xs"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Badge label={`${item.days} Days`} tone="seafoam" />
              <Ionicons name="arrow-forward-circle-outline" size={18} color={COLORS.primary} />
            </View>

            <Typography variant="body" style={{ fontWeight: '700' }} className="mb-1">
              {item.title}
            </Typography>

            <Typography variant="caption" color="secondary" className="leading-4 mb-3">
              {item.desc}
            </Typography>

            <View className="flex-row flex-wrap gap-1">
              {item.interests.slice(0, 2).map((tag, tIdx) => (
                <Badge key={tIdx} label={tag} tone="neutral" />
              ))}
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Operational Disclaimer */}
      <View className="bg-ink-50 border border-ink-200 rounded-2xl p-3.5 mb-8">
        <Typography variant="caption" color="secondary" className="leading-4">
          ℹ️ All durations, budgets, and recommendations generated by Gemini AI are estimates for planning purposes only. Trips are saved to your account only when you review and confirm.
        </Typography>
      </View>
    </ScreenContainer>
  );
}
