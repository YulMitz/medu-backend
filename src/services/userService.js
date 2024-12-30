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
const COUNTY_TOWNSHIPS = {
    '台北市': ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
    '新北市': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區', '泰山區', '林口區', '深坑區', '石碇區', '坪林區', '三芝區', '石門區', '八里區', '平溪區', '雙溪區', '貢寮區', '金山區', '萬里區', '烏來區'],
    '桃園市': ['桃園區', '中壢區', '平鎮區', '八德區', '楊梅區', '蘆竹區', '大溪區', '龜山區', '大園區', '觀音區', '新屋區', '龍潭區', '復興區'],
    '台中市': ['中區', '東區', '南區', '西區', '北區', '北屯區', '西屯區', '南屯區', '太平區', '大里區', '霧峰區', '烏日區', '豐原區', '后里區', '石岡區', '東勢區', '新社區', '潭子區', '大雅區', '神岡區', '大肚區', '沙鹿區', '龍井區', '梧棲區', '清水區', '大甲區', '外埔區', '大安區', '和平區'],
    '台南市': ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區', '新化區', '左鎮區', '玉井區', '楠西區', '南化區', '仁德區', '關廟區', '龍崎區', '官田區', '麻豆區', '佳里區', '西港區', '七股區', '將軍區', '學甲區', '北門區', '新營區', '後壁區', '白河區', '東山區', '六甲區', '下營區', '柳營區', '鹽水區', '善化區', '大內區', '山上區', '新市區', '安定區'],
    '高雄市': ['楠梓區', '左營區', '鼓山區', '三民區', '鹽埕區', '前金區', '新興區', '苓雅區', '前鎮區', '旗津區', '小港區', '鳳山區', '林園區', '大寮區', '大樹區', '大社區', '仁武區', '鳥松區', '岡山區', '橋頭區', '燕巢區', '田寮區', '阿蓮區', '路竹區', '湖內區', '茄萣區', '永安區', '彌陀區', '梓官區', '旗山區', '美濃區', '六龜區', '甲仙區', '杉林區', '內門區', '茂林區', '桃源區', '那瑪夏區'],
    '基隆市': ['仁愛區', '信義區', '中正區', '中山區', '安樂區', '暖暖區', '七堵區'],
    '新竹市': ['東區', '北區', '香山區'],
    '嘉義市': ['東區', '西區'],
    '新竹縣': ['竹北市', '竹東鎮', '新埔鎮', '關西鎮', '湖口鄉', '新豐鄉', '峨眉鄉', '寶山鄉', '北埔鄉', '芎林鄉', '橫山鄉', '尖石鄉', '五峰鄉'],
    '苗栗縣': ['苗栗市', '頭份市', '竹南鎮', '後龍鎮', '通霄鎮', '苑裡鎮', '卓蘭鎮', '造橋鄉', '西湖鄉', '頭屋鄉', '公館鄉', '銅鑼鄉', '三義鄉', '大湖鄉', '獅潭鄉', '三灣鄉', '南庄鄉', '泰安鄉'],
    '彰化縣': ['彰化市', '員林市', '和美鎮', '鹿港鎮', '溪湖鎮', '二林鎮', '田中鎮', '北斗鎮', '花壇鄉', '芬園鄉', '大村鄉', '永靖鄉', '伸港鄉', '線西鄉', '福興鄉', '秀水鄉', '埔心鄉', '埔鹽鄉', '大城鄉', '芳苑鄉', '竹塘鄉', '社頭鄉', '二水鄉', '田尾鄉', '埤頭鄉', '溪州鄉'],
    '南投縣': ['南投市', '埔里鎮', '草屯鎮', '竹山鎮', '集集鎮', '名間鄉', '鹿谷鄉', '中寮鄉', '魚池鄉', '國姓鄉', '水里鄉', '信義鄉', '仁愛鄉'],
    '雲林縣': ['斗六市', '斗南鎮', '虎尾鎮', '西螺鎮', '土庫鎮', '北港鎮', '古坑鄉', '大埤鄉', '莿桐鄉', '林內鄉', '二崙鄉', '崙背鄉', '麥寮鄉', '東勢鄉', '褒忠鄉', '台西鄉', '元長鄉', '四湖鄉', '口湖鄉', '水林鄉'],
    '嘉義縣': ['太保市', '朴子市', '布袋鎮', '大林鎮', '民雄鄉', '溪口鄉', '新港鄉', '六腳鄉', '東石鄉', '義竹鄉', '鹿草鄉', '水上鄉', '中埔鄉', '竹崎鄉', '梅山鄉', '番路鄉', '大埔鄉', '阿里山鄉'],
    '屏東縣': ['屏東市', '潮州鎮', '東港鎮', '恆春鎮', '萬丹鄉', '長治鄉', '麟洛鄉', '九如鄉', '里港鄉', '鹽埔鄉', '高樹鄉', '萬巒鄉', '內埔鄉', '泰武鄉', '來義鄉', '春日鄉', '獅子鄉', '牡丹鄉', '車城鄉', '三地門鄉', '霧台鄉', '瑪家鄉'],
    '宜蘭縣': ['宜蘭市', '羅東鎮', '蘇澳鎮', '頭城鎮', '礁溪鄉', '壯圍鄉', '員山鄉', '冬山鄉', '五結鄉', '三星鄉', '大同鄉', '南澳鄉'],
    '花蓮縣': ['花蓮市', '鳳林鎮', '玉里鎮', '新城鄉', '吉安鄉', '壽豐鄉', '光復鄉', '豐濱鄉', '瑞穗鄉', '富里鄉', '秀林鄉', '萬榮鄉', '卓溪鄉'],
    '台東縣': ['台東市', '成功鎮', '關山鎮', '卑南鄉', '鹿野鄉', '池上鄉', '東河鄉', '長濱鄉', '太麻里鄉', '金峰鄉', '大武鄉', '達仁鄉', '綠島鄉', '蘭嶼鄉', '延平鄉', '海端鄉'],
    '澎湖縣': ['馬公市', '湖西鄉', '白沙鄉', '西嶼鄉', '望安鄉', '七美鄉'],
    '金門縣': ['金城鎮', '金沙鎮', '金湖鎮', '金寧鄉', '烈嶼鄉', '烏坵鄉'],
    '連江縣': ['南竿鄉', '北竿鄉', '莒光鄉', '東引鄉'],
};

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
        "userId" : user._id,
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
    } else {
        const accessToken = jwt.sign({ userId: userObjectId }, process.env.SECRET_KEY, {
            expiresIn: '1h', // 1 hour expires
        });

        return accessToken;
    }
}

exports.getUserById = async (userId) => {
    const userObjectId = userId instanceof mongoose.Types.ObjectId ? userId : mongoose.Types.ObjectId.createFromHexString(userId);
    const user = await User.findById(userObjectId);
    if (!user) {
        throw new APIError(400, "用戶不存在");
    }
    return user;
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

exports.updateNickname = async(userId, nickname) => {
    const userObjectId = userId instanceof mongoose.Types.ObjectId ? userId : mongoose.Types.ObjectId.createFromHexString(userId);
    const user = await User.findById(userObjectId);
    user.profile.nickname = nickname;
    try {
        user.save();
    } catch (error) {
        throw new APIError(400, "user nickname update failed");
    }
}

exports.updatePassword = async(userId, password) => {
    const userObjectId = userId instanceof mongoose.Types.ObjectId ? userId : mongoose.Types.ObjectId.createFromHexString(userId);
    const user = await User.findById(userObjectId);
    user.password = password;
    try {
        user.save();
    } catch (error) {
        throw new APIError(400, "user password update failed");
    }
}

exports.updateBio = async(userId, bio) => {
    const userObjectId = userId instanceof mongoose.Types.ObjectId ? userId : mongoose.Types.ObjectId.createFromHexString(userId);
    const user = await User.findById(userObjectId);
    user.profile.bio = bio;
    try {
        user.save();
    } catch (error) {
        throw new APIError(400, "user bio update failed");
    }
}

exports.updateLocation = async (userId, county, township) => {
    const userObjectId = userId instanceof mongoose.Types.ObjectId ? userId : mongoose.Types.ObjectId.createFromHexString(userId);
    const user = await User.findById(userObjectId);
    if (!isLocationValid(county, township)){
        throw new APIError(400, "user location update failed : Invalid county or township");
    }
    user.profile.location.county = county;
    user.profile.location.township = township;
    try {
        user.save();
    } catch (error) {
        throw new APIError(400, "user location update failed : " + error.message);
    }
}

isLocationValid = (county, township) => {
    if (county in Object.keys(COUNTY_TOWNSHIPS))
        console.log("dsadasdsdadssadsas")
        if (COUNTY_TOWNSHIPS[county].includes(township))
            return true;
    return false;
}

exports.getRandomUserExcludeCollection = async (userId, excludeCollection) => {
    const userObjectId = userId instanceof mongoose.Types.ObjectId ? userId : mongoose.Types.ObjectId.createFromHexString(userId);
    const user = await User.findById(userObjectId);
    
    if (!(excludeCollection instanceof Set)) {
        throw new Error("excludeCollection must be a Set");
    }


    const excludeArray = Array.from(excludeCollection);
    if (excludeArray.length >= await User.countDocuments()) {
        return null; 
    }

    // const randomUser = await User.aggregate([
    //     { $match: { _id: { $nin: excludeArray.map(id => mongoose.Types.ObjectId(id)) } } },
    //     { $sample: { size: 1 } }
    // ]);

    const excludeObjectIds = excludeArray.map(id => mongoose.Types.ObjectId.createFromHexString(id));

    const randomUserbyCounty = await User.aggregate([
        { $match: { 
            _id: { $nin: excludeObjectIds },
            'location.county': user.county
        } },
        { $sample: { size: 1 } } // 隨機選取一個使用者
    ]);

    if (randomUserbyCounty) {
        console.log("location not found match user");
        return randomUserbyCounty[0];
    }

    const randomUser = await User.aggregate([
        { $match: { 
            _id: { $nin: excludeObjectIds },
            'location.county': user.county
        } },
        { $sample: { size: 1 } } // 隨機選取一個使用者
    ]);

    return randomUser.length > 0 ? randomUser[0] : null;
}