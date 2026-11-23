import mongoose from 'mongoose';
import { SmartFolder } from '../models/SmartFolder.js';
import { PersonProfile } from '../models/PersonProfile.js';
import { FaceDetection } from '../models/FaceDetection.js';
import { GroupFolder } from '../models/GroupFolder.js';
import { OrganizationHistory } from '../models/OrganizationHistory.js';
import { File } from '../models/File.js';

class FaceOrganizationService {
  /**
   * Cosine similarity between two dense embedding vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const len = Math.min(vecA.length, vecB.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Deterministic Group Key Generator (Section 7)
   * Two photos containing the same members produce identical keys regardless of face ordering.
   */
  generateGroupKey({ userId, collectionId = 'default', memberIds = [] }) {
    const sortedIds = [...new Set(memberIds.map(String))].sort();
    return [
      String(userId),
      String(collectionId || 'default'),
      ...sortedIds,
    ].join('_');
  }

  /**
   * Ensure hierarchical base folders exist (Section 8)
   */
  async ensureBaseFolders(userId, collectionId = null) {
    const baseFolders = [
      { name: 'People', category: 'People', icon: 'Users', color: '#8B5CF6', isRoot: true },
      { name: 'Solo', category: 'Solo', icon: 'User', color: '#8B5CF6', parent: 'People' },
      { name: 'Two People', category: 'Two People', icon: 'UserCheck', color: '#3B82F6', parent: 'People' },
      { name: 'Three People', category: 'Three People', icon: 'Users', color: '#10B981', parent: 'People' },
      { name: 'Four People', category: 'Four People', icon: 'Users', color: '#F59E0B', parent: 'People' },
      { name: 'Group', category: 'Group', icon: 'Sparkles', color: '#EC4899', parent: 'People' },
      { name: 'Needs Review', category: 'Needs Review', icon: 'AlertCircle', color: '#EF4444', parent: 'People' },
    ];

    const folderMap = {};

    for (const b of baseFolders) {
      // Check for folder by new name OR legacy alias name
      const aliasNames = [b.name];
      if (b.name === 'Solo') aliasNames.push('Individual Photos', 'Single Photos', 'Solo Photos');
      if (b.name === 'Two People') aliasNames.push('Two Member Groups', 'Pair Photos');
      if (b.name === 'Three People') aliasNames.push('Three Member Groups');
      if (b.name === 'Four People') aliasNames.push('Four Member Groups');
      if (b.name === 'Group') aliasNames.push('Group Photos');

      let folder = await SmartFolder.findOne({
        userId,
        name: { $in: aliasNames },
      });

      if (!folder) {
        folder = await SmartFolder.create({
          userId,
          collectionId: collectionId || null,
          name: b.name,
          category: b.category,
          icon: b.icon,
          color: b.color,
          isAIGenerated: true,
          fileIds: [],
        });
      } else if (folder.name !== b.name) {
        // Upgrade legacy folder name to official name
        folder.name = b.name;
        folder.category = b.category;
        folder.icon = b.icon;
        folder.color = b.color;
        await folder.save();
      }
      folderMap[b.name] = folder;
    }

    // Set convenience alias mappings
    folderMap['Individual Photos'] = folderMap['Solo'];
    folderMap['Single Photos'] = folderMap['Solo'];
    folderMap['Solo Photos'] = folderMap['Solo'];
    folderMap['Two Member Groups'] = folderMap['Two People'];
    folderMap['Pair Photos'] = folderMap['Two People'];
    folderMap['Three Member Groups'] = folderMap['Three People'];
    folderMap['Four Member Groups'] = folderMap['Four People'];
    folderMap['Group Photos'] = folderMap['Group'];

    // Set parent relationships
    for (const b of baseFolders) {
      if (b.parent && folderMap[b.parent] && folderMap[b.name]) {
        if (!folderMap[b.name].parentFolderId || String(folderMap[b.name].parentFolderId) !== String(folderMap[b.parent]._id)) {
          folderMap[b.name].parentFolderId = folderMap[b.parent]._id;
          await folderMap[b.name].save();
        }
      }
    }

    return folderMap;
  }

  /**
   * Privacy-conscious face matching against existing person profiles (Section 5)
   */
  async matchFacesToProfiles(facesData, userId, collectionId = null, matchingThreshold = 0.80) {
    // Fetch user's existing active private person profiles with embedding vectors
    const existingProfiles = await PersonProfile.find({
      userId,
      status: 'active',
    }).select('+privateEmbeddingReference');

    const matchedProfiles = [];
    const updatedFaces = [];

    let currentProfileCount = existingProfiles.length;

    for (const face of facesData) {
      let matchedProfile = null;
      let highestSimilarity = 0;

      if (face.embedding && face.embedding.length > 0) {
        for (const prof of existingProfiles) {
          if (prof.privateEmbeddingReference && prof.privateEmbeddingReference.length > 0) {
            const sim = this.cosineSimilarity(face.embedding, prof.privateEmbeddingReference);
            if (sim > highestSimilarity && sim >= matchingThreshold) {
              highestSimilarity = sim;
              matchedProfile = prof;
            }
          }
        }

        // If no confident match, create a new private person profile
        if (!matchedProfile) {
          currentProfileCount++;
          const newProfileName = `Person #${currentProfileCount}`;
          const unnamedId = `person_${new mongoose.Types.ObjectId().toString().slice(-6)}`;

          matchedProfile = await PersonProfile.create({
            userId,
            collectionId,
            displayName: newProfileName,
            unnamedId,
            privateEmbeddingReference: face.embedding,
            consentStatus: true,
            status: 'active',
            fileCount: 1,
          });
          existingProfiles.push(matchedProfile);
          highestSimilarity = 1.0;
        } else {
          matchedProfile.fileCount = (matchedProfile.fileCount || 0) + 1;
          await matchedProfile.save();
        }
      }

      updatedFaces.push({
        ...face,
        matchedProfileId: matchedProfile ? matchedProfile._id : null,
        matchConfidence: highestSimilarity,
      });

      if (matchedProfile && !matchedProfiles.some((p) => String(p._id) === String(matchedProfile._id))) {
        matchedProfiles.push(matchedProfile);
      }
    }

    return { updatedFaces, matchedProfiles };
  }

  /**
   * Deterministic Rules A through G Execution (Section 6)
   */
  async organizePhotoByRules({
    file,
    userId,
    collectionId = null,
    faceCount = 0,
    faces = [],
    matchedProfiles = [],
    hasConsent = false,
    isLowConfidence = false,
  }) {
    const baseFolders = await this.ensureBaseFolders(userId, collectionId);
    const assignedFolders = [];

    // Helper to add file to a smart folder and update two-way references
    const addToFileAndFolder = async (smartFolder) => {
      if (!smartFolder) return;
      if (!Array.isArray(smartFolder.fileIds)) {
        smartFolder.fileIds = [];
      }
      if (!smartFolder.fileIds.map(String).includes(String(file._id))) {
        smartFolder.fileIds.push(file._id);
        await smartFolder.save();
      }
      if (!Array.isArray(file.smartFolderIds)) {
        file.smartFolderIds = [];
      }
      if (!file.smartFolderIds.map(String).includes(String(smartFolder._id))) {
        file.smartFolderIds.push(smartFolder._id);
      }
      if (!assignedFolders.some((f) => String(f._id) === String(smartFolder._id))) {
        assignedFolders.push(smartFolder);
      }
    };

    // Helper to purge file from all conflicting / incorrect human & general folders (Requirement #6 & #8)
    const cleanOtherFolders = async (keepFolders) => {
      const keepFolderIds = new Set(keepFolders.map((f) => String(f._id)));
      const baseHumanNames = [
        'Solo', 'Two People', 'Three People', 'Four People', 'Group',
        'Individual Photos', 'Single Photos', 'Four Member Groups', 'Group Photos',
        'Two Member Groups', 'Pair Photos', 'Three Member Groups',
        'General Photos'
      ];
      const otherFolders = await SmartFolder.find({
        userId,
        $or: [
          { name: { $in: baseHumanNames } },
          { category: { $in: ['Solo', 'Two People', 'Three People', 'Four People', 'Group', 'General Photos', 'Individual Photos', 'Four Member Groups', 'Group Photos'] } }
        ],
        _id: { $nin: Array.from(keepFolderIds) }
      });

      for (const ofolder of otherFolders) {
        if (ofolder.fileIds && ofolder.fileIds.map(String).includes(String(file._id))) {
          ofolder.fileIds = ofolder.fileIds.filter((id) => String(id) !== String(file._id));
          await ofolder.save();
        }
      }

      if (Array.isArray(file.smartFolderIds)) {
        file.smartFolderIds = file.smartFolderIds.filter((fid) => {
          const isOther = otherFolders.some((of) => String(of._id) === String(fid));
          return !isOther;
        });
      }
    };

    // Check for low detection confidence fallback (Requirement #9)
    const minFaceConf = faces.length > 0 ? Math.min(...faces.map(f => f.detectionConfidence || 1)) : 1;
    if (isLowConfidence || (faces.length > 0 && minFaceConf < 0.60)) {
      await addToFileAndFolder(baseFolders['Needs Review']);
      await cleanOtherFolders(assignedFolders);
      await file.save();
      return { assignedFolders, ruleApplied: 'Rule G (Needs Review - Low Confidence)' };
    }

    // Rule A: Five or more people (faceCount >= 5) -> Group
    if (faceCount >= 5) {
      await addToFileAndFolder(baseFolders['Group']);
      await cleanOtherFolders(assignedFolders);
      await file.save();
      return { assignedFolders, ruleApplied: 'Rule A (Group - 5+ People)' };
    }

    // Rule B: Exactly four people (faceCount === 4) -> Four People
    if (faceCount === 4) {
      await addToFileAndFolder(baseFolders['Four People']);
      await cleanOtherFolders(assignedFolders);
      await file.save();
      return { assignedFolders, ruleApplied: 'Rule B (Four People)' };
    }

    // Rule C: Exactly three people (faceCount === 3) -> Three People
    if (faceCount === 3) {
      await addToFileAndFolder(baseFolders['Three People']);
      await cleanOtherFolders(assignedFolders);
      await file.save();
      return { assignedFolders, ruleApplied: 'Rule C (Three People)' };
    }

    // Rule D: Exactly two people (faceCount === 2) -> Two People
    if (faceCount === 2) {
      await addToFileAndFolder(baseFolders['Two People']);
      await cleanOtherFolders(assignedFolders);
      await file.save();
      return { assignedFolders, ruleApplied: 'Rule D (Two People)' };
    }

    // Rule E: Exactly one person (faceCount === 1) -> Solo & Person Subfolder
    if (faceCount === 1) {
      // 1. Always place in base "Solo" folder
      await addToFileAndFolder(baseFolders['Solo']);

      // 2. Intelligent Cross-Image Face Recognition & Personal Folder Matching (Requirements #4 & #5)
      const faceEmb = faces[0]?.embedding;
      if (faceEmb && faceEmb.length > 0) {
        const existingProfiles = await PersonProfile.find({
          userId,
          status: 'active',
        }).select('+privateEmbeddingReference');

        let matchedProfile = null;
        let highestSim = 0;

        for (const prof of existingProfiles) {
          if (prof.privateEmbeddingReference && prof.privateEmbeddingReference.length > 0) {
            const sim = this.cosineSimilarity(faceEmb, prof.privateEmbeddingReference);
            if (sim > highestSim && sim >= 0.45) {
              highestSim = sim;
              matchedProfile = prof;
            }
          }
        }

        if (matchedProfile) {
          // Re-use existing person profile
          matchedProfile.fileCount = (matchedProfile.fileCount || 0) + 1;
          if (!matchedProfile.sampleFaceUrl && file.cloudinaryUrl) {
            matchedProfile.sampleFaceUrl = file.cloudinaryUrl;
          }
          await matchedProfile.save();

          let personFolder = await SmartFolder.findOne({
            userId,
            category: 'Solo',
            personName: matchedProfile.displayName,
          });

          if (!personFolder) {
            personFolder = await SmartFolder.create({
              userId,
              collectionId,
              name: matchedProfile.displayName,
              category: 'Solo',
              parentFolderId: baseFolders['Solo']._id,
              icon: 'User',
              color: '#8B5CF6',
              isAIGenerated: true,
              isPersonFolder: true,
              personName: matchedProfile.displayName,
              fileIds: [file._id],
            });
          } else {
            if (!personFolder.fileIds.map(String).includes(String(file._id))) {
              personFolder.fileIds.push(file._id);
              await personFolder.save();
            }
          }
          await addToFileAndFolder(personFolder);
        } else {
          // New person: create new PersonProfile and personal folder under Solo
          const newProfileCount = existingProfiles.length + 1;
          const newProfileName = `Person #${newProfileCount}`;
          const unnamedId = `person_${new mongoose.Types.ObjectId().toString().slice(-6)}`;

          await PersonProfile.create({
            userId,
            collectionId,
            displayName: newProfileName,
            unnamedId,
            privateEmbeddingReference: faceEmb,
            sampleFaceUrl: file.cloudinaryUrl || '',
            consentStatus: true,
            status: 'active',
            fileCount: 1,
          });

          const personFolder = await SmartFolder.create({
            userId,
            collectionId,
            name: newProfileName,
            category: 'Solo',
            parentFolderId: baseFolders['Solo']._id,
            icon: 'User',
            color: '#8B5CF6',
            isAIGenerated: true,
            isPersonFolder: true,
            personName: newProfileName,
            fileIds: [file._id],
          });

          await addToFileAndFolder(personFolder);
        }
      }

      await cleanOtherFolders(assignedFolders);
      await file.save();
      return { assignedFolders, ruleApplied: 'Rule E (Solo & Recognized Person Folder)' };
    }

    // Rule F: Zero people (faceCount === 0)
    // Non-human content -> purge from all human base folders
    await cleanOtherFolders([]);
    await file.save();
    return { assignedFolders: [], ruleApplied: 'Rule F (Non-Human Scenery / Objects)' };
  }
}

export const faceOrganizationService = new FaceOrganizationService();