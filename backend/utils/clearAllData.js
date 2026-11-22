import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { User } from '../models/User.js';
import { Collection } from '../models/Collection.js';
import { File } from '../models/File.js';
import { QRCode } from '../models/QRCode.js';
import { Analytics } from '../models/Analytics.js';
import { AuditLog } from '../models/AuditLog.js';
import { Subscription } from '../models/Subscription.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

const clearDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snapshare';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Purging all dummy and seed data...');

    // Delete all documents from all collections
    const [u, c, f, q, a, al, s] = await Promise.all([
      User.deleteMany({}),
      Collection.deleteMany({}),
      File.deleteMany({}),
      QRCode.deleteMany({}),
      Analytics.deleteMany({}),
      AuditLog.deleteMany({}),
      Subscription.deleteMany({}),
    ]);

    console.log(`✅ Deleted ${u.deletedCount} Users`);
    console.log(`✅ Deleted ${c.deletedCount} Collections`);
    console.log(`✅ Deleted ${f.deletedCount} Files`);
    console.log(`✅ Deleted ${q.deletedCount} QR Codes`);
    console.log(`✅ Deleted ${a.deletedCount} Analytics entries`);
    console.log(`✅ Deleted ${al.deletedCount} Audit Logs`);
    console.log(`✅ Deleted ${s.deletedCount} Subscriptions`);

    // Clean physical upload folders
    const uploadFolders = ['uploads/files', 'uploads/thumbnails', 'uploads/zips', 'uploads/temp'];
    for (const folder of uploadFolders) {
      const fullPath = path.join(backendRoot, folder);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        for (const file of files) {
          if (file !== '.gitkeep') {
            try {
              fs.unlinkSync(path.join(fullPath, file));
            } catch (err) {
              // ignore
            }
          }
        }
      }
    }
    console.log('✅ Cleaned all physical upload folders.');

    console.log('\n🎉 Database is now completely clean and ready for real users!');
    console.log('Next step:');
    console.log('1. Go to http://localhost:5173/register and register your own account.');
    console.log('2. It will be registered as a standard user (role: "user").');
    console.log('3. Open MongoDB Compass (or mongosh) and change "role" to "admin" if you want admin access.\n');

    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
};

clearDatabase();
