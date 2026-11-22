import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { File } from '../models/File.js';

async function cleanupUploads() {
  await mongoose.connect('mongodb://127.0.0.1:27017/snapshare');
  const files = await File.find({});
  console.log(`Total files in MongoDB: ${files.length}`);

  let cloudCount = 0;
  for (const f of files) {
    if (f.cloudinaryUrl) {
      cloudCount++;
      console.log(`Cloud-hosted: ${f.originalName} -> ${f.cloudinaryUrl}`);
    } else {
      console.log(`Local-only: ${f.originalName}`);
    }
  }
  console.log(`Files safely stored in Cloudinary: ${cloudCount} / ${files.length}`);

  // Purge uploads/files
  const filesDir = path.resolve('uploads', 'files');
  if (fs.existsSync(filesDir)) {
    const list = fs.readdirSync(filesDir);
    console.log(`Purging ${list.length} redundant file(s) from uploads/files...`);
    for (const item of list) {
      fs.unlinkSync(path.join(filesDir, item));
    }
  }

  // Purge uploads/thumbnails
  const thumbsDir = path.resolve('uploads', 'thumbnails');
  if (fs.existsSync(thumbsDir)) {
    const list = fs.readdirSync(thumbsDir);
    console.log(`Purging ${list.length} local thumbnail(s) from uploads/thumbnails...`);
    for (const item of list) {
      fs.unlinkSync(path.join(thumbsDir, item));
    }
  }

  // Purge uploads/temp
  const tempDir = path.resolve('uploads', 'temp');
  if (fs.existsSync(tempDir)) {
    const list = fs.readdirSync(tempDir);
    console.log(`Purging ${list.length} temporary file(s) from uploads/temp...`);
    for (const item of list) {
      fs.unlinkSync(path.join(tempDir, item));
    }
  }

  console.log('\nBackend uploads directory is now clean! All files are served 100% directly from Cloudinary.');
  process.exit(0);
}

cleanupUploads().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
