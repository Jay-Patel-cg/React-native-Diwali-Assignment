import { ApiError } from '../utils/ApiError.js';

/**
 * In-memory sliding-window rate limiter for Authentication endpoints.
 * Defends against brute-force password guessing and automated registration spam.
 */
const requestStore = new Map();
const MAX_STORE_ENTRIES = 10000;

const pruneExpiredEntries = (now, windowMs) => {
  if (requestStore.size <= MAX_STORE_ENTRIES) return;
  for (const [key, timestamps] of requestStore.entries()) {
    const fresh = timestamps.filter((ts) => now - ts < windowMs);
    if (fresh.length === 0) {
      requestStore.delete(key);
    } else {
      requestStore.set(key, fresh);
    }
  }
};

export const authRateLimiter = (req, res, next) => {
  // Allow disabling in test environment if needed
  if (process.env.NODE_ENV === 'test' && process.env.DISABLE_AUTH_RATE_LIMIT === 'true') {
    return next();
  }

  const windowMs = Math.max(
    1000,
    parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10) // 15 mins default
  );
  const maxRequests = Math.max(
    1,
    parseInt(process.env.AUTH_RATE_LIMIT_MAX || '60', 10) // 60 requests per 15 mins
  );

  const identifier = `auth_ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
  const now = Date.now();
  pruneExpiredEntries(now, windowMs);

  const existingTimestamps = requestStore.get(identifier) || [];
  const validTimestamps = existingTimestamps.filter((ts) => now - ts < windowMs);
  const resetEpochSeconds =
    validTimestamps.length > 0
      ? Math.ceil((validTimestamps[0] + windowMs) / 1000)
      : Math.ceil((now + windowMs) / 1000);

  if (validTimestamps.length >= maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((validTimestamps[0] + windowMs - now) / 1000)
    );
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', String(resetEpochSeconds));
    res.setHeader('Retry-After', String(retryAfterSeconds));

    return next(
      new ApiError(
        429,
        `Too many authentication attempts from this IP address. Please try again after ${retryAfterSeconds} seconds.`
      )
    );
  }

  validTimestamps.push(now);
  requestStore.set(identifier, validTimestamps);

  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader(
    'X-RateLimit-Remaining',
    String(Math.max(0, maxRequests - validTimestamps.length))
  );
  res.setHeader('X-RateLimit-Reset', String(resetEpochSeconds));

  next();
};

export const resetAuthRateLimiter = () => {
  requestStore.clear();
};

export default authRateLimiter;
