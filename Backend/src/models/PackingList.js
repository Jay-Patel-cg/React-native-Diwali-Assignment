import mongoose from 'mongoose';

const packingItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    isPacked: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: {
        values: [
          'clothing',
          'beachwear',
          'toiletries',
          'electronics',
          'documents',
          'medication',
          'accessories',
          'other',
        ],
        message: '{VALUE} is not a valid packing item category',
      },
      default: 'clothing',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: true }
);

const packingListSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
      unique: true,
      index: true,
    },
    items: {
      type: [packingItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const PackingList = mongoose.model('PackingList', packingListSchema);
export default PackingList;

