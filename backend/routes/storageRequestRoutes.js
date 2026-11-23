import express from 'express';
import {
  createStorageRequest,
  getMyStorageRequests,
} from '../controllers/storageRequestController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createStorageRequest);
router.get('/my', protect, getMyStorageRequests);

export default router;
