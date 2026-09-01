const express = require('express');
const router = express.Router();
const { updateProfile, getProfile } = require('../controllers/vendorController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/profile')
  .get(protect, authorize('vendor'), getProfile)
  .put(protect, authorize('vendor'), updateProfile);

module.exports = router;
