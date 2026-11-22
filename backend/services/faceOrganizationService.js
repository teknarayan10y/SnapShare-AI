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
      { name: 'Individual Photos', category: 'Individual Photos', icon: 'User', color: '#EC4899', parent: 'People' },
      { name: 'Two People', category: 'Two People', icon: 'UserCheck', color: '#3B82F6', parent: 'People' },
      { name: 'Three People', category: 'Three People', icon: 'Users', color: '#10B981', parent: 'People' },
      { name: 'Four Member Groups', category: 'Four Member Groups', icon: 'Users', color: '#F59E0B', parent: 'People' },
      { name: 'Group Photos', category: 'Group Photos', icon: 'Users', color: '#6366F1', parent: 'People' },
      { name: 'Needs Review', category: 'Needs Review', icon: 'AlertCircle', color: '#EF4444', parent: 'People' },
    ];

    const folderMap = {};

    for (const b of baseFolders) {
      // Check for folder by new name OR legacy alias name
      const aliasNames = [b.name];
      if (b.name === 'Two People') aliasNames.push('Two Member Groups', 'Pair Photos');
      if (b.name === 'Three People') aliasNames.push('Three Member Groups');
      if (b.name === 'Four Member Groups') aliasNames.push('Four People');
      if (b.name === 'Individual Photos') aliasNames.push('Single Photos');

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
        await folder.save();
      }
      folderMap[b.name] = folder;
    }

    // Set convenience alias mappings
    folderMap['Two Member Groups'] = folderMap['Two People'];
    folderMap['Three Member Groups'] = folderMap['Three People'];
    folderMap['Pair Photos'] = folderMap['Two People'];
    folderMap['Single Photos'] = folderMap['Individual Photos'];
    folderMap['Four People'] = folderMap['Four Member Groups'];

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
  }) {
    const baseFolders = await this.ensureBaseFolders(userId, collectionId);
    const assignedFolders = [];

    // Helper to add file to a smart folder
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
      assignedFolders.push(smartFolder);
    };

    // Rule A: More than four people (faceCount > 4)
    if (faceCount > 4) {
      await addToFileAndFolder(baseFolders['Group Photos']);
      await file.save();
      return { assignedFolders, ruleApplied: 'Rule A (Group Photos)' };
    }

    // Rule B: Exactly four people (faceCount === 4)
    if (faceCount === 4) {
      // 1. Always place in "Four Member Groups" parent category folder
      await addToFileAndFolder(baseFolders['Four Member Groups']);

      // 2. If all 4 members confirmed and consented, also place in specific combination folder
      if (hasConsent && matchedProfiles.length === 4) {
        const memberIds = matchedProfiles.map((p) => p._id);
        const groupKey = this.generateGroupKey({ userId, collectionId, memberIds });

        let groupRec = await GroupFolder.findOne({ userId, collectionId, groupKey });

        if (groupRec) {
          const existingFolder = await SmartFolder.findById(groupRec.folderId);
          if (existingFolder) {
            await addToFileAndFolder(existingFolder);
          }
          if (!groupRec.fileIds.map(String).includes(String(file._id))) {
            groupRec.fileIds.push(file._id);
            await groupRec.save();
          }
        } else {
          const names = matchedProfiles.map((p) => p.displayName || 'Person').join(' - ');
          const folderName = `${names}`;

          const newFolder = await SmartFolder.create({
            userId,
            collectionId,
            name: folderName,
            category: 'Four Member Groups',
            parentFolderId: baseFolders['Four Member Groups']._id,
            icon: 'Users',
            color: '#F59E0B',
            isAIGenerated: true,
            fileIds: [file._id],
          });

          groupRec = await GroupFolder.create({
            userId,
            collectionId,
            groupKey,
            groupSize: 4,
            memberProfileIds: memberIds,
            folderId: newFolder._id,
            fileIds: [file._id],
          });

          await addToFileAndFolder(newFolder);
        }
      }

      let ruleApplied = 'Rule B (Four-Member Group)';
      if (hasConsent && matchedProfiles.length < 4) {
        // Flag for human review if matching is on but profiles incomplete
        await addToFileAndFolder(baseFolders['Needs Review']);
        ruleApplied += ' & Rule G (Needs Review)';
      }

      await file.save();
      return { assignedFolders, ruleApplied };
    }

    // Rule C: Exactly three people (faceCount === 3)
    if (faceCount === 3) {
      // 1. Always place in "Three People" parent category folder
      await addToFileAndFolder(baseFolders['Three People']);

      // 2. If all 3 members confirmed and consented, also place in specific combination folder
      if (hasConsent && matchedProfiles.length === 3) {
        const memberIds = matchedProfiles.map((p) => p._id);
        const groupKey = this.generateGroupKey({ userId, collectionId, memberIds });

        let groupRec = await GroupFolder.findOne({ userId, collectionId, groupKey });

        if (groupRec) {
          const existingFolder = await SmartFolder.findById(groupRec.folderId);
          if (existingFolder) {
            await addToFileAndFolder(existingFolder);
          }
          if (!groupRec.fileIds.map(String).includes(String(file._id))) {
            groupRec.fileIds.push(file._id);
            await groupRec.save();
          }
        } else {
          const names = matchedProfiles.map((p) => p.displayName || 'Person').join(' - ');
          const folderName = `${names}`;

          const newFolder = await SmartFolder.create({
            userId,
            collectionId,
            name: folderName,
            category: 'Three People',
            parentFolderId: baseFolders['Three People']._id,
            icon: 'Users',
            color: '#10B981',
            isAIGenerated: true,
            fileIds: [file._id],
          });

          groupRec = await GroupFolder.create({
            userId,
            collectionId,
            groupKey,
            groupSize: 3,
            memberProfileIds: memberIds,
            folderId: newFolder._id,
            fileIds: [file._id],
          });

          await addToFileAndFolder(newFolder);
        }
      }

      let ruleApplied = 'Rule C (Three People)';
      if (hasConsent && matchedProfiles.length < 3) {
        await addToFileAndFolder(baseFolders['Needs Review']);
        ruleApplied += ' & Rule G (Needs Review)';
      }

      await file.save();
      return { assignedFolders, ruleApplied };
    }

    // Rule D: Exactly two people (faceCount === 2)
    if (faceCount === 2) {
      // 1. Always place in "Two People" parent category folder
      await addToFileAndFolder(baseFolders['Two People']);

      // 2. If both members confirmed and consented, also place in specific pair folder
      if (hasConsent && matchedProfiles.length === 2) {
        const memberIds = matchedProfiles.map((p) => p._id);
        const groupKey = this.generateGroupKey({ userId, collectionId, memberIds });

        let groupRec = await GroupFolder.findOne({ userId, collectionId, groupKey });

        if (groupRec) {
          const existingFolder = await SmartFolder.findById(groupRec.folderId);
          if (existingFolder) {
            await addToFileAndFolder(existingFolder);
          }
          if (!groupRec.fileIds.map(String).includes(String(file._id))) {
            groupRec.fileIds.push(file._id);
            await groupRec.save();
          }
        } else {
          const names = matchedProfiles.map((p) => p.displayName || 'Person').join(' - ');
          const folderName = `${names}`;

          const newFolder = await SmartFolder.create({
            userId,
            collectionId,
            name: folderName,
            category: 'Two People',
            parentFolderId: baseFolders['Two People']._id,
            icon: 'UserCheck',
            color: '#3B82F6',
            isAIGenerated: true,
            fileIds: [file._id],
          });

          groupRec = await GroupFolder.create({
            userId,
            collectionId,
            groupKey,
            groupSize: 2,
            memberProfileIds: memberIds,
            folderId: newFolder._id,
            fileIds: [file._id],
          });

          await addToFileAndFolder(newFolder);
        }
      }

      let ruleApplied = 'Rule D (Two People)';
      if (hasConsent && matchedProfiles.length < 2) {
        await addToFileAndFolder(baseFolders['Needs Review']);
        ruleApplied += ' & Rule G (Needs Review)';
      }

      await file.save();
      return { assignedFolders, ruleApplied };
    }

    // Rule E: Exactly one person (faceCount === 1)
    if (faceCount === 1) {
      // 1. Always place in "Individual Photos" parent category folder
      await addToFileAndFolder(baseFolders['Individual Photos']);

      // 2. If profile confirmed and consented, also place in specific personal folder
      if (hasConsent && matchedProfiles.length === 1) {
        const profile = matchedProfiles[0];
        const folderName = profile.displayName || 'Person';

        let personFolder = await SmartFolder.findOne({
          userId,
          collectionId,
          category: 'Individual Photos',
          personName: folderName,
        });

        if (!personFolder) {
          personFolder = await SmartFolder.create({
            userId,
            collectionId,
            name: folderName,
            category: 'Individual Photos',
            parentFolderId: baseFolders['Individual Photos']._id,
            icon: 'User',
            color: '#EC4899',
            isAIGenerated: true,
            isPersonFolder: true,
            personName: folderName,
            fileIds: [file._id],
          });
        } else {
          if (!personFolder.fileIds.map(String).includes(String(file._id))) {
            personFolder.fileIds.push(file._id);
            await personFolder.save();
          }
        }

        await addToFileAndFolder(personFolder);
      }

      await file.save();
      return { assignedFolders, ruleApplied: 'Rule E (Individual Photo)' };
    }

    // Rule F: Zero people (faceCount === 0)
    // Send to normal category folders (handled by smartFolderService, strictly no person/group folder)
    await file.save();
    return { assignedFolders: [], ruleApplied: 'Rule F (Non-Human Scenery / Objects)' };
  }
}

export const faceOrganizationService = new FaceOrganizationService();