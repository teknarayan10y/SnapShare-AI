import path from 'path';
import fs from 'fs';
import { AIJob } from '../models/AIJob.js';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { aiClient } from './aiMicroserviceClient.js';
import { storageService } from './storageService.js';
import { smartFolderService } from './smartFolderService.js';
import { duplicateService } from './duplicateService.js';
import { FaceDetection } from '../models/FaceDetection.js';
import { PersonProfile } from '../models/PersonProfile.js';
import { faceOrganizationService } from './faceOrganizationService.js';
import { generateAICaption } from './captionService.js';

class AIJobQueue {
  constructor() {
    this.concurrency = 4;
    this.activeWorkers = 0;
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Enqueue a file for AI analysis
   */
  async enqueue(fileId, userId, collectionId = null, jobType = 'full_analysis') {
    const job = await AIJob.create({
      fileId,
      userId,
      collectionId,
      jobType,
      status: 'queued',
      progress: 0,
    });

    this.queue.push(job._id.toString());
    this.processNext();
    return job;
  }

  /**
   * Enqueue multiple files
   */
  async enqueueBulk(fileIds, userId, collectionId = null) {
    const jobs = [];
    for (const fId of fileIds) {
      const job = await this.enqueue(fId, userId, collectionId);
      jobs.push(job);
    }
    return jobs;
  }

  /**
   * Worker loop
   */
  async processNext() {
    if (this.activeWorkers >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const jobId = this.queue.shift();
    this.activeWorkers++;

    try {
      await this.executeJob(jobId);
    } catch (err) {
      console.error(`❌ [AI Job ${jobId} Execution Error]:`, err.message);
    } finally {
      this.activeWorkers--;
      // Process next in queue
      if (this.queue.length > 0) {
        this.processNext();
      }
    }
  }

  /**
   * Execute single AI job
   */
  async executeJob(jobId) {
    const job = await AIJob.findById(jobId);
    if (!job || job.status === 'cancelled') return;

    job.status = 'processing';
    job.progress = 15;
    job.startedAt = new Date();
    await job.save();

    const file = await File.findById(job.fileId);
    if (!file) {
      job.status = 'failed';
      job.error = 'Target file record not found';
      return await job.save();
    }

    file.aiStatus = 'processing';
    await file.save();

    const startTime = Date.now();
    let filePath = storageService.getFilePath(file.storageKey);

    // If file is on Cloudinary and not locally present, download temporary chunk
    let tempDownloaded = false;
    if (!fs.existsSync(filePath) && file.cloudinaryUrl) {
      // In cloud mode, pass file URL or temporary buffer
      filePath = file.cloudinaryUrl;
    }

    try {
      job.progress = 40;
      await job.save();

      const ext = (file.fileExtension || '').toLowerCase();
      let analysisResult = null;
      const category = file.metadata?.aiCategory || 'other';

      // Route to correct microservice analysis pipeline
      if (category === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg'].includes(ext)) {
        analysisResult = await aiClient.analyzeImage(filePath, file.originalName, file.cloudinaryUrl);
      } else if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'php', 'html', 'css', 'sql', 'json'].includes(ext)) {
        analysisResult = await aiClient.analyzeCode(filePath, file.originalName);
      } else {
        analysisResult = await aiClient.analyzeDocument(filePath, file.originalName, file.mimeType);
      }

      job.progress = 75;
      await job.save();

      const durationMs = Date.now() - startTime;

      // Create persistent AIAnalysis record
      const analysisRecord = await AIAnalysis.create({
        fileId: file._id,
        userId: job.userId,
        status: 'completed',
        caption: analysisResult.caption || analysisResult.description || analysisResult.summary || '',
        detectedObjects: analysisResult.detectedObjects || [],
        scenes: analysisResult.scenes || [],
        tags: analysisResult.tags || analysisResult.keywords || [],
        categories: analysisResult.categories || [analysisResult.category || 'General'],
        colors: analysisResult.colors || {},
        quality: analysisResult.quality || {},
        perceptualHash: analysisResult.perceptualHash || '',
        personCount: analysisResult.personCount || 0,
        photoComposition: analysisResult.photoComposition || 'non_human',
        personSignature: analysisResult.personSignature || [],
        documentData: {
          summary: analysisResult.summary || '',
          keywords: analysisResult.keywords || [],
          wordCount: analysisResult.wordCount || 0,
          topics: analysisResult.topics || [],
        },
        codeData: {
          language: analysisResult.language || '',
          lineCount: analysisResult.lineCount || 0,
          frameworks: analysisResult.frameworks || [],
          description: analysisResult.description || '',
        },
        embedding: analysisResult.embedding || [],
        processingDurationMs: durationMs,
      });

      // Privacy and Face Detection processing
      const user = await User.findById(job.userId);
      const enableFaceDetection = user?.aiPreferences?.enableFaceDetection ?? true;
      const enableFaceMatching = true; // Always generate embeddings and match people across images
      const faceDetThreshold = 0.55;   // Deep neural YuNet optimal threshold
      const faceMatchThreshold = 0.45; // SFace normalized cosine similarity threshold

      let faceDetectionRecord = null;
      let matchedProfiles = [];
      let facesData = [];
      let actualFaceCount = 0;
      let isLowConfidence = false;

      const isImage = category === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg'].includes(ext);

      if (isImage && enableFaceDetection) {
        try {
          const faceRes = await aiClient.analyzeFaces(filePath, file.originalName, file.cloudinaryUrl, true, faceDetThreshold);
          actualFaceCount = faceRes.faceCount || 0;
          facesData = faceRes.faces || [];
          if (faceRes.needsReview || (actualFaceCount > 0 && facesData.some(f => (f.detectionConfidence || 1) < 0.60))) {
            isLowConfidence = true;
          }

          if (enableFaceMatching && facesData.length > 0) {
            const matchRes = await faceOrganizationService.matchFacesToProfiles(facesData, job.userId, job.collectionId, faceMatchThreshold);
            facesData = matchRes.updatedFaces;
            matchedProfiles = matchRes.matchedProfiles;
          }

          faceDetectionRecord = await FaceDetection.findOneAndUpdate(
            { fileId: file._id, userId: job.userId },
            {
              fileId: file._id,
              userId: job.userId,
              collectionId: job.collectionId || null,
              boundingBoxes: facesData,
              detectionConfidence: facesData[0]?.detectionConfidence || 0,
              faceCount: actualFaceCount,
              matchedProfileIds: matchedProfiles.map((p) => p._id),
              analysisStatus: isLowConfidence ? 'needs_review' : 'completed',
            },
            { upsert: true, new: true }
          );
        } catch (fErr) {
          console.warn('[Face Detection Job Warning]:', fErr.message);
          isLowConfidence = true;
        }
      }

      // Determine final composition strictly conforming to 5-tier rules:
      // 1 person -> solo, 2 people -> two_people, 3 people -> three_people, 4 people -> four_people, 5+ -> group
      const finalFaceCount = actualFaceCount || analysisResult.personCount || 0;
      let finalComposition = 'non_human';
      if (finalFaceCount > 4) finalComposition = 'group';
      else if (finalFaceCount === 4) finalComposition = 'four_people';
      else if (finalFaceCount === 3) finalComposition = 'three_people';
      else if (finalFaceCount === 2) finalComposition = 'two_people';
      else if (finalFaceCount === 1) finalComposition = 'solo';
      else finalComposition = 'non_human';

      // Update File with AI metadata & person count
      file.aiStatus = 'analyzed';
      file.aiAnalysisId = analysisRecord._id;
      file.aiCaption = analysisRecord.caption;
      file.aiTags = analysisRecord.tags;
      file.personCount = finalFaceCount;
      file.photoComposition = finalComposition;

      // Synthesize AI-powered photo caption using Gemini Vision API (falls back to smart template)
      file.aiCaption = await generateAICaption(file);

      // Ensure tags strictly reflect verified composition without robotic phrases
      if (finalFaceCount > 4) {
        file.aiTags = Array.from(new Set([...(file.aiTags || []), 'Group', 'Group Photo', 'People', 'Social', 'Group Gathering'])).filter(t => !['Solo', 'Single Photo', 'Portrait'].includes(t));
      } else if (finalFaceCount === 4) {
        file.aiTags = Array.from(new Set([...(file.aiTags || []), 'Four People', 'Four-Member Group', 'Quartet'])).filter(t => !['Solo', 'Single Photo'].includes(t));
      } else if (finalFaceCount === 3) {
        file.aiTags = Array.from(new Set([...(file.aiTags || []), 'Three People', 'Three-Member Group', 'Trio'])).filter(t => !['Solo', 'Single Photo'].includes(t));
      } else if (finalFaceCount === 2) {
        file.aiTags = Array.from(new Set([...(file.aiTags || []), 'Two People', 'Pair', 'Couple', 'Duo'])).filter(t => !['Solo', 'Single Photo'].includes(t));
      } else if (finalFaceCount === 1) {
        file.aiTags = Array.from(new Set([...(file.aiTags || []), 'Solo', 'Single Photo', 'Portrait'])).filter(t => !['Group Photo', 'Group', 'People'].includes(t));
      }
      file.detectedObjects = (analysisResult.detectedObjects || []).map((o) => o.label);
      file.sceneLabels = (analysisResult.scenes || []).map((s) => s.label);
      file.qualityScore = analysisResult.quality?.overallScore || 100;
      file.perceptualHash = analysisResult.perceptualHash || '';
      file.embedding = analysisResult.embedding || [];
      await file.save();

      // Trigger Smart Folder Organization
      const orgMode = user?.aiPreferences?.organizationMode || 'automatic';

      if (isImage) {
        // Execute Deterministic Face-based Organization Rules (Rules A-G)
        await faceOrganizationService.organizePhotoByRules({
          file,
          userId: job.userId,
          collectionId: job.collectionId,
          faceCount: finalFaceCount,
          faces: facesData,
          matchedProfiles,
          hasConsent: true,
          isLowConfidence,
        });

        // Also route non-human content to general semantic category folders (Rule F)
        if (finalFaceCount === 0 && !isLowConfidence) {
          await smartFolderService.organizeFile(file, analysisRecord, job.userId, orgMode);
        }
      } else {
        // Standard category organization for documents and code
        await smartFolderService.organizeFile(file, analysisRecord, job.userId, orgMode);
      }

      // Trigger Perceptual Duplicate & Exact Hash Detection
      if (file.perceptualHash) {
        await duplicateService.scanDuplicates(file, job.userId);
      }

      // Mark Job Completed
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();
      await job.save();

      // Update User monthly quota stats
      await User.findByIdAndUpdate(job.userId, {
        $inc: { 'aiPreferences.aiUsageThisMonth': 1 },
      });
    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
      await job.save();

      file.aiStatus = 'failed';
      await file.save();
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId) {
    const job = await AIJob.findById(jobId);
    if (!job) return null;

    job.status = 'queued';
    job.progress = 0;
    job.retryCount += 1;
    job.error = null;
    await job.save();

    this.queue.push(job._id.toString());
    this.processNext();
    return job;
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId) {
    const job = await AIJob.findById(jobId);
    if (!job) return null;

    if (job.status === 'queued') {
      job.status = 'cancelled';
      await job.save();
      this.queue = this.queue.filter((id) => id !== jobId);
    }
    return job;
  }
}

export const aiJobQueue = new AIJobQueue();
