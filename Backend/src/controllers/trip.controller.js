import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as tripService from '../services/trip.service.js';

/**
 * @desc    Create a new trip
 * @route   POST /api/trips
 * @access  Private
 */
export const createTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.createTrip(req.user._id, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, trip, 'Trip created successfully'));
});

/**
 * @desc    Get all trips belonging to logged-in user (owned or accepted member)
 * @route   GET /api/trips
 * @access  Private
 */
export const getUserTrips = asyncHandler(async (req, res) => {
  const result = await tripService.getUserTrips(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, 'User trips retrieved successfully'));
});

/**
 * @desc    Get trip details by ID
 * @route   GET /api/trips/:tripId
 * @access  Private (Owner / Member)
 */
export const getTripById = asyncHandler(async (req, res) => {
  const tripDetails = await tripService.getTripById(req.params.tripId);
  res
    .status(200)
    .json(new ApiResponse(200, tripDetails, 'Trip details retrieved successfully'));
});

/**
 * @desc    Update trip details or status
 * @route   PATCH /api/trips/:tripId
 * @access  Private (Owner / Admin)
 */
export const updateTrip = asyncHandler(async (req, res) => {
  const updatedTrip = await tripService.updateTrip(req.params.tripId, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, updatedTrip, 'Trip updated successfully'));
});

/**
 * @desc    Delete trip
 * @route   DELETE /api/trips/:tripId
 * @access  Private (Owner only)
 */
export const deleteTrip = asyncHandler(async (req, res) => {
  const result = await tripService.deleteTrip(req.params.tripId);
  res
    .status(200)
    .json(new ApiResponse(200, result, 'Trip deleted successfully'));
});

/**
 * @desc    Add member to trip
 * @route   POST /api/trips/:tripId/members
 * @access  Private (Owner / Admin)
 */
export const addTripMember = asyncHandler(async (req, res) => {
  const newMember = await tripService.addTripMember(
    req.params.tripId,
    req.user._id,
    req.body
  );
  res
    .status(201)
    .json(new ApiResponse(201, newMember, 'Member added to trip successfully'));
});

/**
 * @desc    Get all members of a trip
 * @route   GET /api/trips/:tripId/members
 * @access  Private (Owner / Member)
 */
export const getTripMembers = asyncHandler(async (req, res) => {
  const members = await tripService.getTripMembers(req.params.tripId);
  res
    .status(200)
    .json(new ApiResponse(200, members, 'Trip members retrieved successfully'));
});

/**
 * @desc    Remove a member from a trip
 * @route   DELETE /api/trips/:tripId/members/:memberId
 * @access  Private (Owner, Admin, or self)
 */
export const removeTripMember = asyncHandler(async (req, res) => {
  const result = await tripService.removeTripMember(
    req.params.tripId,
    req.params.memberId,
    req.user._id.toString(),
    req.tripRole
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, 'Member removed successfully'));
});

/**
 * @desc    Create a daily itinerary with activities
 * @route   POST /api/trips/:tripId/itinerary
 * @access  Private (Owner / Admin / Editor)
 */
export const createItinerary = asyncHandler(async (req, res) => {
  const itinerary = await tripService.createItinerary(
    req.params.tripId,
    req.body
  );
  res
    .status(201)
    .json(new ApiResponse(201, itinerary, 'Itinerary day created successfully'));
});

/**
 * @desc    Get all daily itineraries for a trip
 * @route   GET /api/trips/:tripId/itinerary
 * @access  Private (Owner / Member)
 */
export const getTripItineraries = asyncHandler(async (req, res) => {
  const itineraries = await tripService.getTripItineraries(req.params.tripId);
  res
    .status(200)
    .json(new ApiResponse(200, itineraries, 'Trip itineraries retrieved successfully'));
});

/**
 * @desc    Update an itinerary day
 * @route   PATCH /api/trips/:tripId/itinerary/:itineraryId
 * @access  Private (Owner / Admin / Editor)
 */
export const updateItinerary = asyncHandler(async (req, res) => {
  const updatedItinerary = await tripService.updateItinerary(
    req.params.tripId,
    req.params.itineraryId,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, updatedItinerary, 'Itinerary updated successfully'));
});

/**
 * @desc    Delete an itinerary day
 * @route   DELETE /api/trips/:tripId/itinerary/:itineraryId
 * @access  Private (Owner / Admin / Editor)
 */
export const deleteItinerary = asyncHandler(async (req, res) => {
  const result = await tripService.deleteItinerary(
    req.params.tripId,
    req.params.itineraryId
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, 'Itinerary day deleted successfully'));
});

export default {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  addTripMember,
  getTripMembers,
  removeTripMember,
  createItinerary,
  getTripItineraries,
  updateItinerary,
  deleteItinerary,
};

