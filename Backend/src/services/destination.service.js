import mongoose from 'mongoose';
import { Destination } from '../models/Destination.js';
import { CURATED_DESTINATIONS } from '../utils/destinationSeedData.js';
import { ApiError } from '../utils/ApiError.js';
import {
  escapeRegex,
  parsePagination,
  buildPaginationMeta,
} from '../utils/queryHelpers.js';

let seedPromise = null;

/**
 * Idempotently seeds curated destinations when the collection is empty.
 */
export const ensureSeedDestinations = async () => {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await Destination.estimatedDocumentCount();
      if (count === 0) {
        await Destination.insertMany(CURATED_DESTINATIONS, { ordered: false }).catch(
          () => {}
        );
      }
    })().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
};

/**
 * Builds common MongoDB filter & sort clauses for destination discovery queries.
 */
const buildFilterAndSort = (queryParams = {}) => {
  const {
    category,
    budgetTier,
    minBudget,
    maxBudget,
    travelType,
    featured,
    country,
    sort = 'featured',
  } = queryParams;

  const filter = {};

  if (category) {
    filter.category = String(category).toLowerCase().trim();
  }

  if (budgetTier) {
    filter.budgetTier = String(budgetTier).toLowerCase().trim();
  }

  if (travelType) {
    filter.travelTypes = String(travelType).toLowerCase().trim();
  }

  if (featured !== undefined) {
    filter.isFeatured = featured === 'true' || featured === true;
  }

  if (country) {
    filter.country = new RegExp(`^${escapeRegex(String(country).trim())}$`, 'i');
  }

  if (minBudget !== undefined || maxBudget !== undefined) {
    filter.averageDailyBudget = {};
    if (minBudget !== undefined) {
      filter.averageDailyBudget.$gte = Number(minBudget);
    }
    if (maxBudget !== undefined) {
      filter.averageDailyBudget.$lte = Number(maxBudget);
    }
  }

  let sortOption = { isFeatured: -1, rating: -1, name: 1 };
  switch (sort) {
    case 'rating':
      sortOption = { rating: -1, name: 1 };
      break;
    case 'budget_asc':
      sortOption = { averageDailyBudget: 1, rating: -1 };
      break;
    case 'budget_desc':
      sortOption = { averageDailyBudget: -1, rating: -1 };
      break;
    case 'name':
      sortOption = { name: 1 };
      break;
    default:
      sortOption = { isFeatured: -1, rating: -1, name: 1 };
  }

  return { filter, sortOption };
};

/**
 * List destinations with filtering, sorting, and pagination.
 */
export const getDestinations = async (queryParams = {}) => {
  await ensureSeedDestinations();

  const { page, limit, skip } = parsePagination(queryParams, {
    defaultLimit: 10,
    maxLimit: 50,
  });

  const { filter, sortOption } = buildFilterAndSort(queryParams);

  const [destinations, total] = await Promise.all([
    Destination.find(filter).sort(sortOption).skip(skip).limit(limit),
    Destination.countDocuments(filter),
  ]);

  return {
    destinations,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Search destinations across name, region, country, description, and highlights
 * with optional category, budget, and travelType filters + pagination.
 */
export const searchDestinations = async (queryParams = {}) => {
  await ensureSeedDestinations();

  const rawQ = String(queryParams.q || '').trim();
  const safeRegex = new RegExp(escapeRegex(rawQ), 'i');

  const { page, limit, skip } = parsePagination(queryParams, {
    defaultLimit: 10,
    maxLimit: 50,
  });

  const { filter, sortOption } = buildFilterAndSort(queryParams);

  filter.$or = [
    { name: safeRegex },
    { stateOrRegion: safeRegex },
    { country: safeRegex },
    { shortDescription: safeRegex },
    { description: safeRegex },
    { highlights: safeRegex },
    { category: safeRegex },
  ];

  const [destinations, total] = await Promise.all([
    Destination.find(filter).sort(sortOption).skip(skip).limit(limit),
    Destination.countDocuments(filter),
  ]);

  return {
    query: rawQ,
    destinations,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Retrieve destination details by MongoDB ObjectId or slug.
 */
export const getDestinationById = async (destinationId) => {
  await ensureSeedDestinations();

  let destination = null;

  if (mongoose.Types.ObjectId.isValid(destinationId)) {
    destination = await Destination.findById(destinationId);
  }

  if (!destination) {
    destination = await Destination.findOne({
      slug: String(destinationId).toLowerCase().trim(),
    });
  }

  if (!destination) {
    throw new ApiError(404, 'Destination not found');
  }

  return destination;
};

export default {
  ensureSeedDestinations,
  getDestinations,
  searchDestinations,
  getDestinationById,
};

