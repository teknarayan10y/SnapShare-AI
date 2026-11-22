import { DuplicateGroup } from '../models/DuplicateGroup.js';
import { File } from '../models/File.js';
import { aiClient } from './aiMicroserviceClient.js';
import { storageService } from './storageService.js';
import { User } from '../models/User.js';

class DuplicateService {
  /**
   * Scan for exact SHA-256 and perceptual visual duplicates for a given file
   */
  async scanDuplicates(file, userId) {
    if (!file || !userId) return;

    // 1. Exact duplicates by SHA-256
    if (file.checksum) {
      const exactMatches = await File.find({
        ownerId: userId,
        checksum: file.checksum,
        _id: { $ne: file._id },
      });

      if (exactMatches.length > 0) {
        const potentialSavings = exactMatches.reduce((acc, f) => acc + (f.fileSize || 0), 0);
        await DuplicateGroup.findOneAndUpdate(
          { userId, primaryFileId: file._id, duplicateType: 'exact' },
          {
            userId,
            primaryFileId: file._id,
            duplicateFileIds: exactMatches.map((f) => f._id),
            duplicateType: 'exact',
            similarityScore: 1.0,
            potentialSavingsBytes: potentialSavings,
            isResolved: false,
          },
          { upsert: true, new: true }
        );
      }
    }

    // 2. Visual / perceptual duplicates by pHash
    if (file.perceptualHash) {
      const candidates = await File.find({
        ownerId: userId,
        perceptualHash: { $exists: true, $ne: '' },
        _id: { $ne: file._id },
      }).limit(50);

      const similarFileIds = [];
      let totalSimilarSavings = 0;

      for (const candidate of candidates) {
        const simRes = await aiClient.comparePHash(file.perceptualHash, candidate.perceptualHash);
        if (simRes.isSimilar) {
          similarFileIds.push(candidate._id);
          totalSimilarSavings += candidate.fileSize || 0;
        }
      }

      if (similarFileIds.length > 0) {
        await DuplicateGroup.findOneAndUpdate(
          { userId, primaryFileId: file._id, duplicateType: 'visual_similar' },
          {
            userId,
            primaryFileId: file._id,
            duplicateFileIds: similarFileIds,
            duplicateType: 'visual_similar',
            similarityScore: 0.92,
            potentialSavingsBytes: totalSimilarSavings,
            isResolved: false,
          },
          { upsert: true, new: true }
        );
      }
    }
  }

  /**
   * Resolve duplicate group (user elects to delete duplicates or dismiss)
   */
  async resolveGroup(groupId, action, fileIdsToDelete, userId) {
    const group = await DuplicateGroup.findOne({ _id: groupId, userId });
    if (!group) throw new Error('Duplicate group not found');

    if (action === 'delete_selected' && fileIdsToDelete?.length > 0) {
      let freedBytes = 0;
      for (const fId of fileIdsToDelete) {
        const f = await File.findOne({ _id: fId, ownerId: userId });
        if (f) {
          freedBytes += f.fileSize || 0;
          await storageService.deleteObject(f.storageKey);
          if (f.thumbnailKey) await storageService.deleteObject(f.thumbnailKey);
          await File.findByIdAndDelete(f._id);
        }
      }

      await User.findByIdAndUpdate(userId, {
        $inc: { storageUsed: -freedBytes },
      });
    }

    group.isResolved = true;
    await group.save();
    return { success: true, message: 'Duplicates resolved successfully' };
  }
}

export const duplicateService = new DuplicateService();
