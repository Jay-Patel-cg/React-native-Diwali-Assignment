import { ApiError } from '../utils/ApiError.js';

/**
 * In-memory per-user / per-IP sliding-window rate limiter for AI endpoints.
 * Protects Gemini API quotas against abuse and accidental client loops.
 */
const requestStore = new Map();
const MAX_STORE_ENTRIES = 10000;

/**
 * Removes stale keys to keep memory bounded in long-running server instances.
 */
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

/**
 * Express middleware enforcing reasonable per-user request limits on AI routes.
 */
export const aiRateLimiter = (req, res, next) => {
  const windowMs = Math.max(
    1000,
    parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || '900000', 10)
  ); // Default: 15 minutes
  const maxRequests = Math.max(
    1,
    parseInt(process.env.AI_RATE_LIMIT_MAX || '20', 10)
  ); // Default: 20 requests / window

  const identifier = req.user?._id
    ? `user:${req.user._id.toString()}`
    : `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;

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
        `AI rate limit exceeded. You can make up to ${maxRequests} AI requests per ${Math.round(
          windowMs / 60000
        )} minutes. Please retry after ${retryAfterSeconds} seconds.`
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

/**
 * Helper for tests to clear rate-limit counters cleanly.
 */
export const resetAiRateLimiter = () => {
  requestStore.clear();
};

export default aiRateLimiter;

