const express = require('express');
const router = express.Router();
const { createLead, getLeads, assignLead, generateQuote } = require('../controllers/leadController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, authorize('vendor', 'team-member'), createLead)
  .get(protect, authorize('vendor', 'team-member'), getLeads);

router.put('/:id/assign', protect, authorize('vendor'), assignLead);
router.post('/:id/quote', protect, authorize('vendor'), generateQuote);

module.exports = router;
