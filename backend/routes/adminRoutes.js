import express from 'express';
import {
  getAdminOverview,
  getAllUsers,
  updateUserStatus,
  getAuditLogs,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/overview', getAdminOverview);
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUserStatus);
router.get('/audit-logs', getAuditLogs);

export default router;
