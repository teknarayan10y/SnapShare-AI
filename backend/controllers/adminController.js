import os from 'os';
import { User } from '../models/User.js';
import { Collection } from '../models/Collection.js';
import { File } from '../models/File.js';
import { AuditLog } from '../models/AuditLog.js';
import { Subscription } from '../models/Subscription.js';
import { StorageRequest } from '../models/StorageRequest.js';
import { Announcement } from '../models/Announcement.js';
import { cloudinaryService } from '../services/cloudinaryService.js';

// @desc    Get overall system health and platform statistics
// @route   GET /api/admin/overview
export const getAdminOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const suspendedUsers = await User.countDocuments({ isActive: false });
    const totalCollections = await Collection.countDocuments();
    const totalFiles = await File.countDocuments();
    const aiAnalyzedFiles = await File.countDocuments({ aiStatus: 'analyzed' });

    // Real Storage Aggregations
    const storageAgg = await User.aggregate([
      { $group: { _id: null, totalUsed: { $sum: '$storageUsed' }, totalAllocated: { $sum: '$storageQuota' } } },
    ]);
    const totalStorageConsumption = storageAgg[0]?.totalUsed || 0;
    const totalAllocatedQuota = storageAgg[0]?.totalAllocated || 0;

    // Real Downloads and Scans
    const downloadAgg = await Collection.aggregate([
      { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' }, totalScans: { $sum: '$scanCount' } } },
    ]);
    const totalDownloads = downloadAgg[0]?.totalDownloads || 0;
    const totalScans = downloadAgg[0]?.totalScans || 0;

    // Real Media Categories Breakdown from MongoDB
    const mediaByCategory = await File.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$metadata.aiCategory', { $ifNull: ['$category', 'image'] }] },
          count: { $sum: 1 },
          totalBytes: { $sum: '$fileSize' },
        },
      },
      { $sort: { totalBytes: -1 } },
    ]);

    // Real Collection Categories Breakdown from MongoDB
    const collectionCategories = await Collection.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$category', 'general'] },
          count: { $sum: 1 },
          totalFiles: { $sum: '$totalFiles' },
          totalScans: { $sum: '$scanCount' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // Real Users Breakdown by Plan
    const usersByPlan = await User.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$plan', 'free'] },
          count: { $sum: 1 },
          storageUsed: { $sum: '$storageUsed' },
        },
      },
    ]);

    // Storage Requests
    const pendingRequests = await StorageRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await StorageRequest.countDocuments({ status: 'approved' });

    // Real Audit Log Operations Breakdown
    const actionAgg = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 },
    ]);

    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

    // System health metrics
    const systemHealth = {
      uptimeSeconds: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuCount: os.cpus().length,
      freeMemoryBytes: os.freemem(),
      totalMemoryBytes: os.totalmem(),
      memoryUsage: process.memoryUsage(),
    };

    const recentAuditLogs = await AuditLog.find().sort('-timestamp').limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalCollections,
        totalFiles,
        aiAnalyzedFiles,
        totalStorageConsumption,
        totalAllocatedQuota,
        totalDownloads,
        totalScans,
        activeSubscriptions,
        pendingRequests,
        approvedRequests,
        mediaByCategory,
        collectionCategories,
        usersByPlan,
        actionBreakdown: actionAgg,
      },
      systemHealth,
      recentAuditLogs,
      cloudinary: {
        isConfigured: cloudinaryService.isConfigured(),
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all users with pagination and search
// @route   GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const users = await User.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit, 10));
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      users,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Toggle user status (ban / activate) or change role
// @route   PATCH /api/admin/users/:id
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive, role, storageQuota, plan } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;
    if (plan) user.plan = plan;
    if (storageQuota) user.storageQuota = storageQuota;

    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'ADMIN_UPDATE_USER',
      resourceType: 'User',
      resourceId: user._id.toString(),
      details: { isActive, role, storageQuota },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get system audit logs
// @route   GET /api/admin/audit-logs
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const logs = await AuditLog.find()
      .populate('userId', 'name email')
      .sort('-timestamp')
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await AuditLog.countDocuments();

    res.status(200).json({
      success: true,
      total,
      logs,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete user account and all owned assets by admin
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own admin account' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await File.deleteMany({ ownerId: targetUserId });
    await Collection.deleteMany({ ownerId: targetUserId });
    await StorageRequest.deleteMany({ userId: targetUserId });
    await User.findByIdAndDelete(targetUserId);

    await AuditLog.create({
      userId: req.user._id,
      action: 'ADMIN_DELETE_USER',
      resourceType: 'User',
      resourceId: targetUserId,
      details: { deletedEmail: user.email, deletedName: user.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true, message: 'User and all associated data deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all storage upgrade requests
// @route   GET /api/admin/storage-requests
export const getStorageRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await StorageRequest.find(query)
      .populate('userId', 'name email avatar storageQuota storageUsed plan')
      .sort('-createdAt');

    const pendingCount = await StorageRequest.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      requests,
      pendingCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Approve storage request
// @route   PATCH /api/admin/storage-requests/:id/approve
export const approveStorageRequest = async (req, res) => {
  try {
    const request = await StorageRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Storage request not found' });
    }

    const grantedBytes = request.requestedQuotaGB * 1024 * 1024 * 1024;
    const user = await User.findById(request.userId);
    if (user) {
      user.storageQuota = grantedBytes;
      await user.save();
    }

    request.status = 'approved';
    request.grantedQuotaGB = request.requestedQuotaGB;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'STORAGE_REQUEST_APPROVED',
      resourceType: 'StorageRequest',
      resourceId: request._id.toString(),
      details: { requestedQuotaGB: request.requestedQuotaGB, grantedGB: request.requestedQuotaGB },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      request,
      message: `Approved ${request.requestedQuotaGB} GB for ${request.userName || 'user'}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Reject storage request
// @route   PATCH /api/admin/storage-requests/:id/reject
export const rejectStorageRequest = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const request = await StorageRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Storage request not found' });
    }

    request.status = 'rejected';
    request.adminNotes = adminNotes || 'Storage request declined by administrator';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'STORAGE_REQUEST_REJECTED',
      resourceType: 'StorageRequest',
      resourceId: request._id.toString(),
      details: { adminNotes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      request,
      message: 'Storage request rejected',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Grant custom storage allocation
// @route   PATCH /api/admin/storage-requests/:id/custom
export const customStorageRequest = async (req, res) => {
  try {
    const { customQuotaGB, adminNotes } = req.body;
    if (!customQuotaGB || customQuotaGB <= 0) {
      return res.status(400).json({ success: false, error: 'Please provide a valid custom quota in GB' });
    }

    const request = await StorageRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Storage request not found' });
    }

    const grantedBytes = Number(customQuotaGB) * 1024 * 1024 * 1024;
    const user = await User.findById(request.userId);
    if (user) {
      user.storageQuota = grantedBytes;
      await user.save();
    }

    request.status = 'approved';
    request.grantedQuotaGB = Number(customQuotaGB);
    request.adminNotes = adminNotes || `Custom grant of ${customQuotaGB} GB by admin`;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'STORAGE_CUSTOM_GRANTED',
      resourceType: 'StorageRequest',
      resourceId: request._id.toString(),
      details: { customQuotaGB, adminNotes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      request,
      message: `Granted custom ${customQuotaGB} GB for ${request.userName || 'user'}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get announcements for admin
// @route   GET /api/admin/announcements
export const getAdminAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort('-createdAt');
    res.status(200).json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create announcement
// @route   POST /api/admin/announcements
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type = 'info', targetAudience = 'all', expiresAt } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }

    const announcement = await Announcement.create({
      title,
      message,
      type,
      targetAudience,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'ANNOUNCEMENT_CREATED',
      resourceType: 'Announcement',
      resourceId: announcement._id.toString(),
      details: { title, type },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update announcement
// @route   PATCH /api/admin/announcements/:id
export const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    res.status(200).json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/admin/announcements/:id
export const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Storage Analytics Breakdown
// @route   GET /api/admin/storage-analytics
export const getStorageAnalytics = async (req, res) => {
  try {
    // 1. Storage by Category
    const categoryAgg = await File.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalBytes: { $sum: '$fileSize' },
        },
      },
      { $sort: { totalBytes: -1 } },
    ]);

    // 2. Top 10 Storage Consumers
    const topUsers = await User.find()
      .sort('-storageUsed')
      .limit(10)
      .select('name email avatar storageQuota storageUsed plan');

    // 3. Total Quota vs Used
    const quotaAgg = await User.aggregate([
      {
        $group: {
          _id: null,
          totalAllocated: { $sum: '$storageQuota' },
          totalUsed: { $sum: '$storageUsed' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      categoryBreakdown: categoryAgg,
      topUsers,
      totalAllocated: quotaAgg[0]?.totalAllocated || 0,
      totalUsed: quotaAgg[0]?.totalUsed || 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Security & Activity Metrics
// @route   GET /api/admin/security-metrics
export const getSecurityMetrics = async (req, res) => {
  try {
    const activeUsers = await User.countDocuments({ isActive: true });
    const suspendedUsers = await User.countDocuments({ isActive: false });
    const twoFactorCount = await User.countDocuments({ twoFactorEnabled: true });

    const recentLogins = await AuditLog.find({ action: 'USER_LOGIN' })
      .populate('userId', 'name email avatar')
      .sort('-timestamp')
      .limit(10);

    const sensitiveEvents = await AuditLog.find({
      action: {
        $in: [
          'ADMIN_UPDATE_USER',
          'ADMIN_DELETE_USER',
          'STORAGE_REQUEST_APPROVED',
          'STORAGE_REQUEST_REJECTED',
          'USER_REGISTERED',
        ],
      },
    })
      .populate('userId', 'name email')
      .sort('-timestamp')
      .limit(15);

    res.status(200).json({
      success: true,
      activeUsers,
      suspendedUsers,
      twoFactorCount,
      recentLogins,
      sensitiveEvents,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
