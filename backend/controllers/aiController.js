import { AIJob } from '../models/AIJob.js';
import { SmartFolder } from '../models/SmartFolder.js';
import { DuplicateGroup } from '../models/DuplicateGroup.js';
import { OrganizationHistory } from '../models/OrganizationHistory.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { aiJobQueue } from '../services/aiJobQueue.js';
import { smartFolderService } from '../services/smartFolderService.js';
import { duplicateService } from '../services/duplicateService.js';
import { semanticSearch } from '../services/semanticSearchService.js';
import { aiClient } from '../services/aiMicroserviceClient.js';

// @desc    Get AI Organizer Overview statistics
// @route   GET /api/ai/overview
export const getAIOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalAnalyzed, pendingAnalysis, totalFolders, duplicateGroups, user] = await Promise.all([
      File.countDocuments({ ownerId: userId, aiStatus: 'analyzed' }),
      File.countDocuments({ ownerId: userId, aiStatus: { $in: ['unprocessed', 'processing'] } }),
      SmartFolder.countDocuments({ userId }),
      DuplicateGroup.countDocuments({ userId, isResolved: false }),
      User.findById(userId).select('aiPreferences plan'),
    ]);

    const microserviceHealth = await aiClient.checkHealth();

    res.status(200).json({
      success: true,
      stats: {
        totalAnalyzed,
        pendingAnalysis,
        totalFolders,
        duplicateGroups,
        monthlyQuota: user?.aiPreferences?.monthlyAIQuota || 500,
        quotaUsedThisMonth: user?.aiPreferences?.aiUsageThisMonth || 0,
        microserviceOnline: microserviceHealth.online,
        organizationMode: user?.aiPreferences?.organizationMode || 'review',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Trigger AI analysis for a single file
// @route   POST /api/ai/analyze
export const analyzeFile = async (req, res) => {
  try {
    const { fileId, jobType = 'full_analysis' } = req.body;
    if (!fileId) return res.status(400).json({ success: false, error: 'fileId is required' });

    const file = await File.findOne({ _id: fileId, ownerId: req.user._id });
    if (!file) return res.status(404).json({ success: false, error: 'File not found' });

    const job = await aiJobQueue.enqueue(file._id, req.user._id, file.collectionId, jobType);

    res.status(202).json({
      success: true,
      message: 'Analysis job enqueued',
      job,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Trigger bulk AI analysis
// @route   POST /api/ai/analyze/bulk
export const analyzeBulkFiles = async (req, res) => {
  try {
    const { fileIds, collectionId } = req.body;
    let targetIds = fileIds;

    if (!targetIds && collectionId) {
      const files = await File.find({ collectionId, ownerId: req.user._id });
      targetIds = files.map((f) => f._id);
    }

    if (!targetIds || targetIds.length === 0) {
      return res.status(400).json({ success: false, error: 'fileIds array or collectionId is required' });
    }

    const jobs = await aiJobQueue.enqueueBulk(targetIds, req.user._id, collectionId);

    res.status(202).json({
      success: true,
      message: `Enqueued ${jobs.length} files for AI analysis`,
      totalJobs: jobs.length,
      jobs: jobs.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get user's AI jobs list
// @route   GET /api/ai/jobs
export const getAIJobs = async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const jobs = await AIJob.find(query)
      .populate('fileId', 'originalName mimeType fileSize cloudinaryUrl thumbnailKey')
      .sort('-createdAt')
      .limit(Number(limit));

    res.status(200).json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Retry an AI Job
// @route   POST /api/ai/jobs/:jobId/retry
export const retryJob = async (req, res) => {
  try {
    const job = await aiJobQueue.retryJob(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.status(200).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Cancel an AI Job
// @route   POST /api/ai/jobs/:jobId/cancel
export const cancelJob = async (req, res) => {
  try {
    const job = await aiJobQueue.cancelJob(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.status(200).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all smart folders for user
// @route   GET /api/ai/folders
export const getSmartFolders = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.collectionId) {
      filter.collectionId = req.query.collectionId;
    }

    const folders = await SmartFolder.find(filter)
      .populate('fileIds', 'originalName mimeType fileSize fileExtension cloudinaryUrl thumbnailKey aiCaption aiTags detectedObjects sceneLabels qualityScore aiStatus photoComposition personCount')
      .sort('-updatedAt');

    // Deduplicate by folder name to ensure clean UI presentation
    const uniqueFolders = [];
    const seenNames = new Map();

    for (const f of folders) {
      const key = `${f.name}_${f.category}`;
      const fCount = Array.isArray(f.fileIds) ? f.fileIds.length : 0;

      if (!seenNames.has(key)) {
        seenNames.set(key, uniqueFolders.length);
        uniqueFolders.push(f);
      } else {
        const existingIdx = seenNames.get(key);
        const existing = uniqueFolders[existingIdx];
        const existingCount = Array.isArray(existing.fileIds) ? existing.fileIds.length : 0;

        // If the newer/other folder has more files, prefer it
        if (fCount > existingCount) {
          uniqueFolders[existingIdx] = f;
        }
      }
    }

    res.status(200).json({ success: true, folders: uniqueFolders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create custom smart folder
// @route   POST /api/ai/folders
export const createSmartFolder = async (req, res) => {
  try {
    const { name, category, color, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Folder name is required' });

    const folder = await SmartFolder.create({
      userId: req.user._id,
      name,
      category: category || name,
      color: color || '#8B5CF6',
      icon: icon || 'Folder',
      isAIGenerated: false,
    });

    res.status(201).json({ success: true, folder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Merge smart folders
// @route   POST /api/ai/folders/:folderId/merge
export const mergeSmartFolders = async (req, res) => {
  try {
    const { sourceFolderId } = req.body;
    const target = await smartFolderService.mergeFolders(req.params.folderId, sourceFolderId, req.user._id);
    res.status(200).json({ success: true, folder: target });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Natural Language Semantic Search
// @route   POST /api/ai/search
export const searchAI = async (req, res) => {
  try {
    const { query, category, minQuality, limit } = req.body;
    const results = await semanticSearch.search(query, req.user._id, { category, minQuality, limit });
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get search suggestions
// @route   GET /api/ai/search/suggestions
export const getSearchSuggestions = async (req, res) => {
  try {
    const suggestions = await semanticSearch.getSuggestions(req.user._id);
    res.status(200).json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get duplicate groups
// @route   GET /api/ai/duplicates
export const getDuplicates = async (req, res) => {
  try {
    const groups = await DuplicateGroup.find({ userId: req.user._id, isResolved: false })
      .populate('primaryFileId', 'originalName fileSize cloudinaryUrl thumbnailKey')
      .populate('duplicateFileIds', 'originalName fileSize cloudinaryUrl thumbnailKey')
      .sort('-potentialSavingsBytes');

    res.status(200).json({ success: true, groups, duplicates: groups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Resolve duplicate group
// @route   POST /api/ai/duplicates/:groupId/resolve
export const resolveDuplicateGroup = async (req, res) => {
  try {
    const { action = 'delete_selected', fileIdsToDelete } = req.body;
    const result = await duplicateService.resolveGroup(req.params.groupId, action, fileIdsToDelete, req.user._id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Preview organization proposed by AI
// @route   POST /api/ai/organize/preview
export const previewOrganization = async (req, res) => {
  try {
    const { fileIds } = req.body;
    const preview = await smartFolderService.previewOrganization(fileIds, req.user._id);
    res.status(200).json({ success: true, preview });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Undo previous organization
// @route   POST /api/ai/organize/undo
export const undoOrganization = async (req, res) => {
  try {
    const { historyId } = req.body;
    const result = await smartFolderService.undoOrganization(historyId, req.user._id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get organization history
// @route   GET /api/ai/organization-history
export const getOrganizationHistory = async (req, res) => {
  try {
    const history = await OrganizationHistory.find({ userId: req.user._id })
      .sort('-createdAt')
      .limit(30);
    res.status(200).json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get AI user settings
// @route   GET /api/ai/settings
export const getAISettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('aiPreferences');
    res.status(200).json({ success: true, settings: user.aiPreferences });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update AI user settings
// @route   PATCH /api/ai/settings
export const updateAISettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.aiPreferences = {
      ...user.aiPreferences.toObject(),
      ...req.body,
    };
    await user.save();
    res.status(200).json({ success: true, settings: user.aiPreferences });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
