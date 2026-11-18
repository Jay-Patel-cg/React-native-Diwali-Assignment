import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
      maxlength: [120, 'Activity title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Activity description cannot exceed 1000 characters'],
      default: '',
    },
    startTime: {
      type: String,
      trim: true,
      default: '', // e.g. "09:00 AM" or "09:00"
    },
    endTime: {
      type: String,
      trim: true,
      default: '', // e.g. "11:30 AM" or "11:30"
    },
    location: {
      name: {
        type: String,
        trim: true,
        default: '',
      },
      address: {
        type: String,
        trim: true,
        default: '',
      },
      coordinates: {
        latitude: {
          type: Number,
          default: null,
        },
        longitude: {
          type: Number,
          default: null,
        },
      },
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: [0, 'Estimated cost cannot be negative'],
    },
    category: {
      type: String,
      enum: {
        values: [
          'sightseeing',
          'dining',
          'beach',
          'water_sports',
          'transport',
          'accommodation',
          'relaxation',
          'shopping',
          'other',
        ],
        message: '{VALUE} is not a valid activity category',
      },
      default: 'sightseeing',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Activity notes cannot exceed 500 characters'],
      default: '',
    },
  },
  { _id: true, timestamps: true }
);

const itinerarySchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Itinerary date is required'],
    },
    dayNumber: {
      type: Number,
      required: [true, 'Day number is required'],
      min: [1, 'Day number must be at least 1'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Day notes cannot exceed 500 characters'],
      default: '',
    },
    activities: {
      type: [activitySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes: Each dayNumber is unique per trip
itinerarySchema.index({ tripId: 1, dayNumber: 1 }, { unique: true });
itinerarySchema.index({ tripId: 1, date: 1 });

export const Itinerary = mongoose.model('Itinerary', itinerarySchema);
export default Itinerary;

