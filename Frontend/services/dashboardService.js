import tripService from './tripService.js';
import expenseService from './expenseService.js';
import discoveryService from './discoveryService.js';

/**
 * Service that orchestrates and aggregates dashboard data from backend APIs.
 * Resilient against partial failures so that failure in one sub-resource
 * (e.g. expenses) does not crash the entire dashboard.
 */
export const dashboardService = {
  /**
   * Fetches all live data required for the Home Dashboard.
   */
  getDashboardData: async () => {
    // 1. Fetch user's trips and popular destinations concurrently
    const [tripsResult, destinationsResult] = await Promise.allSettled([
      tripService.getTrips({ limit: 10, sort: 'asc' }),
      discoveryService.getDestinations({ limit: 6, featured: true }),
    ]);

    const trips =
      tripsResult.status === 'fulfilled'
        ? tripsResult.value?.data?.trips || []
        : [];

    const popularDestinations =
      destinationsResult.status === 'fulfilled'
        ? destinationsResult.value?.data?.destinations || []
        : [];

    // 2. Determine the primary upcoming or active trip
    const now = new Date();
    const upcomingTrip =
      trips.find((t) => t.status === 'active') ||
      trips.find((t) => t.status === 'planning' && new Date(t.startDate) >= now) ||
      trips.find((t) => t.status === 'planning') ||
      trips[0] ||
      null;

    // 3. If an upcoming trip exists, fetch its budget and recent expenses in parallel
    let budgetSummary = null;
    let recentExpenses = [];

    if (upcomingTrip?._id) {
      const [budgetResult, expensesResult] = await Promise.allSettled([
        expenseService.getTripBudget(upcomingTrip._id),
        expenseService.getExpenses(upcomingTrip._id, { limit: 5, sort: 'desc' }),
      ]);

      if (budgetResult.status === 'fulfilled') {
        budgetSummary = budgetResult.value?.data || null;
      }

      if (expensesResult.status === 'fulfilled') {
        recentExpenses = expensesResult.value?.data?.expenses || [];
      }
    }

    // 4. Calculate aggregated travel statistics across all user trips
    const completedTrips = trips.filter((t) => t.status === 'completed').length;
    const activeTrips = trips.filter((t) => t.status === 'active' || t.status === 'planning').length;
    const uniqueDestinations = new Set(
      trips.map((t) => t.destination?.trim().toLowerCase()).filter(Boolean)
    ).size;
    const totalTravelers = trips.reduce(
      (sum, t) => sum + (Number(t.travelers) || 1),
      0
    );
    const totalSpent = budgetSummary?.totalSpent || 0;

    const stats = {
      totalTrips: trips.length,
      activeTrips,
      completedTrips,
      uniqueDestinations,
      totalTravelers,
      totalSpent,
      currency: upcomingTrip?.currency || 'INR',
    };

    return {
      upcomingTrip,
      trips,
      budgetSummary,
      recentExpenses,
      popularDestinations,
      stats,
    };
  },

  /**
   * Search destinations live for the dashboard search bar.
   */
  searchDestinations: async (query) => {
    if (!query || !query.trim()) {
      return discoveryService.getDestinations({ limit: 6, featured: true });
    }
    return discoveryService.searchDestinations({ q: query.trim(), limit: 8 });
  },
};

export default dashboardService;
