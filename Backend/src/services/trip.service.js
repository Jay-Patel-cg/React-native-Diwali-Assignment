import mongoose from 'mongoose';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { Itinerary } from '../models/Itinerary.js';
import { PackingList } from '../models/PackingList.js';
import { Expense } from '../models/Expense.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Create a new Trip and assign the creator as the Owner member
 */
export const createTrip = async (userId, tripData) => {
  // Create trip
  const trip = await Trip.create({
    ...tripData,
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
  const { page = 1, limit = 10, status, search, sort = 'asc' } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

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

  if (search && search.trim().length > 0) {
    const searchRegex = new RegExp(search.trim(), 'i');
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
      .limit(limitNum),
    Trip.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    trips,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
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
 * Update trip details with date-range validation
 */
export const updateTrip = async (tripId, updateData) => {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  // Guard date ranges if only one date is updated
  const newStartDate = updateData.startDate ? new Date(updateData.startDate) : trip.startDate;
  const newEndDate = updateData.endDate ? new Date(updateData.endDate) : trip.endDate;

  if (newEndDate < newStartDate) {
    throw new ApiError(400, 'End date must be on or after the start date');
  }

  Object.assign(trip, updateData);
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
  ]);

  return { message: 'Trip and all associated resources deleted successfully' };
};

/**
 * Add a member to a trip by email or userId
 */
export const addTripMember = async (tripId, requesterId, { email, userId, role = 'viewer' }) => {
  let targetUser;

  if (email) {
    targetUser = await User.findOne({ email: email.toLowerCase().trim() });
  } else if (userId) {
    targetUser = await User.findById(userId);
  }

  if (!targetUser) {
    throw new ApiError(404, 'User to be added was not found');
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  // Prevent adding trip owner
  if (trip.owner.toString() === targetUser._id.toString()) {
    throw new ApiError(400, 'This user is already the owner of the trip');
  }

  // Check existing membership
  const existingMember = await TripMember.findOne({
    tripId,
    userId: targetUser._id,
  });

  if (existingMember) {
    throw new ApiError(409, 'User is already a member of this trip');
  }

  const newMember = await TripMember.create({
    tripId,
    userId: targetUser._id,
    role,
    invitationStatus: 'accepted',
  });

  // Create in-app notification for the newly added member
  await Notification.create({
    userId: targetUser._id,
    title: 'Added to Trip',
    message: `You were added to the trip '${trip.title}' as a ${role}.`,
    type: 'trip_invitation',
    relatedTrip: trip._id,
  });

  return newMember.populate('userId', 'name email profileImage');
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
export const createItinerary = async (tripId, itineraryData) => {
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
export const updateItinerary = async (tripId, itineraryId, updateData) => {
  const itinerary = await Itinerary.findOne({ _id: itineraryId, tripId });
  if (!itinerary) {
    throw new ApiError(404, 'Itinerary day not found');
  }

  if (updateData.dayNumber && updateData.dayNumber !== itinerary.dayNumber) {
    const duplicate = await Itinerary.findOne({
      tripId,
      dayNumber: updateData.dayNumber,
      _id: { $ne: itineraryId },
    });
    if (duplicate) {
      throw new ApiError(
        409,
        `Day ${updateData.dayNumber} already exists for this trip.`
      );
    }
  }

  Object.assign(itinerary, updateData);
  await itinerary.save();

  return itinerary;
};

/**
 * Delete an itinerary day
 */
export const deleteItinerary = async (tripId, itineraryId) => {
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
  getTripMembers,
  removeTripMember,
  createItinerary,
  getTripItineraries,
  updateItinerary,
  deleteItinerary,
};
