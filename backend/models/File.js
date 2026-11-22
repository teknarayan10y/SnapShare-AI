import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      index: true,
    },
    fileExtension: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    checksum: {
      type: String,
      index: true,
    },
    thumbnailKey: {
      type: String,
      default: '',
    },
    cloudinaryUrl: {
      type: String,
      default: '',
    },
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
    cloudinaryResourceType: {
      type: String,
      default: '',
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    metadata: {
      width: Number,
      height: Number,
      duration: Number,
      bitrate: Number,
      pageCount: Number,
      encoding: String,
      aiCategory: {
        type: String,
        enum: ['image', 'video', 'audio', 'document', 'archive', 'code', 'data', 'other'],
        default: 'other',
      },
      aiTags: [String],
      aiDescription: String,
      fileHash: String,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    // SnapShare AI Native Metadata
    aiStatus: {
      type: String,
      enum: ['unprocessed', 'processing', 'analyzed', 'failed'],
      default: 'unprocessed',
      index: true,
    },
    aiAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIAnalysis',
    },
    smartFolderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SmartFolder',
      },
    ],
    aiCaption: {
      type: String,
      default: '',
    },
    aiTags: [String],
    detectedObjects: [String],
    sceneLabels: [String],
    qualityScore: {
      type: Number,
      default: 100,
    },
    personCount: {
      type: Number,
      default: 0,
      index: true,
    },
    photoComposition: {
      type: String,
      enum: ['single_person', 'pair', 'three_person', 'four_person', 'group', 'non_human', ''],
      default: 'non_human',
      index: true,
    },
    perceptualHash: {
      type: String,
      default: '',
      index: true,
    },
    embedding: [Number],
    voiceNote: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      duration: { type: Number, default: 0 },
      transcription: { type: String, default: '' },
      senderName: { type: String, default: 'Guest' },
      recordedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: { createdAt: 'uploadedAt', updatedAt: true },
  }
);

export const File = mongoose.model('File', fileSchema);
