import express from 'express';
import {
  getAdminOverview,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAuditLogs,
  getStorageRequests,
  approveStorageRequest,
  rejectStorageRequest,
  customStorageRequest,
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getStorageAnalytics,
  getSecurityMetrics,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/overview', getAdminOverview);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Storage Requests
router.get('/storage-requests', getStorageRequests);
router.patch('/storage-requests/:id/approve', approveStorageRequest);
router.patch('/storage-requests/:id/reject', rejectStorageRequest);
router.patch('/storage-requests/:id/custom', customStorageRequest);

// Announcements
router.get('/announcements', getAdminAnnouncements);
router.post('/announcements', createAnnouncement);
router.patch('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Storage Analytics & Security
router.get('/storage-analytics', getStorageAnalytics);
router.get('/security-metrics', getSecurityMetrics);

export default router;
