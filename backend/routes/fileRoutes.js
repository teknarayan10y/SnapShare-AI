import express from 'express';
import {
  uploadFiles,
  getFileById,
  deleteFile,
  downloadFile,
  toggleFavorite,
  getAllFiles,
  attachVoiceNote,
} from '../controllers/fileController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// List all files for authenticated user
router.get('/', protect, getAllFiles);

// Allow optional auth for uploads if collaborative upload is enabled on the collection
router.post('/upload', optionalAuth, upload.array('files', 50), uploadFiles);

router.get('/:id', optionalAuth, getFileById);
router.get('/:id/download', optionalAuth, downloadFile);
router.delete('/:id', protect, deleteFile);
router.patch('/:id/favorite', protect, toggleFavorite);
router.post('/:id/voice-note', optionalAuth, attachVoiceNote);

export default router;
