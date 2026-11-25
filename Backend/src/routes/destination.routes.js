import { Router } from 'express';
import {
  getDestinations,
  searchDestinations,
  getDestinationById,
} from '../controllers/destination.controller.js';
import {
  validateDestinationQuery,
  validateDestinationSearch,
} from '../validators/destination.validator.js';

const router = Router();

// GET /api/destinations/search (Declared BEFORE /:destinationId)
router.get('/search', validateDestinationSearch, searchDestinations);

// GET /api/destinations
router.get('/', validateDestinationQuery, getDestinations);

// GET /api/destinations/:destinationId
router.get('/:destinationId', getDestinationById);

export default router;

