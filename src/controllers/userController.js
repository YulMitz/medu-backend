const userService = require('../services/userService');
const path = require('path');

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

        const userInfo = await userService.login(username, password);

        res.json({
            "userId" : userInfo.userId, 
            "accessToken" : userInfo.accessToken,
            "refreshToken" : userInfo.refreshToken,
            "userProfile" : userInfo.userProfile
        });
    } catch (error) {
        if(error.name === "APIError") {
            return res.status(error.statusCode).json({ message: error.message.trim() });
        }
        // console.error(error); // 方便調試
        res.status(500).json({ message: error.message.trim() });
    }
};

exports.logout = async (req, res) => {
    try {
        const accessToken = req.cookies.token || req.headers.authorization?.split(' ')[1];
        const { refreshToken } = req.body
        if (!accessToken && !refreshToken) {
            return res.status(400).json({ message: 'No token provided' });
        }
        const message = await userService.logout(accessToken, refreshToken);
        res.clearCookie('token'); // 清除 Cookie
        res.status(201).json({ message: message });
    } catch (error) {
        if(error.name === "APIError") {
            return res.status(error.statusCode).json({ message: error.message.trim() });
        }
        // console.error(error); // 方便調試
        res.status(500).json({ message: error.message.trim() });
    }
};

exports.getNewToken = async (req, res) => {
    try {
        console.log(req.body.userId)
        console.log("--------------------")
        console.log(req.body.refreshToken)

        const newAccessToken = await userService.getNewToken(req.body.userId, req.body.refreshToken);
        res.status(201).json({ accessToken : newAccessToken });
    } catch (error) {
        if(error.name === "APIError") {
            return res.status(error.statusCode).json({ message: error.message.trim() });
        }
        // console.error(error); // 方便調試
        res.status(500).json({ message: error.message.trim() });
    }
}

exports.uploadPicture = async (req, res) => {
    console.log(req.file);
    try {
        const profilePicturePath = await userService.updatePicturePath(req.file.path, req.user.userId);
        res.json({ profilePicturePath: profilePicturePath });
    } catch (error) {
        res.status(500).json({ message: error.message.trim() });
    }
}

exports.getProfilePicture = async (req, res) => {
    try {
        const profilePicturePath = await userService.getProfilePicturePathByUserId(req.params.targetUserId);
        
        const imagePath = path.join(__dirname, "../", profilePicturePath);
        res.sendFile(imagePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                return res.status(404).json({ message: 'Image not found' });
            }
        });
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

exports.updateNickname = async (req, res) => {
    try {
        const { nickname } = req.body;
        await userService.updateNickname(req.user.userId, nickname);

        res.status(201).json({ 
            message: 'update nickname success',
            nickname: nickname
        });
    } catch (error) {
        if(error.name === 'APIError'){
            return res.status(error.statusCode).json({ message: error.message.trim() });
        }
        return res.status(500).json({ message: error.message.trim() });
    }
}

exports.updatePassword = async (req, res) => {
    try {
        const { password } = req.body;
        await userService.updatePassword(req.user.userId, password);

        res.status(201).json({ 
            message: 'update password success'
        });
    } catch (error) {
        if(error.name === 'APIError'){
            return res.status(error.statusCode).json({ message: error.message.trim() });
        }
        return res.status(500).json({ message: error.message.trim() });
    }
}

exports.updateBio = async (req, res) => {
    try {
        const { bio } = req.body;
        await userService.updateBio(req.user.userId, bio);

        res.status(201).json({ 
            message: 'update bio success',
            bio: bio
        });
    } catch (error) {
        if(error.name === 'APIError'){
            return res.status(error.statusCode).json({ message: error.message.trim() });
        }
        return res.status(500).json({ message: error.message.trim() });
    }
}

exports.updateLocation = async (req, res) => {
    try {
        const { county, township } = req.body;
        await userService.updateLocation(req.user.userId, county, township);

        res.status(201).json({ 
            message: 'update location success',
            county: county,
            township: township
        });
    } catch (error) {
        if(error.name === 'APIError'){
            return res.status(error.statusCode).json({ message: error.message.trim() });
        }
        return res.status(500).json({ message: error.message.trim() });
    }
}

exports.updateProfile = async (req, res) => {
    try {
        let { nickname, bio, county, township } = req.body;
        if (nickname) 
            await userService.updateNickname(req.user.userId, nickname);
        else 
            nickname = "nickname was not updated";

        if (bio) 
            await userService.updateBio(req.user.userId, bio);
        else
            bio = "bio was not updated";

        if (county && township) 
            await userService.updateLocation(req.user.userId, county, township);
        else
            location = "location was not updated";
        

        res.status(201).json({ 
            message: 'update profile success',
            nickname: nickname,
            bio: bio,
            county: county,
            township: township
        });
    } catch (error) {
        if(error.name === 'APIError'){
            return res.status(error.statusCode).json({ message: error.message.trim() });
        }
        return res.status(500).json({ message: error.message.trim() });
    }
}