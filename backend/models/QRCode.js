import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const qrCodeSchema = new mongoose.Schema(
  {
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
      unique: true,
      index: true,
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
      default: () => 'qr_' + uuidv4().replace(/-/g, '').slice(0, 16),
      index: true,
    },
    qrStyle: {
      template: {
        type: String,
        enum: ['minimal', 'gradient', 'professional', 'event', 'dark', 'branded'],
        default: 'gradient',
      },
      dotsColor: {
        type: String,
        default: '#8B5CF6',
      },
      bgColor: {
        type: String,
        default: '#080B14',
      },
      cornerColor: {
        type: String,
        default: '#06B6D4',
      },
      showLogo: {
        type: Boolean,
        default: true,
      },
      logoUrl: {
        type: String,
        default: '',
      },
      margin: {
        type: Number,
        default: 2,
      },
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      index: true,
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    lastScannedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const QRCode = mongoose.model('QRCode', qrCodeSchema);
