import mongoose from 'mongoose';

const groupFolderSchema = new mongoose.Schema(
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
    groupKey: {
      type: String,
      required: true,
      index: true,
    },
    groupSize: {
      type: Number,
      required: true,
      index: true,
    },
    memberProfileIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonProfile',
      },
    ],
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartFolder',
      required: true,
    },
    fileIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Deterministic unique compound index scoped to owner and collection
groupFolderSchema.index({ userId: 1, collectionId: 1, groupKey: 1 }, { unique: true });

export const GroupFolder = mongoose.model('GroupFolder', groupFolderSchema);