import express from 'express';
const router = express.Router();
import { updateProfile, getProfile  } from '../controllers/vendorController.js';
import { protect, authorize  } from '../middlewares/authMiddleware.js';

router.route('/profile')
  .get(protect, authorize('vendor'), getProfile)
  .put(protect, authorize('vendor'), updateProfile);

export default router;
