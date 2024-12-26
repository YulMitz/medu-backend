// controllers/matchController.js
const matchService = require('../services/matchService');
const APIError = require('../errors/APIError');

exports.likeUser = async (req, res) => {
    try {
        await matchService.updateUserMatchStatus(req.user.userId, req.body.targetUserId, "like");
        res.json({ message: '已喜歡該用戶' });
    } catch (error) {
        if(error instanceof APIError){
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

exports.dislikeUser = async (req, res) => {
    try {
        await matchService.updateUserMatchStatus(req.user.userId, req.body.targetUserId, "dislike");
        res.json({ message: '已不喜歡該用戶' });
    } catch (error) {
        if(error instanceof APIError){
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

exports.getFriendListByUserId = async (req, res) => {
    try {
        const friendList = await matchService.getFriendListByUserId(req.user.userId);
        res.status(200).json({ friendList: friendList });
    } catch (error) {
        if(error instanceof APIError){
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
}

exports.getMatchCardByUserId = async (req, res) => {
    try {
        const matchCard = await matchService.getMatchCardByUserId(req.user.userId);
        res.status(200).json({ matchCard: matchCard });
    } catch (error) {
        if(error instanceof APIError){
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
}


