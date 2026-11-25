import api from './api.js';

export const discoveryService = {
  // Public Destination Discovery
  getDestinations: (params = {}) =>
    api.get('/destinations', { params, requiresAuth: false }),

  searchDestinations: (params = {}) => {
    const queryParams =
      typeof params === 'string'
        ? { q: params.trim() }
        : {
            ...params,
            q: (params.q || params.search || '').trim(),
          };
    return api.get('/destinations/search', { params: queryParams, requiresAuth: false });
  },

  getDestinationById: (destinationId) =>
    api.get(`/destinations/${destinationId}`, { requiresAuth: false }),

  // Protected User Notifications
  getNotifications: (params = {}) => api.get('/notifications', { params }),

  markNotificationRead: (notificationId) =>
    api.patch(`/notifications/${notificationId}/read`, {}),

  markAllNotificationsRead: () => api.patch('/notifications/read-all', {}),
};

export default discoveryService;
