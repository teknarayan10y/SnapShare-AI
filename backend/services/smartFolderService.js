import { SmartFolder } from '../models/SmartFolder.js';
import { OrganizationHistory } from '../models/OrganizationHistory.js';
import { File } from '../models/File.js';

class SmartFolderService {
  /**
   * Compute cosine similarity between two feature vectors
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
   * Automatically organize a file into relevant smart folders
   */
  async organizeFile(file, analysis, userId, mode = 'automatic') {
    const rawCategories = [...(analysis.categories || ['General'])];
    const personCount = analysis.personCount ?? file.personCount ?? 0;
    const comp = analysis.photoComposition || file.photoComposition || 'non_human';

    // Strict 5-tier classification conforming to Master Rules A through F:
    const isLargeGroup = comp === 'group' || personCount > 4;
    const isFourMember = !isLargeGroup && (comp === 'four_person' || personCount === 4 || rawCategories.includes('Four-Member Groups') || rawCategories.includes('Four Member Groups') || rawCategories.includes('Four People'));
    const isThreeMember = !isLargeGroup && !isFourMember && (comp === 'three_person' || personCount === 3 || rawCategories.includes('Three-Member Groups') || rawCategories.includes('Three Member Groups') || rawCategories.includes('Three People'));
    const isPair = !isLargeGroup && !isFourMember && !isThreeMember && (comp === 'pair' || personCount === 2 || rawCategories.includes('Pair Photos') || rawCategories.includes('Two Member Groups') || rawCategories.includes('Two People'));
    const isSinglePerson = !isLargeGroup && !isFourMember && !isThreeMember && !isPair && (comp === 'single_person' || personCount === 1 || rawCategories.includes('Single Photos') || rawCategories.includes('Individual Photos'));

    let targetCategories = [];

    if (isLargeGroup) {
      // RULE A: >4 people strictly to Group Photos
      targetCategories = ['Group Photos'];
    } else if (isFourMember) {
      // RULE B: Exactly 4 people strictly to Four Member Groups
      targetCategories = ['Four Member Groups'];
    } else if (isThreeMember) {
      // RULE C: Exactly 3 people strictly to Three People
      targetCategories = ['Three People'];
    } else if (isPair) {
      // RULE D: Exactly 2 people strictly to Two People
      targetCategories = ['Two People'];
    } else if (isSinglePerson) {
      // RULE E: Exactly 1 person strictly to Individual Photos
      targetCategories = ['Individual Photos'];
    } else {
      // RULE F: Non-human / scenery / objects - strictly exclude all person/group folders!
      targetCategories = rawCategories.filter(
        (c) =>
          ![
            'Group Photos',
            'Four Member Groups',
            'Four-Member Groups',
            'Four People',
            'Three Member Groups',
            'Three-Member Groups',
            'Three People',
            'Pair Photos',
            'Two Member Groups',
            'Two People',
            'Single Photos',
            'Individual Photos',
            'Person',
          ].includes(c)
      );
      if (targetCategories.length === 0) {
        targetCategories = ['General'];
      }
    }

    const assignedFolders = [];

    // 1. Process determined target folders
    for (const catName of targetCategories) {
      if (!catName || catName.trim() === '') continue;

      let folder = await SmartFolder.findOne({
        userId,
        name: catName,
      });

      if (!folder) {
        folder = await SmartFolder.create({
          userId,
          name: catName,
          category: catName,
          fileIds: [file._id],
          isAIGenerated: true,
          color: this.getCategoryColor(catName),
          icon: this.getCategoryIcon(catName),
        });
      } else {
        if (!folder.fileIds.includes(file._id)) {
          folder.fileIds.push(file._id);
          await folder.save();
        }
      }

      if (!file.smartFolderIds.includes(folder._id)) {
        file.smartFolderIds.push(folder._id);
      }
      assignedFolders.push(folder);
    }

    // 2. Intelligent Person Matching for Single Person Photos
    // When NOT a group photo, match the person's photo features:
    // If it matches that person, store in that person's folder;
    // If it does NOT match that person, route to the other matching person or create a distinct folder!
    if (isSinglePerson && analysis.personSignature && analysis.personSignature.length > 0) {
      const personFolders = await SmartFolder.find({
        userId,
        category: 'Person',
      });

      let bestMatchFolder = null;
      let highestSimilarity = 0;

      for (const pFolder of personFolders) {
        if (pFolder.personSignature && pFolder.personSignature.length > 0) {
          const sim = this.cosineSimilarity(analysis.personSignature, pFolder.personSignature);
          if (sim > highestSimilarity && sim >= 0.75) {
            highestSimilarity = sim;
            bestMatchFolder = pFolder;
          }
        }
      }

      if (bestMatchFolder) {
        // Matched existing person cluster!
        if (!bestMatchFolder.fileIds.includes(file._id)) {
          bestMatchFolder.fileIds.push(file._id);
          await bestMatchFolder.save();
        }
        if (!file.smartFolderIds.includes(bestMatchFolder._id)) {
          file.smartFolderIds.push(bestMatchFolder._id);
        }
        assignedFolders.push(bestMatchFolder);
      } else {
        // Did NOT match any existing person:
        // Create new distinct person cluster folder so all future matching photos go here!
        const newPersonIndex = personFolders.length + 1;
        const newPersonFolder = await SmartFolder.create({
          userId,
          name: `Person #${newPersonIndex}`,
          category: 'Person',
          personName: `Person #${newPersonIndex}`,
          isPersonFolder: true,
          personSignature: analysis.personSignature,
          fileIds: [file._id],
          isAIGenerated: true,
          color: '#A855F7',
          icon: 'UserCheck',
        });
        if (!file.smartFolderIds.includes(newPersonFolder._id)) {
          file.smartFolderIds.push(newPersonFolder._id);
        }
        assignedFolders.push(newPersonFolder);
      }
    }

    await file.save();

    // Record in OrganizationHistory
    await OrganizationHistory.create({
      userId,
      collectionId: file.collectionId,
      action: mode === 'review' ? 'review_approve' : 'auto_organize',
      mode,
      affectedFolders: assignedFolders.map((f) => ({ folderId: f._id, folderName: f.name })),
      affectedFileIds: [file._id],
      snapshot: {
        fileId: file._id,
        folderIds: assignedFolders.map((f) => f._id),
      },
    });

    return assignedFolders;
  }

  /**
   * Preview proposed organization for a collection or set of files
   */
  async previewOrganization(fileIds, userId) {
    const files = await File.find({ _id: { $in: fileIds }, ownerId: userId }).populate('aiAnalysisId');
    const proposedFolders = {};

    for (const f of files) {
      const cats = f.aiAnalysisId?.categories || [f.metadata?.aiCategory || 'General'];
      for (const cat of cats) {
        if (!proposedFolders[cat]) {
          proposedFolders[cat] = [];
        }
        proposedFolders[cat].push({
          fileId: f._id,
          originalName: f.originalName,
          category: cat,
          thumbnailUrl: f.cloudinaryUrl || (f.thumbnailKey ? `/uploads/${f.thumbnailKey}` : ''),
        });
      }
    }

    return proposedFolders;
  }

  /**
   * 1-Click Undo Organization
   */
  async undoOrganization(historyId, userId) {
    const history = await OrganizationHistory.findOne({ _id: historyId, userId });
    if (!history || history.isUndone) {
      throw new Error('History entry not found or already undone');
    }

    const { affectedFileIds, affectedFolders } = history;

    // Remove file associations from affected folders
    for (const folderRef of affectedFolders) {
      await SmartFolder.updateOne(
        { _id: folderRef.folderId, userId },
        { $pull: { fileIds: { $in: affectedFileIds } } }
      );
    }

    // Remove folder references from files
    for (const fileId of affectedFileIds) {
      const folderIdsToRemove = affectedFolders.map((f) => f.folderId);
      await File.updateOne(
        { _id: fileId },
        { $pull: { smartFolderIds: { $in: folderIdsToRemove } } }
      );
    }

    history.isUndone = true;
    await history.save();

    return { success: true, message: 'Organization undone successfully' };
  }

  /**
   * Merge two folders
   */
  async mergeFolders(targetFolderId, sourceFolderId, userId) {
    const [target, source] = await Promise.all([
      SmartFolder.findOne({ _id: targetFolderId, userId }),
      SmartFolder.findOne({ _id: sourceFolderId, userId }),
    ]);

    if (!target || !source) {
      throw new Error('One or both folders not found');
    }

    // Merge unique fileIds
    const combinedFiles = Array.from(new Set([...target.fileIds.map(String), ...source.fileIds.map(String)]));
    target.fileIds = combinedFiles;
    await target.save();

    // Update files to point to target
    await File.updateMany(
      { _id: { $in: source.fileIds } },
      { $addToSet: { smartFolderIds: target._id }, $pull: { smartFolderIds: source._id } }
    );

    // Remove source folder
    await SmartFolder.findByIdAndDelete(source._id);

    return target;
  }

  getCategoryColor(category) {
    const palette = {
      Nature: '#10B981',
      Animals: '#F59E0B',
      Technology: '#8B5CF6',
      Travel: '#06B6D4',
      Food: '#EF4444',
      Architecture: '#3B82F6',
      Vehicles: '#EC4899',
      Screenshots: '#6366F1',
      Documents: '#14B8A6',
      Code: '#8B5CF6',
      Events: '#F43F5E',
      'Single Photos': '#EC4899',
      'Individual Photos': '#EC4899',
      'Pair Photos': '#3B82F6',
      'Two Member Groups': '#3B82F6',
      'Two People': '#3B82F6',
      'Three Member Groups': '#10B981',
      'Three People': '#10B981',
      'Four Member Groups': '#F59E0B',
      'Four People': '#F59E0B',
      'Group Photos': '#6366F1',
      'Needs Review': '#EF4444',
      Person: '#A855F7',
    };
    return palette[category] || '#A855F7';
  }

  getCategoryIcon(category) {
    const icons = {
      Nature: 'Trees',
      Animals: 'PawPrint',
      Technology: 'Cpu',
      Travel: 'Plane',
      Food: 'Utensils',
      Architecture: 'Building',
      Vehicles: 'Car',
      Screenshots: 'Monitor',
      Documents: 'FileText',
      Code: 'Code2',
      Events: 'PartyPopper',
      'Single Photos': 'User',
      'Individual Photos': 'User',
      'Pair Photos': 'UserCheck',
      'Two Member Groups': 'UserCheck',
      'Two People': 'UserCheck',
      'Three Member Groups': 'Users',
      'Three People': 'Users',
      'Four Member Groups': 'Users',
      'Four People': 'Users',
      'Group Photos': 'Users',
      'Needs Review': 'AlertCircle',
      Person: 'UserCheck',
    };
    return icons[category] || 'Folder';
  }
}

export const smartFolderService = new SmartFolderService();
