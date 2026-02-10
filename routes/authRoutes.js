const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/ - get details of logged user
router.get('/', authMiddleware, authController.getProfile);

// PUT /api/auth/profile - update profile picture
router.put('/profile', authMiddleware, upload.single('profilePicture'), authController.updateProfile);

// POST /api/auth/otp - send OTP to user mail
router.post('/otp', authController.sendOtp);

// POST /api/auth/otp-verify - verify OTP code
router.post('/otp-verify', authController.verifyOtp);

// POST /api/auth/fwd - reset password
router.post('/fwd', authMiddleware, authController.resetPassword);

// POST /api/auth/google - Google OAuth
router.post('/google', authController.googleAuth);

module.exports = router;
