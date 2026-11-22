import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const collectionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Collection title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    coverImage: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['general', 'wedding', 'birthday', 'education', 'business', 'travel', 'project', 'media'],
      default: 'general',
    },
    template: {
      type: String,
      enum: ['standard', 'wedding', 'birthday', 'education', 'business', 'travel', 'project'],
      default: 'standard',
    },
    eventDate: {
      type: Date,
    },
    accessType: {
      type: String,
      enum: ['public', 'private', 'password'],
      default: 'public',
      index: true,
    },
    passwordHash: {
      type: String,
      default: null,
      select: false,
    },
    shareToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => uuidv4().replace(/-/g, '').slice(0, 16),
    },
    allowDownloads: {
      type: Boolean,
      default: true,
    },
    allowCollaborativeUpload: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'disabled'],
      default: 'active',
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    totalFiles: {
      type: Number,
      default: 0,
    },
    totalSize: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Collection = mongoose.model('Collection', collectionSchema);
