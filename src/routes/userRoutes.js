// routes/UserRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/authenticationMiddleware');

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, '../uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString() + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        db(null, false);
    }
};

const upload = multer({
    storage: storage, 
    // limits: {
    //     fileSize: 1024 * 1024 * 5
    // },
    fileFilter: fileFilter
});

// register route
router.post('/register', userController.register);

// login route
router.post('/login', userController.login);

// logout route
router.post('/logout', userController.logout);

// upload profile picture route
router.post('/upload', upload.single('profilePicture'), userController.uploadPicture);

// get user profile
router.get('/profile/:targetUserId', auth, userController.getUserProfile);

// get user profile picture
router.get('/profilepicture/:targetUserId', userController.getProfilePicture);

// get user nickname
router.get('/nickname/:targetUserId', userController.getUserNickname);

module.exports = router;
