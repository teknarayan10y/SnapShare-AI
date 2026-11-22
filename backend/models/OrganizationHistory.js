import mongoose from 'mongoose';

const organizationHistorySchema = new mongoose.Schema(
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
    },
    action: {
      type: String,
      enum: ['auto_organize', 'review_approve', 'manual_move', 'undo_organize', 'folder_create', 'folder_merge'],
      required: true,
    },
    mode: {
      type: String,
      enum: ['automatic', 'review', 'manual'],
      default: 'automatic',
    },
    affectedFolders: [
      {
        folderId: mongoose.Schema.Types.ObjectId,
        folderName: String,
      },
    ],
    affectedFileIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    snapshot: mongoose.Schema.Types.Mixed, // Stored state to support instantaneous 1-click Undo
    isUndone: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const OrganizationHistory = mongoose.model('OrganizationHistory', organizationHistorySchema);
