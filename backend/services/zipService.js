import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from './storageService.js';

// In-memory job tracker for asynchronous ZIP preparation
const downloadJobs = new Map();

class ZipService {
  /**
   * Generates a safe, non-colliding filename inside a ZIP
   */
  getUniqueName(name, existingNames) {
    let base = name;
    let ext = '';
    const lastDot = name.lastIndexOf('.');
    if (lastDot > 0) {
      base = name.substring(0, lastDot);
      ext = name.substring(lastDot);
    }

    let finalName = name;
    let counter = 1;
    while (existingNames.has(finalName)) {
      finalName = `${base} (${counter})${ext}`;
      counter++;
    }
    existingNames.add(finalName);
    return finalName;
  }

  /**
   * Direct streaming of files into a ZIP response (ideal for instant download)
   */
  async streamZip(files, res, zipFileName = 'collection.zip') {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFileName)}"`);

    const archive = archiver('zip', {
      zlib: { level: 6 }, // Balance compression & speed
    });

    archive.on('error', (err) => {
      console.error('[ZipService Error]', err);
      if (!res.headersSent) {
        res.status(500).send({ error: 'Failed to compress archive' });
      }
    });

    archive.pipe(res);

    const existingNames = new Set();

    for (const file of files) {
      const filePath = storageService.getFilePath(file.storageKey);
      const uniqueEntryName = this.getUniqueName(file.originalName, existingNames);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: uniqueEntryName });
      } else if (file.cloudinaryUrl) {
        try {
          const cloudResp = await axios.get(file.cloudinaryUrl, { responseType: 'stream', timeout: 15000 });
          archive.append(cloudResp.data, { name: uniqueEntryName });
        } catch (err) {
          console.warn(`[ZipService Cloud Stream Error for ${file.originalName}]:`, err.message);
        }
      }
    }

    await archive.finalize();
  }

  /**
   * Asynchronous ZIP creation job (for large collections or background preparation)
   */
  async startZipJob(files, collectionTitle = 'collection') {
    const jobId = uuidv4();
    const tempFileName = `zip_${jobId}.zip`;
    const tempFilePath = path.join(path.resolve('uploads', 'zips'), tempFileName);

    downloadJobs.set(jobId, {
      jobId,
      status: 'processing',
      progress: 0,
      totalFiles: files.length,
      processedFiles: 0,
      tempFilePath,
      fileName: `${collectionTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`,
      createdAt: Date.now(),
    });

    // Run archiving asynchronously
    setTimeout(async () => {
      try {
        const output = fs.createWriteStream(tempFilePath);
        const archive = archiver('zip', { zlib: { level: 6 } });

        archive.pipe(output);

        const existingNames = new Set();
        let count = 0;

        for (const file of files) {
          const filePath = storageService.getFilePath(file.storageKey);
          const entryName = this.getUniqueName(file.originalName, existingNames);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: entryName });
          } else if (file.cloudinaryUrl) {
            try {
              const cloudResp = await axios.get(file.cloudinaryUrl, { responseType: 'stream', timeout: 15000 });
              archive.append(cloudResp.data, { name: entryName });
            } catch (err) {
              console.warn(`[ZipJob Cloud Stream Error for ${file.originalName}]:`, err.message);
            }
          }
          count++;
          const job = downloadJobs.get(jobId);
          if (job) {
            job.processedFiles = count;
            job.progress = Math.round((count / files.length) * 95);
          }
        }

        output.on('close', () => {
          const job = downloadJobs.get(jobId);
          if (job) {
            job.status = 'completed';
            job.progress = 100;
            job.fileSize = archive.pointer();
          }
        });

        archive.on('error', (err) => {
          const job = downloadJobs.get(jobId);
          if (job) {
            job.status = 'failed';
            job.error = err.message;
          }
        });

        await archive.finalize();
      } catch (err) {
        const job = downloadJobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.error = err.message;
        }
      }
    }, 10);

    return jobId;
  }

  getJobStatus(jobId) {
    return downloadJobs.get(jobId) || null;
  }

  cleanOldJobs() {
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    for (const [jobId, job] of downloadJobs.entries()) {
      if (now - job.createdAt > TWO_HOURS) {
        if (job.tempFilePath && fs.existsSync(job.tempFilePath)) {
          fs.unlink(job.tempFilePath, () => {});
        }
        downloadJobs.delete(jobId);
      }
    }
  }
}

export const zipService = new ZipService();

// Run periodic cleanup every 30 minutes
setInterval(() => {
  zipService.cleanOldJobs();
}, 30 * 60 * 1000);
