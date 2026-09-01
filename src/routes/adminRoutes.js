import express from 'express';
const router = express.Router();
import { getAllUsers, getAllLeads, getAnalytics  } from '../controllers/adminController.js';
import { protect, authorize  } from '../middlewares/authMiddleware.js';

// All routes here require the 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.get('/leads', getAllLeads);
router.get('/analytics', getAnalytics);

export default router;
