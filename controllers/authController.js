const authService = require('../services/authService');
const emailService = require('../services/emailService');
const { validateRequired, validateEmail, validatePassword } = require('../utils/validators');

class AuthController {
    async register(req, res) {
        try {
            const { email, username, password } = req.body;
            
            // Validation
            const missing = validateRequired({ email, username, password });
            if (missing.length > 0) {
                return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
            }

            if (!validateEmail(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            if (!validatePassword(password)) {
                return res.status(400).json({ message: 'Password must be at least 6 characters' });
            }

            const result = await authService.registerUser({ email, username, password });
            
            res.status(201).json({
                message: 'User created successfully',
                userId: result.userId
            });

        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            const missing = validateRequired({ email, password });
            if (missing.length > 0) {
                return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
            }

            const result = await authService.loginUser({ email, password });
            
            res.status(200).json({
                message: 'Login Successful',
                ...result
            });

        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    }

    async getProfile(req, res) {
        try {
            const user = await authService.getUserById(req.userId);
            res.status(200).json({ user });
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    }

    async updateProfile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No image file uploaded.' });
            }
            
            const imageUrl = req.file.path;
            const updatedUser = await authService.updateProfilePicture(req.userId, imageUrl);

            res.status(200).json({
                message: 'Profile picture successfully uploaded.',
                user: updatedUser,
                imageUrl: imageUrl
            });

        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ message: 'Server Error during profile update.' });
        }
    }

    async sendOtp(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Email Required.' });
            }

            if (!validateEmail(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            const { otp, username } = await authService.generateAndSendOtp(email);
            await emailService.sendOtpEmail(email, otp, username);

            res.status(200).json({
                message: 'OTP code sent to your mail.',
                email: email
            });

        } catch (error) {
            console.error("OTP Error:", error);
            res.status(404).json({ message: error.message });
        }
    }

    async verifyOtp(req, res) {
        try {
            const { email, otp } = req.body;

            const missing = validateRequired({ email, otp });
            if (missing.length > 0) {
                return res.status(400).json({ message: 'Email and OTP code required.' });
            }

            const { resetToken } = await authService.verifyOtp(email, otp);

            res.status(200).json({
                message: 'OTP verified. Proceed to password reset.',
                resetToken: resetToken
            });

        } catch (error) {
            console.error("OTP Verification Error:", error);
            res.status(400).json({ message: error.message });
        }
    }

    async resetPassword(req, res) {
        try {
            const { password } = req.body;
            
            if (!password) {
                return res.status(400).json({ message: "New Password Required." });
            }

            if (!validatePassword(password)) {
                return res.status(400).json({ message: 'Password must be at least 6 characters' });
            }

            const result = await authService.resetPassword(req.userId, password);
            
            res.status(200).json(result);

        } catch (error) {
            console.error("Password Reset Error:", error);
            res.status(404).json({ message: error.message });
        }
    }

    async googleAuth(req, res) {
        try {
            const { idToken } = req.body;
            
            if (!idToken) {
                return res.status(400).json({ message: 'ID token required' });
            }

            const result = await authService.googleAuth(idToken);
            
            res.status(200).json(result);

        } catch (error) {
            console.error('Google Auth Error:', error);
            res.status(500).json({ message: 'Failed to verify Google login.' });
        }
    }
}

module.exports = new AuthController();