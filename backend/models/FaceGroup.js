import mongoose from 'mongoose';

const faceGroupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      default: '', // Private user-defined label (e.g. "Friend 1", "Mom", "Self")
    },
    unnamedId: {
      type: String,
      required: true, // Anonymous identifier e.g. "Cluster-Alpha-7"
    },
    sampleFaceUrl: String,
    fileIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    faceCount: {
      type: Number,
      default: 0,
    },
    isConsentGiven: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const FaceGroup = mongoose.model('FaceGroup', faceGroupSchema);
