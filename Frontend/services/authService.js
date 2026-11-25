import api from './api.js';

export const authService = {
  register: (payload) =>
    api.post('/auth/register', payload, { requiresAuth: false }),

  login: (payload) =>
    api.post('/auth/login', payload, { requiresAuth: false }),

  googleSignIn: (idToken) =>
    api.post('/auth/google', { idToken }, { requiresAuth: false }),

  getMe: () => api.get('/auth/me'),

  updateProfile: (payload) => api.patch('/auth/profile', payload),

  changePassword: (payload) => api.patch('/auth/change-password', payload),

  logout: () => api.post('/auth/logout', {}),
};

export default authService;

