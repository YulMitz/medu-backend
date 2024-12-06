const userService = require('../services/userService');

// register
exports.register = async (req, res) => {
    try {
        const { username, password, nickname, birthDate, gender } = req.body;
        const userData = { username, password, nickname, birthDate, gender };

        await userService.register(userData);

        res.status(201).json({ message: 'register success' });
    } catch (error) {
        if(error.name === 'APIError'){
            return res.status(error.statusCode).json({ message: error.message.trim() });
        }
        return res.status(500).json({ message: error.message.trim() });
    }
};

// login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const token = await userService.login(username, password);

        res.json({ token });
    } catch (error) {
        if(error.name === "APIError") {
            return res.status(error.statusCode).json({ message: error.message.trim() });
        }
        // console.error(error); // 方便調試
        res.status(500).json({ message: error.message.trim() });
    }
};

exports.uploadPicture = async (req, res) => {
    console.log(req.file);
    try {
        const profilePicturePath = await userService.updatePicturePath(req.file.path, req.body.userId);
        res.json({ profilePicturePath: profilePicturePath });
    } catch (error) {
        res.status(500).json({ message: error.message.trim() });
    }
}

exports.getProfilePicture = async (req, res) => {
    try {
        const profilePicturePath = await userService.getProfilePicturePathByUserId(req.params.targetUserId);
        res.json({ profilePicturePath: profilePicturePath});
    } catch (error) {
        res.status(500).json({ message: error.message.trim() });
    }
}

exports.getUserNickname = async (req, res) => {
    try {
        const nickname = await userService.getUserNicknameById(req.params.targetUserId);
        res.json({ nickname: nickname});
    } catch (error) {
        res.status(500).json({ message: error.message.trim() });
    }
}

exports.getUserProfile = async (req, res) => {
    try {
        const profile = await userService.getProfileByUserId(req.params.targetUserId);
        res.json({ profile: profile});
    } catch (error) {
        res.status(500).json({ message: error.message.trim() });
    }
}