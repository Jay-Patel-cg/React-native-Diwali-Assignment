import React, { useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  Badge,
  ErrorState,
  EmptyState,
} from '../../components/ui';
import {
  TripCard,
  ExpenseSummaryCard,
  DestinationCard,
} from '../../components/cards';
import { QuickActions, DashboardSkeleton } from '../../components/dashboard';
import { COLORS } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { useDashboardStore } from '../../store/useDashboardStore';

export default function HomeDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const {
    upcomingTrip,
    trips,
    budgetSummary,
    recentExpenses,
    popularDestinations,
    stats,
    isLoading,
    isRefreshing,
    error,
    searchQuery,
    searchResults,
    isSearching,
    fetchDashboard,
    searchDestinations,
    clearSearch,
  } = useDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Traveler';
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

  return (
    <ScreenContainer
      scrollable
      padded
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      edges={['top', 'left', 'right']}
    >
      {/* 1. & 2. GREETING & PROFILE AVATAR SECTION */}
      <View className="flex-row items-center justify-between pt-2 pb-3 mb-2">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-1.5 mb-0.5">
            <Ionicons name="boat" size={16} color={COLORS.primary} />
            <Typography variant="caption" color="ocean" style={{ fontWeight: '700' }}>
              SAMUNDAR KE SATH
            </Typography>
          </View>

          <Typography variant="h2" numberOfLines={1}>
            {getGreeting()}, {firstName} 👋
          </Typography>

          <Typography variant="caption" color="secondary">
            Ready to explore India's coastlines?
          </Typography>
        </View>

        {/* Header Actions: Notification Bell + Profile Avatar */}
        <View className="flex-row items-center gap-2.5">
          <Pressable
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            className="w-11 h-11 rounded-full bg-white border border-ink-200 items-center justify-center shadow-xs active:bg-ink-50"
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Go to Profile"
            className="relative"
          >
            {user?.avatar || user?.profileImage ? (
              <Image
                source={{ uri: user.avatar || user.profileImage }}
                className="w-11 h-11 rounded-full border-2 border-ocean-600 bg-ocean-100"
              />
            ) : (
              <View className="w-11 h-11 rounded-full bg-ocean-800 items-center justify-center border-2 border-ocean-600 shadow-xs">
                <Typography variant="body" color="inverse" style={{ fontWeight: '700' }}>
                  {userInitial}
                </Typography>
              </View>
            )}
            <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </Pressable>
        </View>
      </View>

      {/* API Error State Banner */}
      {error && !isLoading ? (
        <ErrorState
          compact
          message={error}
          onRetry={() => fetchDashboard()}
          retryLabel="Retry loading dashboard"
          className="mb-4"
        />
      ) : null}

      {/* 3. SEARCH DESTINATION BAR */}
      <View className="mb-5">
        <View className="flex-row items-center bg-white border border-ink-200 rounded-2xl px-3.5 h-12 shadow-xs">
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Search beaches, islands, coastlines..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={searchDestinations}
            className="flex-1 ml-2.5 text-[15px] text-ink-900"
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable onPress={clearSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          ) : isSearching ? (
            <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.primary} />
          ) : null}
        </View>

        {/* Live Search Results Dropdown/Preview */}
        {searchResults !== null ? (
          <View className="mt-2 p-3 bg-white border border-ink-200 rounded-2xl shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Typography variant="label" color="secondary">
                {searchResults.length} {searchResults.length === 1 ? 'Destination found' : 'Destinations found'}
              </Typography>
              <Pressable onPress={clearSearch}>
                <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
                  Close Search
                </Typography>
              </Pressable>
            </View>

            {searchResults.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {searchResults.map((dest) => (
                  <DestinationCard
                    key={dest._id || dest.slug}
                    destination={dest}
                    compact
                    onPress={() => router.push(`/destinations/${dest._id || dest.slug}`)}
                  />
                ))}
              </ScrollView>
            ) : (
              <Typography variant="caption" color="muted" align="center" className="py-2">
                No coastal destinations matched "{searchQuery}".
              </Typography>
            )}
          </View>
        ) : null}
      </View>

      {/* LOADING SKELETON */}
      {isLoading && !isRefreshing ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* 5. QUICK ACTION BUTTONS */}
          <View className="mb-6">
            <QuickActions />
          </View>

          {/* 4. & 6. UPCOMING TRIP CARD / EMPTY STATE */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Typography variant="h3">Upcoming Expedition</Typography>
              {trips.length > 0 ? (
                <Pressable onPress={() => router.push('/trips')} hitSlop={6}>
                  <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
                    View All ({trips.length})
                  </Typography>
                </Pressable>
              ) : null}
            </View>

            {upcomingTrip ? (
              <TripCard
                trip={upcomingTrip}
                onPress={() => router.push(`/trips/${upcomingTrip._id}`)}
              />
            ) : (
              /* Empty state with prominent Create Trip CTA */
              <View className="p-6 bg-white border border-ink-200 rounded-3xl items-center text-center shadow-xs">
                <View className="w-14 h-14 rounded-2xl bg-ocean-50 border border-ocean-100 items-center justify-center mb-3">
                  <Ionicons name="compass-outline" size={28} color={COLORS.primary} />
                </View>
                <Typography variant="h3" align="center" className="mb-1">
                  No Upcoming Expeditions
                </Typography>
                <Typography variant="bodySmall" color="secondary" align="center" className="mb-4 px-2">
                  Ready to feel the sea breeze? Plan your next coastal journey with Gemini AI.
                </Typography>
                <Button
                  title="Plan Your First Trip"
                  variant="primary"
                  size="md"
                  onPress={() => router.push('/trips/create')}
                  leftIcon={<Ionicons name="add" size={18} color={COLORS.textInverse} />}
                />
              </View>
            )}
          </View>

          {/* 7. AI TRIP PLANNER BANNER */}
          <Pressable
            onPress={() => router.push('/ai')}
            className="rounded-3xl bg-ocean-800 p-5 mb-6 shadow-sm overflow-hidden relative"
            style={({ pressed }) => [pressed ? { opacity: 0.94 } : null]}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Badge label="Google Gemini 3.8" tone="seafoam" />
              <Ionicons name="sparkles" size={20} color={COLORS.secondarySoft} />
            </View>

            <Typography variant="h2" color="inverse" className="mb-1">
              AI Travel Copilot
            </Typography>

            <Typography variant="bodySmall" color="#CCFBF1" className="mb-4 leading-5">
              Generate custom day-wise coastal itineraries, smart budgets, and hidden seaside spots in seconds.
            </Typography>

            <View className="flex-row items-center self-start bg-white/10 px-3.5 py-2 rounded-xl gap-2">
              <Typography variant="caption" color="inverse" style={{ fontWeight: '700' }}>
                Launch AI Planner
              </Typography>
              <Ionicons name="arrow-forward" size={14} color={COLORS.textInverse} />
            </View>
          </Pressable>

          {/* 8. & 9. BUDGET SUMMARY & RECENT EXPENSES */}
          {upcomingTrip ? (
            <View className="mb-6">
              <ExpenseSummaryCard
                budgetSummary={budgetSummary}
                recentExpenses={recentExpenses}
                tripTitle={upcomingTrip.title || upcomingTrip.destination}
                onViewAll={() => router.push(`/trips/${upcomingTrip._id}/expenses`)}
                onAddExpense={() =>
                  router.push({
                    pathname: '/expenses/create',
                    params: { tripId: upcomingTrip._id },
                  })
                }
              />
            </View>
          ) : null}

          {/* 11. TRAVEL STATISTICS SECTION */}
          <View className="mb-6">
            <Typography variant="h3" className="mb-3 px-1">
              Travel Statistics
            </Typography>

            <View className="flex-row gap-3">
              {/* Stat 1: Total Trips */}
              <View className="flex-1 bg-white border border-ink-200 rounded-2xl p-3.5 shadow-xs">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Typography variant="caption" color="muted">
                    Total Trips
                  </Typography>
                  <Ionicons name="boat-outline" size={16} color={COLORS.primary} />
                </View>
                <Typography variant="h2" color="primary">
                  {stats.totalTrips}
                </Typography>
                <Typography variant="caption" color="secondary" className="mt-0.5">
                  {stats.activeTrips} active
                </Typography>
              </View>

              {/* Stat 2: Destinations */}
              <View className="flex-1 bg-white border border-ink-200 rounded-2xl p-3.5 shadow-xs">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Typography variant="caption" color="muted">
                    Coastlines
                  </Typography>
                  <Ionicons name="earth-outline" size={16} color={COLORS.secondary} />
                </View>
                <Typography variant="h2" color="secondary">
                  {stats.uniqueDestinations}
                </Typography>
                <Typography variant="caption" color="secondary" className="mt-0.5">
                  explored
                </Typography>
              </View>

              {/* Stat 3: Total Spent */}
              <View className="flex-1 bg-white border border-ink-200 rounded-2xl p-3.5 shadow-xs">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Typography variant="caption" color="muted">
                    Exp. Spent
                  </Typography>
                  <Ionicons name="wallet-outline" size={16} color={COLORS.accent} />
                </View>
                <Typography variant="h3" color="ocean" numberOfLines={1}>
                  {formatCurrency(stats.totalSpent, stats.currency)}
                </Typography>
                <Typography variant="caption" color="secondary" className="mt-0.5">
                  in active trips
                </Typography>
              </View>
            </View>
          </View>

          {/* 10. POPULAR DESTINATIONS CAROUSEL */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <View>
                <Typography variant="h3">Popular Destinations</Typography>
                <Typography variant="caption" color="secondary">
                  Hand-picked Indian coastlines & islands
                </Typography>
              </View>
              <Pressable onPress={() => router.push('/destinations')} hitSlop={6}>
                <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
                  Explore All
                </Typography>
              </Pressable>
            </View>

            {popularDestinations.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 8 }}
              >
                {popularDestinations.map((destination) => (
                  <DestinationCard
                    key={destination._id || destination.slug}
                    destination={destination}
                    compact
                    onPress={() =>
                      router.push(`/destinations/${destination._id || destination.slug}`)
                    }
                  />
                ))}
              </ScrollView>
            ) : (
              <EmptyState
                title="No destinations found"
                message="Discoveries are being updated. Check back shortly."
              />
            )}
          </View>
        </>
      )}
    </ScreenContainer>
  );
}
