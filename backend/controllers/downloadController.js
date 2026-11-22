import fs from 'fs';
import { Collection } from '../models/Collection.js';
import { File } from '../models/File.js';
import { Analytics } from '../models/Analytics.js';
import { zipService } from '../services/zipService.js';

// @desc    Prepare asynchronous ZIP archive for all or selected files
// @route   POST /api/downloads/prepare
export const prepareDownloadJob = async (req, res) => {
  try {
    const { collectionId, fileIds } = req.body;

    if (!collectionId) {
      return res.status(400).json({ success: false, error: 'collectionId is required' });
    }

    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    if (!collection.allowDownloads) {
      return res.status(403).json({ success: false, error: 'Downloads are disabled by the collection owner' });
    }

    // Query files
    const query = { collectionId: collection._id };
    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      query._id = { $in: fileIds };
    }

    const files = await File.find(query);
    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files available for download' });
    }

    const jobId = await zipService.startZipJob(files, collection.title);

    // Record bulk download analytics
    await Analytics.create({
      collectionId: collection._id,
      eventType: 'bulk_download',
      device: 'desktop',
    });

    res.status(202).json({
      success: true,
      jobId,
      totalFiles: files.length,
      message: 'Archive preparation started',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get status of an archiving job
// @route   GET /api/downloads/:jobId/status
export const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = zipService.getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Download job not found or expired' });
    }

    res.status(200).json({
      success: true,
      job: {
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        totalFiles: job.totalFiles,
        processedFiles: job.processedFiles,
        fileName: job.fileName,
        fileSize: job.fileSize,
        error: job.error,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Download prepared ZIP archive file
// @route   GET /api/downloads/:jobId/file
export const downloadJobFile = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = zipService.getJobStatus(jobId);

    if (!job || job.status !== 'completed') {
      return res.status(404).json({ success: false, error: 'Archive is not ready or does not exist' });
    }

    if (!fs.existsSync(job.tempFilePath)) {
      return res.status(410).json({ success: false, error: 'Prepared archive file has expired' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(job.fileName)}"`);

    const readStream = fs.createReadStream(job.tempFilePath);
    readStream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Direct stream ZIP archive for immediate one-click download
// @route   POST /api/downloads/stream
export const streamZipDownload = async (req, res) => {
  try {
    const { collectionId, fileIds } = req.body;

    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    const query = { collectionId: collection._id };
    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      query._id = { $in: fileIds };
    }

    const files = await File.find(query);
    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files to download' });
    }

    const safeTitle = `${collection.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`;
    await zipService.streamZip(files, res, safeTitle);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
