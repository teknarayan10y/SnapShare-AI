import mongoose from 'mongoose';

const aiJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
    },
    jobType: {
      type: String,
      enum: ['full_analysis', 'image_intelligence', 'document_ocr', 'duplicate_scan', 'smart_folder_organize'],
      default: 'full_analysis',
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    error: String,
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const AIJob = mongoose.model('AIJob', aiJobSchema);
