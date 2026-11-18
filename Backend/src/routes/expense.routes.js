import { Router } from 'express';
import {
  createExpense,
  getTripExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseAnalytics,
  getExpenseSettlements,
} from '../controllers/expense.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { checkTripAccess } from '../middleware/tripAuth.middleware.js';
import {
  validateCreateExpense,
  validateUpdateExpense,
} from '../validators/expense.validator.js';

// Enable mergeParams to inherit :tripId from parent router
const router = Router({ mergeParams: true });

// Require authentication for all expense routes
router.use(protect);

// Require at least viewer access to the trip
router.use(checkTripAccess(['owner', 'admin', 'editor', 'viewer']));

// ==========================================
// 1. Static/Aggregated Sub-routes (Placed BEFORE /:expenseId)
// ==========================================
router.get('/analytics', getExpenseAnalytics);
router.get('/settlements', getExpenseSettlements);

// ==========================================
// 2. Collection Route: /api/trips/:tripId/expenses
// ==========================================
router
  .route('/')
  .post(validateCreateExpense, createExpense)
  .get(getTripExpenses);

// ==========================================
// 3. Document Route: /api/trips/:tripId/expenses/:expenseId
// ==========================================
router
  .route('/:expenseId')
  .get(getExpenseById)
  .patch(validateUpdateExpense, updateExpense)
  .delete(deleteExpense);

export default router;

