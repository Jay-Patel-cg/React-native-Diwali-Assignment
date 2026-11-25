/**
 * Shared query utilities for safe regex search and NaN-proof pagination.
 */

/**
 * Escapes RegExp metacharacters to prevent ReDoS and SyntaxError crashes
 * when constructing case-insensitive MongoDB search filters.
 */
export const escapeRegex = (input = '') =>
  String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Safely parses page & limit query params without ever producing NaN.
 */
export const parsePagination = (
  query = {},
  { defaultPage = 1, defaultLimit = 10, maxLimit = 100 } = {}
) => {
  const parsedPage = Number.parseInt(String(query.page ?? defaultPage), 10);
  const parsedLimit = Number.parseInt(String(query.limit ?? defaultLimit), 10);

  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : defaultPage;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit >= 1
      ? Math.min(maxLimit, parsedLimit)
      : defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

/**
 * Builds consistent pagination metadata across all list endpoints.
 */
export const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export default {
  escapeRegex,
  parsePagination,
  buildPaginationMeta,
};

