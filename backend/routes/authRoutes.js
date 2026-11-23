import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  deleteAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

export default router;
