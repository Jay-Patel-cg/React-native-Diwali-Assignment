import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Badge,
  EmptyState,
  LoadingState,
  ErrorState,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { DestinationCard } from '../../components/cards';
import { SkeletonBox } from '../../components/dashboard/DashboardSkeleton';
import { COLORS } from '../../constants/theme';
import { discoveryService } from '../../services';

const CATEGORIES = [
  { id: 'all', label: 'All Coastlines' },
  { id: 'beach', label: 'Beaches' },
  { id: 'island', label: 'Islands' },
  { id: 'heritage', label: 'Heritage Forts' },
  { id: 'adventure', label: 'Water Sports' },
];

export default function DestinationsExploreScreen() {
  const router = useRouter();

  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDestinations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const params = {};
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      if (activeCategory !== 'all') {
        params.category = activeCategory;
      }

      const res = searchQuery.trim()
        ? await discoveryService.searchDestinations(params)
        : await discoveryService.getDestinations(params);

      setDestinations(res.data?.destinations || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load destinations. Pull to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const onRefresh = useCallback(() => {
    fetchDestinations(true);
  }, [fetchDestinations]);

  return (
    <ScreenContainer
      scrollable
      padded
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <ScreenHeader
        title="Explore Coastlines"
        subtitle="Discover hidden seaside destinations"
        showBack
      />

      {/* Search Bar */}
      <View className="mb-3">
        <View className="flex-row items-center bg-white border border-ink-200 rounded-2xl px-3.5 py-2 shadow-xs">
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Goa, Varkala, Havelock, Daman..."
            placeholderTextColor={COLORS.textMuted}
            className="flex-1 text-ink-900 text-sm ml-2.5"
            returnKeyType="search"
            onSubmitEditing={() => fetchDestinations()}
          />
          {searchQuery.trim().length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Categories Horizontal Filter */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-full border mr-2 ${
                  isSelected
                    ? 'bg-ocean-700 border-ocean-700'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Typography
                  variant="caption"
                  color={isSelected ? 'inverse' : 'primary'}
                  style={{ fontWeight: isSelected ? '700' : '500' }}
                >
                  {cat.label}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Error state */}
      {error && !isLoading ? (
        <ErrorState message={error} onRetry={() => fetchDestinations()} className="mb-4" />
      ) : null}

      {/* Loading state */}
      {isLoading && !isRefreshing ? (
        <View className="gap-3">
          {[1, 2, 3].map((k) => (
            <SkeletonBox key={k} height={160} className="rounded-3xl" />
          ))}
        </View>
      ) : destinations.length === 0 ? (
        <EmptyState
          icon="compass-outline"
          title="No Coastlines Found"
          description={
            searchQuery
              ? `No destinations matched "${searchQuery}". Try a different keyword.`
              : 'Destinations will appear here once loaded.'
          }
          actionLabel="Clear Search"
          onAction={() => {
            setSearchQuery('');
            setActiveCategory('all');
          }}
        />
      ) : (
        <View className="gap-4 pb-8">
          {destinations.map((dest) => (
            <DestinationCard
              key={dest._id || dest.slug}
              destination={dest}
              onPress={() =>
                router.push(`/destinations/${dest._id || dest.slug}`)
              }
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
