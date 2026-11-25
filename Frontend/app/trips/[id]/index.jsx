import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  Badge,
  LoadingState,
  ErrorState,
  Divider,
} from '../../../components/ui';
import { Card } from '../../../components/cards';
import { COLORS } from '../../../constants/theme';
import { formatCurrency, formatDateRange } from '../../../utils/formatters';
import { tripService } from '../../../services';

const STATUS_TONES = {
  planning: 'ocean',
  active: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const fetchTripDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await tripService.getTripById(id);
      setTrip(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTripDetails();
  }, [fetchTripDetails]);

  // Delete trip with native confirmation alert
  const handleDeleteTrip = () => {
    Alert.alert(
      'Delete Expedition',
      `Are you sure you want to delete "${trip?.title || 'this trip'}"? This will permanently delete all associated itineraries, packing lists, and expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await tripService.deleteTrip(id);
              router.replace('/trips');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete trip');
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
        <LoadingState message="Loading expedition details..." fullScreen />
      </ScreenContainer>
    );
  }

  if (error || !trip) {
    return (
      <ScreenContainer padded>
        <ErrorState
          message={error || 'Trip not found'}
          onRetry={fetchTripDetails}
          retryLabel="Retry"
        />
        <Button
          title="Back to My Trips"
          variant="outline"
          className="mt-4"
          onPress={() => router.replace('/trips')}
        />
      </ScreenContainer>
    );
  }

  const {
    title,
    destination,
    origin,
    startDate,
    endDate,
    status = 'planning',
    budget = 0,
    currency = 'INR',
    travelers = 1,
    coverImage,
    description,
    members = [],
    totalItineraryDays = 0,
  } = trip;

  // Calculate duration and trip progress
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  let progressPercent = 0;
  let progressText = 'Trip in Planning';

  if (now < start) {
    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    progressText = daysUntil === 1 ? 'Departs Tomorrow' : `Departs in ${daysUntil} days`;
    progressPercent = 0;
  } else if (now > end || status === 'completed') {
    progressText = 'Expedition Completed';
    progressPercent = 100;
  } else {
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    progressText = `Day ${daysElapsed} of ${totalDays}`;
    progressPercent = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
  }

  const statusTone = STATUS_TONES[status] || 'ocean';

  return (
    <ScreenContainer scrollable padded={false} edges={['top', 'left', 'right']}>
      {/* Hero Cover Image & Header */}
      <View className="relative h-64 w-full bg-ocean-900 justify-end">
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            className="w-full h-full absolute inset-0"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full absolute inset-0 bg-ocean-800 items-center justify-center">
            <Ionicons name="boat" size={64} color={COLORS.secondarySoft} />
          </View>
        )}

        {/* Scrim Overlay */}
        <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        {/* Top Header Controls */}
        <View className="absolute top-4 left-4 right-4 flex-row items-center justify-between z-10">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/trips'))}
            accessibilityLabel="Go back"
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </Pressable>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push(`/trips/${id}/edit`)}
              accessibilityLabel="Edit Trip"
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            >
              <Ionicons name="create-outline" size={20} color="#FFF" />
            </Pressable>

            <Pressable
              onPress={handleDeleteTrip}
              disabled={isDeleting}
              accessibilityLabel="Delete Trip"
              className="w-10 h-10 rounded-full bg-red-600/80 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={18} color="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* Bottom Hero Info */}
        <View className="p-5 z-10">
          <View className="flex-row items-center gap-2 mb-2">
            <Badge label={status.toUpperCase()} tone={statusTone} />
            <View className="flex-row items-center bg-white/20 px-2.5 py-0.5 rounded-full">
              <Typography variant="caption" color="inverse" style={{ fontWeight: '600' }}>
                {totalDays} Days
              </Typography>
            </View>
          </View>

          <Typography variant="display" color="inverse" numberOfLines={2} className="mb-1 text-2xl">
            {title}
          </Typography>

          <View className="flex-row items-center gap-1.5">
            <Ionicons name="location" size={14} color={COLORS.secondarySoft} />
            <Typography variant="bodySmall" color="#CCFBF1" numberOfLines={1}>
              {destination}
              {origin ? ` • from ${origin}` : ''}
            </Typography>
          </View>
        </View>
      </View>

      {/* Main Content Body */}
      <View className="p-5 gap-5">
        {/* Progress & Dates Card */}
        <Card className="p-4 bg-white border border-ink-200">
          <View className="flex-row items-center justify-between mb-2">
            <Typography variant="body" style={{ fontWeight: '700' }}>
              {progressText}
            </Typography>
            <Typography variant="caption" color="secondary">
              {progressPercent}%
            </Typography>
          </View>

          <View className="h-2 w-full bg-ink-100 rounded-full overflow-hidden mb-3">
            <View
              className="h-full bg-ocean-700 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>

          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Typography variant="bodySmall" color="secondary">
              {formatDateRange(startDate, endDate)}
            </Typography>
          </View>
        </Card>

        {/* Feature Navigation Grid (4 Modules) */}
        <Typography variant="h3">Expedition Modules</Typography>

        <View className="flex-row flex-wrap gap-3">
          {/* 1. Itinerary */}
          <Pressable
            onPress={() => router.push(`/trips/${id}/itinerary`)}
            className="flex-1 min-w-[140px] bg-white border border-ocean-100 rounded-3xl p-4 shadow-xs"
            style={({ pressed }) => [pressed ? { opacity: 0.85 } : null]}
          >
            <View className="w-12 h-12 rounded-2xl bg-ocean-50 items-center justify-center mb-2.5">
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
            </View>
            <Typography variant="body" style={{ fontWeight: '700' }}>
              Itinerary
            </Typography>
            <Typography variant="caption" color="secondary">
              {totalItineraryDays} {totalItineraryDays === 1 ? 'day planned' : 'days planned'}
            </Typography>
          </Pressable>

          {/* 2. Packing List */}
          <Pressable
            onPress={() => router.push(`/trips/${id}/packing-list`)}
            className="flex-1 min-w-[140px] bg-white border border-coral-100 rounded-3xl p-4 shadow-xs"
            style={({ pressed }) => [pressed ? { opacity: 0.85 } : null]}
          >
            <View className="w-12 h-12 rounded-2xl bg-coral-50 items-center justify-center mb-2.5">
              <Ionicons name="bag-check" size={24} color={COLORS.accent} />
            </View>
            <Typography variant="body" style={{ fontWeight: '700' }}>
              Packing List
            </Typography>
            <Typography variant="caption" color="secondary">
              Checklists & progress
            </Typography>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {/* 3. Trip Members */}
          <Pressable
            onPress={() => router.push(`/trips/${id}/members`)}
            className="flex-1 min-w-[140px] bg-white border border-sky-100 rounded-3xl p-4 shadow-xs"
            style={({ pressed }) => [pressed ? { opacity: 0.85 } : null]}
          >
            <View className="w-12 h-12 rounded-2xl bg-sky-50 items-center justify-center mb-2.5">
              <Ionicons name="people" size={24} color="#0284C7" />
            </View>
            <Typography variant="body" style={{ fontWeight: '700' }}>
              Crew Members
            </Typography>
            <Typography variant="caption" color="secondary">
              {members.length} {members.length === 1 ? 'member' : 'members'} joined
            </Typography>
          </Pressable>

          {/* 4. Expenses */}
          <Pressable
            onPress={() => router.push(`/trips/${id}/expenses`)}
            className="flex-1 min-w-[140px] bg-white border border-seafoam-100 rounded-3xl p-4 shadow-xs"
            style={({ pressed }) => [pressed ? { opacity: 0.85 } : null]}
          >
            <View className="w-12 h-12 rounded-2xl bg-seafoam-50 items-center justify-center mb-2.5">
              <Ionicons name="wallet" size={24} color={COLORS.secondary} />
            </View>
            <Typography variant="body" style={{ fontWeight: '700' }}>
              Expenses
            </Typography>
            <Typography variant="caption" color="secondary">
              Splits & settlements
            </Typography>
          </Pressable>
        </View>

        {/* Trip Overview & Budget Info */}
        <Card className="p-4 bg-white border border-ink-200">
          <Typography variant="h3" className="mb-3">
            Expedition Summary
          </Typography>

          <View className="gap-2.5">
            <View className="flex-row justify-between py-1 border-b border-ink-100">
              <Typography variant="bodySmall" color="secondary">
                Budget Allocated
              </Typography>
              <Typography variant="bodySmall" color="ocean" style={{ fontWeight: '700' }}>
                {formatCurrency(budget, currency)}
              </Typography>
            </View>

            <View className="flex-row justify-between py-1 border-b border-ink-100">
              <Typography variant="bodySmall" color="secondary">
                Expected Travelers
              </Typography>
              <Typography variant="bodySmall" style={{ fontWeight: '600' }}>
                {travelers} {travelers === 1 ? 'Person' : 'People'}
              </Typography>
            </View>

            <View className="flex-row justify-between py-1">
              <Typography variant="bodySmall" color="secondary">
                Origin
              </Typography>
              <Typography variant="bodySmall" style={{ fontWeight: '600' }}>
                {origin || 'Not specified'}
              </Typography>
            </View>
          </View>

          {description ? (
            <>
              <Divider />
              <Typography variant="label" color="secondary" className="mb-1">
                Notes & Highlights
              </Typography>
              <Typography variant="bodySmall" color="secondary" className="leading-5">
                {description}
              </Typography>
            </>
          ) : null}
        </Card>

        {/* Quick Edit CTA */}
        <Button
          title="Edit Expedition Details"
          variant="outline"
          size="md"
          fullWidth
          onPress={() => router.push(`/trips/${id}/edit`)}
          leftIcon={<Ionicons name="create-outline" size={18} color={COLORS.primary} />}
        />
      </View>
    </ScreenContainer>
  );
}
