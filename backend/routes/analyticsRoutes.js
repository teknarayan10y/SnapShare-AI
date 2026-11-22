import express from 'express';
import {
  getDashboardAnalytics,
  getCollectionAnalytics,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardAnalytics);
router.get('/collections/:id', getCollectionAnalytics);

export default router;
