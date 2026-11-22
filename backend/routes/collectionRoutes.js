import express from 'express';
import {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  duplicateCollection,
} from '../controllers/collectionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createCollection)
  .get(getCollections);

router.route('/:id')
  .get(getCollectionById)
  .patch(updateCollection)
  .delete(deleteCollection);

router.post('/:id/duplicate', duplicateCollection);

export default router;
