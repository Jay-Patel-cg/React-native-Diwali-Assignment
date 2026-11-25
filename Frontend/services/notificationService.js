import api from './api.js';

export const notificationService = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),

  markAsRead: (notificationId) =>
    api.patch(`/notifications/${notificationId}/read`),

  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export default notificationService;
