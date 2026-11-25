import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isPrivateOrLocalHost = (hostname = '') => {
  if (!hostname) return true;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '10.0.2.2'
  ) {
    return true;
  }
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
};

const parseConfiguredUrl = (rawUrl) => {
  if (!rawUrl) return null;
  const match = rawUrl.match(/^(https?):\/\/([^/:?#]+)(?::(\d+))?(\/[^?#]*)?/i);
  if (!match) return null;
  return {
    protocol: match[1].toLowerCase(),
    hostname: match[2],
    port: match[3] || (match[1].toLowerCase() === 'https' ? '' : '5000'),
    basePath: (match[4] || '/api').replace(/\/+$/, '') || '/api',
  };
};

/**
 * Resolves the backend API base URL cleanly across Web, iOS Simulator,
 * Android Emulator, and physical mobile devices via Expo hostUri or EXPO_PUBLIC_API_URL.
 */
const resolveApiBaseUrl = () => {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const parsed = parseConfiguredUrl(configured);

  // Use explicit production/staging URLs directly (non-local, non-private LAN host)
  if (configured && (!parsed || !isPrivateOrLocalHost(parsed.hostname))) {
    return configured.replace(/\/+$/, '');
  }

  const port = parsed?.port || '5000';
  const basePath = parsed?.basePath || '/api';

  // When running on a physical phone or simulator in Expo Go / development
  if (Platform.OS !== 'web') {
    // 1. Dynamically detect the current Metro host LAN IP from expo-constants
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoClient?.hostUri ||
      Constants.manifest?.debuggerHost;

    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostIp);
      if (isIpv4 && hostIp !== '127.0.0.1' && hostIp !== '0.0.0.0') {
        return `http://${hostIp}:${port}${basePath}`;
      }
    }

    // 2. Fallback to configured LAN IP (useful with --tunnel when on the same Wi-Fi)
    if (
      parsed &&
      parsed.hostname !== 'localhost' &&
      parsed.hostname !== '127.0.0.1' &&
      configured
    ) {
      return configured.replace(/\/+$/, '');
    }

    // 3. Android emulator fallback (host loopback)
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${port}${basePath}`;
    }

    return `http://localhost:${port}${basePath}`;
  }

  // On Web, match the current browser hostname (e.g. localhost or LAN IP)
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:${port}${basePath}`;
  }

  return `http://localhost:${port}${basePath}`;
};

export const APP_CONFIG = {
  appName: process.env.EXPO_PUBLIC_APP_NAME || 'Samundar Ke Sath',
  apiBaseUrl: resolveApiBaseUrl(),
  requestTimeoutMs: 15000,
  aiRequestTimeoutMs: 65000,
  defaultCurrency: 'INR',
  googleClientIds: {
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  },
};

export const TRIP_STATUSES = [
  { value: 'planning', label: 'Planning', tone: 'ocean' },
  { value: 'active', label: 'Active', tone: 'success' },
  { value: 'completed', label: 'Completed', tone: 'neutral' },
  { value: 'cancelled', label: 'Cancelled', tone: 'danger' },
];

export const EXPENSE_CATEGORIES = [
  'transport',
  'accommodation',
  'food',
  'activities',
  'shopping',
  'fuel',
  'tickets',
  'miscellaneous',
];

export const PACKING_CATEGORIES = [
  'clothing',
  'beachwear',
  'toiletries',
  'electronics',
  'documents',
  'medication',
  'accessories',
  'other',
];

export const TRAVEL_STYLES = [
  'coastal',
  'relaxation',
  'adventure',
  'budget',
  'luxury',
  'backpacking',
  'family',
  'solo',
];

export default {
  APP_CONFIG,
  TRIP_STATUSES,
  EXPENSE_CATEGORIES,
  PACKING_CATEGORIES,
  TRAVEL_STYLES,
};

