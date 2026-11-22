import express from 'express';
import {
  prepareDownloadJob,
  getJobStatus,
  downloadJobFile,
  streamZipDownload,
} from '../controllers/downloadController.js';

const router = express.Router();

router.post('/prepare', prepareDownloadJob);
router.get('/:jobId/status', getJobStatus);
router.get('/:jobId/file', downloadJobFile);
router.post('/stream', streamZipDownload);

export default router;
