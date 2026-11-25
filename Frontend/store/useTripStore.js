import { create } from 'zustand';
import { tripService } from '../services';

export const useTripStore = create((set) => ({
  trips: [],
  selectedTrip: null,
  pagination: null,
  isLoading: false,
  error: null,

  fetchTrips: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tripService.getTrips(params);
      set({
        trips: response.data?.trips || [],
        pagination: response.data?.pagination || null,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  setSelectedTrip: (trip) => set({ selectedTrip: trip }),

  clearTrips: () =>
    set({ trips: [], selectedTrip: null, pagination: null, error: null }),
}));

export default useTripStore;

