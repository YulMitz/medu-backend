const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const APIError = require('../errors/APIError');
const mongoose = require('mongoose');

const blacklistedTokens = new Set();
const refreshTokenSet = new Set();

// 將 Token 集合導出，在測試中操作
exports.refreshTokenSet = refreshTokenSet;
exports.blacklistedTokens = blacklistedTokens;

// 新增 token 到黑名單
const addTokenToBlacklist = (token) => {
    blacklistedTokens.add(token);
};

// 檢查 token 是否在黑名單中
exports.isTokenBlacklisted = (token) => {
    return blacklistedTokens.has(token);
};

exports.register = async (userData) => {
    const { username, password, nickname, birthDate, gender } = userData;
    if (!username?.trim() || !password?.trim() || !nickname?.trim() || !birthDate || !gender?.trim()) {
        throw new APIError(400, "請提供完整的註冊資訊");
    }

    if (await User.exists({ 'username': username })) {
        throw new APIError(400, "User is existed");
    }

    try {
        const { username, password, nickname, birthDate, gender } = userData;
        newUser = new User({
            profile: {
                nickname,
                birthDate,
                gender,
            },
            username,
            password,
        });
        await newUser.save();
    } catch (error) {
        if (error.name === 'ValidationError') {
            let errorMessage = '';
            for (const field in error.errors) {
                switch (error.errors[field].path) {
                    case 'username':
                        errorMessage += '請提供有效的用戶名';
                        break;
                    case 'password':
                        errorMessage += '密碼長度應至少為6個字符';
                        break;
                    case 'profile.nickname':
                        errorMessage += '請提供有效的暱稱';
                        break;
                    case 'profile.gender':
                        errorMessage += '請提供有效的性別';
                        break;
                    case 'profile.birthDate':
                        errorMessage += '請提供有效的生日';
                        break;
                    default:
                        errorMessage += error.errors[field].message;
                }
            }
            throw new APIError(400, errorMessage);
        }
        throw new Error('Error createUser : ' + error.message);
    }
}

exports.login = async (username, password) => {
    if (!username?.trim() || !password?.trim()) {
        throw new APIError(400, "請提供用戶名和密碼");
    }

    const user = await User.findOne({ 'username': username });
    if (!user) {
        throw new APIError(400, "用戶不存在");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new APIError(400, "密碼錯誤");
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
        expiresIn: '1h', // 1 hour expires
    });

    const refreshToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
        expiresIn: '3d', // 1 hour expires
    });

    refreshTokenSet.add(refreshToken);

    const res = {
        "accessToken" : accessToken,
        "refreshToken" : refreshToken,
        "userProfile" : user.profile
    }
    
    return res;
}

exports.logout = async (accessToken, refreshToken) => {
    // 將 Token 加入黑名單
    addTokenToBlacklist(accessToken);
    refreshTokenSet.delete(refreshToken);
    const res = { message: 'Logged out successfully' }
    return res
}

exports.getNewToken = async (userId, refreshToken) => {
    const userObjectId = userId instanceof mongoose.Types.ObjectId ? userId : new mongoose.Types.ObjectId(userId);
    
    // 拋出錯誤，如果 refresh token 不存在
    if (!refreshTokenSet.has(refreshToken)) {
        throw new APIError(401, "Invalid or expired refresh token");
    }
    
    const accessToken = jwt.sign({ userId: userObjectId }, process.env.SECRET_KEY || 'test-secret', {
        expiresIn: '1h', // 1 hour expires
    });

    return accessToken;
}

exports.getUserById = async (userId) => {
    const userObjectId = userId instanceof mongoose.Types.ObjectId ? userId : mongoose.Types.ObjectId.createFromHexString(userId);
    const user = await User.findById(userObjectId);
    if (!user) {
        throw new APIError(400, "用戶不存在");
    }
    return user;
}

exports.getRandomUserExcludeCollection = async (excludeCollection) => {

    if (!(excludeCollection instanceof Set)) {
        throw new Error("excludeCollection must be a Set");
    }


    const excludeArray = Array.from(excludeCollection);
    if (excludeArray.length >= await User.countDocuments()) {
        return null; 
    }

    const randomUser = await User.aggregate([
        { $match: { _id: { $nin: excludeArray.map(id => mongoose.Types.ObjectId(id)) } } },
        { $sample: { size: 1 } }
    ]);

    return randomUser.length > 0 ? randomUser[0] : null;
}

exports.getUserNicknameById = async (targetUserId) => {
    const userObjectId = targetUserId instanceof mongoose.Types.ObjectId ? targetUserId : mongoose.Types.ObjectId.createFromHexString(targetUserId);
    const user = await User.findById(userObjectId);
    if (!user) {
        throw new APIError(400, "用戶不存在");
    }
    return user.profile.nickname;
}

exports.getProfilePicturePathByUserId = async (targetUserId) => {
    const userObjectId = targetUserId instanceof mongoose.Types.ObjectId ? targetUserId : mongoose.Types.ObjectId.createFromHexString(targetUserId);
    const user = await User.findById(userObjectId);
    if (!user) {
        throw new APIError(400, "用戶不存在");
    }
    return user.profile.profilePicturePath;
}

exports.updatePicturePath = async (path, userId) => {
    const userObjectId = userId instanceof mongoose.Types.ObjectId ? userId : mongoose.Types.ObjectId.createFromHexString(userId);
    const user = await User.findById(userObjectId);
    if (!user) {
        throw new APIError(400, "用戶不存在");
    }
    user.profile.profilePicturePath = path;

    try {
        user.save();
    } catch (error) {
        throw new APIError(400, "user profile picture upload failed");
    }
}

exports.getProfileByUserId = async (targetUserId) => {
    const userObjectId = targetUserId instanceof mongoose.Types.ObjectId ? targetUserId : mongoose.Types.ObjectId.createFromHexString(targetUserId);
    const user = await User.findById(userObjectId);
    if (!user) {
        throw new APIError(400, "用戶不存在");
    }
    return user.profile;
}