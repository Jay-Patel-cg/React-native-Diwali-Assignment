import { Router } from 'express';
import {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  addTripMember,
  getUserInvitations,
  respondToInvitation,
  updateMemberRole,
  getTripMembers,
  removeTripMember,
  createItinerary,
  getTripItineraries,
  updateItinerary,
  deleteItinerary,
} from '../controllers/trip.controller.js';
import { getTripBudget } from '../controllers/expense.controller.js';
import expenseRoutes from './expense.routes.js';
import packingListRoutes from './packingList.routes.js';
import { protect } from '../middleware/auth.middleware.js';
import { checkTripAccess } from '../middleware/tripAuth.middleware.js';
import {
  validateCreateTrip,
  validateUpdateTrip,
  validateAddMember,
  validateInvitationResponse,
  validateUpdateMemberRole,
  validateItinerary,
  validateUpdateItinerary,
} from '../validators/trip.validator.js';

const router = Router();

// Protect all trip routes by default
router.use(protect);

// ==========================================
// 0. User Trip Invitations (Declared BEFORE /:tripId)
// ==========================================
router.get('/invitations', getUserInvitations);

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
// 2. Trip Collaboration & Members Management
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

// Invited user accepts or rejects their own pending invitation (BEFORE /:memberId)
router.patch(
  '/:tripId/members/respond',
  validateInvitationResponse,
  respondToInvitation
);

// Owner/Admin updates a member's role
router.patch(
  '/:tripId/members/:memberId/role',
  checkTripAccess(['owner', 'admin']),
  validateUpdateMemberRole,
  updateMemberRole
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

// ==========================================
// 6. Trip Packing List Sub-router
// Mounted at: /api/trips/:tripId/packing-list
// ==========================================
router.use('/:tripId/packing-list', packingListRoutes);

export default router;
