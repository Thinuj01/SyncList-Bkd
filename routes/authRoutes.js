const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt =  require('bcrypt');
const jwt =  require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Otp = require('../models/Otp'); 
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'SyncList_Profiles',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        public_id: (req, file) => `profile-${req.userId}-${Date.now()}`
    }
});

const upload = multer({ storage: storage });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

//POST /api/auth/register
router.post('/register',async (req,res)=>{
    try{
        const {email,username,password} = req.body;

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: 'Already registed with this email.'});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser= new User({
            username,
            email,
            password: hashedPassword
        })

        const savedUser = await newUser.save();

        res.status(201).json({
            message: 'User created successfully',
            userId : savedUser._id
        })


    }catch (error){
        console.log(error);
        res.status(500).json({
            message: 'Server Error'
        });
    }
});


//POST api/auth/login
router.post('/login', async(req,res) => {
    try{
        const { email,password } = req.body;

        const user = await User.findOne({email});
        if(!user){
            res.status(400).json({message: 'Your email or password incorrect'});
        }

        const isRight = await bcrypt.compare(password,user.password);
        if(!isRight){
            res.status(400).json({message: 'Your email or password incorrect'});
        }

        const payload = {
            userId: user._id
        }
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        res.status(200).json({
            message: 'Login Successful',
            token: token,
            name:user.username,
            profilePic: user.profilePictureUrl
        });

    }
    catch(error){
        console.log(error);
        res.status(500).json({
            message : 'Internal Server error'
        });
    }
});

//GET api/auth/ get details of logged user
router.get('/',authMiddleware ,async(req,res) => {
    try{
        const user = await User.findById(req.userId).select('email username _id');

        if(!user){
            return res.status(400).json({message: 'User not found'});
        }

        res.status(200).json({user});
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            message : 'Internal Server error'
        });
    }
});

// In authRoutes.js (Find your PUT /profile route)
//PUT api/auth/profile
router.put('/profile', authMiddleware, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded.' });
        }
        
        const imageUrl = req.file.path; 

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { profilePictureUrl: imageUrl },
            { new: true, select: 'email username _id profilePictureUrl' }
        );

        res.status(200).json({
            message: 'Profile picture successfully uploaded.',
            user: updatedUser,
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        res.status(500).json({ message: 'Server Error during Cloudinary update.' });
    }
});

//POST api/auth/otp send a otp to user mail
router.post('/otp', async(req,res) => {
    try{
        const {email} = req.body;

        if(!email){
            return res.status(400).json({message: 'Email Required.'});
        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message: 'No Account found with that mail'});
        }

        const otp = randomstring.generate({
            length:6,
            charset: 'numeric'
        });

        await Otp.create({
            email: email,
            code: otp
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'SyncList Password Reset Code',
            html: `
                <p>Hello ${user.username},</p>
                <p>Use the following code to reset your SyncList password. This code will expire in 5 minutes:</p>
                <h2 style="color: #2A7886;">${otp}</h2>
                <p>If you did not request this, please ignore this email.</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: 'OTP code sent to your mail.',
            email: email
        });
    }
    catch(error){
        console.error("OTP Error:", error);
        res.status(500).json({ message: error.message });
    }
});

//POST api/auth/otp-verify In here user sended otp compares to DB otp
router.post('/otp-verify',async(req,res) => {
    try{
        const {email,otp} = req.body;

        if(!email || !otp) {
            return res.status(400).json({message: 'Email and OTP code required.'});
        }

        const otpRecord = await Otp.findOne({
            email: email,
            code: otp
        });

        if(!otpRecord){
            return res.status(400).json({message: 'Invalid or expired OTP code.'});
        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }

        const resetToken = jwt.sign(
            { userId: user._id, purpose: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } 
        );

        res.status(200).json({ 
            message: 'OTP verified. Proceed to password reset.',
            resetToken: resetToken
        });

        await Otp.deleteOne({_id: otpRecord._id});

    }
    catch{
        console.error("OTP Error:", error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/fwd',authMiddleware,async(req,res)=>{
    try{
        const {password} = req.body;
        if(!password){
            return res.status(400).json({message: "New Password Requiered."});
        }

        const user = await User.findById(req.userId);
        if(!user){
            return res.status(404).json({message: "User not Found."});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;

        await user.save();

        return res.status(201).json({message: "User password changed successfully"});

    }
    catch{
        console.error("OTP Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
