const Message = require('../models/Message');
const userService = require('../services/userService');
const APIError = require('../errors/APIError');
const mongoose = require('mongoose');

exports.sendMessage = async (fromUserId, toUserId, message) => {
    if (fromUserId === toUserId) {
        throw new APIError(400, '不能對自己進行操作');
    }

    const fromUserObjectId = mongoose.Types.ObjectId.createFromHexString(fromUserId);
    const toUserObjectId = mongoose.Types.ObjectId.createFromHexString(toUserId);

    try {
        const fromUser = await userService.getUserById(fromUserObjectId);
        const toUser = await userService.getUserById(toUserObjectId);

        if (!fromUser || !toUser) {
            throw new APIError(404, '用戶不存在');
        }

        const newMessage = new Message({
            fromUserId : fromUserObjectId,
            toUserId : toUserObjectId,
            message : message
        });

        const savedMessage = await newMessage.save();
        return savedMessage;

    } catch (error) {
        throw error;
    }

}

exports.getAllMessageHistoryByUserId = async (userAId, userBId) => {
    if (userAId === userBId) {
        throw new APIError(400, '不能對自己進行操作');
    }

    const userAObjectId = mongoose.Types.ObjectId.createFromHexString(userAId);
    const userBObjectId = mongoose.Types.ObjectId.createFromHexString(userBId);

    try {
        const userA = await userService.getUserById(userAObjectId);
        const userB = await userService.getUserById(userBObjectId);

        if (!userA || !userB) {
            throw new APIError(404, '用戶不存在');
        }

        const messageHistory = await Message.find({
            $or: [
                { fromUserId: userA, toUserId: userB },  
                { fromUserId: userB, toUserId: userA }   
            ]
        }).sort({ createdAt: -1 });

        return messageHistory.length > 0 ? Array.from(messageHistory) : null;

    } catch (error) {
        throw error;
    }
}

exports.getLatestMessage = async (userAId, userBId) => {
    if (userAId === userBId) {
        throw new APIError(400, '不能對自己進行操作');
    }
    const userAObjectId = userAId instanceof mongoose.Types.ObjectId ? userAId : mongoose.Types.ObjectId.createFromHexString(userAId);
    const userBObjectId = userBId instanceof mongoose.Types.ObjectId ? userBId : mongoose.Types.ObjectId.createFromHexString(userBId);
    try {
        const userA = await userService.getUserById(userAObjectId);
        const userB = await userService.getUserById(userBObjectId);

        if (!userA || !userB) {
            throw new APIError(404, '用戶不存在');
        }

        const latestMessage = await Message.find({
            $or: [
                { fromUserId: userA, toUserId: userB },  
                { fromUserId: userB, toUserId: userA }   
            ]
        }).sort({ createdAt: -1 }).limit(1);

        return latestMessage.length > 0 ? latestMessage[0] : null;

    } catch (error) {
        throw error;
    }
}