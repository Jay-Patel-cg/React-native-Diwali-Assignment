import mongoose from 'mongoose';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Middleware factory for Role-Based Access Control on Trip resources.
 * Validates trip existence, calculates user's role on the trip, and verifies permissions.
 *
 * @param {Array<string>} allowedRoles - Roles permitted to perform the action ('owner', 'admin', 'editor', 'viewer')
 */
export const checkTripAccess = (allowedRoles = ['owner', 'admin', 'editor', 'viewer']) => {
  return asyncHandler(async (req, res, next) => {
    const { tripId } = req.params;

    if (!tripId || !mongoose.Types.ObjectId.isValid(tripId)) {
      throw new ApiError(400, 'Invalid Trip ID format');
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new ApiError(404, 'Trip not found');
    }

    const userId = req.user._id.toString();
    const isOwner = trip.owner.toString() === userId;

    let userRole = null;

    if (isOwner) {
      userRole = 'owner';
    } else {
      // Check membership
      const membership = await TripMember.findOne({
        tripId: trip._id,
        userId: req.user._id,
        invitationStatus: 'accepted',
      });

      if (membership) {
        userRole = membership.role;
      }
    }

    if (!userRole) {
      throw new ApiError(
        403,
        'Access denied. You are not a member of this trip.'
      );
    }

    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(
        403,
        `Permission denied. This action requires one of the following roles: [${allowedRoles.join(
          ', '
        )}]. Your current role is '${userRole}'.`
      );
    }

    // Attach verified trip and user role to request for downstream handlers
    req.trip = trip;
    req.tripRole = userRole;

    next();
  });
};

export default checkTripAccess;

