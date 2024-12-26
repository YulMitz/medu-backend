const messageService = require('../services/messageService');
const APIError = require('../errors/APIError');

exports.sendMessage = async (req, res) => {
    try {
        const savedMessage = await messageService.sendMessage(req.user.userId, req.body.targetUserId, req.body.message);
        res.json({ message: savedMessage });
    } catch(error) {
        if(error instanceof APIError){
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
}

exports.getAllMessageHistory = async (req, res) => {
    try {
        const messageHistory = await messageService.getAllMessageHistoryByUserId(req.user.userId, req.params.targetUserId);
        res.status(200).json({ messageHistory: messageHistory || [] });
    } catch(error) {
        if(error instanceof APIError){
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
}

exports.getLatestMessage = async (req, res) => {
    try {
        const latestMessage = await messageService.getLatestMessage(req.user.userId, req.params.targetUserId);
        res.status(200).json({ latestMessage: latestMessage });
    } catch(error) {
        if(error instanceof APIError){
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
}