import { v4 as uuidv4 } from 'uuid';
import { Collection } from '../models/Collection.js';
import { QRCode } from '../models/QRCode.js';
import { qrService } from '../services/qrService.js';

// @desc    Generate or update QR Code for a collection
// @route   POST /api/qr/generate/:collectionId
export const generateQR = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const {
      template = 'gradient',
      dotsColor = '#8B5CF6',
      bgColor = '#080B14',
      cornerColor = '#06B6D4',
      showLogo = true,
      logoUrl = '',
      margin = 2,
    } = req.body;

    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    if (collection.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to configure QR for this collection' });
    }

    let qr = await QRCode.findOne({ collectionId });
    if (!qr) {
      qr = new QRCode({
        collectionId,
        qrStyle: { template, dotsColor, bgColor, cornerColor, showLogo, logoUrl, margin },
      });
    } else {
      qr.qrStyle = {
        template: template || qr.qrStyle.template,
        dotsColor: dotsColor || qr.qrStyle.dotsColor,
        bgColor: bgColor || qr.qrStyle.bgColor,
        cornerColor: cornerColor || qr.qrStyle.cornerColor,
        showLogo: showLogo !== undefined ? showLogo : qr.qrStyle.showLogo,
        logoUrl: logoUrl !== undefined ? logoUrl : qr.qrStyle.logoUrl,
        margin: margin !== undefined ? margin : qr.qrStyle.margin,
      };
      qr.status = 'active';
    }

    await qr.save();

    // Build the public link URL
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const publicUrl = `${clientBaseUrl}/public/${collection.shareToken}`;

    // Generate live Base64 Data URL and SVG
    const dataUrl = await qrService.generateDataURL(publicUrl, qr.qrStyle);
    const svgString = await qrService.generateSVG(publicUrl, qr.qrStyle);

    res.status(200).json({
      success: true,
      qr,
      publicUrl,
      dataUrl,
      svg: svgString,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get QR configuration and image for a collection
// @route   GET /api/qr/:collectionId
export const getQR = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    let qr = await QRCode.findOne({ collectionId });
    if (!qr) {
      qr = await QRCode.create({
        collectionId,
        qrStyle: { template: 'gradient', dotsColor: '#8B5CF6', bgColor: '#080B14' },
      });
    }

    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const publicUrl = `${clientBaseUrl}/public/${collection.shareToken}`;

    const dataUrl = await qrService.generateDataURL(publicUrl, qr.qrStyle);
    const svgString = await qrService.generateSVG(publicUrl, qr.qrStyle);

    res.status(200).json({
      success: true,
      qr,
      publicUrl,
      dataUrl,
      svg: svgString,
      collectionTitle: collection.title,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Download QR code in requested format (png, svg, pdf)
// @route   GET /api/qr/:collectionId/download/:format
export const downloadQR = async (req, res) => {
  try {
    const { collectionId, format } = req.params;
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    const qr = await QRCode.findOne({ collectionId });
    const qrStyle = qr ? qr.qrStyle : {};

    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const publicUrl = `${clientBaseUrl}/public/${collection.shareToken}`;
    const safeTitle = collection.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'svg') {
      const svg = await qrService.generateSVG(publicUrl, qrStyle);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_qr.svg"`);
      return res.send(svg);
    }

    if (format === 'pdf') {
      const pdfBuffer = await qrService.generatePrintablePDF(collection, publicUrl, qrStyle);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_QR_Card.pdf"`);
      return res.send(pdfBuffer);
    }

    // Default: PNG
    const pngBuffer = await qrService.generateBuffer(publicUrl, qrStyle);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_qr.png"`);
    res.send(pngBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Revoke or regenerate QR token
// @route   POST /api/qr/:collectionId/revoke
export const revokeQR = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    if (collection.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Generate a fresh share token for the collection so previous QR is invalidated
    collection.shareToken = uuidv4().replace(/-/g, '').slice(0, 16);
    await collection.save();

    let qr = await QRCode.findOne({ collectionId });
    if (qr) {
      qr.qrToken = 'qr_' + uuidv4().replace(/-/g, '').slice(0, 16);
      await qr.save();
    }

    res.status(200).json({
      success: true,
      message: 'QR code regenerated and previous links revoked',
      newShareToken: collection.shareToken,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
