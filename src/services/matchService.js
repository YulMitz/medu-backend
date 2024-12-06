// services/matchService.js
const Match = require('../models/Match');
const userService = require('../services/userService');
const messageService = require('../services/messageService');
const APIError = require('../errors/APIError');
const mongoose = require('mongoose');

exports.updateUserMatchStatus = async (fromUserId, toUserId, status) => {
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

        let match = await Match.findOne({
            $or: [
                { $and: [{ userAId: fromUserObjectId }, { userBId: toUserObjectId }] },
                { $and: [{ userAId: toUserObjectId }, { userBId: fromUserObjectId }] },
            ],
        });

        if (match) {
            if (match.userAId.equals(fromUserObjectId)) {
                match.matchStatus.userAtoBstatus = status;
            } else if (match.userBId.equals(fromUserObjectId)) {
                match.matchStatus.userBtoAstatus = status;
            }
        } else {
            match = new Match({
                userAId: fromUserObjectId,
                userBId: toUserObjectId,
                matchStatus: {
                    userAtoBstatus: status,
                    userBtoAstatus: "pending"
                }
            });
        }

        await match.save();
    } catch (error) {
        throw error;
    }
}; 

exports.getFriendListByUserId = async (userId) => {
    try {
        // const user = await User.findById(userId).session(session);
        const friendList = await Match.find({
            $and: [
                { "matchStatus.userAtoBstatus": "like" },
                { "matchStatus.userBtoAstatus": "like" },
            ],
            $or: [
                { userAId: userId },
                { userBId: userId }
            ]
        }).lean();
        
        let friendInfoList = [];

        for (let i = 0; i < friendList.length; i++) {
            let friendId = (friendList[i].userAId == userId) ? friendList[i].userBId : friendList[i].userAId;
            let friendNickname = await userService.getUserNicknameById(friendId);
            let friendLatestMessage = await messageService.getLatestMessage(userId, friendId);
            let friendObj = {
                "friendId": friendId,
                "friendNickname": friendNickname,
                "friendLatestMessage": friendLatestMessage
            };
            
            console.log(friendObj);
            friendInfoList[i] = friendObj;
        }
        return friendInfoList;
        
    } catch (error) {
        console.error("Error fetching matches:", error);
        throw new Error("Failed to fetch matches");
    }
};

exports.getMatchCardByUserId = async (userId) => {
    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);
    const checkUserSet = new Set();

    try {
        let randomUser = null;

        while (!randomUser) {
            const user = await userService.getRandomUserExcludeCollection(checkUserSet);

            if (!user) {
                return null;
            }

            checkUserSet.add(user._id.toString());

            const match = await Match.findOne({
                $or: [
                    { $and: [{userAId : userObjectId}, {userBId : user._id}] },
                    { $and: [{userAId : user._id}, {userBId : userObjectId}] }
                ]
            });

            if (
                !match ||
                (match.userAId.equals(userObjectId) && match.matchStatus.userAtoBstatus === "pending") ||
                (match.userBId.equals(userObjectId) && match.matchStatus.userBtoAstatus === "pending")
            ) {
                randomUser = user; // 找到符合條件的用戶
            }
        }

        return randomUser.profile;
    } catch (error) {
        console.error("Error fetching match cards:", error);
        throw new Error("Failed to fetch match cards");
    } 
};

exports.checkFriendship = async (userAId, userBId) => {
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

        const match = await Match.findOne({
            $or: [
                { userAId: userAObjectId, userBId: userBObjectId },  
                { userAId: userBObjectId, userBId: userAObjectId }   
            ]
        });

        if (!match) {
            return false;
        }

        return (match.matchStatus.userAtoBstatus === "like" && match.matchStatus.userBtoAstatus === "like") ? true : false;

    } catch (error) {
        throw error;
    }
}
