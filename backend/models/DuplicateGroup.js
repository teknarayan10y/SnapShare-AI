import mongoose from 'mongoose';

const duplicateGroupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    duplicateType: {
      type: String,
      enum: ['exact', 'visual_similar'],
      default: 'exact',
    },
    similarityScore: {
      type: Number,
      default: 1.0,
    },
    primaryFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
    },
    duplicateFileIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    potentialSavingsBytes: {
      type: Number,
      default: 0,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const DuplicateGroup = mongoose.model('DuplicateGroup', duplicateGroupSchema);
