import mongoose from 'mongoose';

const expenseParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Participant user reference is required'],
    },
    shareAmount: {
      type: Number,
      default: 0,
      min: [0, 'Share amount cannot be negative'],
    },
    hasPaid: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
      index: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who paid the expense is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [120, 'Expense title cannot exceed 120 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Expense amount must be greater than 0'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      maxlength: 5,
    },
    category: {
      type: String,
      enum: {
        values: [
          'transport',
          'accommodation',
          'stay',
          'food',
          'activities',
          'shopping',
          'fuel',
          'tickets',
          'miscellaneous',
        ],
        message: '{VALUE} is not a valid expense category',
      },
      default: 'miscellaneous',
      index: true,
    },
    expenseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Expense notes cannot exceed 500 characters'],
      default: '',
    },
    splitType: {
      type: String,
      enum: {
        values: ['equal', 'exact', 'percentage'],
        message: '{VALUE} is not a valid split type',
      },
      default: 'equal',
    },
    participants: {
      type: [expenseParticipantSchema],
      default: [],
    },
    receiptImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for financial queries and reports
expenseSchema.index({ tripId: 1, expenseDate: -1 });
expenseSchema.index({ tripId: 1, category: 1 });
expenseSchema.index({ paidBy: 1, expenseDate: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;

