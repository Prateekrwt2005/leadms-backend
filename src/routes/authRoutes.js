const express = require('express');
const router = express.Router();
const { 
  register, 
  confirmEmail, 
  login, 
  logout, 
  refreshToken, 
  forgotPassword, 
  resetPassword, 
  inviteTeamMember, 
  acceptInvitation 
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

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

module.exports = router;
