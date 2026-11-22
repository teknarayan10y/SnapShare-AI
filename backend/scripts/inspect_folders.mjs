import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const SmartFolder = mongoose.model('SmartFolder', new mongoose.Schema({
  fileIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }]
}, { strict: false }));
const File = mongoose.model('File', new mongoose.Schema({}, { strict: false }));

const folders = await SmartFolder.find({}, {}, { strictPopulate: false }).populate({ path: 'fileIds', select: 'originalName photoComposition personCount aiTags aiStatus', strictPopulate: false });

for (const f of folders) {
  console.log(`\nFolder: "${f.name}" (${f.category}) — ${(f.fileIds||[]).length} files`);
  for (const file of (f.fileIds || [])) {
    if (typeof file === 'object' && file.originalName) {
      console.log(`  - ${file.originalName} | composition=${file.photoComposition} | personCount=${file.personCount} | aiStatus=${file.aiStatus}`);
    } else {
      console.log(`  - [bare ID: ${file}]`);
    }
  }
}

await mongoose.disconnect();
