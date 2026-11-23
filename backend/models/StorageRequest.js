import mongoose from 'mongoose';

const storageRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      default: '',
    },
    userEmail: {
      type: String,
      default: '',
    },
    currentQuota: {
      type: Number,
      default: 5 * 1024 * 1024 * 1024,
    },
    currentUsed: {
      type: Number,
      default: 0,
    },
    requestedQuotaGB: {
      type: Number,
      required: [true, 'Requested quota in GB is required'],
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for the extra storage request'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    grantedQuotaGB: {
      type: Number,
      default: null,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const StorageRequest = mongoose.model('StorageRequest', storageRequestSchema);
