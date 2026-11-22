import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log(`☁️  [Cloudinary] Universal storage initialized for cloud: ${cloudName}`);
} else if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
  console.log('☁️  [Cloudinary] Universal storage initialized via CLOUDINARY_URL');
} else {
  console.log('ℹ️  [Cloudinary] Not configured yet (Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in backend/.env)');
}

class CloudinaryService {
  isConfigured() {
    return Boolean(
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) ||
      process.env.CLOUDINARY_URL
    );
  }

  /**
   * Determine the optimal Cloudinary resource_type for any file category/extension
   */
  resolveResourceType(category, ext = '') {
    const cleanExt = ext.toLowerCase().replace('.', '');

    if (category === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'tiff', 'heic', 'ico'].includes(cleanExt)) {
      return 'image';
    }
    if (category === 'video' || category === 'audio' || ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', 'mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'].includes(cleanExt)) {
      return 'video'; // Cloudinary hosts both audio & video under 'video'
    }
    // PDF, Office docs, code, archives, data, and everything else
    return 'raw';
  }

  /**
   * Universal file uploader for ALL file formats:
   * Images, Videos, Audio, Documents, Archives, Source Code, etc.
   * @param {string} filePath - Local disk path to the temporary file
   * @param {string} originalName - Original user filename with extension
   * @param {string} category - File category (image, video, audio, document, archive, code, etc.)
   * @param {object} options - Custom Cloudinary upload options
   */
  async uploadFile(filePath, originalName, category = 'other', options = {}) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const ext = path.extname(originalName).toLowerCase();
      const resourceType = this.resolveResourceType(category, ext);
      const folder = `snapshare/${category}s`;

      const uploadOptions = {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...options,
      };

      // For 'raw' files (documents, code, zip), ensure original filename extension is preserved in public_id
      if (resourceType === 'raw') {
        const basenameWithoutExt = path.basename(originalName, ext);
        const timestamp = Date.now();
        uploadOptions.public_id = `${timestamp}-${basenameWithoutExt}${ext}`;
      }

      const result = await cloudinary.uploader.upload(filePath, uploadOptions);

      return {
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type || resourceType,
        format: result.format || ext.replace('.', ''),
        width: result.width || null,
        height: result.height || null,
        bytes: result.bytes,
      };
    } catch (err) {
      console.error(`❌ [Cloudinary Universal Upload Error for ${originalName}]:`, err.message);
      return null;
    }
  }

  /**
   * Specifically for image thumbnails
   */
  async uploadThumbnail(filePath) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'snapshare/thumbnails',
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
        ],
      });

      return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
      };
    } catch (err) {
      console.error('❌ [Cloudinary Thumbnail Error]:', err.message);
      return null;
    }
  }

  /**
   * Delete an asset from Cloudinary with support for any resource type
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - 'image', 'video', or 'raw'
   */
  async deleteFile(publicId, resourceType = 'image') {
    if (!this.isConfigured() || !publicId) {
      return false;
    }

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return true;
    } catch (err) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        return true;
      } catch {
        console.error(`❌ [Cloudinary Delete Error for ${publicId}]:`, err.message);
        return false;
      }
    }
  }

  // Alias for backward compatibility
  async deleteImage(publicId) {
    return this.deleteFile(publicId, 'image');
  }

  // Alias for backward compatibility
  async uploadImage(filePath, options = {}) {
    return this.uploadFile(filePath, 'image.jpg', 'image', options);
  }
}

export const cloudinaryService = new CloudinaryService();
