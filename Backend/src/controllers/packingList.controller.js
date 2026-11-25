import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as packingListService from '../services/packingList.service.js';

/**
 * @desc    Create packing list or add item(s) to a trip's packing list
 * @route   POST /api/trips/:tripId/packing-list
 * @access  Private (Owner, Admin, Editor)
 */
export const createOrAddPackingItems = asyncHandler(async (req, res) => {
  const result = await packingListService.createOrAddItems(
    req.params.tripId,
    req.validatedPackingItems
  );
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        result,
        'Packing list updated with items successfully'
      )
    );
});

/**
 * @desc    Get trip packing list with filters & packing progress
 * @route   GET /api/trips/:tripId/packing-list
 * @access  Private (Trip Members & Owner)
 */
export const getPackingList = asyncHandler(async (req, res) => {
  const result = await packingListService.getPackingList(
    req.params.tripId,
    req.query
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, 'Packing list retrieved successfully'));
});

/**
 * @desc    Update a packing list item or toggle isPacked
 * @route   PATCH /api/trips/:tripId/packing-list/:itemId
 * @access  Private (Owner, Admin, Editor)
 */
export const updatePackingItem = asyncHandler(async (req, res) => {
  const result = await packingListService.updatePackingItem(
    req.params.tripId,
    req.params.itemId,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, 'Packing item updated successfully'));
});

/**
 * @desc    Delete an item from the packing list
 * @route   DELETE /api/trips/:tripId/packing-list/:itemId
 * @access  Private (Owner, Admin, Editor)
 */
export const deletePackingItem = asyncHandler(async (req, res) => {
  const result = await packingListService.deletePackingItem(
    req.params.tripId,
    req.params.itemId
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, 'Packing item deleted successfully'));
});

export default {
  createOrAddPackingItems,
  getPackingList,
  updatePackingItem,
  deletePackingItem,
};

