const express = require('express');
const router = express.Router();
const { 
  createProduct, 
  getTraderProducts, 
  updateProduct, 
  deleteProduct, 
  getAvailableProducts, 
  lockProduct, 
  unlockProduct, 
  getVendorLockedProducts 
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Trader Routes
router.route('/trader')
  .post(protect, authorize('trader'), createProduct)
  .get(protect, authorize('trader'), getTraderProducts);

router.route('/trader/:id')
  .put(protect, authorize('trader'), updateProduct)
  .delete(protect, authorize('trader'), deleteProduct);

// Vendor Routes
router.get('/available', protect, authorize('vendor'), getAvailableProducts);
router.post('/:id/lock', protect, authorize('vendor'), lockProduct);
router.post('/:id/unlock', protect, authorize('vendor'), unlockProduct);

// Team-member Routes
router.get('/locked', protect, authorize('team-member', 'vendor'), getVendorLockedProducts);

module.exports = router;
