// services/matchService.js
const Match = require('../models/Match');
const userService = require('../services/userService');
const messageService = require('../services/messageService');
const APIError = require('../errors/APIError');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

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
                {
                    $or: [
                        { userAId: userId },
                        { userBId: userId }
                    ]
                }
            ]
        }).lean();
        
        let friendInfoList = [];
        console.log(friendList.length)
        console.log("-------------------------------")
        
        for (let i = 0; i < friendList.length; i++) {
            console.log("friend " + i)


            let friendId = (friendList[i].userAId == userId) ? friendList[i].userBId : friendList[i].userAId;
            let friendNickname = await userService.getUserNicknameById(friendId);
            let friendLatestMessage = await messageService.getLatestMessage(userId, friendId);
            let friendProfilePicturePath = await userService.getProfilePicturePathByUserId(friendId);
            const imagePath = path.join(__dirname, "../", friendProfilePicturePath);
            // data = await fs.readFile(imagePath, (err, data) => {

            //     if (err) {
            //         return res.status(500).json({ error: 'Failed to read image' });
            //     }
            //     base64Image = data.toString('base64');
            //     const ext = path.extname(friendProfilePicturePath).toLowerCase();
            //     mimeType = ext === '.png' ? 'image/png' : ext === '.jpeg' || ext === '.jpg' ? 'image/jpeg' : 'application/octet-stream';
            //     return mimeType;
            // });
            data = await fs.readFile(imagePath);
            const base64Image = data.toString('base64');
            const ext = path.extname(friendProfilePicturePath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : ext === '.jpeg' || ext === '.jpg' ? 'image/jpeg' : 'application/octet-stream';

            let friendObj = {
                "friendId": friendId,
                "friendNickname": friendNickname,
                "friendLatestMessage": friendLatestMessage,
                "friendProfilePicture": base64Image,
                "mimeType": mimeType,
            };

            console.log(friendObj.friendNickname);
            friendInfoList.push(friendObj);
        }
        console.log(friendInfoList[0].mimeType)
        console.log("-------------------------------")

        for(let i = 0; i < friendList.length; i++)
        return friendInfoList;
        
    } catch (error) {
        console.error("Error fetching matches:", error);
        throw new Error("Failed to fetch matches");
    }
};

exports.getMatchCardByUserId = async (userId) => {
    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);
    const checkUserSet = new Set();
    checkUserSet.add(userId);
    try {
        let randomUser = null;

        while (!randomUser) {
            const user = await userService.getRandomUserExcludeCollection(userObjectId, checkUserSet);

            if (!user) {
                let matchCard = {
                    userId: ""
                }
                return matchCard;
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
        let matchCard = {
            userId: randomUser._id,
            profile: randomUser.profile
        }
        return matchCard;
    } catch (error) {
        console.error("Error fetching match cards:", error);
        throw new Error("Failed to fetch match cards" + error);
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
