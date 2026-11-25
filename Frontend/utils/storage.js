import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryFallback = new Map();

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'samundar_auth_token',
  USER_CACHE: 'samundar_user_cache',
};

/**
 * Saves a key/value pair securely on native (Keychain/Keystore via expo-secure-store)
 * and falls back gracefully to localStorage on web.
 */
export const setSecureItem = async (key, value) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, stringValue);
        return;
      }
      memoryFallback.set(key, stringValue);
      return;
    }
    await SecureStore.setItemAsync(key, stringValue);
  } catch {
    memoryFallback.set(key, stringValue);
  }
};

/**
 * Reads a stored string value securely.
 */
export const getSecureItem = async (key) => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryFallback.get(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
};

/**
 * Deletes a stored value cleanly.
 */
export const removeSecureItem = async (key) => {
  try {
    memoryFallback.delete(key);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    memoryFallback.delete(key);
  }
};

export default {
  STORAGE_KEYS,
  setSecureItem,
  getSecureItem,
  removeSecureItem,
};

