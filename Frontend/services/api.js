import { APP_CONFIG } from '../constants/config.js';
import { getSecureItem, STORAGE_KEYS } from '../utils/storage.js';

/**
 * Standardized API Client Error for uniform UI error handling.
 */
export class ApiClientError extends Error {
  constructor(
    message,
    { status = 0, errors = [], isNetworkError = false, isTimeout = false } = {}
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;
    this.isUnauthorized = status === 401;
  }
}

let inMemoryToken = null;
let onUnauthorizedCallback = null;

/**
 * Keeps an in-memory copy of the JWT for zero-latency header injection.
 */
export const setAuthToken = (token) => {
  inMemoryToken = token || null;
};

/**
 * Registers a listener (e.g. from useAuthStore) invoked whenever a 401 occurs.
 */
export const setUnauthorizedHandler = (handler) => {
  onUnauthorizedCallback = typeof handler === 'function' ? handler : null;
};

/**
 * Builds query string from a plain object, skipping undefined/null/empty values.
 */
export const buildQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(
    ([, val]) => val !== undefined && val !== null && val !== ''
  );
  if (entries.length === 0) return '';
  const query = entries
    .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`)
    .join('&');
  return `?${query}`;
};

/**
 * Core fetch-based HTTP client (no Axios).
 * Automatically attaches Bearer JWT, enforces AbortController timeout,
 * and unwraps the backend ApiResponse / errorHandler contract.
 */
export const apiRequest = async (
  endpoint,
  {
    method = 'GET',
    body = null,
    params = null,
    headers = {},
    timeoutMs = APP_CONFIG.requestTimeoutMs,
    requiresAuth = true,
  } = {}
) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const queryString = params ? buildQueryString(params) : '';
  const url = `${APP_CONFIG.apiBaseUrl}${normalizedEndpoint}${queryString}`;

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== null && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (requiresAuth) {
    const token = inMemoryToken || (await getSecureItem(STORAGE_KEYS.AUTH_TOKEN));
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body:
        body === null
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
      signal: controller.signal,
    });

    const rawText = await response.text();
    let payload = null;
    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      if (response.status === 401 && onUnauthorizedCallback && requiresAuth) {
        onUnauthorizedCallback();
      }

      const errorMessage =
        payload?.message ||
        `Request failed with status ${response.status}`;

      throw new ApiClientError(errorMessage, {
        status: response.status,
        errors: Array.isArray(payload?.errors) ? payload.errors : [],
      });
    }

    return payload ?? { success: true, data: null, message: 'OK' };
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error?.name === 'AbortError') {
      throw new ApiClientError(
        'Request timed out. Please check your connection and try again.',
        { isNetworkError: true, isTimeout: true }
      );
    }

    const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
    if (isDev) {
      console.warn(`[API] Network request failed for ${method} ${url}:`, error?.message || error);
    }

    throw new ApiClientError(
      isDev
        ? `Unable to reach Samundar Ke Sath server (${APP_CONFIG.apiBaseUrl}). Ensure the backend is running and your device is on the same network.`
        : 'Unable to reach Samundar Ke Sath servers. Please check your internet connection.',
      { isNetworkError: true }
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

export const api = {
  get: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'POST', body }),
  patch: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
  checkHealth: () => apiRequest('/health', { method: 'GET', requiresAuth: false }),
};

export default api;

