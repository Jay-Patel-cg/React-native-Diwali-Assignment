import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

const VALID_STATUSES = ['planning', 'active', 'completed', 'cancelled'];
const VALID_MEMBER_ROLES = ['admin', 'editor', 'viewer'];
const VALID_ACTIVITY_CATEGORIES = [
  'sightseeing',
  'dining',
  'beach',
  'water_sports',
  'transport',
  'accommodation',
  'relaxation',
  'shopping',
  'other',
];

/**
 * Validates request payload for creating a new Trip
 */
export const validateCreateTrip = (req, res, next) => {
  const { title, destination, startDate, endDate, budget, currency, travelers, status } =
    req.body || {};
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push('Trip title is required and must be at least 2 characters long');
  } else if (title.trim().length > 120) {
    errors.push('Trip title cannot exceed 120 characters');
  }

  if (!destination || typeof destination !== 'string' || destination.trim().length === 0) {
    errors.push('Destination is required');
  }

  if (!startDate || isNaN(new Date(startDate).getTime())) {
    errors.push('A valid trip start date is required');
  }

  if (!endDate || isNaN(new Date(endDate).getTime())) {
    errors.push('A valid trip end date is required');
  }

  if (startDate && endDate && !isNaN(new Date(startDate).getTime()) && !isNaN(new Date(endDate).getTime())) {
    if (new Date(endDate) < new Date(startDate)) {
      errors.push('End date must be on or after the start date');
    }
  }

  if (budget !== undefined) {
    const numBudget = Number(budget);
    if (isNaN(numBudget) || numBudget < 0) {
      errors.push('Budget must be a non-negative number');
    }
  }

  if (travelers !== undefined) {
    const numTravelers = Number(travelers);
    if (isNaN(numTravelers) || numTravelers < 1) {
      errors.push('Travelers count must be at least 1');
    }
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

/**
 * Validates request payload for updating a Trip
 */
export const validateUpdateTrip = (req, res, next) => {
  const { title, destination, startDate, endDate, budget, travelers, status } = req.body || {};
  const errors = [];

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 2)) {
    errors.push('Title must be at least 2 characters long');
  }

  if (startDate !== undefined && isNaN(new Date(startDate).getTime())) {
    errors.push('Start date must be a valid date format');
  }

  if (endDate !== undefined && isNaN(new Date(endDate).getTime())) {
    errors.push('End date must be a valid date format');
  }

  if (startDate && endDate) {
    if (new Date(endDate) < new Date(startDate)) {
      errors.push('End date must be on or after the start date');
    }
  }

  if (budget !== undefined) {
    const numBudget = Number(budget);
    if (isNaN(numBudget) || numBudget < 0) {
      errors.push('Budget must be a non-negative number');
    }
  }

  if (travelers !== undefined) {
    const numTravelers = Number(travelers);
    if (isNaN(numTravelers) || numTravelers < 1) {
      errors.push('Travelers count must be at least 1');
    }
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

/**
 * Validates request payload for adding a Trip member
 */
export const validateAddMember = (req, res, next) => {
  const { email, userId, role } = req.body || {};
  const errors = [];

  if (!email && !userId) {
    errors.push('Either user email or userId is required to add a member');
  }

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    errors.push('Invalid userId format');
  }

  if (role !== undefined && !VALID_MEMBER_ROLES.includes(role)) {
    errors.push(`Member role must be one of: ${VALID_MEMBER_ROLES.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

/**
 * Validates request payload for creating an Itinerary day and activities
 */
export const validateItinerary = (req, res, next) => {
  const { date, dayNumber, activities } = req.body || {};
  const errors = [];

  if (!date || isNaN(new Date(date).getTime())) {
    errors.push('A valid itinerary date is required');
  }

  const numDay = Number(dayNumber);
  if (dayNumber === undefined || isNaN(numDay) || numDay < 1) {
    errors.push('Day number is required and must be an integer >= 1');
  }

  if (activities !== undefined) {
    if (!Array.isArray(activities)) {
      errors.push('Activities must be an array of activity objects');
    } else {
      activities.forEach((act, idx) => {
        if (!act.title || typeof act.title !== 'string' || act.title.trim().length === 0) {
          errors.push(`Activity at index ${idx} must have a title`);
        }
        if (act.category && !VALID_ACTIVITY_CATEGORIES.includes(act.category)) {
          errors.push(
            `Activity category '${act.category}' at index ${idx} is invalid. Allowed: ${VALID_ACTIVITY_CATEGORIES.join(', ')}`
          );
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
 * Validates request payload for updating an Itinerary day
 */
export const validateUpdateItinerary = (req, res, next) => {
  const { date, dayNumber, activities } = req.body || {};
  const errors = [];

  if (date !== undefined && isNaN(new Date(date).getTime())) {
    errors.push('Date must be a valid date format');
  }

  if (dayNumber !== undefined) {
    const numDay = Number(dayNumber);
    if (isNaN(numDay) || numDay < 1) {
      errors.push('Day number must be an integer >= 1');
    }
  }

  if (activities !== undefined) {
    if (!Array.isArray(activities)) {
      errors.push('Activities must be an array');
    } else {
      activities.forEach((act, idx) => {
        if (act.title !== undefined && (typeof act.title !== 'string' || act.title.trim().length === 0)) {
          errors.push(`Activity title at index ${idx} cannot be empty`);
        }
        if (act.category && !VALID_ACTIVITY_CATEGORIES.includes(act.category)) {
          errors.push(`Invalid category '${act.category}' at index ${idx}`);
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
 * Validates PATCH /api/trips/:tripId/members/respond
 */
export const validateInvitationResponse = (req, res, next) => {
  const raw = req.body?.status || req.body?.action;
  if (!raw || typeof raw !== 'string') {
    return next(
      new ApiError(400, 'status (accepted or rejected) is required')
    );
  }

  const normalized = raw.toLowerCase().trim();
  const mapped =
    normalized === 'accept'
      ? 'accepted'
      : normalized === 'reject'
        ? 'rejected'
        : normalized;

  if (mapped !== 'accepted' && mapped !== 'rejected') {
    return next(
      new ApiError(400, 'Invitation status must be either "accepted" or "rejected"')
    );
  }

  req.body.status = mapped;
  next();
};

/**
 * Validates PATCH /api/trips/:tripId/members/:memberId/role
 */
export const validateUpdateMemberRole = (req, res, next) => {
  const { memberId } = req.params;
  const { role } = req.body || {};
  const errors = [];

  if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
    errors.push('Invalid memberId format');
  }

  if (!role || !VALID_MEMBER_ROLES.includes(String(role).toLowerCase().trim())) {
    errors.push(`role is required and must be one of: ${VALID_MEMBER_ROLES.join(', ')}`);
  } else {
    req.body.role = String(role).toLowerCase().trim();
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

export default {
  validateCreateTrip,
  validateUpdateTrip,
  validateAddMember,
  validateInvitationResponse,
  validateUpdateMemberRole,
  validateItinerary,
  validateUpdateItinerary,
};

