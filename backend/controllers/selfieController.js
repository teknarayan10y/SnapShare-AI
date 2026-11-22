import axios from 'axios';
import { File } from '../models/File.js';
import { Collection } from '../models/Collection.js';
import { PersonProfile } from '../models/PersonProfile.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

export const findMyPhotos = async (req, res) => {
  try {
    const { selfieBase64, collectionId, threshold = 0.40 } = req.body;
    let selfiePath = null;
    let b64 = selfieBase64;

    if (req.file) {
      selfiePath = req.file.path;
    }

    if (!selfiePath && !b64) {
      return res.status(400).json({ success: false, error: 'Please provide a selfie image or upload.' });
    }

    const userId = req.user?._id;
    const filter = {};
    if (userId) filter.ownerId = userId;
    if (collectionId) filter.collectionId = collectionId;

    // Fetch candidate photos in the collection
    const files = await File.find(filter)
      .select('_id cloudinaryUrl thumbnailKey originalName aiCaption aiTags personCount')
      .lean();

    if (files.length === 0) {
      return res.json({
        success: true,
        foundFace: false,
        message: 'No photos found in this event to search against.',
        matches: [],
      });
    }

    // Try to get person profiles with embeddings for quick match
    const profiles = await PersonProfile.find({
      ...(userId ? { userId } : {}),
      ...(collectionId ? { collectionId } : {}),
    })
      .select('+privateEmbeddingReference')
      .lean();

    const candidates = files.map((f) => ({
      fileId: String(f._id),
      filePath: f.storageKey || null,
      embedding: null,
    }));

    // Call Python FastAPI AI Service
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/search/selfie`, {
      selfiePath,
      selfieBase64: b64,
      candidates,
      threshold: parseFloat(threshold),
    });

    const result = aiResponse.data;
    if (!result.foundFace) {
      return res.json({
        success: true,
        foundFace: false,
        message: result.message || 'No clear face detected in the selfie.',
        matches: [],
      });
    }

    // Map matched file IDs back to full File documents
    const matchMap = new Map();
    (result.matches || []).forEach((m) => matchMap.set(String(m.fileId), m));

    const matchedFiles = files
      .filter((f) => matchMap.has(String(f._id)))
      .map((f) => {
        const m = matchMap.get(String(f._id));
        return {
          ...f,
          similarity: m.similarity,
          confidencePercent: m.confidencePercent,
        };
      })
      .sort((a, b) => b.similarity - a.similarity);

    return res.json({
      success: true,
      foundFace: true,
      matchCount: matchedFiles.length,
      matches: matchedFiles,
      selfieBox: result.selfieBox,
    });
  } catch (error) {
    console.error('[Find My Photos Error]:', error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to search photos by selfie',
    });
  }
};
