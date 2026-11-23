import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { File } from '../models/File.js';
import { Collection } from '../models/Collection.js';
import { User } from '../models/User.js';
import { storageService } from '../services/storageService.js';
import { mediaService } from '../services/mediaService.js';
import { aiService } from '../services/aiService.js';
import { cloudinaryService } from '../services/cloudinaryService.js';
import { aiJobQueue } from '../services/aiJobQueue.js';
import { validateFileSafety, categorizeExtension } from '../utils/fileSignatures.js';

// @desc    Upload files to a collection
// @route   POST /api/files/upload
export const uploadFiles = async (req, res) => {
  try {
    const { collectionId } = req.body;

    if (!collectionId) {
      return res.status(400).json({ success: false, error: 'Target collectionId is required' });
    }

    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    // Verify ownership or collaborative permission
    const isOwner = req.user && collection.ownerId.toString() === req.user._id.toString();
    if (!isOwner && !collection.allowCollaborativeUpload) {
      return res.status(403).json({ success: false, error: 'Collaborative upload is not allowed for this collection' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const uploadedRecords = [];
    let totalBatchSize = 0;

    for (const rawFile of req.files) {
      const tempPath = rawFile.path;
      const originalName = rawFile.originalname;
      const fileSize = rawFile.size;
      totalBatchSize += fileSize;

      // 1. Validate file safety and magic bytes
      const safetyCheck = await validateFileSafety(tempPath, originalName);
      if (!safetyCheck.safe) {
        // Remove temp file and abort this file
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        return res.status(400).json({
          success: false,
          error: `Security violation in ${originalName}: ${safetyCheck.reason}`,
        });
      }

      // 2. Compute cryptographic SHA-256 checksum for duplicate detection
      const checksum = await aiService.computeChecksum(tempPath);

      // Check if duplicate already exists in this collection
      const existingInCollection = await File.findOne({ collectionId, checksum });
      if (existingInCollection) {
        // Clean up temp file
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        uploadedRecords.push({
          ...existingInCollection.toObject(),
          isDuplicate: true,
          message: 'File with identical content already existed in this collection',
        });
        continue;
      }

      // 3. Storage Strategy: Direct Cloudinary Cloud Storage (No redundant local storage)
      const ext = path.extname(originalName).replace('.', '').toLowerCase() || 'bin';
      let storageKey = storageService.generateKey('files', ext);
      let thumbnailKey = '';
      let dimensions = { width: null, height: null };
      let cloudinaryUrl = '';
      let cloudinaryPublicId = '';
      let cloudinaryResourceType = '';

      if (cloudinaryService.isConfigured()) {
        // Direct upload to Cloudinary CDN
        const cloudRes = await cloudinaryService.uploadFile(tempPath, originalName, safetyCheck.category);
        if (cloudRes) {
          cloudinaryUrl = cloudRes.secureUrl;
          cloudinaryPublicId = cloudRes.publicId;
          cloudinaryResourceType = cloudRes.resourceType;
          storageKey = `cloudinary/${cloudRes.publicId}`;
          if (cloudRes.width) dimensions.width = cloudRes.width;
          if (cloudRes.height) dimensions.height = cloudRes.height;
        }
      }

      // If Cloudinary is not configured or failed, fallback to local storage
      if (!cloudinaryUrl) {
        await storageService.putObject(storageKey, tempPath);
        if (safetyCheck.category === 'image') {
          const imgResult = await mediaService.processImage(tempPath);
          if (imgResult.hasThumbnail) {
            thumbnailKey = imgResult.thumbnailKey;
            if (!dimensions.width) dimensions.width = imgResult.width;
            if (!dimensions.height) dimensions.height = imgResult.height;
          }
        }
      }

      // 4. AI analysis and categorization
      const aiAnalysis = aiService.analyzeFile(originalName, safetyCheck.category, ext, dimensions);

      // Clean up temporary upload file immediately
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      const mimeType = rawFile.mimetype || mime.lookup(originalName) || 'application/octet-stream';

      // 6. Create database record
      const fileRecord = await File.create({
        ownerId: collection.ownerId,
        collectionId: collection._id,
        originalName,
        storageKey,
        mimeType,
        fileExtension: ext,
        fileSize,
        checksum,
        thumbnailKey,
        cloudinaryUrl,
        cloudinaryPublicId,
        cloudinaryResourceType,
        metadata: {
          width: dimensions.width,
          height: dimensions.height,
          aiCategory: aiAnalysis.aiCategory,
          aiTags: aiAnalysis.aiTags,
          aiDescription: aiAnalysis.aiDescription,
          fileHash: checksum,
        },
      });

      uploadedRecords.push(fileRecord);

      // Enqueue for intelligent AI analysis asynchronously
      aiJobQueue.enqueue(fileRecord._id, collection.ownerId, collection._id).catch((err) => {
        console.warn('⚠️ [AI Queue Auto-enqueue]:', err.message);
      });
    }

    // Update collection summary statistics
    const allCollectionFiles = await File.find({ collectionId: collection._id });
    const totalFilesCount = allCollectionFiles.length;
    const totalBytes = allCollectionFiles.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);

    collection.totalFiles = totalFilesCount;
    collection.totalSize = totalBytes;
    await collection.save();

    // Update owner storage used
    await User.findByIdAndUpdate(collection.ownerId, {
      $inc: { storageUsed: totalBatchSize },
    });

    res.status(201).json({
      success: true,
      files: uploadedRecords,
      totalFiles: totalFilesCount,
      totalSize: totalBytes,
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single file details
// @route   GET /api/files/:id
export const getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const signedDownloadUrl = storageService.generateSignedUrl(file._id.toString(), 120);

    res.status(200).json({
      success: true,
      file,
      downloadUrl: signedDownloadUrl,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Download or stream individual file
// @route   GET /api/files/:id/download
export const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Check collection access
    const collection = await Collection.findById(file.collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Associated collection not found' });
    }

    // Verify token or authentication if private/password
    const token = req.query.token;
    if (token) {
      const valid = storageService.verifySignedToken(token, file._id.toString());
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid or expired download link token' });
      }
    } else if (collection.accessType === 'private') {
      if (!req.user || req.user._id.toString() !== collection.ownerId.toString()) {
        return res.status(403).json({ success: false, error: 'Access forbidden to private file' });
      }
    }

    const filePath = storageService.getFilePath(file.storageKey);
    if (!fs.existsSync(filePath)) {
      if (file.cloudinaryUrl) {
        await File.findByIdAndUpdate(file._id, { $inc: { downloadCount: 1 } });
        await Collection.findByIdAndUpdate(collection._id, { $inc: { downloadCount: 1 } });
        return res.redirect(file.cloudinaryUrl);
      }
      return res.status(404).json({ success: false, error: 'Physical file not found on disk' });
    }

    // Increment download metrics
    await File.findByIdAndUpdate(file._id, { $inc: { downloadCount: 1 } });
    await Collection.findByIdAndUpdate(collection._id, { $inc: { downloadCount: 1 } });

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete individual file
// @route   DELETE /api/files/:id
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Check ownership
    if (file.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this file' });
    }

    // Delete physically
    await storageService.deleteObject(file.storageKey);
    if (file.thumbnailKey) {
      await storageService.deleteObject(file.thumbnailKey);
    }
    if (file.cloudinaryPublicId) {
      await cloudinaryService.deleteFile(file.cloudinaryPublicId, file.cloudinaryResourceType || 'image');
    }

    const fileSize = file.fileSize || 0;
    const collectionId = file.collectionId;

    await File.findByIdAndDelete(file._id);

    // Update user quota
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: -fileSize },
    });

    // Update collection counts
    const remainingFiles = await File.find({ collectionId });
    const totalFilesCount = remainingFiles.length;
    const totalBytes = remainingFiles.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);

    await Collection.findByIdAndUpdate(collectionId, {
      totalFiles: totalFilesCount,
      totalSize: totalBytes,
    });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      totalFiles: totalFilesCount,
      totalSize: totalBytes,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Toggle favorite
// @route   PATCH /api/files/:id/favorite
export const toggleFavorite = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    file.isFavorite = !file.isFavorite;
    await file.save();

    res.status(200).json({
      success: true,
      file,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all files for authenticated user (across all collections)
// @route   GET /api/files
export const getAllFiles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 24,
      search,
      category,
      favorites,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { ownerId: req.user._id };

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (favorites === 'true') {
      query.isFavorite = true;
    }

    const sortFieldMap = {
      createdAt: 'uploadedAt',
      uploadedAt: 'uploadedAt',
      name: 'originalName',
      originalName: 'originalName',
      size: 'fileSize',
      fileSize: 'fileSize',
      quality: 'qualityScore',
      qualityScore: 'qualityScore',
    };
    const sortField = sortFieldMap[sortBy] || 'uploadedAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDir, _id: sortDir };

    const skip = (Number(page) - 1) * Number(limit);
    const [files, total] = await Promise.all([
      File.find(query)
        .collation({ locale: 'en', numericOrdering: true })
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      File.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      files,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Feature 4: Voice Memory Notes (Audio Guestbook)
 * Attaches a voice wish/greeting to a photograph
 */
export const attachVoiceNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { audioBase64, duration = 0, senderName = 'Guest', transcription = '' } = req.body;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    let audioUrl = '';
    let publicId = '';

    // Handle Cloudinary upload if audio data provided
    if (audioBase64 && process.env.CLOUDINARY_CLOUD_NAME) {
      const uploadRes = await cloudinary.uploader.upload(audioBase64, {
        resource_type: 'video', // Cloudinary handles audio files under 'video'
        folder: `snapshare/voice_notes/${file.collectionId || 'general'}`,
      });
      audioUrl = uploadRes.secure_url;
      publicId = uploadRes.public_id;
    } else if (req.file) {
      audioUrl = req.file.path;
    } else if (audioBase64) {
      audioUrl = audioBase64;
    }

    file.voiceNote = {
      url: audioUrl,
      publicId,
      duration: parseFloat(duration) || 0,
      senderName: senderName.trim(),
      transcription: transcription.trim(),
      recordedAt: new Date(),
    };

    await file.save();

    return res.json({
      success: true,
      message: 'Voice note attached successfully!',
      voiceNote: file.voiceNote,
      file,
    });
  } catch (err) {
    console.error('[Voice Note Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
