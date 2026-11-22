import { Collection } from '../models/Collection.js';
import { File } from '../models/File.js';
import { QRCode } from '../models/QRCode.js';
import { Analytics } from '../models/Analytics.js';
import { User } from '../models/User.js';

// @desc    Get user dashboard aggregated analytics
// @route   GET /api/analytics/dashboard
export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Core counters
    const collections = await Collection.find({ ownerId: userId });
    const collectionIds = collections.map((c) => c._id);

    const totalCollections = collections.length;
    const totalFiles = await File.countDocuments({ ownerId: userId });

    const user = await User.findById(userId);
    const storageUsed = user?.storageUsed || 0;
    const storageQuota = user?.storageQuota || 5 * 1024 * 1024 * 1024;

    const totalScans = collections.reduce((acc, c) => acc + (c.scanCount || 0), 0);
    const totalViews = collections.reduce((acc, c) => acc + (c.viewsCount || 0), 0);
    const totalDownloads = collections.reduce((acc, c) => acc + (c.downloadCount || 0), 0);

    const activeQRCodes = await QRCode.countDocuments({
      collectionId: { $in: collectionIds },
      status: 'active',
    });

    // 2. File-type distribution
    const fileTypeAgg = await File.aggregate([
      { $match: { ownerId: userId } },
      {
        $group: {
          _id: '$metadata.aiCategory',
          count: { $sum: 1 },
          totalBytes: { $sum: '$fileSize' },
        },
      },
    ]);

    const distribution = fileTypeAgg.map((item) => ({
      category: item._id || 'other',
      count: item.count,
      totalBytes: item.totalBytes,
    }));

    // 3. Recent 7-day upload activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActivity = await File.aggregate([
      {
        $match: {
          ownerId: userId,
          uploadedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$uploadedAt' } },
          count: { $sum: 1 },
          bytes: { $sum: '$fileSize' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 4. Device analytics from collections
    const deviceBreakdown = await Analytics.aggregate([
      { $match: { collectionId: { $in: collectionIds } } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
    ]);

    // 5. Recent 5 collections and files
    const recentCollections = await Collection.find({ ownerId: userId })
      .sort('-createdAt')
      .limit(5);

    const recentFiles = await File.find({ ownerId: userId })
      .sort('-uploadedAt')
      .limit(8);

    res.status(200).json({
      success: true,
      stats: {
        totalCollections,
        totalFiles,
        storageUsed,
        storageQuota,
        activeQRCodes,
        totalScans,
        totalViews,
        totalDownloads,
      },
      distribution,
      dailyActivity,
      deviceBreakdown: deviceBreakdown.map((d) => ({ device: d._id, count: d.count })),
      recentCollections,
      recentFiles,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get detailed analytics for a single collection
// @route   GET /api/analytics/collections/:id
export const getCollectionAnalytics = async (req, res) => {
  try {
    const collection = await Collection.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    const qr = await QRCode.findOne({ collectionId: collection._id });

    // Events breakdown
    const eventsAgg = await Analytics.aggregate([
      { $match: { collectionId: collection._id } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]);

    const deviceAgg = await Analytics.aggregate([
      { $match: { collectionId: collection._id } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      collection: {
        id: collection._id,
        title: collection.title,
        viewsCount: collection.viewsCount,
        scanCount: collection.scanCount,
        downloadCount: collection.downloadCount,
        totalFiles: collection.totalFiles,
        totalSize: collection.totalSize,
      },
      qr,
      events: eventsAgg.map((e) => ({ type: e._id, count: e.count })),
      devices: deviceAgg.map((d) => ({ device: d._id, count: d.count })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
