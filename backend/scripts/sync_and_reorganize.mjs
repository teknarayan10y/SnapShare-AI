import mongoose from 'mongoose';
import { File } from '../models/File.js';
import { SmartFolder } from '../models/SmartFolder.js';
import { FaceDetection } from '../models/FaceDetection.js';
import { User } from '../models/User.js';
import { faceOrganizationService } from '../services/faceOrganizationService.js';

async function syncAndReorganize() {
  await mongoose.connect('mongodb://127.0.0.1:27017/snapshare');
  console.log('Connected to MongoDB');

  const users = await User.find({});
  for (const user of users) {
    console.log('\n======================================================');
    console.log('Processing user:', user.name, user.email, user._id.toString());
    console.log('======================================================');

    const files = await File.find({
      $or: [{ ownerId: user._id }, { userId: user._id }],
    });
    console.log(`Found ${files.length} file(s) for user.`);
    if (files.length === 0) continue;

    // Fetch existing smart folders for this user
    const existingFolders = await SmartFolder.find({ userId: user._id });
    console.log(`Existing smart folders before cleanup: ${existingFolders.length}`);

    // Remove legacy or duplicate base folders
    const baseNames = [
      'People',
      'Individual Photos',
      'Two Member Groups',
      'Three Member Groups',
      'Four Member Groups',
      'Group Photos',
      'Needs Review',
    ];

    for (const bName of baseNames) {
      const matching = existingFolders.filter((f) => f.name === bName);
      if (matching.length > 1) {
        // Keep the latest one, remove older duplicates
        matching.sort((a, b) => b.createdAt - a.createdAt);
        for (let i = 1; i < matching.length; i++) {
          console.log(`Removing duplicate folder: ${matching[i]._id} (${matching[i].name})`);
          await SmartFolder.findByIdAndDelete(matching[i]._id);
        }
      }
    }

    // Remove obsolete legacy folder names like "Single Photos" / "Pair Photos"
    for (const f of existingFolders) {
      if (['Single Photos', 'Pair Photos'].includes(f.name)) {
        console.log(`Removing legacy folder: ${f.name} (${f._id})`);
        await SmartFolder.findByIdAndDelete(f._id);
      }
    }

    // Reset fileIds on all folders for this user
    await SmartFolder.updateMany({ userId: user._id }, { $set: { fileIds: [] } });

    // Ensure all 7 canonical folders exist
    const baseFolders = await faceOrganizationService.ensureBaseFolders(user._id);

    // Reorganize every file
    for (const file of files) {
      file.smartFolderIds = [];

      const faceDoc = await FaceDetection.findOne({ fileId: file._id });
      const faceCount = file.personCount ?? faceDoc?.faceCount ?? 0;

      const res = await faceOrganizationService.organizePhotoByRules({
        file,
        userId: user._id,
        collectionId: file.collectionId,
        faceCount,
        faces: faceDoc?.boundingBoxes || [],
        matchedProfiles: [],
        hasConsent: false,
      });

      console.log(
        `File: ${file.originalName.padEnd(20)} | Faces: ${String(faceCount).padEnd(2)} | Rule: ${(res?.ruleApplied || 'None').padEnd(30)} | Folders: ${res?.assignedFolders?.map((af) => af.name).join(', ')}`
      );
    }

    // Verify folder counts
    const updatedFolders = await SmartFolder.find({ userId: user._id }).sort('name');
    console.log('\n--- Final Smart Folder Distribution ---');
    for (const uf of updatedFolders) {
      console.log(`📁 ${uf.name.padEnd(25)} : ${(uf.fileIds || []).length} file(s)`);
    }
  }

  console.log('\nSync and reorganization completed successfully!');
  process.exit(0);
}

syncAndReorganize().catch((err) => {
  console.error('Error during reorganization:', err);
  process.exit(1);
});
