import { create } from 'zustand';
import { authService, setAuthToken, setUnauthorizedHandler } from '../services';
import {
  getSecureItem,
  setSecureItem,
  removeSecureItem,
  STORAGE_KEYS,
} from '../utils/storage';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    try {
      const savedToken = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!savedToken) {
        setAuthToken(null);
        set({ isHydrated: true, isAuthenticated: false, user: null, token: null });
        return;
      }

      setAuthToken(savedToken);
      const response = await authService.getMe();
      set({
        user: response.data,
        token: savedToken,
        isAuthenticated: true,
        isHydrated: true,
        error: null,
      });
    } catch {
      await removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      setAuthToken(null);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },

  setSession: async ({ user, token }) => {
    setAuthToken(token);
    await setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
    set({
      user,
      token,
      isAuthenticated: true,
      error: null,
    });
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      await get().setSession(response.data);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(payload);
      await get().setSession(response.data);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.googleSignIn(idToken);
      await get().setSession(response.data);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  updateUser: (user) => set({ user }),

  clearSession: async () => {
    setAuthToken(null);
    await removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch {
      // Stateless logout always clears client session even if network fails
    } finally {
      await get().clearSession();
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// Automatically clear expired sessions on global 401 responses
setUnauthorizedHandler(() => {
  useAuthStore.getState().clearSession();
});

export default useAuthStore;

