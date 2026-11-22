import express from 'express';
import {
  getPublicCollection,
  verifyPassword,
} from '../controllers/publicController.js';
import { findMyPhotos } from '../controllers/selfieController.js';
import { attachVoiceNote } from '../controllers/fileController.js';
import { getPhotobook } from '../controllers/photobookController.js';

const router = express.Router();

router.get('/:shareToken', getPublicCollection);
router.post('/:shareToken/verify', verifyPassword);
router.post('/find-my-photos', findMyPhotos);
router.post('/files/:id/voice-note', attachVoiceNote);
router.get('/photobook/:collectionId', getPhotobook);

export default router;
