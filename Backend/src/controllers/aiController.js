import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as geminiService from '../services/geminiService.js';

/**
 * @desc    Generate a comprehensive AI trip plan (draft only — requires user confirmation to save)
 * @route   POST /api/ai/plan-trip
 * @access  Private (JWT + AI Rate Limiter)
 */
export const planTrip = asyncHandler(async (req, res) => {
  const result = await geminiService.planTrip(req.aiInput);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        'AI trip plan generated successfully (draft estimates — not saved automatically)'
      )
    );
});

/**
 * @desc    Generate a day-wise AI travel itinerary
 * @route   POST /api/ai/generate-itinerary
 * @access  Private (JWT + AI Rate Limiter)
 */
export const generateItinerary = asyncHandler(async (req, res) => {
  const result = await geminiService.generateItinerary(req.aiInput);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        'AI itinerary generated successfully (draft estimates — not saved automatically)'
      )
    );
});

/**
 * @desc    Get AI-powered destination recommendations based on preferences
 * @route   POST /api/ai/recommend-destinations
 * @access  Private (JWT + AI Rate Limiter)
 */
export const recommendDestinations = asyncHandler(async (req, res) => {
  const result = await geminiService.recommendDestinations(req.aiInput);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        'Destination recommendations generated successfully'
      )
    );
});

/**
 * @desc    Generate AI travel budget suggestions & category breakdown
 * @route   POST /api/ai/budget-suggestions
 * @access  Private (JWT + AI Rate Limiter)
 */
export const budgetSuggestions = asyncHandler(async (req, res) => {
  const result = await geminiService.suggestBudget(req.aiInput);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        'Travel budget suggestions generated successfully (estimates only)'
      )
    );
});

/**
 * @desc    Interactive AI Travel Copilot chat
 * @route   POST /api/ai/chat
 * @access  Private (JWT + AI Rate Limiter)
 */
export const chat = asyncHandler(async (req, res) => {
  const result = await geminiService.travelChat(req.aiInput);
  res
    .status(200)
    .json(new ApiResponse(200, result, 'AI Travel Copilot reply generated'));
});

/**
 * @desc    Optimize an existing day-wise itinerary for pacing, routing, or budget
 * @route   POST /api/ai/optimize-itinerary
 * @access  Private (JWT + AI Rate Limiter)
 */
export const optimizeItinerary = asyncHandler(async (req, res) => {
  const result = await geminiService.optimizeItinerary(req.aiInput);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        'Itinerary optimization completed (draft proposal — review before saving)'
      )
    );
});

export default {
  planTrip,
  generateItinerary,
  recommendDestinations,
  budgetSuggestions,
  chat,
  optimizeItinerary,
};

