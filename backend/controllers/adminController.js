import os from 'os';
import { User } from '../models/User.js';
import { Collection } from '../models/Collection.js';
import { File } from '../models/File.js';
import { AuditLog } from '../models/AuditLog.js';
import { Subscription } from '../models/Subscription.js';
import { cloudinaryService } from '../services/cloudinaryService.js';

// @desc    Get overall system health and platform statistics
// @route   GET /api/admin/overview
export const getAdminOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCollections = await Collection.countDocuments();
    const totalFiles = await File.countDocuments();

    const storageAgg = await User.aggregate([
      { $group: { _id: null, totalUsed: { $sum: '$storageUsed' } } },
    ]);
    const totalStorageConsumption = storageAgg[0]?.totalUsed || 0;

    const downloadAgg = await Collection.aggregate([
      { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } },
    ]);
    const totalDownloads = downloadAgg[0]?.totalDownloads || 0;

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
        totalCollections,
        totalFiles,
        totalStorageConsumption,
        totalDownloads,
        activeSubscriptions,
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
