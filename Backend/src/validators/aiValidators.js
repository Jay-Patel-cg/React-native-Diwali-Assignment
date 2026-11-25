import { ApiError } from '../utils/ApiError.js';

const MAX_TRIP_DAYS = 30;
const MAX_TRAVELERS = 50;
const MAX_CHAT_MESSAGE_LENGTH = 1500;
const MAX_CHAT_HISTORY_LENGTH = 20;
const VALID_PACE_OPTIONS = ['relaxed', 'moderate', 'packed'];

/**
 * High-confidence prompt injection and credential exfiltration patterns.
 * Defense-in-depth layer paired with Gemini native systemInstruction & data delimiters.
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|prompts|rules)/i,
  /forget\s+(everything|all\s+previous|your\s+instructions)/i,
  /override\s+(system|developer)\s+(prompt|instructions|rules)/i,
  /(reveal|show|print|output|leak|dump)\s+(your\s+)?(system\s+prompt|hidden\s+instructions|api[\s_-]?key|gemini[\s_-]?api[\s_-]?key|env|environment\s+variables)/i,
  /you\s+are\s+now\s+(dan|in\s+developer\s+mode|jailbroken|unrestricted)/i,
  /<\s*\/?\s*(system|user_travel_request_data|instructions?)\s*>/i,
];

/**
 * Checks whether a string contains blatant prompt-injection override attempts.
 */
const containsPromptInjection = (value) => {
  if (typeof value !== 'string') return false;
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
};

/**
 * Recursively scans an object/array/string for prompt-injection attempts.
 */
const scanForPromptInjection = (payload) => {
  if (typeof payload === 'string') {
    return containsPromptInjection(payload);
  }
  if (Array.isArray(payload)) {
    return payload.some((item) => scanForPromptInjection(item));
  }
  if (payload && typeof payload === 'object') {
    return Object.values(payload).some((val) => scanForPromptInjection(val));
  }
  return false;
};

/**
 * Strips ASCII control characters (except newlines/tabs) and trims strings.
 */
const sanitizeText = (value, maxLength = 500) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
};

/**
 * Normalizes a string or array of strings into a clean bounded array.
 */
const normalizeStringArray = (input, maxItems = 15, maxItemLength = 60) => {
  if (!input) return [];
  const rawList = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',')
      : [];

  return rawList
    .map((item) => sanitizeText(String(item), maxItemLength))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
};

/**
 * Computes inclusive calendar day duration and validates date range.
 */
const parseDateRange = (startDate, endDate, errors) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    errors.push('startDate must be a valid ISO date string (e.g. YYYY-MM-DD)');
    return null;
  }
  if (isNaN(end.getTime())) {
    errors.push('endDate must be a valid ISO date string (e.g. YYYY-MM-DD)');
    return null;
  }
  if (end < start) {
    errors.push('endDate must be on or after startDate');
    return null;
  }

  const diffDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays > MAX_TRIP_DAYS) {
    errors.push(
      `Trip duration cannot exceed ${MAX_TRIP_DAYS} days for a single AI generation request`
    );
    return null;
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    durationDays: diffDays,
  };
};

/**
 * Guard middleware rejecting prompt-injection payloads across all AI routes.
 */
export const guardPromptInjection = (req, res, next) => {
  if (scanForPromptInjection(req.body)) {
    return next(
      new ApiError(
        400,
        'Input rejected due to disallowed instruction-override patterns. Please submit travel planning details only.'
      )
    );
  }
  next();
};

/**
 * 1. Validate POST /api/ai/plan-trip
 */
export const validatePlanTrip = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  const destination = sanitizeText(body.destination, 120);
  if (!destination || destination.length < 2) {
    errors.push('destination is required and must be at least 2 characters');
  }

  const origin = sanitizeText(body.origin || '', 120);

  let dateInfo = null;
  if (!body.startDate || !body.endDate) {
    errors.push('Both startDate and endDate are required');
  } else {
    dateInfo = parseDateRange(body.startDate, body.endDate, errors);
  }

  const rawTravelers =
    body.travelers !== undefined ? body.travelers : body.numberOfTravelers;
  const travelers = rawTravelers !== undefined ? Number(rawTravelers) : 1;
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > MAX_TRAVELERS) {
    errors.push(`travelers must be an integer between 1 and ${MAX_TRAVELERS}`);
  }

  const budget = body.budget !== undefined ? Number(body.budget) : undefined;
  if (budget !== undefined && (isNaN(budget) || budget < 0)) {
    errors.push('budget must be a non-negative number');
  }

  const currency = sanitizeText(body.currency || 'INR', 5).toUpperCase() || 'INR';
  const travelStyle = normalizeStringArray(body.travelStyle, 8, 40);
  const interests = normalizeStringArray(body.interests, 15, 50);
  const accommodationPreferences = sanitizeText(
    body.accommodationPreferences || body.accommodation || '',
    200
  );
  const transportPreferences = sanitizeText(
    body.transportPreferences || body.transport || '',
    200
  );

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  req.aiInput = {
    destination,
    origin,
    startDate: dateInfo.startDate,
    endDate: dateInfo.endDate,
    durationDays: dateInfo.durationDays,
    travelers,
    budget,
    currency,
    travelStyle,
    interests,
    accommodationPreferences,
    transportPreferences,
  };

  next();
};

/**
 * 2. Validate POST /api/ai/generate-itinerary
 */
export const validateGenerateItinerary = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  const destination = sanitizeText(body.destination, 120);
  if (!destination || destination.length < 2) {
    errors.push('destination is required and must be at least 2 characters');
  }

  let startDate = null;
  let endDate = null;
  let durationDays = null;

  if (body.startDate && body.endDate) {
    const dateInfo = parseDateRange(body.startDate, body.endDate, errors);
    if (dateInfo) {
      startDate = dateInfo.startDate;
      endDate = dateInfo.endDate;
      durationDays = dateInfo.durationDays;
    }
  } else if (body.days !== undefined || body.durationDays !== undefined) {
    const rawDays = Number(body.days ?? body.durationDays);
    if (!Number.isInteger(rawDays) || rawDays < 1 || rawDays > MAX_TRIP_DAYS) {
      errors.push(`days must be an integer between 1 and ${MAX_TRIP_DAYS}`);
    } else {
      durationDays = rawDays;
    }
  } else {
    errors.push('Provide either startDate and endDate, or days (1-30)');
  }

  const travelers = body.travelers !== undefined ? Number(body.travelers) : 1;
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > MAX_TRAVELERS) {
    errors.push(`travelers must be an integer between 1 and ${MAX_TRAVELERS}`);
  }

  const budget = body.budget !== undefined ? Number(body.budget) : undefined;
  if (budget !== undefined && (isNaN(budget) || budget < 0)) {
    errors.push('budget must be a non-negative number');
  }

  const pace = body.pace ? sanitizeText(body.pace, 20).toLowerCase() : 'moderate';
  if (!VALID_PACE_OPTIONS.includes(pace)) {
    errors.push(`pace must be one of: ${VALID_PACE_OPTIONS.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  req.aiInput = {
    destination,
    startDate,
    endDate,
    durationDays,
    travelers,
    budget,
    currency: sanitizeText(body.currency || 'INR', 5).toUpperCase() || 'INR',
    travelStyle: normalizeStringArray(body.travelStyle, 8, 40),
    interests: normalizeStringArray(body.interests, 15, 50),
    pace,
    notes: sanitizeText(body.notes || '', 400),
  };

  next();
};

/**
 * 3. Validate POST /api/ai/recommend-destinations
 */
export const validateRecommendDestinations = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  const origin = sanitizeText(body.origin || '', 120);
  const region = sanitizeText(body.region || '', 120);
  const season = sanitizeText(body.season || body.travelMonth || '', 60);
  const preferences = sanitizeText(body.preferences || '', 300);
  const travelStyle = normalizeStringArray(body.travelStyle, 8, 40);
  const interests = normalizeStringArray(body.interests, 15, 50);

  const budget = body.budget !== undefined ? Number(body.budget) : undefined;
  if (budget !== undefined && (isNaN(budget) || budget < 0)) {
    errors.push('budget must be a non-negative number');
  }

  const durationDays =
    body.durationDays !== undefined ? Number(body.durationDays) : 5;
  if (
    !Number.isInteger(durationDays) ||
    durationDays < 1 ||
    durationDays > MAX_TRIP_DAYS
  ) {
    errors.push(`durationDays must be an integer between 1 and ${MAX_TRIP_DAYS}`);
  }

  const travelers = body.travelers !== undefined ? Number(body.travelers) : 2;
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > MAX_TRAVELERS) {
    errors.push(`travelers must be an integer between 1 and ${MAX_TRAVELERS}`);
  }

  const count = body.count !== undefined ? Number(body.count) : 5;
  if (!Number.isInteger(count) || count < 1 || count > 10) {
    errors.push('count must be an integer between 1 and 10');
  }

  const hasCriteria =
    origin ||
    region ||
    season ||
    preferences ||
    budget !== undefined ||
    travelStyle.length > 0 ||
    interests.length > 0;

  if (!hasCriteria) {
    errors.push(
      'Provide at least one preference (e.g. interests, travelStyle, budget, region, or season)'
    );
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  req.aiInput = {
    origin,
    region,
    season,
    preferences,
    budget,
    currency: sanitizeText(body.currency || 'INR', 5).toUpperCase() || 'INR',
    durationDays,
    travelers,
    travelStyle,
    interests,
    count,
  };

  next();
};

/**
 * 4. Validate POST /api/ai/budget-suggestions
 */
export const validateBudgetSuggestions = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  const destination = sanitizeText(body.destination, 120);
  if (!destination || destination.length < 2) {
    errors.push('destination is required and must be at least 2 characters');
  }

  let durationDays = null;
  if (body.startDate && body.endDate) {
    const dateInfo = parseDateRange(body.startDate, body.endDate, errors);
    if (dateInfo) durationDays = dateInfo.durationDays;
  } else if (body.durationDays !== undefined || body.days !== undefined) {
    const rawDays = Number(body.durationDays ?? body.days);
    if (!Number.isInteger(rawDays) || rawDays < 1 || rawDays > MAX_TRIP_DAYS) {
      errors.push(`durationDays must be an integer between 1 and ${MAX_TRIP_DAYS}`);
    } else {
      durationDays = rawDays;
    }
  } else {
    errors.push('Provide either durationDays (1-30) or startDate and endDate');
  }

  const travelers = body.travelers !== undefined ? Number(body.travelers) : 1;
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > MAX_TRAVELERS) {
    errors.push(`travelers must be an integer between 1 and ${MAX_TRAVELERS}`);
  }

  const rawBudget = body.totalBudget !== undefined ? body.totalBudget : body.budget;
  const totalBudget = rawBudget !== undefined ? Number(rawBudget) : undefined;
  if (totalBudget !== undefined && (isNaN(totalBudget) || totalBudget <= 0)) {
    errors.push('totalBudget must be a positive number greater than 0');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  req.aiInput = {
    destination,
    origin: sanitizeText(body.origin || '', 120),
    durationDays,
    travelers,
    totalBudget,
    currency: sanitizeText(body.currency || 'INR', 5).toUpperCase() || 'INR',
    travelStyle: normalizeStringArray(body.travelStyle, 6, 40),
    accommodationPreferences: sanitizeText(
      body.accommodationPreferences || body.accommodation || '',
      200
    ),
    transportPreferences: sanitizeText(
      body.transportPreferences || body.transport || '',
      200
    ),
  };

  next();
};

/**
 * 5. Validate POST /api/ai/chat
 */
export const validateChat = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  const message = sanitizeText(body.message, MAX_CHAT_MESSAGE_LENGTH + 1);
  if (!message) {
    errors.push('message is required and cannot be empty');
  } else if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
    errors.push(
      `message cannot exceed ${MAX_CHAT_MESSAGE_LENGTH} characters`
    );
  }

  let sanitizedHistory = [];
  if (body.history !== undefined) {
    if (!Array.isArray(body.history)) {
      errors.push('history must be an array of chat turns');
    } else if (body.history.length > MAX_CHAT_HISTORY_LENGTH) {
      errors.push(
        `history cannot exceed ${MAX_CHAT_HISTORY_LENGTH} messages`
      );
    } else {
      sanitizedHistory = body.history.map((turn, idx) => {
        if (!turn || typeof turn !== 'object') {
          errors.push(`history[${idx}] must be an object`);
          return null;
        }
        const role = turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user';
        const content = sanitizeText(turn.content || turn.text || '', MAX_CHAT_MESSAGE_LENGTH);
        if (!content) {
          errors.push(`history[${idx}].content cannot be empty`);
          return null;
        }
        return { role, content };
      }).filter(Boolean);
    }
  }

  let tripContext = null;
  if (body.tripContext !== undefined && body.tripContext !== null) {
    if (typeof body.tripContext !== 'object' || Array.isArray(body.tripContext)) {
      errors.push('tripContext must be an object');
    } else {
      tripContext = {
        destination: sanitizeText(body.tripContext.destination || '', 120),
        origin: sanitizeText(body.tripContext.origin || '', 120),
        startDate: sanitizeText(String(body.tripContext.startDate || ''), 30),
        endDate: sanitizeText(String(body.tripContext.endDate || ''), 30),
        travelers:
          body.tripContext.travelers !== undefined
            ? Number(body.tripContext.travelers)
            : undefined,
        budget:
          body.tripContext.budget !== undefined
            ? Number(body.tripContext.budget)
            : undefined,
        currency: sanitizeText(body.tripContext.currency || 'INR', 5).toUpperCase(),
      };
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  req.aiInput = {
    message,
    history: sanitizedHistory,
    tripContext,
  };

  next();
};

/**
 * 6. Validate POST /api/ai/optimize-itinerary
 */
export const validateOptimizeItinerary = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  const destination = sanitizeText(body.destination, 120);
  if (!destination || destination.length < 2) {
    errors.push('destination is required and must be at least 2 characters');
  }

  if (!Array.isArray(body.itinerary) || body.itinerary.length === 0) {
    errors.push('itinerary is required and must be a non-empty array of days');
  } else if (body.itinerary.length > MAX_TRIP_DAYS) {
    errors.push(`itinerary cannot exceed ${MAX_TRIP_DAYS} days`);
  } else {
    body.itinerary.forEach((day, idx) => {
      if (!day || typeof day !== 'object') {
        errors.push(`itinerary[${idx}] must be an object`);
        return;
      }
      if (!Array.isArray(day.activities) || day.activities.length === 0) {
        errors.push(`itinerary[${idx}].activities must be a non-empty array`);
      } else if (day.activities.length > 25) {
        errors.push(`itinerary[${idx}].activities cannot exceed 25 activities`);
      }
    });
  }

  const budget = body.budget !== undefined ? Number(body.budget) : undefined;
  if (budget !== undefined && (isNaN(budget) || budget < 0)) {
    errors.push('budget must be a non-negative number');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  const sanitizedItinerary = body.itinerary.map((day, idx) => ({
    dayNumber: Number(day.dayNumber) || idx + 1,
    date: day.date ? sanitizeText(String(day.date), 30) : '',
    notes: sanitizeText(day.notes || '', 300),
    activities: day.activities.map((act) => ({
      title: sanitizeText(act.title || 'Untitled Activity', 120),
      description: sanitizeText(act.description || '', 300),
      startTime: sanitizeText(act.startTime || '', 30),
      endTime: sanitizeText(act.endTime || '', 30),
      location:
        typeof act.location === 'string'
          ? sanitizeText(act.location, 120)
          : sanitizeText(act.location?.name || '', 120),
      category: sanitizeText(act.category || 'sightseeing', 30),
      estimatedCost:
        act.estimatedCost !== undefined && !isNaN(Number(act.estimatedCost))
          ? Number(act.estimatedCost)
          : 0,
    })),
  }));

  req.aiInput = {
    destination,
    itinerary: sanitizedItinerary,
    goals: normalizeStringArray(body.goals || body.optimizationGoals, 10, 60),
    budget,
    currency: sanitizeText(body.currency || 'INR', 5).toUpperCase() || 'INR',
    travelStyle: normalizeStringArray(body.travelStyle, 8, 40),
    constraints: sanitizeText(body.constraints || '', 500),
  };

  next();
};

export default {
  guardPromptInjection,
  validatePlanTrip,
  validateGenerateItinerary,
  validateRecommendDestinations,
  validateBudgetSuggestions,
  validateChat,
  validateOptimizeItinerary,
};

