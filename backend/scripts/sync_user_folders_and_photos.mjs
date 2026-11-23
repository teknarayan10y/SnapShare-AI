import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { File } from '../models/File.js';
import { Collection } from '../models/Collection.js';
import { SmartFolder } from '../models/SmartFolder.js';
import { PersonProfile } from '../models/PersonProfile.js';
import { User } from '../models/User.js';
import { faceOrganizationService } from '../services/faceOrganizationService.js';
import { aiClient } from '../services/aiMicroserviceClient.js';

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
  await Collection.updateMany(
    { ownerId: { $ne: user._id } },
    { $set: { ownerId: user._id } }
  );

  // 2. Reassign orphaned files
  await File.updateMany(
    { ownerId: { $ne: user._id } },
    { $set: { ownerId: user._id } }
  );

  // 3. Clear previous person profiles and person subfolders to re-index cleanly
  await PersonProfile.deleteMany({ userId: user._id });
  await SmartFolder.deleteMany({ userId: user._id, isPersonFolder: true });

  // 4. Ensure canonical base folders exist
  const baseFolders = await faceOrganizationService.ensureBaseFolders(user._id);

  // 5. Reset folder file lists
  await SmartFolder.updateMany({ userId: user._id }, { $set: { fileIds: [] } });

  // 6. Re-organize each file using real neural face embeddings
  const files = await File.find({ ownerId: user._id });
  console.log(`\nAnalyzing & Re-organizing ${files.length} file(s) with neural embeddings...`);

  for (const f of files) {
    console.log(`\nDetecting faces for: ${f.originalName}...`);
    const faceRes = await aiClient.analyzeFaces('', f.originalName, f.cloudinaryUrl, true, 0.55);
    const pCount = faceRes.faceCount || f.personCount || 0;
    const faces = faceRes.faces || [];
    console.log(` -> Detected ${pCount} person(s). Has face embedding: ${faces[0]?.embedding?.length > 0}`);

    const orgRes = await faceOrganizationService.organizePhotoByRules({
      file: f,
      userId: user._id,
      collectionId: f.collectionId,
      faceCount: pCount,
      faces,
      matchedProfiles: [],
      hasConsent: true,
      isLowConfidence: false,
    });

    console.log(` -> Assigned to: ${orgRes.assignedFolders.map(af => af.name).join(', ')} [${orgRes.ruleApplied}]`);
  }

  // 7. Verify final folders state
  const finalFolders = await SmartFolder.find({ userId: user._id });
  console.log('\n================ FINAL SMART FOLDERS ================');
  for (const fo of finalFolders) {
    console.log(`Folder: "${fo.name}" | Files: ${fo.fileIds.length} | Category: ${fo.category} | PersonFolder: ${!!fo.isPersonFolder}`);
  }
  console.log('====================================================\n');

  await mongoose.disconnect();
}

syncAndOrganize().catch(console.error);
