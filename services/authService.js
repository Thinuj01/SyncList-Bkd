const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const { OAuth2Client } = require('google-auth-library');
const { generateToken } = require('../utils/jwtUtils');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
    async registerUser(userData) {
        const { email, username, password } = userData;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('Already registered with this email.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        const savedUser = await newUser.save();
        return { userId: savedUser._id };
    }

    async loginUser(credentials) {
        const { email, password } = credentials;

        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Your email or password incorrect');
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            throw new Error('Your email or password incorrect');
        }

        const token = generateToken({ userId: user._id });

        return {
            token,
            name: user.username,
            profilePic: user.profilePictureUrl
        };
    }

    async getUserById(userId) {
        const user = await User.findById(userId).select('email username _id profilePictureUrl');
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    async updateProfilePicture(userId, imageUrl) {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePictureUrl: imageUrl },
            { new: true, select: 'email username _id profilePictureUrl' }
        );
        return updatedUser;
    }

    async generateAndSendOtp(email) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('No Account found with that mail');
        }

        const otp = randomstring.generate({
            length: 6,
            charset: 'numeric'
        });

        await Otp.create({
            email: email,
            code: otp
        });

        return { otp, username: user.username };
    }

    async verifyOtp(email, otp) {
        const otpRecord = await Otp.findOne({
            email: email,
            code: otp
        });

        if (!otpRecord) {
            throw new Error('Invalid or expired OTP code.');
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }

        const resetToken = generateToken(
            { userId: user._id, purpose: 'password_reset' },
            '15m'
        );

        await Otp.deleteOne({ _id: otpRecord._id });

        return { resetToken };
    }

    async resetPassword(userId, newPassword) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not Found.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        return { message: 'User password changed successfully' };
    }

    async googleAuth(idToken) {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            const generatedUsername = name.split(' ')[0] + Math.floor(Math.random() * 1000);
            
            user = new User({
                email: email,
                username: generatedUsername,
                profilePictureUrl: picture,
                password: 'GOOGLE_AUTH_PLACEHOLDER'
            });
            await user.save();
        }

        const token = generateToken({ userId: user._id }, '7d');

        return {
            token: token,
            userId: user._id,
            name: user.username,
            profilePic: user.profilePictureUrl
        };
    }
}

module.exports = new AuthService();