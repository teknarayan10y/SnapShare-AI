import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Collection } from '../models/Collection.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { Analytics } from '../models/Analytics.js';
import { QRCode } from '../models/QRCode.js';
import { storageService } from '../services/storageService.js';

// Helper to determine device type
const getDeviceType = (ua = '') => {
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
};

// @desc    Get public collection by share token
// @route   GET /api/public/:shareToken
export const getPublicCollection = async (req, res) => {
  try {
    const { shareToken } = req.params;
    const isScan = req.query.scan === 'true';

    const collection = await Collection.findOne({ shareToken }).select('+passwordHash');
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Shared collection not found or link has been revoked' });
    }

    if (collection.status !== 'active') {
      return res.status(410).json({ success: false, error: 'This collection is archived or no longer available' });
    }

    // Check expiration
    if (collection.expiresAt && new Date(collection.expiresAt) < new Date()) {
      return res.status(410).json({ success: false, error: 'This collection link has expired' });
    }

    // Record Analytics Event (privacy-preserving IP hash)
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
    const userAgent = req.headers['user-agent'] || '';
    const device = getDeviceType(userAgent);

    if (isScan) {
      await Collection.findByIdAndUpdate(collection._id, { $inc: { scanCount: 1 } });
      await QRCode.findOneAndUpdate({ collectionId: collection._id }, { $inc: { scanCount: 1 }, lastScannedAt: new Date() });
      await Analytics.create({
        collectionId: collection._id,
        eventType: 'scan',
        ipHash,
        device,
      });
    } else {
      await Collection.findByIdAndUpdate(collection._id, { $inc: { viewsCount: 1 } });
      await Analytics.create({
        collectionId: collection._id,
        eventType: 'view',
        ipHash,
        device,
      });
    }

    // Check if password protected
    const isProtected = collection.accessType === 'password';

    // If password-protected, verify if caller supplied valid unlock token
    const unlockToken = req.headers['x-collection-unlock-token'];
    let isUnlocked = false;

    if (isProtected && unlockToken) {
      try {
        const decoded = jwt.verify(unlockToken, process.env.JWT_SECRET || 'snapshare_secret_key');
        if (decoded.collectionId === collection._id.toString()) {
          isUnlocked = true;
        }
      } catch {
        isUnlocked = false;
      }
    }

    // Get owner details for branding
    const owner = await User.findById(collection.ownerId).select('name avatar customBranding');

    // If collection is password-protected and not unlocked yet, return metadata only without files
    if (isProtected && !isUnlocked) {
      return res.status(200).json({
        success: true,
        isProtected: true,
        collection: {
          id: collection._id,
          title: collection.title,
          description: collection.description,
          category: collection.category,
          template: collection.template,
          coverImage: collection.coverImage,
          totalFiles: collection.totalFiles,
          totalSize: collection.totalSize,
          createdAt: collection.createdAt,
          owner: {
            name: owner?.name || 'Anonymous',
            branding: owner?.customBranding?.enabled ? owner.customBranding : null,
          },
        },
      });
    }

    const { sortBy = 'sortOrder', sortOrder = 'asc' } = req.query;
    let sort = { sortOrder: 1, originalName: 1, uploadedAt: -1 };
    if (sortBy === 'name' || sortBy === 'originalName') {
      sort = { originalName: sortOrder === 'desc' ? -1 : 1 };
    } else if (sortBy === 'newest') {
      sort = { uploadedAt: -1 };
    } else if (sortBy === 'oldest') {
      sort = { uploadedAt: 1 };
    } else if (sortBy === 'size') {
      sort = { fileSize: sortOrder === 'asc' ? 1 : -1 };
    }

    // Otherwise fetch files with natural numerical collation
    const files = await File.find({ collectionId: collection._id })
      .collation({ locale: 'en', numericOrdering: true })
      .sort(sort);

    // Add signed download URLs for each file
    const filesWithUrls = files.map((f) => ({
      ...f.toObject(),
      downloadUrl: `/api/files/${f._id}/download`,
      thumbnailUrl: f.cloudinaryUrl || (f.thumbnailKey ? `/uploads/${f.thumbnailKey}` : null),
    }));

    res.status(200).json({
      success: true,
      isProtected: false,
      collection: {
        id: collection._id,
        title: collection.title,
        description: collection.description,
        category: collection.category,
        template: collection.template,
        eventDate: collection.eventDate,
        coverImage: collection.coverImage,
        totalFiles: collection.totalFiles,
        totalSize: collection.totalSize,
        allowDownloads: collection.allowDownloads,
        allowCollaborativeUpload: collection.allowCollaborativeUpload,
        createdAt: collection.createdAt,
        owner: {
          name: owner?.name || 'Anonymous',
          avatar: owner?.avatar,
          branding: owner?.customBranding?.enabled ? owner.customBranding : null,
        },
      },
      files: filesWithUrls,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Verify password for a protected collection and receive an unlock token
// @route   POST /api/public/:shareToken/verify
export const verifyPassword = async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { password } = req.body;

    const collection = await Collection.findOne({ shareToken }).select('+passwordHash');
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    if (collection.accessType !== 'password' || !collection.passwordHash) {
      return res.status(400).json({ success: false, error: 'This collection is not password-protected' });
    }

    const isMatch = await bcrypt.compare(password || '', collection.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect collection password' });
    }

    // Issue unlock token valid for 24 hours
    const unlockToken = jwt.sign(
      { collectionId: collection._id.toString(), type: 'collection_unlock' },
      process.env.JWT_SECRET || 'snapshare_secret_key',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      unlockToken,
      message: 'Access granted',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
