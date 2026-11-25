import { Router } from 'express';
import {
  createOrAddPackingItems,
  getPackingList,
  updatePackingItem,
  deletePackingItem,
} from '../controllers/packingList.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { checkTripAccess } from '../middleware/tripAuth.middleware.js';
import {
  validateAddPackingItems,
  validateUpdatePackingItem,
  validatePackingItemId,
} from '../validators/packingList.validator.js';

const router = Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .post(
    checkTripAccess(['owner', 'admin', 'editor']),
    validateAddPackingItems,
    createOrAddPackingItems
  )
  .get(
    checkTripAccess(['owner', 'admin', 'editor', 'viewer']),
    getPackingList
  );

router
  .route('/:itemId')
  .patch(
    checkTripAccess(['owner', 'admin', 'editor']),
    validateUpdatePackingItem,
    updatePackingItem
  )
  .delete(
    checkTripAccess(['owner', 'admin', 'editor']),
    validatePackingItemId,
    deletePackingItem
  );

export default router;

