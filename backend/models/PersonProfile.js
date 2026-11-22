import mongoose from 'mongoose';

const personProfileSchema = new mongoose.Schema(
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
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    unnamedId: {
      type: String,
      required: true,
      index: true,
    },
    sampleFaceUrl: {
      type: String,
      default: '',
    },
    privateEmbeddingReference: {
      type: [Number], // 128-dim normalized face embedding vector
      default: [],
      select: false, // Protected: never expose private raw embedding data to ordinary client requests
    },
    fileCount: {
      type: Number,
      default: 0,
    },
    consentStatus: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'merged', 'split', 'deleted', 'unconfirmed'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

personProfileSchema.index({ userId: 1, unnamedId: 1 }, { unique: true });

export const PersonProfile = mongoose.model('PersonProfile', personProfileSchema);