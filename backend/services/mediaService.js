import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { storageService } from './storageService.js';

class MediaService {
  /**
   * Generates a thumbnail for an image and extracts its dimensions
   */
  async processImage(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      const thumbKey = storageService.generateKey('thumbnails', 'webp');
      const thumbFullPath = storageService.getFilePath(thumbKey);

      // Create destination directory if needed
      const destDir = path.dirname(thumbFullPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Generate a clean, optimized WebP thumbnail (max 400x400, preserving aspect ratio)
      await sharp(filePath)
        .rotate() // auto-orient based on EXIF
        .resize(400, 400, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(thumbFullPath);

      return {
        hasThumbnail: true,
        thumbnailKey: thumbKey,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      };
    } catch (err) {
      console.warn(`[MediaService] Could not generate thumbnail: ${err.message}`);
      return {
        hasThumbnail: false,
        thumbnailKey: '',
        width: null,
        height: null,
        format: null,
      };
    }
  }

  /**
   * Extract video/audio metadata
   */
  extractMediaMetadata(extension, fileSize) {
    // Basic media metadata approximation
    return {
      encoding: extension.toUpperCase(),
      approxBitrate: fileSize > 0 ? Math.round((fileSize * 8) / 1000) : null,
    };
  }
}

export const mediaService = new MediaService();
