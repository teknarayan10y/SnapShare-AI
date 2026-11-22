import mongoose from 'mongoose';
import { PersonProfile } from '../models/PersonProfile.js';
import { FaceDetection } from '../models/FaceDetection.js';
import { GroupFolder } from '../models/GroupFolder.js';
import { OrganizationRule } from '../models/OrganizationRule.js';
import { OrganizationJob } from '../models/OrganizationJob.js';
import { OrganizationHistory } from '../models/OrganizationHistory.js';
import { SmartFolder } from '../models/SmartFolder.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { AIJob } from '../models/AIJob.js';
import { aiJobQueue } from '../services/aiJobQueue.js';
import { aiClient } from '../services/aiMicroserviceClient.js';
import { faceOrganizationService } from '../services/faceOrganizationService.js';
import { ruleEngineService } from '../services/ruleEngineService.js';

// =============================================================
// 1. FACE DETECTION ENDPOINTS
// =============================================================

export const analyzeFace = async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ success: false, error: 'File ID is required' });

    const file = await File.findOne({ _id: fileId, ownerId: req.user._id });
    if (!file) return res.status(404).json({ success: false, error: 'File not found' });

    const user = await User.findById(req.user._id);
    const hasConsent = user?.aiPreferences?.enableFaceMatching ?? false;
    const threshold = user?.aiPreferences?.faceDetectionThreshold || 0.70;

    const faceRes = await aiClient.analyzeFaces(
      file.cloudinaryUrl || '',
      file.originalName,
      file.cloudinaryUrl,
      hasConsent,
      threshold
    );

    let matchedProfiles = [];
    let updatedFaces = faceRes.faces || [];

    if (hasConsent && updatedFaces.length > 0) {
      const matchResult = await faceOrganizationService.matchFacesToProfiles(
        updatedFaces,
        req.user._id,
        file.collectionId
      );
      updatedFaces = matchResult.updatedFaces;
      matchedProfiles = matchResult.matchedProfiles;
    }

    const detectionRecord = await FaceDetection.findOneAndUpdate(
      { fileId: file._id, userId: req.user._id },
      {
        fileId: file._id,
        userId: req.user._id,
        collectionId: file.collectionId,
        boundingBoxes: updatedFaces,
        detectionConfidence: updatedFaces[0]?.detectionConfidence || 0,
        faceCount: faceRes.faceCount,
        matchedProfileIds: matchedProfiles.map((p) => p._id),
        analysisStatus: (hasConsent && matchedProfiles.length < faceRes.faceCount && faceRes.faceCount <= 4) ? 'needs_review' : 'completed',
      },
      { upsert: true, new: true }
    ).populate('matchedProfileIds', 'displayName unnamedId sampleFaceUrl');

    res.status(200).json({
      success: true,
      detection: detectionRecord,
      faceCount: faceRes.faceCount,
      photoComposition: faceRes.photoComposition,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const analyzeBulkFaces = async (req, res) => {
  try {
    const { fileIds, collectionId } = req.body;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Valid array of fileIds required' });
    }

    const jobs = await aiJobQueue.enqueueBulk(fileIds, req.user._id, collectionId);
    res.status(202).json({
      success: true,
      message: `Enqueued ${jobs.length} files for face intelligence analysis`,
      jobCount: jobs.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getFaceJobs = async (req, res) => {
  try {
    const jobs = await AIJob.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('fileId', 'originalName fileExtension cloudinaryUrl');
    res.status(200).json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getFaceJobById = async (req, res) => {
  try {
    const job = await AIJob.findOne({ _id: req.params.jobId, userId: req.user._id }).populate('fileId');
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.status(200).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// =============================================================
// 2. PERSON PROFILE ENDPOINTS (Section 5)
// =============================================================

export const getPeople = async (req, res) => {
  try {
    const people = await PersonProfile.find({
      userId: req.user._id,
      status: { $in: ['active', 'unconfirmed'] },
    }).sort({ createdAt: -1 });

    // Attach sample photo thumbnail to each profile
    const enhancedPeople = await Promise.all(
      people.map(async (p) => {
        const detection = await FaceDetection.findOne({
          userId: req.user._id,
          matchedProfileIds: p._id,
        }).populate('fileId', 'cloudinaryUrl originalName');

        return {
          ...p.toObject(),
          samplePhotoUrl: detection?.fileId?.cloudinaryUrl || p.sampleFaceUrl || '',
          sampleFileId: detection?.fileId?._id || null,
        };
      })
    );

    res.status(200).json({ success: true, people: enhancedPeople });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createPerson = async (req, res) => {
  try {
    const { displayName, collectionId } = req.body;
    if (!displayName) {
      return res.status(400).json({ success: false, error: 'Display name is required' });
    }

    const count = await PersonProfile.countDocuments({ userId: req.user._id });
    const unnamedId = `person_${new mongoose.Types.ObjectId().toString().slice(-6)}`;

    const profile = await PersonProfile.create({
      userId: req.user._id,
      collectionId: collectionId || null,
      displayName,
      unnamedId,
      consentStatus: true,
      status: 'active',
      fileCount: 0,
    });

    res.status(201).json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updatePerson = async (req, res) => {
  try {
    const { displayName } = req.body;
    if (!displayName) {
      return res.status(400).json({ success: false, error: 'Display name is required' });
    }

    const profile = await PersonProfile.findOneAndUpdate(
      { _id: req.params.personId, userId: req.user._id },
      { displayName: displayName.trim() },
      { new: true }
    );

    if (!profile) return res.status(404).json({ success: false, error: 'Person profile not found' });

    // Update corresponding SmartFolder name if it exists
    await SmartFolder.updateOne(
      { userId: req.user._id, category: 'Individual Photos', personName: profile.displayName },
      { name: displayName.trim(), personName: displayName.trim() }
    );

    res.status(200).json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deletePerson = async (req, res) => {
  try {
    const profile = await PersonProfile.findOne({ _id: req.params.personId, userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, error: 'Person profile not found' });

    // Soft-delete profile and remove references from face detections
    profile.status = 'deleted';
    await profile.save();

    await FaceDetection.updateMany(
      { userId: req.user._id, matchedProfileIds: profile._id },
      { $pull: { matchedProfileIds: profile._id } }
    );

    res.status(200).json({ success: true, message: 'Person profile deleted safely' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const mergePeople = async (req, res) => {
  try {
    const { targetProfileId, sourceProfileIds } = req.body;
    if (!targetProfileId || !Array.isArray(sourceProfileIds) || sourceProfileIds.length === 0) {
      return res.status(400).json({ success: false, error: 'targetProfileId and sourceProfileIds array required' });
    }

    const targetProfile = await PersonProfile.findOne({ _id: targetProfileId, userId: req.user._id });
    if (!targetProfile) return res.status(404).json({ success: false, error: 'Target profile not found' });

    // Update FaceDetections: replace source profile IDs with target profile ID
    await FaceDetection.updateMany(
      { userId: req.user._id, matchedProfileIds: { $in: sourceProfileIds } },
      { $addToSet: { matchedProfileIds: targetProfile._id }, $pull: { matchedProfileIds: { $in: sourceProfileIds } } }
    );

    // Mark source profiles as merged
    await PersonProfile.updateMany(
      { _id: { $in: sourceProfileIds }, userId: req.user._id },
      { status: 'merged' }
    );

    // Recalculate file count for target profile
    const matchCount = await FaceDetection.countDocuments({
      userId: req.user._id,
      matchedProfileIds: targetProfile._id,
    });
    targetProfile.fileCount = matchCount;
    await targetProfile.save();

    res.status(200).json({ success: true, message: 'Profiles merged successfully', targetProfile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const splitPerson = async (req, res) => {
  try {
    const { personId, fileIds, newPersonName } = req.body;
    if (!personId || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ success: false, error: 'personId and fileIds required' });
    }

    const originalProfile = await PersonProfile.findOne({ _id: personId, userId: req.user._id });
    if (!originalProfile) return res.status(404).json({ success: false, error: 'Profile not found' });

    const unnamedId = `person_${new mongoose.Types.ObjectId().toString().slice(-6)}`;
    const newProfile = await PersonProfile.create({
      userId: req.user._id,
      displayName: newPersonName || `Person #${Date.now().toString().slice(-4)}`,
      unnamedId,
      consentStatus: true,
      status: 'active',
      fileCount: fileIds.length,
    });

    // Move file associations in FaceDetection
    await FaceDetection.updateMany(
      { userId: req.user._id, fileId: { $in: fileIds } },
      { $addToSet: { matchedProfileIds: newProfile._id }, $pull: { matchedProfileIds: originalProfile._id } }
    );

    res.status(200).json({ success: true, message: 'Person profile split successfully', newProfile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// =============================================================
// 3. GROUP ORGANIZATION ENDPOINTS (Section 6, 7, 8, 11)
// =============================================================

export const previewGroupOrganization = async (req, res) => {
  try {
    const { fileIds, collectionId } = req.body;
    const filter = { ownerId: req.user._id };
    if (fileIds && fileIds.length > 0) filter._id = { $in: fileIds };
    if (collectionId) filter.collectionId = collectionId;

    const files = await File.find(filter);
    const detections = await FaceDetection.find({
      userId: req.user._id,
      fileId: { $in: files.map((f) => f._id) },
    }).populate('matchedProfileIds', 'displayName');

    let totalDetectedFaces = 0;
    let groupPhotosCount = 0;
    let fourMemberCount = 0;
    let threeMemberCount = 0;
    let twoMemberCount = 0;
    let singleCount = 0;
    let zeroCount = 0;
    let needsReviewCount = 0;

    for (const file of files) {
      const det = detections.find((d) => String(d.fileId) === String(file._id));
      const fCount = det ? det.faceCount : (file.personCount || 0);
      totalDetectedFaces += fCount;

      if (fCount > 4) groupPhotosCount++;
      else if (fCount === 4) fourMemberCount++;
      else if (fCount === 3) threeMemberCount++;
      else if (fCount === 2) twoMemberCount++;
      else if (fCount === 1) singleCount++;
      else zeroCount++;

      if (det?.analysisStatus === 'needs_review' || (fCount > 0 && fCount <= 4 && (!det || det.matchedProfileIds.length < fCount))) {
        needsReviewCount++;
      }
    }

    const proposedFolders = [
      { name: 'Group Photos (>4 People)', count: groupPhotosCount, action: 'Reuse / Associate' },
      { name: 'Four Member Groups', count: fourMemberCount, action: 'Create / Match combination' },
      { name: 'Three Member Groups', count: threeMemberCount, action: 'Create / Match combination' },
      { name: 'Two Member Groups', count: twoMemberCount, action: 'Create / Match combination' },
      { name: 'Individual Photos', count: singleCount, action: 'Route to personal folders' },
      { name: 'Needs Review', count: needsReviewCount, action: 'Hold for user review' },
    ];

    res.status(200).json({
      success: true,
      preview: {
        totalFiles: files.length,
        totalDetectedFaces,
        groupPhotosCount,
        fourMemberCount,
        threeMemberCount,
        twoMemberCount,
        singleCount,
        zeroCount,
        needsReviewCount,
        proposedFolders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const executeGroupOrganization = async (req, res) => {
  try {
    const { fileIds, collectionId } = req.body;
    const filter = { ownerId: req.user._id };
    if (fileIds && fileIds.length > 0) filter._id = { $in: fileIds };
    if (collectionId) filter.collectionId = collectionId;

    const files = await File.find(filter);
    const user = await User.findById(req.user._id);
    const hasConsent = user?.aiPreferences?.enableFaceMatching ?? false;

    let processedCount = 0;
    const assignedFoldersLog = [];

    for (const file of files) {
      const detection = await FaceDetection.findOne({ fileId: file._id, userId: req.user._id }).populate('matchedProfileIds');
      const faceCount = detection ? detection.faceCount : (file.personCount || 0);

      const result = await faceOrganizationService.organizePhotoByRules({
        file,
        userId: req.user._id,
        collectionId: file.collectionId,
        faceCount,
        faces: detection?.boundingBoxes || [],
        matchedProfiles: detection?.matchedProfileIds || [],
        hasConsent,
      });

      if (result.assignedFolders?.length > 0) {
        assignedFoldersLog.push(...result.assignedFolders);
      }
      processedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully organized ${processedCount} photos based on deterministic face rules`,
      processedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getGroupFolders = async (req, res) => {
  try {
    const groups = await GroupFolder.find({ userId: req.user._id })
      .populate('memberProfileIds', 'displayName unnamedId')
      .populate('folderId', 'name category color icon fileIds')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getGroupFolderById = async (req, res) => {
  try {
    const group = await GroupFolder.findOne({ _id: req.params.groupId, userId: req.user._id })
      .populate('memberProfileIds', 'displayName unnamedId')
      .populate('folderId')
      .populate('fileIds');

    if (!group) return res.status(404).json({ success: false, error: 'Group folder not found' });
    res.status(200).json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// =============================================================
// 4. NATURAL LANGUAGE RULES (Section 9 & 10)
// =============================================================

export const interpretRule = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, error: 'Command prompt is required' });

    const result = ruleEngineService.interpretCommand(prompt);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const validateRule = async (req, res) => {
  try {
    const { ruleJSON } = req.body;
    const result = ruleEngineService.validateRule(ruleJSON);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createRule = async (req, res) => {
  try {
    const { name, ruleJSON, naturalLanguagePrompt, priority } = req.body;
    if (!name || !ruleJSON) {
      return res.status(400).json({ success: false, error: 'Name and ruleJSON are required' });
    }

    const validation = ruleEngineService.validateRule(ruleJSON);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const rule = await OrganizationRule.create({
      userId: req.user._id,
      name,
      naturalLanguagePrompt: naturalLanguagePrompt || '',
      ruleJSON,
      priority: priority || 1,
      enabled: true,
    });

    res.status(201).json({ success: true, rule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getRules = async (req, res) => {
  try {
    const rules = await OrganizationRule.find({ userId: req.user._id }).sort({ priority: -1, createdAt: -1 });
    res.status(200).json({ success: true, rules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateRule = async (req, res) => {
  try {
    const rule = await OrganizationRule.findOneAndUpdate(
      { _id: req.params.ruleId, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!rule) return res.status(404).json({ success: false, error: 'Rule not found' });
    res.status(200).json({ success: true, rule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteRule = async (req, res) => {
  try {
    const rule = await OrganizationRule.findOneAndDelete({ _id: req.params.ruleId, userId: req.user._id });
    if (!rule) return res.status(404).json({ success: false, error: 'Rule not found' });
    res.status(200).json({ success: true, message: 'Rule deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// =============================================================
// 5. HISTORY & UNDO (Section 12)
// =============================================================

export const getHistory = async (req, res) => {
  try {
    const history = await OrganizationHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('affectedFileIds', 'originalName fileExtension');
    res.status(200).json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const undoHistory = async (req, res) => {
  try {
    const { historyId } = req.body;
    const history = await OrganizationHistory.findOne({ _id: historyId, userId: req.user._id });
    if (!history || history.isUndone) {
      return res.status(400).json({ success: false, error: 'History record not found or already undone' });
    }

    // Pull affected files from folders
    for (const folderRef of history.affectedFolders || []) {
      await SmartFolder.updateOne(
        { _id: folderRef.folderId, userId: req.user._id },
        { $pull: { fileIds: { $in: history.affectedFileIds } } }
      );
    }

    // Unlink folders from files
    const fIds = (history.affectedFolders || []).map((f) => f.folderId);
    await File.updateMany(
      { _id: { $in: history.affectedFileIds }, ownerId: req.user._id },
      { $pull: { smartFolderIds: { $in: fIds } } }
    );

    history.isUndone = true;
    await history.save();

    res.status(200).json({ success: true, message: 'Organization operation undone successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const restoreHistory = async (req, res) => {
  try {
    const { historyId } = req.body;
    const history = await OrganizationHistory.findOne({ _id: historyId, userId: req.user._id });
    if (!history) return res.status(404).json({ success: false, error: 'History record not found' });

    for (const folderRef of history.affectedFolders || []) {
      await SmartFolder.updateOne(
        { _id: folderRef.folderId, userId: req.user._id },
        { $addToSet: { fileIds: { $in: history.affectedFileIds } } }
      );
    }

    const fIds = (history.affectedFolders || []).map((f) => f.folderId);
    await File.updateMany(
      { _id: { $in: history.affectedFileIds }, ownerId: req.user._id },
      { $addToSet: { smartFolderIds: { $in: fIds } } }
    );

    history.isUndone = false;
    await history.save();

    res.status(200).json({ success: true, message: 'Organization operation restored successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// =============================================================
// 6. PRIVACY & CONSENT (Section 5 & 19)
// =============================================================

export const getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('aiPreferences');
    res.status(200).json({
      success: true,
      privacy: {
        enableFaceDetection: user?.aiPreferences?.enableFaceDetection ?? true,
        enableFaceMatching: user?.aiPreferences?.enableFaceMatching ?? false,
        faceDetectionThreshold: user?.aiPreferences?.faceDetectionThreshold || 0.85,
        faceMatchingThreshold: user?.aiPreferences?.faceMatchingThreshold || 0.95,
        organizationMode: user?.aiPreferences?.organizationMode || 'automatic',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updatePrivacySettings = async (req, res) => {
  try {
    const { enableFaceDetection, enableFaceMatching, faceDetectionThreshold, faceMatchingThreshold } = req.body;

    const updates = {};
    if (enableFaceDetection !== undefined) updates['aiPreferences.enableFaceDetection'] = Boolean(enableFaceDetection);
    if (enableFaceMatching !== undefined) updates['aiPreferences.enableFaceMatching'] = Boolean(enableFaceMatching);
    if (faceDetectionThreshold !== undefined) updates['aiPreferences.faceDetectionThreshold'] = Number(faceDetectionThreshold);
    if (faceMatchingThreshold !== undefined) updates['aiPreferences.faceMatchingThreshold'] = Number(faceMatchingThreshold);

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select('aiPreferences');
    res.status(200).json({ success: true, privacy: user.aiPreferences });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const purgeFaceData = async (req, res) => {
  try {
    // Strictly purge all face profiles, face embeddings, group combinations, and detections for this user
    await Promise.all([
      PersonProfile.deleteMany({ userId: req.user._id }),
      FaceDetection.deleteMany({ userId: req.user._id }),
      GroupFolder.deleteMany({ userId: req.user._id }),
      User.findByIdAndUpdate(req.user._id, {
        $set: {
          'aiPreferences.enableFaceMatching': false,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'All private face data, embeddings, and profiles have been permanently purged.',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
