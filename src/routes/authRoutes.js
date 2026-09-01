import express from 'express';
const router = express.Router();
import { register, 
  confirmEmail, 
  login, 
  logout, 
  refreshToken, 
  forgotPassword, 
  resetPassword, 
  inviteTeamMember, 
  acceptInvitation 
 } from '../controllers/authController.js';
import { protect, authorize  } from '../middlewares/authMiddleware.js';

// Public routes
router.post('/register', register);
router.get('/confirm-email', confirmEmail);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/accept-invitation', acceptInvitation);

// Protected routes
router.post('/logout', protect, logout);
router.post('/invite', protect, authorize('vendor'), inviteTeamMember);

export default router;
