import mongoose from 'mongoose';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { Itinerary } from '../models/Itinerary.js';
import { PackingList } from '../models/PackingList.js';
import { Expense } from '../models/Expense.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import {
  escapeRegex,
  parsePagination,
  buildPaginationMeta,
} from '../utils/queryHelpers.js';
import * as notificationService from './notification.service.js';

const ALLOWED_TRIP_FIELDS = [
  'title',
  'destination',
  'origin',
  'startDate',
  'endDate',
  'travelers',
  'budget',
  'currency',
  'status',
  'coverImage',
  'description',
];

const ALLOWED_ITINERARY_FIELDS = ['date', 'dayNumber', 'notes', 'activities'];

const pickFields = (source = {}, allowed = []) => {
  const result = {};
  for (const key of allowed) {
    if (source[key] !== undefined) result[key] = source[key];
  }
  return result;
};

/**
 * Create a new Trip and assign the creator as the Owner member
 */
export const createTrip = async (userId, tripData) => {
  const safeTripData = pickFields(tripData, ALLOWED_TRIP_FIELDS);

  // Create trip (owner strictly bound to authenticated creator)
  const trip = await Trip.create({
    ...safeTripData,
    owner: userId,
  });

  try {
    // Automatically register owner in TripMember
    await TripMember.create({
      tripId: trip._id,
      userId,
      role: 'owner',
      invitationStatus: 'accepted',
    });

    // Initialize an empty default packing list for the trip
    await PackingList.create({
      tripId: trip._id,
      items: [],
    });

    return trip;
  } catch (error) {
    // Clean up if secondary document creation fails
    await Trip.findByIdAndDelete(trip._id);
    await TripMember.deleteMany({ tripId: trip._id });
    await PackingList.deleteMany({ tripId: trip._id });
    throw error;
  }
};

/**
 * Retrieve paginated trips for the authenticated user (owned or accepted member)
 */
export const getUserTrips = async (userId, queryParams = {}) => {
  const { status, search, sort = 'asc' } = queryParams;
  const { page, limit, skip } = parsePagination(queryParams, {
    defaultLimit: 10,
    maxLimit: 100,
  });

  // Find all trips where user is an accepted member
  const memberships = await TripMember.find({
    userId,
    invitationStatus: 'accepted',
  }).select('tripId');

  const memberTripIds = memberships.map((m) => m.tripId);

  // Filter criteria: owner OR accepted member
  const filter = {
    $or: [{ owner: userId }, { _id: { $in: memberTripIds } }],
  };

  if (status) {
    filter.status = status;
  }

  if (search && String(search).trim().length > 0) {
    const searchRegex = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$and = [
      {
        $or: [
          { title: searchRegex },
          { destination: searchRegex },
          { origin: searchRegex },
        ],
      },
    ];
  }

  // Sort by departure date
  const sortDirection = sort === 'desc' ? -1 : 1;
  const sortOption = { startDate: sortDirection };

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .populate('owner', 'name email profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Trip.countDocuments(filter),
  ]);

  return {
    trips,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Get comprehensive trip details including owner, members, and itinerary count
 */
export const getTripById = async (tripId) => {
  const trip = await Trip.findById(tripId).populate('owner', 'name email profileImage');
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const [members, itineraryCount] = await Promise.all([
    TripMember.find({ tripId }).populate('userId', 'name email profileImage'),
    Itinerary.countDocuments({ tripId }),
  ]);

  return {
    ...trip.toObject(),
    members,
    totalItineraryDays: itineraryCount,
  };
};

/**
 * Update trip details with date-range validation and strict field whitelisting
 */
export const updateTrip = async (tripId, updateData) => {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const safeUpdate = pickFields(updateData, ALLOWED_TRIP_FIELDS);

  // Guard date ranges if only one date is updated
  const newStartDate = safeUpdate.startDate ? new Date(safeUpdate.startDate) : trip.startDate;
  const newEndDate = safeUpdate.endDate ? new Date(safeUpdate.endDate) : trip.endDate;

  if (newEndDate < newStartDate) {
    throw new ApiError(400, 'End date must be on or after the start date');
  }

  Object.assign(trip, safeUpdate);
  await trip.save();

  return trip;
};

/**
 * Delete a trip with cascading cleanup of all related resources
 */
export const deleteTrip = async (tripId) => {
  const trip = await Trip.findByIdAndDelete(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  await Promise.all([
    TripMember.deleteMany({ tripId }),
    Itinerary.deleteMany({ tripId }),
    PackingList.deleteMany({ tripId }),
    Expense.deleteMany({ tripId }),
    Notification.deleteMany({ relatedTrip: tripId }),
  ]);

  return { message: 'Trip and all associated resources deleted successfully' };
};

/**
 * Invite a member to a trip by email or userId (creates a pending invitation)
 */
export const addTripMember = async (
  tripId,
  requesterId,
  { email, userId, role = 'viewer' },
  requesterName = ''
) => {
  let targetUser;

  if (email) {
    targetUser = await User.findOne({ email: email.toLowerCase().trim() });
  } else if (userId) {
    targetUser = await User.findById(userId);
  }

  if (!targetUser) {
    throw new ApiError(404, 'User to be invited was not found');
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  // Prevent adding trip owner
  if (trip.owner.toString() === targetUser._id.toString()) {
    throw new ApiError(400, 'This user is already the owner of the trip');
  }

  // Check existing membership / invitation
  const existingMember = await TripMember.findOne({
    tripId,
    userId: targetUser._id,
  });

  let memberDoc;
  if (existingMember) {
    if (existingMember.invitationStatus === 'accepted') {
      throw new ApiError(409, 'User is already an active member of this trip');
    }
    if (existingMember.invitationStatus === 'pending') {
      throw new ApiError(409, 'An invitation is already pending for this user');
    }
    // Re-invite a user who previously rejected
    existingMember.role = role;
    existingMember.invitationStatus = 'pending';
    await existingMember.save();
    memberDoc = existingMember;
  } else {
    memberDoc = await TripMember.create({
      tripId,
      userId: targetUser._id,
      role,
      invitationStatus: 'pending',
    });
  }

  // Dispatch scalable in-app invitation notification
  await notificationService.sendTripInvitationNotification({
    inviteeUserId: targetUser._id,
    inviterName: requesterName,
    tripId: trip._id,
    tripTitle: trip.title,
    role,
  });

  return memberDoc.populate('userId', 'name email profileImage');
};

/**
 * List trip invitations for the logged-in user (default: pending)
 */
export const getUserInvitations = async (userId, queryParams = {}) => {
  const { status = 'pending' } = queryParams;
  const { page, limit, skip } = parsePagination(queryParams, {
    defaultLimit: 10,
    maxLimit: 50,
  });

  const filter = { userId, role: { $ne: 'owner' } };
  if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
    filter.invitationStatus = status;
  }

  const [invitations, total] = await Promise.all([
    TripMember.find(filter)
      .populate({
        path: 'tripId',
        select: 'title destination startDate endDate status coverImage owner',
        populate: { path: 'owner', select: 'name email profileImage' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    TripMember.countDocuments(filter),
  ]);

  return {
    invitations,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Accept or reject a pending trip invitation
 */
export const respondToInvitation = async (tripId, userId, responderName, status) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw new ApiError(400, 'Invalid Trip ID format');
  }

  const membership = await TripMember.findOne({ tripId, userId });
  if (!membership) {
    throw new ApiError(404, 'No invitation found for this trip');
  }

  if (membership.role === 'owner') {
    throw new ApiError(400, 'Trip owner does not have a pending invitation');
  }

  if (membership.invitationStatus !== 'pending') {
    throw new ApiError(
      400,
      `Invitation has already been ${membership.invitationStatus}`
    );
  }

  membership.invitationStatus = status;
  await membership.save();

  const trip = await Trip.findById(tripId).select('owner title');
  if (trip) {
    await notificationService.sendInvitationResponseNotification({
      ownerId: trip.owner,
      responderName,
      tripId: trip._id,
      tripTitle: trip.title,
      status,
    });
  }

  return membership.populate([
    { path: 'userId', select: 'name email profileImage' },
    { path: 'tripId', select: 'title destination startDate endDate status' },
  ]);
};

/**
 * Update a trip member's role (RBAC: owner can set admin/editor/viewer; admin can set editor/viewer)
 */
export const updateMemberRole = async (
  tripId,
  memberRecordId,
  requesterRole,
  newRole
) => {
  const member = await TripMember.findById(memberRecordId);
  if (!member || member.tripId.toString() !== tripId.toString()) {
    throw new ApiError(404, 'Trip member record not found');
  }

  if (member.role === 'owner') {
    throw new ApiError(400, 'Cannot modify the role of the trip owner');
  }

  if (requesterRole !== 'owner') {
    if (requesterRole !== 'admin' || member.role === 'admin' || newRole === 'admin') {
      throw new ApiError(
        403,
        'Permission denied. Only the trip owner can assign or modify admin roles.'
      );
    }
  }

  member.role = newRole;
  await member.save();

  const trip = await Trip.findById(tripId).select('title');
  if (trip) {
    await notificationService.sendRoleUpdateNotification({
      targetUserId: member.userId,
      tripId: trip._id,
      tripTitle: trip.title,
      newRole,
    });
  }

  return member.populate('userId', 'name email profileImage');
};

/**
 * Retrieve all members of a trip
 */
export const getTripMembers = async (tripId) => {
  return TripMember.find({ tripId }).populate('userId', 'name email profileImage');
};

/**
 * Remove a member from a trip
 */
export const removeTripMember = async (tripId, memberRecordId, requesterId, requesterRole) => {
  if (!mongoose.Types.ObjectId.isValid(memberRecordId)) {
    throw new ApiError(400, 'Invalid member ID format');
  }

  const member = await TripMember.findById(memberRecordId);
  if (!member || member.tripId.toString() !== tripId.toString()) {
    throw new ApiError(404, 'Trip member record not found');
  }

  if (member.role === 'owner') {
    throw new ApiError(400, 'The trip owner cannot be removed from the trip');
  }

  const isSelf = member.userId.toString() === requesterId.toString();

  // Permissions check:
  // - User can remove themselves (leave trip)
  // - Owner can remove anyone
  // - Admin can remove editors and viewers
  if (!isSelf && requesterRole !== 'owner') {
    if (requesterRole !== 'admin' || member.role === 'admin') {
      throw new ApiError(
        403,
        'Permission denied. You cannot remove this member from the trip.'
      );
    }
  }

  await TripMember.findByIdAndDelete(memberRecordId);

  return { message: 'Member removed from trip successfully' };
};

/**
 * Create or append a daily itinerary with activities
 */
export const createItinerary = async (tripId, itineraryData, actor = null) => {
  const { dayNumber, date, notes, activities } = itineraryData;

  const existing = await Itinerary.findOne({ tripId, dayNumber });
  if (existing) {
    throw new ApiError(
      409,
      `Itinerary for Day ${dayNumber} already exists. Please update the existing day.`
    );
  }

  const itinerary = await Itinerary.create({
    tripId,
    date,
    dayNumber,
    notes: notes || '',
    activities: activities || [],
  });

  if (actor) {
    const trip = await Trip.findById(tripId).select('title');
    if (trip) {
      await notificationService.sendItineraryUpdateNotification({
        tripId,
        tripTitle: trip.title,
        actorId: actor._id,
        actorName: actor.name,
        dayNumber,
        action: 'added',
      });
    }
  }

  return itinerary;
};

/**
 * Get all itineraries for a trip sorted by day number
 */
export const getTripItineraries = async (tripId) => {
  return Itinerary.find({ tripId }).sort({ dayNumber: 1 });
};

/**
 * Update an existing itinerary day
 */
export const updateItinerary = async (tripId, itineraryId, updateData, actor = null) => {
  if (!mongoose.Types.ObjectId.isValid(itineraryId)) {
    throw new ApiError(400, 'Invalid itinerary ID format');
  }

  const itinerary = await Itinerary.findOne({ _id: itineraryId, tripId });
  if (!itinerary) {
    throw new ApiError(404, 'Itinerary day not found');
  }

  const safeUpdate = pickFields(updateData, ALLOWED_ITINERARY_FIELDS);

  if (safeUpdate.dayNumber && safeUpdate.dayNumber !== itinerary.dayNumber) {
    const duplicate = await Itinerary.findOne({
      tripId,
      dayNumber: safeUpdate.dayNumber,
      _id: { $ne: itineraryId },
    });
    if (duplicate) {
      throw new ApiError(
        409,
        `Day ${safeUpdate.dayNumber} already exists for this trip.`
      );
    }
  }

  Object.assign(itinerary, safeUpdate);
  await itinerary.save();

  if (actor) {
    const trip = await Trip.findById(tripId).select('title');
    if (trip) {
      await notificationService.sendItineraryUpdateNotification({
        tripId,
        tripTitle: trip.title,
        actorId: actor._id,
        actorName: actor.name,
        dayNumber: itinerary.dayNumber,
        action: 'updated',
      });
    }
  }

  return itinerary;
};

/**
 * Delete an itinerary day
 */
export const deleteItinerary = async (tripId, itineraryId) => {
  if (!mongoose.Types.ObjectId.isValid(itineraryId)) {
    throw new ApiError(400, 'Invalid itinerary ID format');
  }

  const result = await Itinerary.findOneAndDelete({ _id: itineraryId, tripId });
  if (!result) {
    throw new ApiError(404, 'Itinerary day not found');
  }

  return { message: 'Itinerary day deleted successfully' };
};

export default {
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
};
