import { create } from 'zustand';

const DEFAULT_PREFERENCES = {
  destination: '',
  origin: '',
  startDate: '',
  endDate: '',
  travelers: 2,
  budget: '',
  currency: 'INR',
  travelStyle: ['coastal', 'relaxing'],
  interests: ['Beaches', 'Seafood', 'Sunsets'],
  accommodationPreferences: 'Resort',
  transportPreferences: 'Rental Car',
  pace: 'moderate',
  notes: '',
};

export const useAiStore = create((set, get) => ({
  preferences: { ...DEFAULT_PREFERENCES },
  currentPlan: null,
  chatMessages: [
    {
      id: 'welcome-1',
      role: 'model',
      content:
        'Namaste! I am your Samundar Ke Sath AI Travel Copilot. Whether you need a coastal getaway, island itinerary, hidden beach recommendations, or travel budget advice, I am here to help you navigate your journey. Where would you like to travel?',
      suggestions: [
        'Plan a 4-day Goa coastal trip',
        'Recommend offbeat beaches in South India',
        'Suggest a 5-day budget for Andaman',
        'Best seaside spots for scuba diving',
      ],
      timestamp: new Date().toISOString(),
    },
  ],
  recommendations: [],
  recommendationCriteria: {},
  budgetSuggestions: null,
  isLoading: false,
  isThinking: false,
  error: null,

  setPreferences: (updates) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        ...updates,
      },
    })),

  resetPreferences: () =>
    set({
      preferences: { ...DEFAULT_PREFERENCES },
    }),

  setCurrentPlan: (plan) =>
    set({
      currentPlan: plan,
      error: null,
    }),

  clearCurrentPlan: () => set({ currentPlan: null }),

  updatePlanDay: (dayNumber, updatedDay) =>
    set((state) => {
      if (!state.currentPlan?.dayWiseItinerary) return state;
      const updatedList = state.currentPlan.dayWiseItinerary.map((d) =>
        (d.dayNumber || d.day) === dayNumber ? { ...d, ...updatedDay } : d
      );
      return {
        currentPlan: {
          ...state.currentPlan,
          dayWiseItinerary: updatedList,
        },
      };
    }),

  addActivityToDay: (dayNumber, activity) =>
    set((state) => {
      if (!state.currentPlan?.dayWiseItinerary) return state;
      const updatedList = state.currentPlan.dayWiseItinerary.map((d) => {
        if ((d.dayNumber || d.day) === dayNumber) {
          return {
            ...d,
            activities: [...(d.activities || []), activity],
          };
        }
        return d;
      });
      return {
        currentPlan: {
          ...state.currentPlan,
          dayWiseItinerary: updatedList,
        },
      };
    }),

  removeActivityFromDay: (dayNumber, activityIndex) =>
    set((state) => {
      if (!state.currentPlan?.dayWiseItinerary) return state;
      const updatedList = state.currentPlan.dayWiseItinerary.map((d) => {
        if ((d.dayNumber || d.day) === dayNumber) {
          const nextActs = (d.activities || []).filter(
            (_, idx) => idx !== activityIndex
          );
          return {
            ...d,
            activities: nextActs,
          };
        }
        return d;
      });
      return {
        currentPlan: {
          ...state.currentPlan,
          dayWiseItinerary: updatedList,
        },
      };
    }),

  updateActivityInDay: (dayNumber, activityIndex, updatedActivity) =>
    set((state) => {
      if (!state.currentPlan?.dayWiseItinerary) return state;
      const updatedList = state.currentPlan.dayWiseItinerary.map((d) => {
        if ((d.dayNumber || d.day) === dayNumber) {
          const nextActs = (d.activities || []).map((act, idx) =>
            idx === activityIndex ? { ...act, ...updatedActivity } : act
          );
          return {
            ...d,
            activities: nextActs,
          };
        }
        return d;
      });
      return {
        currentPlan: {
          ...state.currentPlan,
          dayWiseItinerary: updatedList,
        },
      };
    }),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: msg.timestamp || new Date().toISOString(),
          ...msg,
        },
      ],
    })),

  clearChat: () =>
    set({
      chatMessages: [
        {
          id: `welcome-${Date.now()}`,
          role: 'model',
          content:
            'Chat reset. I am ready for your next travel question! Where to next?',
          suggestions: [
            'Plan a weekend beach trip',
            'Find romantic coastal stays',
            'Budget backpacker itinerary for Gokarna',
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),

  setRecommendations: (recommendations, criteria = {}) =>
    set({
      recommendations,
      recommendationCriteria: criteria,
      error: null,
    }),

  setBudgetSuggestions: (suggestions) =>
    set({
      budgetSuggestions: suggestions,
      error: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setThinking: (isThinking) => set({ isThinking }),
  setError: (error) => set({ error }),

  resetAll: () =>
    set({
      preferences: { ...DEFAULT_PREFERENCES },
      currentPlan: null,
      recommendations: [],
      recommendationCriteria: {},
      budgetSuggestions: null,
      isLoading: false,
      isThinking: false,
      error: null,
    }),
}));

export default useAiStore;
