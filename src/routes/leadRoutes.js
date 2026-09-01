import express from 'express';
const router = express.Router();
import { createLead, getLeads, assignLead, generateQuote  } from '../controllers/leadController.js';
import { protect, authorize  } from '../middlewares/authMiddleware.js';

router.route('/')
  .post(protect, authorize('vendor', 'team-member'), createLead)
  .get(protect, authorize('vendor', 'team-member'), getLeads);

router.put('/:id/assign', protect, authorize('vendor'), assignLead);
router.post('/:id/quote', protect, authorize('vendor'), generateQuote);

export default router;
