import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { File } from '../models/File.js';
import { Collection } from '../models/Collection.js';
import { SmartFolder } from '../models/SmartFolder.js';
import { User } from '../models/User.js';
import { faceOrganizationService } from '../services/faceOrganizationService.js';

async function syncAndOrganize() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas!');

  const user = await User.findOne({ email: 'teknarayan0725@gmail.com' });
  if (!user) {
    console.error('Target user not found!');
    process.exit(1);
  }
  console.log(`Syncing for user: ${user.name} (${user.email}) - ${user._id}`);

  // 1. Reassign orphaned collections
  const colRes = await Collection.updateMany(
    { ownerId: { $ne: user._id } },
    { $set: { ownerId: user._id } }
  );
  console.log('Updated collections to active user:', colRes.modifiedCount);

  // 2. Reassign orphaned files
  const fileRes = await File.updateMany(
    { ownerId: { $ne: user._id } },
    { $set: { ownerId: user._id } }
  );
  console.log('Updated files to active user:', fileRes.modifiedCount);

  // 3. Remove orphaned smart folders from old deleted test user IDs
  const delFolders = await SmartFolder.deleteMany({
    userId: { $ne: user._id }
  });
  console.log('Deleted orphaned smart folders:', delFolders.deletedCount);

  // 4. Ensure 7 canonical base folders exist for the user
  const baseFolders = await faceOrganizationService.ensureBaseFolders(user._id);
  console.log('Canonical folders verified:');
  Object.keys(baseFolders).forEach(k => console.log(' -', k));

  // 5. Reset folder file lists before re-organizing
  await SmartFolder.updateMany({ userId: user._id }, { $set: { fileIds: [] } });

  // 6. Re-organize each file according to strict rules
  const files = await File.find({ ownerId: user._id });
  console.log(`\nRe-organizing ${files.length} file(s) into smart folders...`);

  for (const f of files) {
    const pCount = f.personCount ?? 0;
    console.log(`Processing: ${f.originalName} (personCount: ${pCount}, comp: ${f.photoComposition})`);

    const faces = [];
    for (let i = 0; i < pCount; i++) {
      faces.push({
        detectionConfidence: 0.95,
        box: [100, 100, 150, 200],
        embedding: new Array(128).fill(0.05),
      });
    }

    const orgRes = await faceOrganizationService.organizePhotoByRules({
      file: f,
      userId: user._id,
      collectionId: f.collectionId,
      faceCount: pCount,
      faces,
      hasConsent: true,
      isLowConfidence: false,
    });

    console.log(` -> Assigned to: ${orgRes.assignedFolders.map(af => af.name).join(', ')} [${orgRes.ruleApplied}]`);
  }

  // 7. Verify final folders state
  const finalFolders = await SmartFolder.find({ userId: user._id });
  console.log('\n================ FINAL SMART FOLDERS ================');
  for (const fo of finalFolders) {
    console.log(`Folder: "${fo.name}" | Files: ${fo.fileIds.length} | Category: ${fo.category}`);
  }
  console.log('====================================================\n');

  await mongoose.disconnect();
}

syncAndOrganize().catch(console.error);
