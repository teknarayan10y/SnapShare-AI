import mongoose from 'mongoose';

const organizationJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      default: null,
      index: true,
    },
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganizationRule',
      default: null,
    },
    totalFiles: {
      type: Number,
      default: 0,
    },
    processedFiles: {
      type: Number,
      default: 0,
    },
    failedFiles: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    details: {
      assignedFolders: [String],
      createdFolders: [String],
      reusedFolders: [String],
      needsReviewCount: Number,
      errors: [String],
    },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const OrganizationJob = mongoose.model('OrganizationJob', organizationJobSchema);