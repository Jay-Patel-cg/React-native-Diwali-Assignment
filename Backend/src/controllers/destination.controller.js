import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as destinationService from '../services/destination.service.js';

/**
 * @desc    List destinations with category, budget, travelType filters & pagination
 * @route   GET /api/destinations
 * @access  Public
 */
export const getDestinations = asyncHandler(async (req, res) => {
  const result = await destinationService.getDestinations(req.query);
  res
    .status(200)
    .json(
      new ApiResponse(200, result, 'Destinations retrieved successfully')
    );
});

/**
 * @desc    Search destinations by keyword with optional filters & pagination
 * @route   GET /api/destinations/search
 * @access  Public
 */
export const searchDestinations = asyncHandler(async (req, res) => {
  const result = await destinationService.searchDestinations(req.query);
  res
    .status(200)
    .json(
      new ApiResponse(200, result, 'Destination search completed successfully')
    );
});

/**
 * @desc    Get single destination details by ObjectId or slug
 * @route   GET /api/destinations/:destinationId
 * @access  Public
 */
export const getDestinationById = asyncHandler(async (req, res) => {
  const destination = await destinationService.getDestinationById(
    req.params.destinationId
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, destination, 'Destination details retrieved successfully')
    );
});

export default {
  getDestinations,
  searchDestinations,
  getDestinationById,
};

