const transporter = require('../config/nodemailer');

class EmailService {
    async sendOtpEmail(email, otp, username) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'SyncList Password Reset Code',
            html: `
                <p>Hello ${username},</p>
                <p>Use the following code to reset your SyncList password. This code will expire in 5 minutes:</p>
                <h2 style="color: #2A7886;">${otp}</h2>
                <p>If you did not request this, please ignore this email.</p>
            `,
        };

        await transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailService();