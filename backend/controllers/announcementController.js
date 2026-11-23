import { Announcement } from '../models/Announcement.js';

// @desc    Get all active announcements for users
// @route   GET /api/announcements
export const getActiveAnnouncements = async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort('-createdAt').limit(5);

    res.status(200).json({
      success: true,
      announcements,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
