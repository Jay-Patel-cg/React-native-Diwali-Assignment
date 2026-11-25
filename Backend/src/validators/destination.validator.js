import { ApiError } from '../utils/ApiError.js';
import {
  DESTINATION_CATEGORIES,
  DESTINATION_BUDGET_TIERS,
  DESTINATION_TRAVEL_TYPES,
} from '../models/Destination.js';

const VALID_SORT_OPTIONS = ['rating', 'budget_asc', 'budget_desc', 'name', 'featured'];

/**
 * Validates query filters & pagination for GET /api/destinations
 */
export const validateDestinationQuery = (req, res, next) => {
  const {
    page,
    limit,
    category,
    budgetTier,
    minBudget,
    maxBudget,
    travelType,
    sort,
  } = req.query || {};
  const errors = [];

  if (page !== undefined) {
    const p = parseInt(page, 10);
    if (isNaN(p) || p < 1) errors.push('page must be a positive integer');
  }

  if (limit !== undefined) {
    const l = parseInt(limit, 10);
    if (isNaN(l) || l < 1 || l > 50) {
      errors.push('limit must be an integer between 1 and 50');
    }
  }

  if (category !== undefined) {
    const normalized = String(category).toLowerCase().trim();
    if (!DESTINATION_CATEGORIES.includes(normalized)) {
      errors.push(
        `Invalid category '${category}'. Allowed: ${DESTINATION_CATEGORIES.join(', ')}`
      );
    }
  }

  if (budgetTier !== undefined) {
    const normalized = String(budgetTier).toLowerCase().trim();
    if (!DESTINATION_BUDGET_TIERS.includes(normalized)) {
      errors.push(
        `Invalid budgetTier '${budgetTier}'. Allowed: ${DESTINATION_BUDGET_TIERS.join(', ')}`
      );
    }
  }

  if (travelType !== undefined) {
    const normalized = String(travelType).toLowerCase().trim();
    if (!DESTINATION_TRAVEL_TYPES.includes(normalized)) {
      errors.push(
        `Invalid travelType '${travelType}'. Allowed: ${DESTINATION_TRAVEL_TYPES.join(', ')}`
      );
    }
  }

  if (minBudget !== undefined) {
    const min = Number(minBudget);
    if (isNaN(min) || min < 0) errors.push('minBudget must be a non-negative number');
  }

  if (maxBudget !== undefined) {
    const max = Number(maxBudget);
    if (isNaN(max) || max < 0) errors.push('maxBudget must be a non-negative number');
  }

  if (minBudget !== undefined && maxBudget !== undefined) {
    if (Number(maxBudget) < Number(minBudget)) {
      errors.push('maxBudget must be greater than or equal to minBudget');
    }
  }

  if (sort !== undefined && !VALID_SORT_OPTIONS.includes(String(sort))) {
    errors.push(`sort must be one of: ${VALID_SORT_OPTIONS.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

/**
 * Validates GET /api/destinations/search
 */
export const validateDestinationSearch = (req, res, next) => {
  const q = req.query?.q;
  if (!q || typeof q !== 'string' || q.trim().length < 1) {
    return next(new ApiError(400, 'Search query parameter "q" is required'));
  }
  if (q.trim().length > 100) {
    return next(new ApiError(400, 'Search query "q" cannot exceed 100 characters'));
  }
  return validateDestinationQuery(req, res, next);
};

export default {
  validateDestinationQuery,
  validateDestinationSearch,
};

