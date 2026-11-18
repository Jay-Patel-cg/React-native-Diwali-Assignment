import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trip owner reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Trip title is required'],
      trim: true,
      minlength: [2, 'Trip title must be at least 2 characters long'],
      maxlength: [120, 'Trip title cannot exceed 120 characters'],
    },
    destination: {
      type: String,
      required: [true, 'Trip destination is required'],
      trim: true,
      maxlength: [100, 'Destination name cannot exceed 100 characters'],
    },
    origin: {
      type: String,
      trim: true,
      maxlength: [100, 'Origin name cannot exceed 100 characters'],
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Trip start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Trip end date is required'],
      validate: {
        validator: function (value) {
          if (!this.startDate || !value) return true;
          return new Date(value) >= new Date(this.startDate);
        },
        message: 'Trip end date must be on or after the start date',
      },
    },
    travelers: {
      type: Number,
      default: 1,
      min: [1, 'Travelers count must be at least 1'],
    },
    budget: {
      type: Number,
      default: 0,
      min: [0, 'Budget cannot be a negative value'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      maxlength: 5,
    },
    status: {
      type: String,
      enum: {
        values: ['planning', 'active', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid trip status',
      },
      default: 'planning',
      index: true,
    },
    coverImage: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for optimal queries
tripSchema.index({ owner: 1, status: 1 });
tripSchema.index({ startDate: 1, endDate: 1 });

// Virtual property to calculate trip duration in days
tripSchema.virtual('durationInDays').get(function () {
  if (!this.startDate || !this.endDate) return 0;
  const start = new Date(this.startDate).getTime();
  const end = new Date(this.endDate).getTime();
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
});

// Pre-validate hook for update operations to guard date range integrity
tripSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    const startDate = update.startDate || update.$set?.startDate;
    const endDate = update.endDate || update.$set?.endDate;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return next(new Error('Trip end date must be on or after the start date'));
    }
  }
  next();
});

export const Trip = mongoose.model('Trip', tripSchema);
export default Trip;

