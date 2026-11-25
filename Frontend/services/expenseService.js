import api from './api.js';

export const expenseService = {
  createExpense: (tripId, payload) =>
    api.post(`/trips/${tripId}/expenses`, payload),

  getExpenses: (tripId, params = {}) =>
    api.get(`/trips/${tripId}/expenses`, { params }),

  getTripExpenses: (tripId, params = {}) =>
    api.get(`/trips/${tripId}/expenses`, { params }),

  getExpenseById: (tripId, expenseId) =>
    api.get(`/trips/${tripId}/expenses/${expenseId}`),

  updateExpense: (tripId, expenseId, payload) =>
    api.patch(`/trips/${tripId}/expenses/${expenseId}`, payload),

  deleteExpense: (tripId, expenseId) =>
    api.delete(`/trips/${tripId}/expenses/${expenseId}`),

  getTripBudget: (tripId) => api.get(`/trips/${tripId}/budget`),

  getBudget: (tripId) => api.get(`/trips/${tripId}/budget`),

  getAnalytics: (tripId) => api.get(`/trips/${tripId}/expenses/analytics`),

  getTripAnalytics: (tripId) =>
    api.get(`/trips/${tripId}/expenses/analytics`),

  getSettlements: (tripId) => api.get(`/trips/${tripId}/expenses/settlements`),

  getTripSettlements: (tripId) =>
    api.get(`/trips/${tripId}/expenses/settlements`),
};

export default expenseService;
