import { create } from 'zustand';
import { dashboardService } from '../services';

export const useDashboardStore = create((set, get) => ({
  upcomingTrip: null,
  trips: [],
  budgetSummary: null,
  recentExpenses: [],
  popularDestinations: [],
  stats: {
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    uniqueDestinations: 0,
    totalTravelers: 0,
    totalSpent: 0,
    currency: 'INR',
  },

  isLoading: false,
  isRefreshing: false,
  error: null,

  searchQuery: '',
  searchResults: null,
  isSearching: false,

  fetchDashboard: async (isRefresh = false) => {
    if (isRefresh) {
      set({ isRefreshing: true, error: null });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const data = await dashboardService.getDashboardData();
      set({
        upcomingTrip: data.upcomingTrip,
        trips: data.trips,
        budgetSummary: data.budgetSummary,
        recentExpenses: data.recentExpenses,
        popularDestinations: data.popularDestinations,
        stats: data.stats,
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
      return data;
    } catch (err) {
      set({
        isLoading: false,
        isRefreshing: false,
        error: err.message || 'Failed to load dashboard data. Please try again.',
      });
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  searchDestinations: async (query) => {
    set({ searchQuery: query });
    if (!query || !query.trim()) {
      set({ searchResults: null, isSearching: false });
      return;
    }

    set({ isSearching: true });
    try {
      const response = await dashboardService.searchDestinations(query);
      set({
        searchResults: response?.data?.destinations || [],
        isSearching: false,
      });
    } catch {
      set({ searchResults: [], isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: null, isSearching: false });
  },
}));

export default useDashboardStore;
