import { Router } from 'express';
import {
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
} from '../controllers/trip.controller.js';
import { getTripBudget } from '../controllers/expense.controller.js';
import expenseRoutes from './expense.routes.js';
import { protect } from '../middleware/auth.middleware.js';
import { checkTripAccess } from '../middleware/tripAuth.middleware.js';
import {
  validateCreateTrip,
  validateUpdateTrip,
  validateAddMember,
  validateItinerary,
  validateUpdateItinerary,
} from '../validators/trip.validator.js';

const router = Router();

// Protect all trip routes by default
router.use(protect);

// ==========================================
// 1. Core Trip CRUD
// ==========================================
router
  .route('/')
  .post(validateCreateTrip, createTrip)
  .get(getUserTrips);

router
  .route('/:tripId')
  .get(checkTripAccess(['owner', 'admin', 'editor', 'viewer']), getTripById)
  .patch(
    checkTripAccess(['owner', 'admin']),
    validateUpdateTrip,
    updateTrip
  )
  .delete(checkTripAccess(['owner']), deleteTrip);

// ==========================================
// 2. Trip Members Management
// ==========================================
router
  .route('/:tripId/members')
  .post(
    checkTripAccess(['owner', 'admin']),
    validateAddMember,
    addTripMember
  )
  .get(
    checkTripAccess(['owner', 'admin', 'editor', 'viewer']),
    getTripMembers
  );

router
  .route('/:tripId/members/:memberId')
  .delete(
    checkTripAccess(['owner', 'admin', 'editor', 'viewer']),
    removeTripMember
  );

// ==========================================
// 3. Trip Itinerary & Daily Activities
// ==========================================
router
  .route('/:tripId/itinerary')
  .post(
    checkTripAccess(['owner', 'admin', 'editor']),
    validateItinerary,
    createItinerary
  )
  .get(
    checkTripAccess(['owner', 'admin', 'editor', 'viewer']),
    getTripItineraries
  );

router
  .route('/:tripId/itinerary/:itineraryId')
  .patch(
    checkTripAccess(['owner', 'admin', 'editor']),
    validateUpdateItinerary,
    updateItinerary
  )
  .delete(
    checkTripAccess(['owner', 'admin', 'editor']),
    deleteItinerary
  );

// ==========================================
// 4. Trip Budget Tracking: /api/trips/:tripId/budget
// ==========================================
router.get(
  '/:tripId/budget',
  checkTripAccess(['owner', 'admin', 'editor', 'viewer']),
  getTripBudget
);

// ==========================================
// 5. Trip Expense Management Sub-router
// Mounted at: /api/trips/:tripId/expenses
// ==========================================
router.use('/:tripId/expenses', expenseRoutes);

export default router;
