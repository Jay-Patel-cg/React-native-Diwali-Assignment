import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as expenseService from '../services/expense.service.js';

/**
 * @desc    Create a new expense for a trip
 * @route   POST /api/trips/:tripId/expenses
 * @access  Private (Trip Members & Owner)
 */
export const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(
    req.params.tripId,
    req.user._id,
    req.body
  );
  res
    .status(201)
    .json(new ApiResponse(201, expense, 'Expense recorded successfully'));
});

/**
 * @desc    Get all expenses for a trip (filtered, sorted, paginated)
 * @route   GET /api/trips/:tripId/expenses
 * @access  Private (Trip Members & Owner)
 */
export const getTripExpenses = asyncHandler(async (req, res) => {
  const result = await expenseService.getTripExpenses(
    req.params.tripId,
    req.query
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, 'Trip expenses retrieved successfully'));
});

/**
 * @desc    Get expense details by ID
 * @route   GET /api/trips/:tripId/expenses/:expenseId
 * @access  Private (Trip Members & Owner)
 */
export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpenseById(
    req.params.tripId,
    req.params.expenseId
  );
  res
    .status(200)
    .json(new ApiResponse(200, expense, 'Expense details retrieved successfully'));
});

/**
 * @desc    Update an expense
 * @route   PATCH /api/trips/:tripId/expenses/:expenseId
 * @access  Private (Payer, Trip Admin, or Owner)
 */
export const updateExpense = asyncHandler(async (req, res) => {
  const updatedExpense = await expenseService.updateExpense(
    req.params.tripId,
    req.params.expenseId,
    req.user._id.toString(),
    req.tripRole,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, updatedExpense, 'Expense updated successfully'));
});

/**
 * @desc    Delete an expense
 * @route   DELETE /api/trips/:tripId/expenses/:expenseId
 * @access  Private (Payer, Trip Admin, or Owner)
 */
export const deleteExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.deleteExpense(
    req.params.tripId,
    req.params.expenseId,
    req.user._id.toString(),
    req.tripRole
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, 'Expense deleted successfully'));
});

/**
 * @desc    Get real-time trip budget tracking and remaining balance
 * @route   GET /api/trips/:tripId/budget
 * @access  Private (Trip Members & Owner)
 */
export const getTripBudget = asyncHandler(async (req, res) => {
  const budgetStats = await expenseService.getTripBudgetTracking(
    req.params.tripId
  );
  res
    .status(200)
    .json(new ApiResponse(200, budgetStats, 'Trip budget retrieved successfully'));
});

/**
 * @desc    Get category-wise breakdown & per-person expense analytics
 * @route   GET /api/trips/:tripId/expenses/analytics
 * @access  Private (Trip Members & Owner)
 */
export const getExpenseAnalytics = asyncHandler(async (req, res) => {
  const analytics = await expenseService.getExpenseAnalytics(req.params.tripId);
  res
    .status(200)
    .json(new ApiResponse(200, analytics, 'Expense analytics generated successfully'));
});

/**
 * @desc    Calculate multi-party debt settlements
 * @route   GET /api/trips/:tripId/expenses/settlements
 * @access  Private (Trip Members & Owner)
 */
export const getExpenseSettlements = asyncHandler(async (req, res) => {
  const settlements = await expenseService.calculateSettlements(
    req.params.tripId
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, settlements, 'Settlement suggestions calculated successfully')
    );
});

export default {
  createExpense,
  getTripExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getTripBudget,
  getExpenseAnalytics,
  getExpenseSettlements,
};

