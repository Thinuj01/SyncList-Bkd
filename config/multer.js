const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'SyncList_Profiles',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        public_id: (req, file) => `profile-${req.userId}-${Date.now()}`
    }
});

const upload = multer({ storage: storage });

module.exports = upload;