import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export const VALID_PACKING_CATEGORIES = [
  'clothing',
  'beachwear',
  'toiletries',
  'electronics',
  'documents',
  'medication',
  'accessories',
  'other',
];

const validateSingleItem = (item, errors, prefix = '') => {
  if (!item || typeof item !== 'object') {
    errors.push(`${prefix}Item must be an object`);
    return null;
  }

  if (!item.itemName || typeof item.itemName !== 'string' || item.itemName.trim().length === 0) {
    errors.push(`${prefix}itemName is required`);
  } else if (item.itemName.trim().length > 100) {
    errors.push(`${prefix}itemName cannot exceed 100 characters`);
  }

  const quantity = item.quantity !== undefined ? Number(item.quantity) : 1;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
    errors.push(`${prefix}quantity must be an integer between 1 and 999`);
  }

  const category = item.category
    ? String(item.category).toLowerCase().trim()
    : 'clothing';
  if (!VALID_PACKING_CATEGORIES.includes(category)) {
    errors.push(
      `${prefix}Invalid category '${item.category}'. Allowed: ${VALID_PACKING_CATEGORIES.join(', ')}`
    );
  }

  if (
    item.assignedTo !== undefined &&
    item.assignedTo !== null &&
    item.assignedTo !== '' &&
    !mongoose.Types.ObjectId.isValid(item.assignedTo)
  ) {
    errors.push(`${prefix}assignedTo must be a valid user ObjectId`);
  }

  return {
    itemName: item.itemName ? item.itemName.trim() : '',
    quantity,
    isPacked: Boolean(item.isPacked),
    category,
    assignedTo: item.assignedTo || null,
  };
};

/**
 * Validates POST /api/trips/:tripId/packing-list
 * Supports creating a list with items array, creating an empty list, or adding a single item.
 */
export const validateAddPackingItems = (req, res, next) => {
  const body = req.body || {};
  const errors = [];
  let normalizedItems = [];

  if (Array.isArray(body.items)) {
    if (body.items.length > 100) {
      errors.push('Cannot add more than 100 packing items in a single request');
    } else {
      normalizedItems = body.items
        .map((item, idx) => validateSingleItem(item, errors, `items[${idx}]: `))
        .filter(Boolean);
    }
  } else if (body.itemName !== undefined) {
    const single = validateSingleItem(body, errors);
    if (single) normalizedItems = [single];
  } else if (body.items !== undefined) {
    errors.push('items must be an array of packing items');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  req.validatedPackingItems = normalizedItems;
  next();
};

/**
 * Validates PATCH /api/trips/:tripId/packing-list/:itemId
 */
export const validateUpdatePackingItem = (req, res, next) => {
  const { itemId } = req.params;
  const { itemName, quantity, isPacked, category, assignedTo } = req.body || {};
  const errors = [];

  if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
    errors.push('Invalid packing item ID format');
  }

  if (
    itemName === undefined &&
    quantity === undefined &&
    isPacked === undefined &&
    category === undefined &&
    assignedTo === undefined
  ) {
    errors.push('Provide at least one field to update (itemName, quantity, isPacked, category, or assignedTo)');
  }

  if (itemName !== undefined) {
    if (typeof itemName !== 'string' || itemName.trim().length === 0) {
      errors.push('itemName cannot be empty');
    } else if (itemName.trim().length > 100) {
      errors.push('itemName cannot exceed 100 characters');
    }
  }

  if (quantity !== undefined) {
    const q = Number(quantity);
    if (!Number.isInteger(q) || q < 1 || q > 999) {
      errors.push('quantity must be an integer between 1 and 999');
    }
  }

  if (isPacked !== undefined && typeof isPacked !== 'boolean') {
    errors.push('isPacked must be a boolean');
  }

  if (category !== undefined) {
    const normalized = String(category).toLowerCase().trim();
    if (!VALID_PACKING_CATEGORIES.includes(normalized)) {
      errors.push(
        `Invalid category '${category}'. Allowed: ${VALID_PACKING_CATEGORIES.join(', ')}`
      );
    } else {
      req.body.category = normalized;
    }
  }

  if (
    assignedTo !== undefined &&
    assignedTo !== null &&
    assignedTo !== '' &&
    !mongoose.Types.ObjectId.isValid(assignedTo)
  ) {
    errors.push('assignedTo must be a valid user ObjectId');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

/**
 * Validates itemId param for DELETE
 */
export const validatePackingItemId = (req, res, next) => {
  const { itemId } = req.params;
  if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
    return next(new ApiError(400, 'Invalid packing item ID format'));
  }
  next();
};

export default {
  validateAddPackingItems,
  validateUpdatePackingItem,
  validatePackingItemId,
  VALID_PACKING_CATEGORIES,
};

