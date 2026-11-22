import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { User } from '../models/User.js';
import { Collection } from '../models/Collection.js';
import { File } from '../models/File.js';
import { QRCode } from '../models/QRCode.js';
import { storageService } from '../services/storageService.js';
import { mediaService } from '../services/mediaService.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snapshare');
    console.log('Connected to MongoDB for seeding...');

    // Clean existing seed if needed
    await User.deleteMany({ email: { $in: ['admin@snapshare.io', 'demo@snapshare.io'] } });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('SnapShare2026!', salt);

    // 1. Create Admin
    const admin = await User.create({
      name: 'Alex Rivera (Architect)',
      email: 'admin@snapshare.io',
      passwordHash,
      role: 'admin',
      plan: 'enterprise',
      storageQuota: 100 * 1024 * 1024 * 1024,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      customBranding: {
        enabled: true,
        companyName: 'SnapShare Global Studios',
        brandColor: '#8B5CF6',
        customMessage: 'High-speed encrypted digital asset vault',
      },
    });

    // 2. Create Demo User
    const demoUser = await User.create({
      name: 'Elena Rostova',
      email: 'demo@snapshare.io',
      passwordHash,
      role: 'user',
      plan: 'pro',
      storageQuota: 25 * 1024 * 1024 * 1024,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    });

    // 3. Create Sample Collections for Demo User
    const weddingColl = await Collection.create({
      ownerId: demoUser._id,
      title: 'Elena & Lucas Wedding Highlights 2026',
      description: 'Exclusive master photo collection, vows video, and guest album in 4K resolution.',
      category: 'wedding',
      template: 'wedding',
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
      accessType: 'public',
      allowDownloads: true,
      tags: ['wedding', 'celebration', '4K', 'memories'],
      viewsCount: 342,
      scanCount: 189,
      downloadCount: 84,
    });

    const projectColl = await Collection.create({
      ownerId: demoUser._id,
      title: 'Project Nebula — Executive Design System & Assets',
      description: 'Production vector specifications, color palettes, mobile mockups, and client documentation.',
      category: 'project',
      template: 'project',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      accessType: 'public',
      allowDownloads: true,
      tags: ['design', 'ui', 'specs', 'production'],
      viewsCount: 120,
      scanCount: 45,
      downloadCount: 28,
    });

    // 4. Create QR codes
    await QRCode.create({
      collectionId: weddingColl._id,
      qrStyle: {
        template: 'event',
        dotsColor: '#EC4899',
        bgColor: '#0B0F19',
        cornerColor: '#F43F5E',
        showLogo: true,
      },
      scanCount: 189,
    });

    await QRCode.create({
      collectionId: projectColl._id,
      qrStyle: {
        template: 'gradient',
        dotsColor: '#8B5CF6',
        bgColor: '#080B14',
        cornerColor: '#06B6D4',
        showLogo: true,
      },
      scanCount: 45,
    });

    // 5. Create Sample Files
    // Let's create dummy files on disk in uploads/files
    const sampleFiles = [
      {
        name: 'Ceremony_First_Look.jpg',
        mime: 'image/jpeg',
        ext: 'jpg',
        content: 'Sample Image Content',
        category: 'image',
        size: 2450000,
        collId: weddingColl._id,
      },
      {
        name: 'Wedding_Guest_Directory.pdf',
        mime: 'application/pdf',
        ext: 'pdf',
        content: '%PDF-1.4 sample pdf content for snapshare demonstration',
        category: 'document',
        size: 512000,
        collId: weddingColl._id,
      },
      {
        name: 'Nebula_Brand_Guidelines.pdf',
        mime: 'application/pdf',
        ext: 'pdf',
        content: '%PDF-1.4 brand design tokens and guidelines',
        category: 'document',
        size: 1420000,
        collId: projectColl._id,
      },
      {
        name: 'Nebula_Architecture_Schema.json',
        mime: 'application/json',
        ext: 'json',
        content: JSON.stringify({ system: 'Nebula', modules: ['auth', 'qr', 'cloud-sync'] }, null, 2),
        category: 'code',
        size: 1024,
        collId: projectColl._id,
      },
    ];

    let totalUserStorage = 0;

    for (const f of sampleFiles) {
      const storageKey = storageService.generateKey('files', f.ext);
      const filePath = storageService.getFilePath(storageKey);
      fs.writeFileSync(filePath, f.content);

      await File.create({
        ownerId: demoUser._id,
        collectionId: f.collId,
        originalName: f.name,
        storageKey,
        mimeType: f.mime,
        fileExtension: f.ext,
        fileSize: f.size,
        checksum: 'checksum_' + Math.random().toString(36).substring(7),
        metadata: {
          aiCategory: f.category,
          aiTags: [f.category.toUpperCase(), 'Verified'],
          aiDescription: `High-fidelity ${f.name} asset`,
        },
      });

      totalUserStorage += f.size;
    }

    weddingColl.totalFiles = 2;
    weddingColl.totalSize = 2962000;
    await weddingColl.save();

    projectColl.totalFiles = 2;
    projectColl.totalSize = 1421024;
    await projectColl.save();

    demoUser.storageUsed = totalUserStorage;
    await demoUser.save();

    console.log('Seed completed successfully!');
    console.log('Admin account: admin@snapshare.io / SnapShare2026!');
    console.log('Demo account:  demo@snapshare.io  / SnapShare2026!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
