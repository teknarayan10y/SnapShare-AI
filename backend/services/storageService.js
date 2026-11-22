import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const UPLOAD_ROOT = path.resolve('uploads');
const FILES_DIR = path.join(UPLOAD_ROOT, 'files');
const THUMBS_DIR = path.join(UPLOAD_ROOT, 'thumbnails');
const ZIPS_DIR = path.join(UPLOAD_ROOT, 'zips');

// Ensure directories exist
[UPLOAD_ROOT, FILES_DIR, THUMBS_DIR, ZIPS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

class StorageService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 'local';
  }

  /**
   * Generates a unique storage key for a file
   */
  generateKey(prefix = 'file', ext = '') {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(8).toString('hex');
    const sanitizedExt = ext ? `.${ext.replace(/^\./, '')}` : '';
    return `${prefix}/${timestamp}-${randomHex}${sanitizedExt}`;
  }

  /**
   * Save a file buffer or stream to storage
   */
  async putObject(storageKey, sourcePathOrBuffer) {
    const destinationPath = path.join(UPLOAD_ROOT, storageKey);
    const destDir = path.dirname(destinationPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    if (Buffer.isBuffer(sourcePathOrBuffer)) {
      await fs.promises.writeFile(destinationPath, sourcePathOrBuffer);
    } else {
      await fs.promises.copyFile(sourcePathOrBuffer, destinationPath);
    }

    return {
      storageKey,
      path: destinationPath,
    };
  }

  /**
   * Retrieve file read stream
   */
  createReadStream(storageKey) {
    const fullPath = path.join(UPLOAD_ROOT, storageKey);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${storageKey}`);
    }
    return fs.createReadStream(fullPath);
  }

  /**
   * Get physical file path
   */
  getFilePath(storageKey) {
    return path.join(UPLOAD_ROOT, storageKey);
  }

  /**
   * Check if file exists
   */
  async exists(storageKey) {
    const fullPath = path.join(UPLOAD_ROOT, storageKey);
    try {
      await fs.promises.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete an object
   */
  async deleteObject(storageKey) {
    try {
      const fullPath = path.join(UPLOAD_ROOT, storageKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
      return true;
    } catch (err) {
      console.error(`Error deleting storage key ${storageKey}:`, err.message);
      return false;
    }
  }

  /**
   * Generate a secure signed URL for accessing a protected file
   */
  generateSignedUrl(fileId, expiresInMinutes = 60) {
    const secret = process.env.JWT_SECRET || 'snapshare_secret_key';
    const token = jwt.sign(
      {
        fileId,
        type: 'download_token',
      },
      secret,
      { expiresIn: `${expiresInMinutes}m` }
    );
    return `/api/files/${fileId}/download?token=${token}`;
  }

  /**
   * Verify signed URL token
   */
  verifySignedToken(token, fileId) {
    try {
      const secret = process.env.JWT_SECRET || 'snapshare_secret_key';
      const decoded = jwt.verify(token, secret);
      return decoded.type === 'download_token' && decoded.fileId === fileId;
    } catch {
      return false;
    }
  }
}

export const storageService = new StorageService();
