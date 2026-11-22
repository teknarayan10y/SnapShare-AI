import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PersonProfile } from '../models/PersonProfile.js';
import { FaceDetection } from '../models/FaceDetection.js';
import { GroupFolder } from '../models/GroupFolder.js';
import { SmartFolder } from '../models/SmartFolder.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { OrganizationHistory } from '../models/OrganizationHistory.js';
import { faceOrganizationService } from '../services/faceOrganizationService.js';
import { ruleEngineService } from '../services/ruleEngineService.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
console.log(' Connected to MongoDB for Test Suite');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASSED: ${testName}`);
  } else {
    console.error(`❌ FAILED: ${testName}`);
    process.exitCode = 1;
  }
}

try {
  // Test 1: Deterministic Group Key Generation (Section 7)
  console.log('\n--- Test 1: Deterministic Group Key Generator ---');
  const userId = new mongoose.Types.ObjectId();
  const collectionId = new mongoose.Types.ObjectId();
  const idA = '6738c101000000000000000a';
  const idB = '6738c101000000000000000b';
  const idC = '6738c101000000000000000c';
  const idD = '6738c101000000000000000d';

  // Photo A has [A, B, C, D]
  const key1 = faceOrganizationService.generateGroupKey({
    userId,
    collectionId,
    memberIds: [idA, idB, idC, idD],
  });

  // Photo B has [D, C, A, B] (different face order!)
  const key2 = faceOrganizationService.generateGroupKey({
    userId,
    collectionId,
    memberIds: [idD, idC, idA, idB],
  });

  assert(key1 === key2, 'Same four people in different order produce identical groupKey');

  // Different group of 4 people
  const idE = '6738c101000000000000000e';
  const key3 = faceOrganizationService.generateGroupKey({
    userId,
    collectionId,
    memberIds: [idA, idB, idC, idE],
  });
  assert(key1 !== key3, 'Different member combination produces distinct groupKey');

  // Test 2: Natural Language Command Interpretation (Section 9)
  console.log('\n--- Test 2: Natural Language Command Interpreter ---');
  const res1 = ruleEngineService.interpretCommand('If a photo contains more than four people, put it in Group Photos.');
  assert(res1.valid && res1.rule.actions[0].type === 'send_to_group_photos', 'Interprets "> 4 people" rule correctly');

  const res2 = ruleEngineService.interpretCommand('Create a separate folder for every unique group of four people.');
  assert(res2.valid && res2.rule.actions[0].type === 'match_or_create_exact_group' && res2.rule.actions[0].params.groupSize === 4, 'Interprets "unique group of 4" rule correctly');

  const res3 = ruleEngineService.interpretCommand('Group photos containing two recognized people together.');
  assert(res3.valid && res3.rule.actions[0].params.groupSize === 2, 'Interprets "two people pair" rule correctly');

  const res4 = ruleEngineService.interpretCommand('Create individual folders for each recognized person.');
  assert(res4.valid && res4.rule.actions[0].type === 'add_to_individual_folder', 'Interprets individual photo rule correctly');

  const res5 = ruleEngineService.interpretCommand('Keep unknown people in Needs Review.');
  assert(res5.valid && res5.rule.actions[0].type === 'send_to_review', 'Interprets unknown faces rule correctly');

  // Test 3: Rule Schema Validation (Section 9)
  console.log('\n--- Test 3: Strict Allowlist Rule Validation ---');
  const validRule = {
    conditions: [{ field: 'faceCount', operator: 'greater_than', value: 4 }],
    actions: [{ type: 'send_to_group_photos' }],
  };
  assert(ruleEngineService.validateRule(validRule).valid, 'Valid rule passes validation');

  const dangerousRule = {
    conditions: [{ field: 'arbitrary_exec', operator: 'equals', value: 'DROP TABLE' }],
    actions: [{ type: 'send_to_group_photos' }],
  };
  assert(!ruleEngineService.validateRule(dangerousRule).valid, 'Disallowed arbitrary field is rejected by validator');

  // Test 4: Deterministic Rules Execution (Section 6)
  console.log('\n--- Test 4: Business Rules A through G Execution ---');
  let testUser = await User.findOne({});
  if (!testUser) {
    testUser = await User.create({
      name: 'Test Organizer User',
      email: `test_org_${Date.now()}@snapshare.local`,
      passwordHash: 'dummyhash123',
    });
  }
  console.log('Using test user:', testUser.email);

  console.log('Creating test file A...');
  const testFileA = await File.create({
    ownerId: testUser._id,
    collectionId: new mongoose.Types.ObjectId(),
    originalName: 'five_friends.jpg',
    storageKey: 'test/five_friends.jpg',
    mimeType: 'image/jpeg',
    fileExtension: 'jpg',
    fileSize: 204800,
  });
  console.log('Test file A created.');

  // Rule A: More than four people (faceCount = 5)
  console.log('Executing Rule A...');
  const ruleARes = await faceOrganizationService.organizePhotoByRules({
    file: testFileA,
    userId: testUser._id,
    faceCount: 5,
    hasConsent: true,
  });
  console.log('Rule A result:', ruleARes);
  assert(ruleARes.ruleApplied.includes('Rule A') && ruleARes.assignedFolders.some((f) => f.name === 'Group Photos'), 'Rule A: 5 people routed strictly to Group Photos');

  // Create mock person profiles for exact combinations
  const prof1 = await PersonProfile.create({ userId: testUser._id, displayName: 'Person A', unnamedId: 'p_1' });
  const prof2 = await PersonProfile.create({ userId: testUser._id, displayName: 'Person B', unnamedId: 'p_2' });
  const prof3 = await PersonProfile.create({ userId: testUser._id, displayName: 'Person C', unnamedId: 'p_3' });
  const prof4 = await PersonProfile.create({ userId: testUser._id, displayName: 'Person D', unnamedId: 'p_4' });

  // Rule B: Exactly four people (faceCount = 4)
  const testFileB1 = await File.create({
    ownerId: testUser._id,
    collectionId: new mongoose.Types.ObjectId(),
    originalName: 'four_friends_1.jpg',
    storageKey: 'test/four_friends_1.jpg',
    mimeType: 'image/jpeg',
    fileExtension: 'jpg',
    fileSize: 204800,
  });

  const ruleBRes1 = await faceOrganizationService.organizePhotoByRules({
    file: testFileB1,
    userId: testUser._id,
    faceCount: 4,
    matchedProfiles: [prof1, prof2, prof3, prof4],
    hasConsent: true,
  });
  const createdFolderId = ruleBRes1.assignedFolders[0]._id;
  assert(ruleBRes1.ruleApplied.includes('Rule B'), 'Rule B: 4 people created 4-member combination folder');

  // Rule B Reuse: Second photo with same 4 people in reversed order!
  const testFileB2 = await File.create({
    ownerId: testUser._id,
    collectionId: new mongoose.Types.ObjectId(),
    originalName: 'four_friends_2_reordered.jpg',
    storageKey: 'test/four_friends_2.jpg',
    mimeType: 'image/jpeg',
    fileExtension: 'jpg',
    fileSize: 204800,
  });

  const ruleBRes2 = await faceOrganizationService.organizePhotoByRules({
    file: testFileB2,
    userId: testUser._id,
    faceCount: 4,
    matchedProfiles: [prof4, prof3, prof2, prof1], // reversed!
    hasConsent: true,
  });
  const reusedFolderId = ruleBRes2.assignedFolders[0]._id;
  assert(String(createdFolderId) === String(reusedFolderId), 'Rule B Reuse: Folder was successfully reused atomically!');

  // Rule D: Exactly two people (faceCount = 2)
  const testFileD = await File.create({
    ownerId: testUser._id,
    collectionId: new mongoose.Types.ObjectId(),
    originalName: 'couple_duo.jpg',
    storageKey: 'test/couple_duo.jpg',
    mimeType: 'image/jpeg',
    fileExtension: 'jpg',
    fileSize: 102400,
  });

  const ruleDRes = await faceOrganizationService.organizePhotoByRules({
    file: testFileD,
    userId: testUser._id,
    faceCount: 2,
    matchedProfiles: [prof1, prof2],
    hasConsent: true,
  });
  assert(ruleDRes.ruleApplied.includes('Rule D'), 'Rule D: 2 people created two-member pair folder');

  // Rule E: Exactly one person (faceCount = 1)
  const testFileE = await File.create({
    ownerId: testUser._id,
    collectionId: new mongoose.Types.ObjectId(),
    originalName: 'solo_portrait.jpg',
    storageKey: 'test/solo.jpg',
    mimeType: 'image/jpeg',
    fileExtension: 'jpg',
    fileSize: 95000,
  });

  const ruleERes = await faceOrganizationService.organizePhotoByRules({
    file: testFileE,
    userId: testUser._id,
    faceCount: 1,
    matchedProfiles: [prof1],
    hasConsent: true,
  });
  assert(ruleERes.ruleApplied.includes('Rule E'), 'Rule E: Solo photo routed to individual person folder');

  // Rule G: Unknown / uncertain person without consent
  const testFileG = await File.create({
    ownerId: testUser._id,
    collectionId: new mongoose.Types.ObjectId(),
    originalName: 'unknown_party.jpg',
    storageKey: 'test/unknown.jpg',
    mimeType: 'image/jpeg',
    fileExtension: 'jpg',
    fileSize: 150000,
  });

  const ruleGRes = await faceOrganizationService.organizePhotoByRules({
    file: testFileG,
    userId: testUser._id,
    faceCount: 3,
    matchedProfiles: [prof1], // only 1 recognized out of 3 faces!
    hasConsent: true,
  });
  assert(ruleGRes.ruleApplied.includes('Rule G') && ruleGRes.assignedFolders.some((f) => f.name === 'Needs Review'), 'Rule G: Incomplete recognized combination held in Needs Review');

  // Clean up test data
  await File.deleteMany({ _id: { $in: [testFileA._id, testFileB1._id, testFileB2._id, testFileD._id, testFileE._id, testFileG._id] } });
  await SmartFolder.deleteMany({ userId: testUser._id });
  await GroupFolder.deleteMany({ userId: testUser._id });
  await PersonProfile.deleteMany({ userId: testUser._id });

  console.log(`\n======================================================`);
  console.log(`TEST SUITE COMPLETE: ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log(`======================================================\n`);
} catch (err) {
  console.error('Test Suite encountered an error:', err);
} finally {
  await mongoose.disconnect();
}
