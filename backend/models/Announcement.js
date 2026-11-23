import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'urgent'],
      default: 'info',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    targetAudience: {
      type: String,
      enum: ['all', 'users', 'admins'],
      default: 'all',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Announcement = mongoose.model('Announcement', announcementSchema);
