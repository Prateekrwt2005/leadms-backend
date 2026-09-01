import express from 'express';
const router = express.Router();
import { createProduct, 
  getTraderProducts, 
  updateProduct, 
  deleteProduct, 
  getAvailableProducts, 
  lockProduct, 
  unlockProduct, 
  getVendorLockedProducts 
 } from '../controllers/productController.js';
import { protect, authorize  } from '../middlewares/authMiddleware.js';

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

export default router;
