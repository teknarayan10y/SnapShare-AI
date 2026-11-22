/**
 * Reset & re-analyze all files:
 * 1. Delete all SmartFolders
 * 2. Delete all AIAnalysis records
 * 3. Reset all File.aiStatus to 'pending'
 * 4. Clear aiTags, aiCaption, etc.
 * Then the user can click "Analyze All" in the AI Organizer to reprocess.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

// Use raw collections to avoid schema strictness issues
const db = mongoose.connection.db;

// 1. Delete all SmartFolders
const sfResult = await db.collection('smartfolders').deleteMany({});
console.log(`Deleted ${sfResult.deletedCount} SmartFolder(s)`);

// 2. Delete all AIAnalysis records
const aaResult = await db.collection('aianalyses').deleteMany({});
console.log(`Deleted ${aaResult.deletedCount} AIAnalysis record(s)`);

// 3. Delete all AIJob records
const ajResult = await db.collection('aijobs').deleteMany({});
console.log(`Deleted ${ajResult.deletedCount} AIJob(s)`);

// 4. Reset all File AI fields
const fResult = await db.collection('files').updateMany(
  {},
  {
    $set: {
      aiStatus: 'pending',
      aiCaption: '',
      aiTags: [],
      detectedObjects: [],
      sceneLabels: [],
      qualityScore: null,
      embedding: [],
      perceptualHash: '',
      photoComposition: null,
      personCount: null,
    },
    $unset: { aiAnalysisId: '' }
  }
);
console.log(`Reset ${fResult.modifiedCount} File(s) to pending`);

await mongoose.disconnect();
console.log('\n✅ Done! All smart folders cleared. Go to AI Organizer → click "Analyze All" to re-process.');
