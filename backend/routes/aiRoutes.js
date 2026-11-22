import express from 'express';
import {
  getAIOverview,
  analyzeFile,
  analyzeBulkFiles,
  getAIJobs,
  retryJob,
  cancelJob,
  getSmartFolders,
  createSmartFolder,
  mergeSmartFolders,
  searchAI,
  getSearchSuggestions,
  getDuplicates,
  resolveDuplicateGroup,
  previewOrganization,
  undoOrganization,
  getOrganizationHistory,
  getAISettings,
  updateAISettings,
} from '../controllers/aiController.js';
import {
  analyzeFace,
  analyzeBulkFaces,
  getFaceJobs,
  getFaceJobById,
  getPeople,
  createPerson,
  updatePerson,
  deletePerson,
  mergePeople,
  splitPerson,
  previewGroupOrganization,
  executeGroupOrganization,
  getGroupFolders,
  getGroupFolderById,
  interpretRule,
  validateRule,
  createRule,
  getRules,
  updateRule,
  deleteRule,
  getHistory,
  undoHistory,
  restoreHistory,
  getPrivacySettings,
  updatePrivacySettings,
  purgeFaceData,
} from '../controllers/faceController.js';
import { findMyPhotos } from '../controllers/selfieController.js';
import { getPhotobook } from '../controllers/photobookController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All AI endpoints are protected by JWT authentication
router.use(protect);

router.get('/overview', getAIOverview);
router.post('/analyze', analyzeFile);
router.post('/analyze/bulk', analyzeBulkFiles);

// Job Queue
router.get('/jobs', getAIJobs);
router.post('/jobs/:jobId/retry', retryJob);
router.post('/jobs/:jobId/cancel', cancelJob);

// Smart Folders
router.get('/folders', getSmartFolders);
router.get('/smart-folders', getSmartFolders);
router.post('/folders', createSmartFolder);
router.post('/folders/:folderId/merge', mergeSmartFolders);

// Natural Language Search
router.post('/search', searchAI);
router.get('/search/suggestions', getSearchSuggestions);

// Duplicates
router.get('/duplicates', getDuplicates);
router.post('/duplicates/:groupId/resolve', resolveDuplicateGroup);

// Organization Actions
router.post('/organize/preview', previewOrganization);
router.post('/organize/undo', undoOrganization);
router.get('/organization-history', getOrganizationHistory);

// Preferences & Settings
router.get('/settings', getAISettings);
router.patch('/settings', updateAISettings);

// =============================================================
// FACE INTELLIGENCE & RULE ENGINE ENDPOINTS (Section 16)
// =============================================================

// Face Detection
router.post('/faces/analyze', analyzeFace);
router.post('/faces/analyze/bulk', analyzeBulkFaces);
router.get('/faces/jobs', getFaceJobs);
router.get('/faces/jobs/:jobId', getFaceJobById);

// Person Profiles
router.get('/people', getPeople);
router.post('/people', createPerson);
router.patch('/people/:personId', updatePerson);
router.delete('/people/:personId', deletePerson);
router.post('/people/merge', mergePeople);
router.post('/people/split', splitPerson);

// Group Organization
router.post('/groups/preview', previewGroupOrganization);
router.post('/groups/organize', executeGroupOrganization);
router.get('/groups', getGroupFolders);
router.get('/groups/:groupId', getGroupFolderById);

// Rules & Command Center
router.post('/rules/interpret', interpretRule);
router.post('/rules/validate', validateRule);
router.post('/rules', createRule);
router.get('/rules', getRules);
router.patch('/rules/:ruleId', updateRule);
router.delete('/rules/:ruleId', deleteRule);

// Organization History & Undo
router.get('/organization/history', getHistory);
router.post('/organization/undo', undoHistory);
router.post('/organization/restore', restoreHistory);

// Privacy & Consent
router.get('/privacy', getPrivacySettings);
router.patch('/privacy', updatePrivacySettings);
router.delete('/privacy/face-data', purgeFaceData);

// Feature 1: Find My Photos by Selfie Search
router.post('/find-my-photos', findMyPhotos);

// Feature 6: Auto-Curated Digital Photobook Layout
router.get('/photobook/:collectionId?', getPhotobook);

export default router;
