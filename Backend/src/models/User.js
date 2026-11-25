import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const preferenceSchema = new mongoose.Schema(
  {
    preferredCurrency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      maxlength: 5,
    },
    travelStyle: {
      type: [String],
      enum: {
        values: [
          'budget',
          'luxury',
          'backpacking',
          'coastal',
          'adventure',
          'relaxation',
          'family',
          'solo',
        ],
        message: '{VALUE} is not a recognized travel style',
      },
      default: ['coastal', 'relaxation'],
    },
    dietaryRestrictions: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      default: 'en',
      lowercase: true,
      trim: true,
      maxlength: 10,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [
        function () {
          return !this.googleId;
        },
        'Password is required for email/password authentication',
      ],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Prevents accidental exposure in queries
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null/absent values without collision
      trim: true,
    },
    profileImage: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    },
    preferences: {
      type: preferenceSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Password hashing pre-save hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
export default User;

