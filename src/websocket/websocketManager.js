require('dotenv').config();
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const matchService = require('../services/matchService');
const messageService = require('../services/messageService');

const activeUsers = new Map(); 

function startWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {

        ws.isAlive = true;
        ws.on('pong', heartbeat);

        let urlParams;
        try {
            urlParams = new URLSearchParams(req.url.split('?')[1]);
        } catch (error) {
            console.error('Invalid WebSocket URL format:', error);
            ws.close(1008, 'Invalid URL format');
            return;
        }

        const token = urlParams.get('token');
        if (!token) {
            console.log('WebSocket connection rejected: Token not provided');
            ws.close(1008, 'Token not provided'); 
            return;
        }
        
        // 驗證 JWT Token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (error) {
            console.error('WebSocket connection rejected: Invalid token', error);
            ws.close(1008, 'Invalid token');
            return;
        }

        const userId = decoded.userId;
        if (!userId) {
            console.log('WebSocket connection rejected: Invalid token payload');
            ws.close(1008, 'Invalid token payload');
            return;
        }

        // refuse multiple connect
        if (activeUsers.has(userId)) {
            console.log(`User ${userId} already connected. Overwriting previous connection.`);

            // 取得舊的 WebSocket 連線
            const oldConnection = activeUsers.get(userId);

            // 先從 activeUsers 中移除舊連線
            activeUsers.delete(userId);
            console.log(`User ${userId} removed. Active users count: ${activeUsers.size}`);
            // 強制關閉舊連線
            oldConnection.terminate(); 
            console.log(`Old connection for user ${userId} terminated.`);

            console.log(`ssssUser ${userId} disconnected. Active users count: ${activeUsers.size}`);

        }
        console.log(`Active users count: ${activeUsers.size}`);

        activeUsers.set(userId, ws);
        console.log(`user ${userId} connected`);
        
        console.log(`Active users count: ${activeUsers.size}`);

        ws.on('message', async (data) => {
            try {
                let parsedData;
                try {
                    parsedData = JSON.parse(data);
                } catch (error) {
                    ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
                    return;
                }

                const { targetUserId, message } = parsedData;
                if (!targetUserId || !message) {
                    ws.send(JSON.stringify({ error: 'Missing targetUserId or message' }));
                    return;
                }

                const isFriend = await matchService.checkFriendship(userId, targetUserId);
                if (!isFriend) {
                    ws.send(JSON.stringify({ error: 'Target user is not in your friend list' }));
                    return;
                }

                const savedMessage = await messageService.sendMessage(userId, targetUserId, message);

                const targetUser = activeUsers.get(targetUserId);
                if (targetUser && targetUser.readyState === WebSocket.OPEN) {
                    targetUser.send(JSON.stringify({ fromUserId: userId, message, time: savedMessage.createdAt}));
                } else {
                    console.log(`user ${targetUserId} is offline, message has sent`);
                }

                ws.send(JSON.stringify({ success: true, message: savedMessage }));
            } catch (error) {
                console.error('websocket send message error:', error);
                ws.send(JSON.stringify({ error: 'send message error' }));
            }
        });

        ws.on('close', () => {
            if (activeUsers.get(userId) === ws) {
                activeUsers.delete(userId);
                console.log(`User ${userId} disconnected. Active users count: ${activeUsers.size}`);
            } else {
                console.log(`Close event ignored for overwritten connection of user ${userId}.`);
                console.log(`Active users count: ${activeUsers.size}`);
            }
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for user ${userId}:`, error.message || error);
        });
    });

    console.log('WebSocket started');

    setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) {
                console.log('Terminating stale connection');
                return ws.terminate(); // 關閉未響應的連接
            }
    
            ws.isAlive = false;
            ws.ping(); // 發送 ping
        });
    }, 60000); // 每 60 秒檢查一次
}

function heartbeat() {
    this.isAlive = true;
}

module.exports = { startWebSocketServer };
