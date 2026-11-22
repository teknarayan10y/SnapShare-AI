import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    modelVersion: {
      type: String,
      default: 'snapshare-ai-v1.0',
    },
    caption: String,
    detectedObjects: [
      {
        label: String,
        confidence: Number,
        box: [Number],
      },
    ],
    scenes: [
      {
        label: String,
        confidence: Number,
      },
    ],
    tags: [String],
    categories: [String],
    colors: {
      dominantColor: String,
      palette: [String],
      brightness: Number,
      contrast: Number,
      isDark: Boolean,
      isLight: Boolean,
    },
    quality: {
      overallScore: Number,
      sharpness: Number,
      isBlurry: Boolean,
      isLowRes: Boolean,
      isOverexposed: Boolean,
      isUnderexposed: Boolean,
      recommendations: [String],
      rating: String,
    },
    perceptualHash: {
      type: String,
      index: true,
    },
    personCount: {
      type: Number,
      default: 0,
    },
    photoComposition: {
      type: String,
      enum: ['single_person', 'pair', 'three_person', 'four_person', 'group', 'non_human', ''],
      default: 'non_human',
    },
    personSignature: [Number],
    ocrText: String,
    documentData: {
      summary: String,
      keywords: [String],
      wordCount: Number,
      topics: [String],
    },
    codeData: {
      language: String,
      lineCount: Number,
      frameworks: [String],
      description: String,
    },
    embedding: [Number], // 64/128-dim normalized dense vector
    processingDurationMs: Number,
    error: String,
  },
  {
    timestamps: true,
  }
);

export const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);
