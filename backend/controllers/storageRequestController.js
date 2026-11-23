import { StorageRequest } from '../models/StorageRequest.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

// @desc    Submit extra storage request
// @route   POST /api/storage-requests
export const createStorageRequest = async (req, res) => {
  try {
    const { requestedQuotaGB, reason } = req.body;

    if (!requestedQuotaGB || requestedQuotaGB <= 0) {
      return res.status(400).json({ success: false, error: 'Please provide valid requested quota in GB' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide a reason for the extra storage' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const newRequest = await StorageRequest.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      currentQuota: user.storageQuota,
      currentUsed: user.storageUsed,
      requestedQuotaGB: Number(requestedQuotaGB),
      reason: reason.trim(),
      status: 'pending',
    });

    await AuditLog.create({
      userId: user._id,
      action: 'STORAGE_REQUEST_SUBMITTED',
      resourceType: 'StorageRequest',
      resourceId: newRequest._id.toString(),
      details: { requestedQuotaGB, reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      request: newRequest,
      message: 'Storage request submitted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get user's storage requests
// @route   GET /api/storage-requests/my
export const getMyStorageRequests = async (req, res) => {
  try {
    const requests = await StorageRequest.find({ userId: req.user._id }).sort('-createdAt');
    res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
