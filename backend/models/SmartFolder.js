import mongoose from 'mongoose';

const smartFolderSchema = new mongoose.Schema(
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
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    parentFolderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartFolder',
      default: null,
    },
    isAIGenerated: {
      type: Boolean,
      default: true,
    },
    fileIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    color: {
      type: String,
      default: '#8B5CF6',
    },
    icon: {
      type: String,
      default: 'Folder',
    },
    personSignature: {
      type: [Number],
      default: [],
    },
    isPersonFolder: {
      type: Boolean,
      default: false,
    },
    personName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const SmartFolder = mongoose.model('SmartFolder', smartFolderSchema);
