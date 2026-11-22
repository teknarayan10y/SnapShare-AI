import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
      index: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['scan', 'view', 'download', 'preview', 'bulk_download'],
      required: true,
      index: true,
    },
    ipHash: {
      type: String,
      index: true,
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    referrer: {
      type: String,
      default: 'direct',
    },
    country: {
      type: String,
      default: 'Global',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const Analytics = mongoose.model('Analytics', analyticsSchema);
