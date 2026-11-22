import express from 'express';
import {
  generateQR,
  getQR,
  downloadQR,
  revokeQR,
} from '../controllers/qrController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate/:collectionId', protect, generateQR);
router.get('/:collectionId', optionalAuth, getQR);
router.get('/:collectionId/download/:format', optionalAuth, downloadQR);
router.post('/:collectionId/revoke', protect, revokeQR);

export default router;
