import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password hash'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    storageQuota: {
      type: Number,
      default: 5 * 1024 * 1024 * 1024, // 5GB free tier
    },
    storageUsed: {
      type: Number,
      default: 0,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    customBranding: {
      enabled: { type: Boolean, default: false },
      companyName: { type: String, default: '' },
      logoUrl: { type: String, default: '' },
      brandColor: { type: String, default: '#8B5CF6' },
      customMessage: { type: String, default: '' },
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // SnapShare AI Preferences & Quotas
    aiPreferences: {
      organizationMode: {
        type: String,
        enum: ['automatic', 'review', 'manual'],
        default: 'review',
      },
      enableFaceGrouping: {
        type: Boolean,
        default: false, // Strict privacy consent default
      },
      enableFaceDetection: {
        type: Boolean,
        default: true,
      },
      enableFaceMatching: {
        type: Boolean,
        default: false, // Strict privacy requirement: disabled by default
      },
      faceDetectionThreshold: {
        type: Number,
        default: 0.85,
      },
      faceMatchingThreshold: {
        type: Number,
        default: 0.95,
      },
      enableAutoOCR: {
        type: Boolean,
        default: true,
      },
      confidenceThreshold: {
        type: Number,
        default: 0.75,
      },
      monthlyAIQuota: {
        type: Number,
        default: 500, // 500 files per month on free tier
      },
      aiUsageThisMonth: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify entered password against hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
