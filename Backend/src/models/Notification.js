import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'trip_invitation',
  'invitation_response',
  'role_updated',
  'trip_reminder',
  'trip_update',
  'expense_added',
  'expense_updated',
  'expense_settled',
  'itinerary_update',
  'packing_list_update',
  'system',
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [120, 'Notification title cannot exceed 120 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Notification message cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: '{VALUE} is not a valid notification type',
      },
      default: 'system',
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    relatedTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
      index: true,
    },
    channel: {
      type: String,
      enum: ['in_app'],
      default: 'in_app',
    },
    pushDeliveryStatus: {
      type: String,
      enum: ['not_configured', 'skipped', 'queued', 'sent', 'failed'],
      default: 'not_configured',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-throughput notification inbox and unread badge queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
