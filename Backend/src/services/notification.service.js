import { Notification } from '../models/Notification.js';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination, buildPaginationMeta } from '../utils/queryHelpers.js';

/**
 * Push notification dispatch hook.
 * Intentionally does NOT fake push delivery.
 * When Expo Push Notifications are connected later, this hook will dispatch
 * to Expo Push Service using stored user Expo push tokens via expo-server-sdk.
 */
const evaluatePushChannelStatus = () => {
  return {
    pushDeliveryStatus: 'not_configured',
    pushDispatched: false,
  };
};

/**
 * Create a single persisted in-app notification for a user.
 * Respects user notification preferences.
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  relatedTrip = null,
  metadata = {},
}) => {
  const recipient = await User.findById(userId).select('preferences');
  if (!recipient) return null;

  if (recipient.preferences?.notificationsEnabled === false) {
    return null;
  }

  const { pushDeliveryStatus } = evaluatePushChannelStatus();

  return Notification.create({
    userId,
    title: String(title).trim().slice(0, 120),
    message: String(message).trim().slice(0, 500),
    type,
    relatedTrip,
    channel: 'in_app',
    pushDeliveryStatus,
    metadata,
  });
};

/**
 * Scalable bulk fan-out to all accepted members (and owner) of a trip,
 * excluding the actor who triggered the event.
 */
export const notifyTripMembers = async ({
  tripId,
  excludeUserId = null,
  title,
  message,
  type = 'trip_update',
  metadata = {},
}) => {
  const [trip, members] = await Promise.all([
    Trip.findById(tripId).select('owner title'),
    TripMember.find({ tripId, invitationStatus: 'accepted' }).select('userId'),
  ]);

  if (!trip) return [];

  const recipientIdSet = new Set();
  recipientIdSet.add(trip.owner.toString());
  members.forEach((m) => recipientIdSet.add(m.userId.toString()));

  if (excludeUserId) {
    recipientIdSet.delete(excludeUserId.toString());
  }

  const candidateIds = Array.from(recipientIdSet);
  if (candidateIds.length === 0) return [];

  // Filter out users who have explicitly disabled notifications
  const optedInUsers = await User.find({
    _id: { $in: candidateIds },
    'preferences.notificationsEnabled': { $ne: false },
  }).select('_id');

  if (optedInUsers.length === 0) return [];

  const { pushDeliveryStatus } = evaluatePushChannelStatus();

  const docs = optedInUsers.map((u) => ({
    userId: u._id,
    title: String(title).trim().slice(0, 120),
    message: String(message).trim().slice(0, 500),
    type,
    relatedTrip: trip._id,
    channel: 'in_app',
    pushDeliveryStatus,
    metadata,
  }));

  return Notification.insertMany(docs);
};

// ==========================================
// Domain-Specific Notification Triggers
// ==========================================

export const sendTripInvitationNotification = async ({
  inviteeUserId,
  inviterName,
  tripId,
  tripTitle,
  role,
}) => {
  return createNotification({
    userId: inviteeUserId,
    title: 'Trip Invitation',
    message: `${inviterName || 'A traveler'} invited you to join '${tripTitle}' as ${role}. Accept or reject the invitation in your Trips tab.`,
    type: 'trip_invitation',
    relatedTrip: tripId,
    metadata: { role, invitationStatus: 'pending' },
  });
};

export const sendInvitationResponseNotification = async ({
  ownerId,
  responderName,
  tripId,
  tripTitle,
  status,
}) => {
  return createNotification({
    userId: ownerId,
    title: `Invitation ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
    message: `${responderName || 'An invited user'} has ${status} your invitation to '${tripTitle}'.`,
    type: 'invitation_response',
    relatedTrip: tripId,
    metadata: { status },
  });
};

export const sendRoleUpdateNotification = async ({
  targetUserId,
  tripId,
  tripTitle,
  newRole,
}) => {
  return createNotification({
    userId: targetUserId,
    title: 'Trip Role Updated',
    message: `Your role on '${tripTitle}' has been updated to '${newRole}'.`,
    type: 'role_updated',
    relatedTrip: tripId,
    metadata: { newRole },
  });
};

export const sendItineraryUpdateNotification = async ({
  tripId,
  tripTitle,
  actorId,
  actorName,
  dayNumber,
  action = 'updated',
}) => {
  return notifyTripMembers({
    tripId,
    excludeUserId: actorId,
    title: 'Itinerary Updated',
    message: `${actorName || 'A trip member'} ${action} Day ${dayNumber} of the itinerary for '${tripTitle}'.`,
    type: 'itinerary_update',
    metadata: { dayNumber, action },
  });
};

export const sendExpenseUpdateNotification = async ({
  tripId,
  tripTitle,
  actorId,
  actorName,
  expenseTitle,
  amount,
  currency = 'INR',
  action = 'added',
}) => {
  const type = action === 'added' ? 'expense_added' : 'expense_updated';
  return notifyTripMembers({
    tripId,
    excludeUserId: actorId,
    title: action === 'added' ? 'New Trip Expense' : 'Trip Expense Updated',
    message: `${actorName || 'A trip member'} ${action} expense '${expenseTitle}' (${currency} ${amount}) in '${tripTitle}'.`,
    type,
    metadata: { expenseTitle, amount, currency, action },
  });
};

/**
 * Generates idempotent upcoming trip reminder notifications for a user
 * for trips starting within the next `daysAhead` days (default: 7 days).
 */
export const generateUpcomingTripReminders = async (userId, daysAhead = 7) => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const memberships = await TripMember.find({
    userId,
    invitationStatus: 'accepted',
  }).select('tripId');

  const memberTripIds = memberships.map((m) => m.tripId);

  const upcomingTrips = await Trip.find({
    $or: [{ owner: userId }, { _id: { $in: memberTripIds } }],
    status: { $in: ['planning', 'active'] },
    startDate: { $gte: now, $lte: windowEnd },
  }).select('_id title destination startDate');

  const created = [];
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const trip of upcomingTrips) {
    // Avoid sending duplicate reminders for the same trip on the same day
    const alreadySentToday = await Notification.exists({
      userId,
      relatedTrip: trip._id,
      type: 'trip_reminder',
      createdAt: { $gte: startOfToday },
    });

    if (alreadySentToday) continue;

    const daysUntil = Math.max(
      0,
      Math.ceil((new Date(trip.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const notif = await createNotification({
      userId,
      title: `Upcoming Trip Reminder: ${trip.title}`,
      message: `Your trip to ${trip.destination} starts in ${daysUntil} day${
        daysUntil === 1 ? '' : 's'
      }. Review your packing list and itinerary!`,
      type: 'trip_reminder',
      relatedTrip: trip._id,
      metadata: { daysUntil, startDate: trip.startDate },
    });

    if (notif) created.push(notif);
  }

  return created;
};

// ==========================================
// User Notification Inbox Queries & Mutations
// ==========================================

/**
 * Get paginated notifications for the logged-in user along with unread badge count.
 */
export const getUserNotifications = async (userId, queryParams = {}) => {
  const { isRead, type, relatedTrip } = queryParams;
  const { page, limit, skip } = parsePagination(queryParams, {
    defaultLimit: 20,
    maxLimit: 100,
  });

  const filter = { userId };

  if (isRead !== undefined) {
    filter.isRead = isRead === 'true' || isRead === true;
  }

  if (type) {
    filter.type = String(type);
  }

  if (relatedTrip) {
    filter.relatedTrip = relatedTrip;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('relatedTrip', 'title destination startDate endDate status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Mark a single notification as read (verifies recipient ownership).
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    userId,
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

/**
 * Mark all unread notifications for the logged-in user as read.
 */
export const markAllNotificationsAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return {
    markedAsReadCount: result.modifiedCount || 0,
  };
};

export default {
  createNotification,
  notifyTripMembers,
  sendTripInvitationNotification,
  sendInvitationResponseNotification,
  sendRoleUpdateNotification,
  sendItineraryUpdateNotification,
  sendExpenseUpdateNotification,
  generateUpcomingTripReminders,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};

