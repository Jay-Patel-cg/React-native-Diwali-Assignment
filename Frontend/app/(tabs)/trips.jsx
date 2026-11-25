import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, TextInput, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
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
import { TripCard } from '../../components/cards';
import { SkeletonBox } from '../../components/dashboard/DashboardSkeleton';
import { COLORS } from '../../constants/theme';
import { tripService } from '../../services';

const FILTER_TABS = [
  { id: 'all', label: 'All Trips' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'active', label: 'Active Now' },
  { id: 'completed', label: 'Completed' },
];

export default function MyTripsTabScreen() {
  const router = useRouter();

  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrips = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const params = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (activeTab === 'active') {
        params.status = 'active';
      } else if (activeTab === 'completed') {
        params.status = 'completed';
      } else if (activeTab === 'upcoming') {
        params.status = 'planning';
      }

      const res = await tripService.getTrips(params);
      setTrips(res.data?.trips || []);
    } catch (err) {
      setError(err.message || 'Failed to load your trips. Pull to try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const onRefresh = useCallback(() => {
    fetchTrips(true);
  }, [fetchTrips]);

  return (
    <ScreenContainer
      scrollable
      padded
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      edges={['top', 'left', 'right']}
    >
      {/* Screen Header */}
      <ScreenHeader
        title="My Expeditions"
        subtitle="Manage your coastal voyages"
        rightAction={
          <Pressable
            onPress={() => router.push('/trips/create')}
            className="flex-row items-center bg-ocean-700 px-3.5 py-2 rounded-xl active:bg-ocean-800 shadow-xs"
          >
            <Ionicons name="add" size={16} color={COLORS.textInverse} />
            <Typography variant="caption" color="inverse" style={{ fontWeight: '700' }} className="ml-1">
              New Trip
            </Typography>
          </Pressable>
        }
      />

      {/* Search Input Bar */}
      <View className="mb-3">
        <View className="flex-row items-center bg-white border border-ink-200 rounded-2xl px-3.5 py-2 shadow-xs">
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search destination, title, state..."
            placeholderTextColor={COLORS.textMuted}
            className="flex-1 text-ink-900 text-sm ml-2.5"
            returnKeyType="search"
            onSubmitEditing={() => fetchTrips()}
          />
          {searchQuery.trim().length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          {FILTER_TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full border mr-2 ${
                  isSelected
                    ? 'bg-ocean-700 border-ocean-700'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Typography
                  variant="caption"
                  color={isSelected ? 'inverse' : 'secondary'}
                  style={{ fontWeight: isSelected ? '700' : '500' }}
                >
                  {tab.label}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Error state */}
      {error && !isLoading ? (
        <ErrorState
          message={error}
          onRetry={() => fetchTrips()}
          className="mb-4"
        />
      ) : null}

      {/* Loading Skeleton */}
      {isLoading && !isRefreshing ? (
        <View className="gap-3">
          {[1, 2, 3].map((k) => (
            <View key={k} className="bg-white border border-ink-200 rounded-3xl p-4">
              <SkeletonBox height={140} className="mb-3" />
              <SkeletonBox height={20} width="60%" className="mb-2" />
              <SkeletonBox height={14} width="40%" />
            </View>
          ))}
        </View>
      ) : trips.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon="compass-outline"
          title={searchQuery ? 'No Expeditions Found' : 'No Coastal Expeditions Yet'}
          description={
            searchQuery
              ? `No journeys matched "${searchQuery}". Try a different search.`
              : 'Start planning your next ocean journey with our AI copilot or create one manually.'
          }
          actionLabel="Plan New Trip"
          onAction={() => router.push('/trips/create')}
        />
      ) : (
        /* Trips List */
        <View className="gap-3 pb-8">
          {trips.map((trip) => (
            <TripCard
              key={trip._id}
              trip={trip}
              onPress={() => router.push(`/trips/${trip._id}`)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
