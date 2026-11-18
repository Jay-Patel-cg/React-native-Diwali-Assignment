import mongoose from 'mongoose';

const tripMemberSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    role: {
      type: String,
      enum: {
        values: ['owner', 'admin', 'editor', 'viewer'],
        message: '{VALUE} is not a valid member role',
      },
      default: 'viewer',
    },
    invitationStatus: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected'],
        message: '{VALUE} is not a valid invitation status',
      },
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: a user can only be a member of a trip once
tripMemberSchema.index({ tripId: 1, userId: 1 }, { unique: true });
tripMemberSchema.index({ userId: 1, invitationStatus: 1 });

export const TripMember = mongoose.model('TripMember', tripMemberSchema);
export default TripMember;

