import { Router } from 'express';
import {
  planTrip,
  generateItinerary,
  recommendDestinations,
  budgetSuggestions,
  chat,
  optimizeItinerary,
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.middleware.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import {
  guardPromptInjection,
  validatePlanTrip,
  validateGenerateItinerary,
  validateRecommendDestinations,
  validateBudgetSuggestions,
  validateChat,
  validateOptimizeItinerary,
} from '../validators/aiValidators.js';

const router = Router();

// All AI Travel Copilot endpoints require JWT authentication,
// per-user rate limiting, and prompt-injection screening.
router.use(protect);
router.use(aiRateLimiter);
router.use(guardPromptInjection);

router.post('/plan-trip', validatePlanTrip, planTrip);
router.post('/generate-itinerary', validateGenerateItinerary, generateItinerary);
router.post(
  '/recommend-destinations',
  validateRecommendDestinations,
  recommendDestinations
);
router.post(
  '/budget-suggestions',
  validateBudgetSuggestions,
  budgetSuggestions
);
router.post('/chat', validateChat, chat);
router.post('/optimize-itinerary', validateOptimizeItinerary, optimizeItinerary);

export default router;

