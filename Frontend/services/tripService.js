import api from './api.js';

export const tripService = {
  // Core Trip CRUD
  createTrip: (payload) => api.post('/trips', payload),

  getTrips: (params = {}) => api.get('/trips', { params }),

  getTripById: (tripId) => api.get(`/trips/${tripId}`),

  updateTrip: (tripId, payload) => api.patch(`/trips/${tripId}`, payload),

  deleteTrip: (tripId) => api.delete(`/trips/${tripId}`),

  // Collaboration & Invitations
  getMyInvitations: (params = {}) => api.get('/trips/invitations', { params }),

  inviteMember: (tripId, payload) =>
    api.post(`/trips/${tripId}/members`, payload),

  getTripMembers: (tripId) => api.get(`/trips/${tripId}/members`),

  respondToInvitation: (tripId, status) =>
    api.patch(`/trips/${tripId}/members/respond`, { status }),

  updateMemberRole: (tripId, memberId, role) =>
    api.patch(`/trips/${tripId}/members/${memberId}/role`, { role }),

  removeMember: (tripId, memberId) =>
    api.delete(`/trips/${tripId}/members/${memberId}`),

  // Itinerary & Daily Activities
  createItinerary: (tripId, payload) =>
    api.post(`/trips/${tripId}/itinerary`, payload),

  getItineraries: (tripId) => api.get(`/trips/${tripId}/itinerary`),

  updateItinerary: (tripId, itineraryId, payload) =>
    api.patch(`/trips/${tripId}/itinerary/${itineraryId}`, payload),

  deleteItinerary: (tripId, itineraryId) =>
    api.delete(`/trips/${tripId}/itinerary/${itineraryId}`),

  // Packing List Management
  addPackingItems: (tripId, payload) =>
    api.post(`/trips/${tripId}/packing-list`, payload),

  getPackingList: (tripId, params = {}) =>
    api.get(`/trips/${tripId}/packing-list`, { params }),

  updatePackingItem: (tripId, itemId, payload) =>
    api.patch(`/trips/${tripId}/packing-list/${itemId}`, payload),

  deletePackingItem: (tripId, itemId) =>
    api.delete(`/trips/${tripId}/packing-list/${itemId}`),
};

export default tripService;

