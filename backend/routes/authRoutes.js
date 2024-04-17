const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

//! Register user route
router.post('/register', authController.register);

//! Login user route
router.post('/login', authController.login);

//! Generate invite code route 
router.get('/generate', authenticateToken, authController.generateInviteCode);

//! Get user's invite codes route
router.get('/invite-codes', authenticateToken, authController.getUserInviteCodes);

//! Delete user invite code route
router.delete('/invite-codes/:codeId', authenticateToken, authController.deleteUserInviteCode);

module.exports = router;
