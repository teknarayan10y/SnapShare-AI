import bcrypt from 'bcryptjs';
import { Collection } from '../models/Collection.js';
import { File } from '../models/File.js';
import { QRCode } from '../models/QRCode.js';
import { User } from '../models/User.js';
import { storageService } from '../services/storageService.js';
import { cloudinaryService } from '../services/cloudinaryService.js';

// @desc    Create new collection
// @route   POST /api/collections
export const createCollection = async (req, res) => {
  try {
    const {
      title = req.body.name,
      description,
      category = 'general',
      template = 'standard',
      eventDate,
      accessType = 'public',
      password,
      allowDownloads = true,
      allowCollaborativeUpload = false,
      expiresAt,
      tags = [],
      coverImage = '',
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Collection title is required' });
    }

    let passwordHash = null;
    if (accessType === 'password') {
      if (!password || password.length < 4) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a password of at least 4 characters for protected collection',
        });
      }
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const collection = await Collection.create({
      ownerId: req.user._id,
      title,
      description,
      category,
      template,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      accessType,
      passwordHash,
      allowDownloads,
      allowCollaborativeUpload,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      tags,
      coverImage,
    });

    // Automatically create a default QRCode entry for this collection
    await QRCode.create({
      collectionId: collection._id,
      qrStyle: {
        template: 'gradient',
        dotsColor: '#8B5CF6',
        bgColor: '#080B14',
        cornerColor: '#06B6D4',
        showLogo: true,
      },
    });

    res.status(201).json({
      success: true,
      collection,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all collections for the logged-in user
// @route   GET /api/collections
export const getCollections = async (req, res) => {
  try {
    const { category, search, status = 'active', sort = '-createdAt' } = req.query;

    const query = { ownerId: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const collections = await Collection.find(query).sort(sort);

    res.status(200).json({
      success: true,
      count: collections.length,
      collections,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single collection by ID with files
// @route   GET /api/collections/:id
export const getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    const { sortBy = 'sortOrder', sortOrder = 'asc' } = req.query;
    let sort = {};
    if (sortBy === 'name' || sortBy === 'originalName') {
      sort = { originalName: sortOrder === 'desc' ? -1 : 1 };
    } else if (sortBy === 'newest') {
      sort = { uploadedAt: -1 };
    } else if (sortBy === 'oldest') {
      sort = { uploadedAt: 1 };
    } else if (sortBy === 'size') {
      sort = { fileSize: sortOrder === 'asc' ? 1 : -1 };
    } else {
      // Default: respect custom sortOrder, then natural filename ascending, then newest
      sort = { sortOrder: 1, originalName: 1, uploadedAt: -1 };
    }

    const files = await File.find({ collectionId: collection._id })
      .collation({ locale: 'en', numericOrdering: true })
      .sort(sort);
    const qr = await QRCode.findOne({ collectionId: collection._id });

    res.status(200).json({
      success: true,
      collection,
      files,
      qr,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update collection
// @route   PATCH /api/collections/:id
export const updateCollection = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      eventDate,
      accessType,
      password,
      allowDownloads,
      allowCollaborativeUpload,
      expiresAt,
      tags,
      coverImage,
      status,
    } = req.body;

    const collection = await Collection.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    if (title) collection.title = title;
    if (description !== undefined) collection.description = description;
    if (category) collection.category = category;
    if (eventDate !== undefined) collection.eventDate = eventDate ? new Date(eventDate) : undefined;
    if (allowDownloads !== undefined) collection.allowDownloads = allowDownloads;
    if (allowCollaborativeUpload !== undefined) collection.allowCollaborativeUpload = allowCollaborativeUpload;
    if (expiresAt !== undefined) collection.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (tags) collection.tags = tags;
    if (coverImage !== undefined) collection.coverImage = coverImage;
    if (status) collection.status = status;

    if (accessType) {
      collection.accessType = accessType;
      if (accessType === 'password' && password) {
        const salt = await bcrypt.genSalt(10);
        collection.passwordHash = await bcrypt.hash(password, salt);
      } else if (accessType !== 'password') {
        collection.passwordHash = null;
      }
    }

    await collection.save();

    res.status(200).json({
      success: true,
      collection,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete collection and its files
// @route   DELETE /api/collections/:id
export const deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    // Find and delete all files in storage
    const files = await File.find({ collectionId: collection._id });
    let freedBytes = 0;

    for (const f of files) {
      freedBytes += f.fileSize || 0;
      await storageService.deleteObject(f.storageKey);
      if (f.thumbnailKey) {
        await storageService.deleteObject(f.thumbnailKey);
      }
      if (f.cloudinaryPublicId) {
        await cloudinaryService.deleteImage(f.cloudinaryPublicId);
      }
    }

    await File.deleteMany({ collectionId: collection._id });
    await QRCode.deleteOne({ collectionId: collection._id });
    await Collection.findByIdAndDelete(collection._id);

    // Update user storage
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: -freedBytes },
    });

    res.status(200).json({
      success: true,
      message: 'Collection and all associated files deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Duplicate collection
// @route   POST /api/collections/:id/duplicate
export const duplicateCollection = async (req, res) => {
  try {
    const original = await Collection.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!original) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    const duplicated = await Collection.create({
      ownerId: req.user._id,
      title: `${original.title} (Copy)`,
      description: original.description,
      category: original.category,
      template: original.template,
      accessType: original.accessType,
      allowDownloads: original.allowDownloads,
      tags: original.tags,
      coverImage: original.coverImage,
    });

    // Create QR code for duplicated collection
    await QRCode.create({
      collectionId: duplicated._id,
      qrStyle: {
        template: 'gradient',
        dotsColor: '#8B5CF6',
        bgColor: '#080B14',
      },
    });

    res.status(201).json({
      success: true,
      collection: duplicated,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
