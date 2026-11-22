import mongoose from 'mongoose';
import axios from 'axios';
import { File } from '../models/File.js';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { SmartFolder } from '../models/SmartFolder.js';
import { FaceDetection } from '../models/FaceDetection.js';
import { User } from '../models/User.js';
import { faceOrganizationService } from '../services/faceOrganizationService.js';

const AI_SERVICE_URL = 'http://127.0.0.1:8000';

async function reprocessAndOrganize() {
  await mongoose.connect('mongodb://127.0.0.1:27017/snapshare');
  console.log('Connected to MongoDB');

  const users = await User.find({});
  for (const user of users) {
    console.log('\n======================================================');
    console.log(`Processing user: ${user.name} (${user.email}) - ${user._id}`);
    console.log('======================================================');

    const files = await File.find({
      $or: [{ ownerId: user._id }, { userId: user._id }],
    });
    console.log(`Found ${files.length} file(s) for user.`);
    if (files.length === 0) continue;

    // 1. Rename existing legacy folder records for clean migration
    const legacyTwo = await SmartFolder.findOne({ userId: user._id, name: 'Two Member Groups' });
    if (legacyTwo) {
      console.log('Renaming "Two Member Groups" -> "Two People"');
      legacyTwo.name = 'Two People';
      legacyTwo.category = 'Two People';
      await legacyTwo.save();
    }

    const legacyThree = await SmartFolder.findOne({ userId: user._id, name: 'Three Member Groups' });
    if (legacyThree) {
      console.log('Renaming "Three Member Groups" -> "Three People"');
      legacyThree.name = 'Three People';
      legacyThree.category = 'Three People';
      await legacyThree.save();
    }

    // Deduplicate any duplicate folders
    const allUserFolders = await SmartFolder.find({ userId: user._id });
    const seenNames = new Map();
    for (const f of allUserFolders) {
      if (!seenNames.has(f.name)) {
        seenNames.set(f.name, f._id);
      } else {
        console.log(`Deleting duplicate folder: ${f.name} (${f._id})`);
        await SmartFolder.findByIdAndDelete(f._id);
      }
    }

    // Reset all folder fileIds
    await SmartFolder.updateMany({ userId: user._id }, { $set: { fileIds: [] } });

    // Ensure all 7 canonical folders exist
    const baseFolders = await faceOrganizationService.ensureBaseFolders(user._id);

    // 2. Perform fresh neural face detection on every image
    for (const file of files) {
      const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg'].includes(
        (file.fileExtension || '').toLowerCase()
      );

      let detectedFaceCount = 0;
      let detectedFaces = [];
      let comp = 'non_human';

      if (isImage && file.cloudinaryUrl) {
        try {
          const res = await axios.post(`${AI_SERVICE_URL}/analyze/faces`, {
            fileUrl: file.cloudinaryUrl,
            filename: file.originalName,
            confidenceThreshold: 0.85,
            generateEmbeddings: false,
          });

          if (res.data?.success) {
            detectedFaceCount = res.data.faceCount || 0;
            detectedFaces = res.data.faces || [];
            comp = res.data.photoComposition || 'non_human';
          }
        } catch (apiErr) {
          console.warn(`Face detection error for ${file.originalName}:`, apiErr.message);
        }
      }

      // Record FaceDetection in MongoDB
      await FaceDetection.findOneAndUpdate(
        { fileId: file._id, userId: user._id },
        {
          fileId: file._id,
          userId: user._id,
          collectionId: file.collectionId || null,
          boundingBoxes: detectedFaces,
          detectionConfidence: detectedFaces[0]?.detectionConfidence || 0,
          faceCount: detectedFaceCount,
          matchedProfileIds: [],
          analysisStatus: 'completed',
        },
        { upsert: true, new: true }
      );

      // Determine clean caption and tags
      let caption = file.aiCaption || '';
      let tags = file.aiTags || [];

      if (detectedFaceCount > 4) {
        comp = 'group';
        caption = `A group photo featuring ${detectedFaceCount} people.`;
        tags = ['Group Photo', 'People', 'Social', 'Group Gathering', 'Friends'];
      } else if (detectedFaceCount === 4) {
        comp = 'four_person';
        caption = `A four-person photo featuring four people.`;
        tags = ['Four People', 'Four-Member Group', 'Quartet', 'Friends'];
      } else if (detectedFaceCount === 3) {
        comp = 'three_person';
        caption = `A three-person photo featuring three people.`;
        tags = ['Three People', 'Three-Member Group', 'Trio', 'Friends'];
      } else if (detectedFaceCount === 2) {
        comp = 'pair';
        caption = `A two-person photo featuring two people.`;
        tags = ['Two People', 'Pair', 'Couple', 'Duo'];
      } else if (detectedFaceCount === 1) {
        comp = 'single_person';
        caption = `A single portrait featuring one person.`;
        tags = ['Solo', 'Single Photo', 'Portrait', 'Person'];
      } else {
        comp = 'non_human';
      }

      file.personCount = detectedFaceCount;
      file.photoComposition = comp;
      file.aiCaption = caption;
      file.aiTags = tags;
      file.smartFolderIds = [];
      await file.save();

      // Update AIAnalysis record
      await AIAnalysis.findOneAndUpdate(
        { fileId: file._id },
        {
          caption,
          tags,
          personCount: detectedFaceCount,
          photoComposition: comp,
        }
      );

      // 3. Execute strict deterministic folder assignment
      const orgRes = await faceOrganizationService.organizePhotoByRules({
        file,
        userId: user._id,
        collectionId: file.collectionId,
        faceCount: detectedFaceCount,
        faces: detectedFaces,
        matchedProfiles: [],
        hasConsent: false,
      });

      console.log(
        `File: ${file.originalName.padEnd(22)} | Faces: ${String(detectedFaceCount).padEnd(2)} | Folder: ${orgRes?.assignedFolders?.map((af) => af.name).join(', ')}`
      );
    }

    // 4. Print final verified distribution
    const finalFolders = await SmartFolder.find({ userId: user._id }).sort('name');
    console.log('\n--- Final Verified Smart Folder Distribution ---');
    for (const uf of finalFolders) {
      console.log(`📁 ${uf.name.padEnd(25)} : ${(uf.fileIds || []).length} file(s)`);
    }
  }

  console.log('\nRe-processing and organization completed successfully!');
  process.exit(0);
}

reprocessAndOrganize().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
