import api from './api.js';
import { APP_CONFIG } from '../constants/config.js';

const AI_OPTIONS = { timeoutMs: APP_CONFIG.aiRequestTimeoutMs };

export const aiService = {
  planTrip: (payload) => api.post('/ai/plan-trip', payload, AI_OPTIONS),

  generateItinerary: (payload) =>
    api.post('/ai/generate-itinerary', payload, AI_OPTIONS),

  recommendDestinations: (payload) =>
    api.post('/ai/recommend-destinations', payload, AI_OPTIONS),

  getBudgetSuggestions: (payload) =>
    api.post('/ai/budget-suggestions', payload, AI_OPTIONS),

  chat: (payload) => api.post('/ai/chat', payload, AI_OPTIONS),

  optimizeItinerary: (payload) =>
    api.post('/ai/optimize-itinerary', payload, AI_OPTIONS),
};

export default aiService;

