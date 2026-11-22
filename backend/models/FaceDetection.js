import mongoose from 'mongoose';

const faceDetectionSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },
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
    boundingBoxes: [
      {
        faceIndex: Number,
        boundingBox: {
          x: Number,
          y: Number,
          width: Number,
          height: Number,
        },
        detectionConfidence: Number,
        landmarks: [[Number]],
        matchedProfileId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'PersonProfile',
          default: null,
        },
        matchConfidence: {
          type: Number,
          default: 0,
        },
      },
    ],
    detectionConfidence: {
      type: Number,
      default: 0,
    },
    faceCount: {
      type: Number,
      default: 0,
      index: true,
    },
    matchedProfileIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonProfile',
      },
    ],
    analysisStatus: {
      type: String,
      enum: ['completed', 'needs_review', 'unconfirmed', 'failed'],
      default: 'completed',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

faceDetectionSchema.index({ fileId: 1, userId: 1 }, { unique: true });

export const FaceDetection = mongoose.model('FaceDetection', faceDetectionSchema);