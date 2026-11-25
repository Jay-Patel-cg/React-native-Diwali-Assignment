import mongoose from 'mongoose';

export const DESTINATION_CATEGORIES = [
  'beach',
  'island',
  'coastal',
  'hills',
  'heritage',
  'adventure',
  'backwaters',
  'city',
  'wellness',
];

export const DESTINATION_BUDGET_TIERS = ['budget', 'moderate', 'luxury'];

export const DESTINATION_TRAVEL_TYPES = [
  'solo',
  'couple',
  'family',
  'friends',
  'luxury',
  'budget',
  'backpacking',
  'adventure',
  'relaxation',
];

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
      maxlength: [120, 'Destination name cannot exceed 120 characters'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Destination slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'India',
      index: true,
    },
    stateOrRegion: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    description: {
      type: String,
      required: [true, 'Full description is required'],
      trim: true,
      maxlength: [2500, 'Description cannot exceed 2500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Destination category is required'],
      enum: {
        values: DESTINATION_CATEGORIES,
        message: '{VALUE} is not a valid destination category',
      },
      index: true,
    },
    travelTypes: {
      type: [String],
      enum: {
        values: DESTINATION_TRAVEL_TYPES,
        message: '{VALUE} is not a valid travel type',
      },
      default: ['friends', 'couple'],
      index: true,
    },
    budgetTier: {
      type: String,
      enum: {
        values: DESTINATION_BUDGET_TIERS,
        message: '{VALUE} is not a valid budget tier',
      },
      default: 'moderate',
      index: true,
    },
    averageDailyBudget: {
      type: Number,
      required: [true, 'Average daily budget is required'],
      min: [0, 'Average daily budget cannot be negative'],
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      maxlength: 5,
    },
    bestSeason: {
      type: String,
      trim: true,
      default: 'October to March',
    },
    recommendedDays: {
      type: Number,
      default: 4,
      min: [1, 'Recommended days must be at least 1'],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    highlights: {
      type: [String],
      default: [],
    },
    coverImage: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    },
    gallery: {
      type: [String],
      default: [],
    },
    coordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound & Full-Text Search Indexes for fast discovery queries
destinationSchema.index(
  {
    name: 'text',
    stateOrRegion: 'text',
    country: 'text',
    shortDescription: 'text',
    description: 'text',
    highlights: 'text',
  },
  {
    weights: {
      name: 10,
      stateOrRegion: 5,
      highlights: 4,
      shortDescription: 3,
      description: 1,
    },
    name: 'destination_text_search_idx',
  }
);
destinationSchema.index({ category: 1, budgetTier: 1, averageDailyBudget: 1 });
destinationSchema.index({ isFeatured: -1, rating: -1 });

export const Destination = mongoose.model('Destination', destinationSchema);
export default Destination;

