import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export const VALID_EXPENSE_CATEGORIES = [
  'transport',
  'accommodation',
  'stay',
  'food',
  'activities',
  'shopping',
  'fuel',
  'tickets',
  'miscellaneous',
];

export const VALID_SPLIT_TYPES = ['equal', 'exact', 'percentage'];

/**
 * Validates request payload for creating an Expense
 */
export const validateCreateExpense = (req, res, next) => {
  const {
    title,
    amount,
    currency,
    category,
    expenseDate,
    paidBy,
    splitType,
    participants,
  } = req.body || {};

  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Expense title is required');
  } else if (title.trim().length > 120) {
    errors.push('Expense title cannot exceed 120 characters');
  }

  const numAmount = Number(amount);
  if (amount === undefined || isNaN(numAmount) || numAmount <= 0) {
    errors.push('Expense amount must be a positive number greater than 0');
  }

  if (category !== undefined) {
    const normalizedCategory = String(category).toLowerCase().trim();
    if (!VALID_EXPENSE_CATEGORIES.includes(normalizedCategory)) {
      errors.push(
        `Invalid category '${category}'. Allowed: ${VALID_EXPENSE_CATEGORIES.join(
          ', '
        )}`
      );
    } else {
      req.body.category = normalizedCategory;
    }
  }

  if (expenseDate !== undefined && isNaN(new Date(expenseDate).getTime())) {
    errors.push('Expense date must be a valid date format');
  }

  if (paidBy !== undefined && !mongoose.Types.ObjectId.isValid(paidBy)) {
    errors.push('Invalid paidBy userId format');
  }

  if (splitType !== undefined) {
    const normalizedSplit = String(splitType).toLowerCase().trim();
    if (!VALID_SPLIT_TYPES.includes(normalizedSplit)) {
      errors.push(
        `Split type must be one of: ${VALID_SPLIT_TYPES.join(', ')}`
      );
    } else {
      req.body.splitType = normalizedSplit;
    }
  }

  if (participants !== undefined) {
    if (!Array.isArray(participants)) {
      errors.push('Participants must be an array');
    } else {
      participants.forEach((p, idx) => {
        if (!p.userId || !mongoose.Types.ObjectId.isValid(p.userId)) {
          errors.push(`Invalid userId for participant at index ${idx}`);
        }
        if (p.shareAmount !== undefined) {
          const numShare = Number(p.shareAmount);
          if (isNaN(numShare) || numShare < 0) {
            errors.push(`Invalid shareAmount for participant at index ${idx}`);
          }
        }
      });
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

/**
 * Validates request payload for updating an Expense
 */
export const validateUpdateExpense = (req, res, next) => {
  const { title, amount, category, expenseDate, paidBy, splitType, participants } =
    req.body || {};

  const errors = [];

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    errors.push('Expense title cannot be empty');
  }

  if (amount !== undefined) {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errors.push('Expense amount must be a positive number');
    }
  }

  if (category !== undefined) {
    const normalizedCategory = String(category).toLowerCase().trim();
    if (!VALID_EXPENSE_CATEGORIES.includes(normalizedCategory)) {
      errors.push(
        `Invalid category '${category}'. Allowed: ${VALID_EXPENSE_CATEGORIES.join(
          ', '
        )}`
      );
    } else {
      req.body.category = normalizedCategory;
    }
  }

  if (expenseDate !== undefined && isNaN(new Date(expenseDate).getTime())) {
    errors.push('Expense date must be a valid date format');
  }

  if (paidBy !== undefined && !mongoose.Types.ObjectId.isValid(paidBy)) {
    errors.push('Invalid paidBy userId format');
  }

  if (splitType !== undefined) {
    const normalizedSplit = String(splitType).toLowerCase().trim();
    if (!VALID_SPLIT_TYPES.includes(normalizedSplit)) {
      errors.push(
        `Split type must be one of: ${VALID_SPLIT_TYPES.join(', ')}`
      );
    } else {
      req.body.splitType = normalizedSplit;
    }
  }

  if (participants !== undefined) {
    if (!Array.isArray(participants)) {
      errors.push('Participants must be an array');
    } else {
      participants.forEach((p, idx) => {
        if (!p.userId || !mongoose.Types.ObjectId.isValid(p.userId)) {
          errors.push(`Invalid userId for participant at index ${idx}`);
        }
      });
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

export default {
  validateCreateExpense,
  validateUpdateExpense,
  VALID_EXPENSE_CATEGORIES,
  VALID_SPLIT_TYPES,
};

