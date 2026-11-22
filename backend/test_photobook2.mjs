import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const { photobookService } = await import('./services/photobookService.js');
await mongoose.connect('mongodb://127.0.0.1:27017/snapshare');

const book = await photobookService.generatePhotobookLayout({});
console.log('Photobook total pages:', book.totalPages);
for (const p of book.pages) {
  console.log('Page ' + p.pageNumber + ': ' + (p.title || p.spreadTitle));
  if (p.caption) console.log('  Spread Caption:', p.caption);
  if (p.photos) {
    p.photos.forEach((ph, i) => {
      console.log('  Photo ' + (i+1) + ' Caption:', ph.caption);
    });
  }
}
await mongoose.disconnect();
