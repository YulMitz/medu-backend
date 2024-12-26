const request = require('supertest');
const express = require('express');
const messageController = require('../controllers/messageController');
const messageService = require('../services/messageService');
const APIError = require('../errors/APIError');

jest.mock('../services/messageService');

const app = express();
app.use(express.json());

// 假裝有經過驗證，手動把 user 注入 req
app.use((req, res, next) => {
  req.user = { userId: 'testUserId' };
  next();
});

app.post('/send', messageController.sendMessage);
app.get('/history/:targetUserId', messageController.getAllMessageHistory);
app.get('/latest/:targetUserId', messageController.getLatestMessage);

describe('messageController', () => {
  describe('sendMessage', () => {
    // 增加測試超時設定
    jest.setTimeout(10000);

    it('成功傳訊息', async () => {
      messageService.sendMessage.mockResolvedValueOnce({ message: 'test msg' });
      const res = await request(app).post('/send').send({ targetUserId: '123', message: 'test msg' });
      expect(res.status).toBe(200);
      expect(res.body.message.message).toBe('test msg');
    });

    it('自己傳給自己', async () => {
      messageService.sendMessage.mockRejectedValueOnce(new APIError(400, '不能對自己進行操作'));
      const res = await request(app).post('/send').send({ targetUserId: 'me', message: 'error' });
      expect(res.status).toBe(400);
    });

    it('缺少必要參數', async () => {
      messageService.sendMessage.mockRejectedValueOnce(
        new APIError(400, '參數驗證失敗') // 修正順序：先 statusCode，後 message
      );
      const res = await request(app).post('/send').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('參數驗證失敗');
    });

    it('訊息內容為空', async () => {
      messageService.sendMessage.mockRejectedValueOnce(
        new APIError(400, '訊息不可為空') // 修正順序：先 statusCode，後 message
      );
      const res = await request(app)
        .post('/send')
        .send({ targetUserId: '123', message: '' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('訊息不可為空');
    }, 10000); // 或直接在個別測試增加超時設定

    it('無效的 targetUserId 格式', async () => {
      messageService.sendMessage.mockRejectedValueOnce(
        new APIError(400, '無效的用戶ID格式')
      );
      const res = await request(app)
        .post('/send')
        .send({ targetUserId: 'invalid-id', message: 'test' });
      expect(res.status).toBe(400);
    });
  });

  describe('getAllMessageHistory', () => {
    it('成功取得歷史訊息', async () => {
      messageService.getAllMessageHistoryByUserId.mockResolvedValueOnce(['msg1', 'msg2']);
      const res = await request(app).get('/history/456');
      expect(res.status).toBe(200);
      expect(res.body.messageHistory).toEqual(['msg1', 'msg2']);
    });

    it('找不到目標用戶', async () => {
      messageService.getAllMessageHistoryByUserId
        .mockRejectedValueOnce(new APIError(404, '找不到用戶'));
      const res = await request(app).get('/history/999');
      expect(res.status).toBe(404);
    });

    it('無訊息歷史記錄', async () => {
      messageService.getAllMessageHistoryByUserId
        .mockResolvedValueOnce([]);
      const res = await request(app).get('/history/456');
      expect(res.status).toBe(200);
      expect(res.body.messageHistory).toEqual([]);
    });

    it('帶入分頁參數', async () => {
      messageService.getAllMessageHistoryByUserId.mockResolvedValueOnce({
        messages: ['msg1', 'msg2'],
        total: 2,
        page: 1,
        limit: 10
      });
      const res = await request(app).get('/history/456?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.messageHistory.messages).toHaveLength(2);
    });

    it('系統錯誤處理', async () => {
      messageService.getAllMessageHistoryByUserId.mockRejectedValueOnce(
        new Error('Database connection failed')
      );
      const res = await request(app).get('/history/456');
      expect(res.status).toBe(500);
    });
  });

  describe('getLatestMessage', () => {
    it('成功取得最新訊息', async () => {
      messageService.getLatestMessage.mockResolvedValueOnce({ message: 'last msg' });
      const res = await request(app).get('/latest/456');
      expect(res.status).toBe(200);
      expect(res.body.latestMessage.message).toBe('last msg');
    });

    it('找不到最新訊息', async () => {
      messageService.getLatestMessage
        .mockResolvedValueOnce(null);
      const res = await request(app).get('/latest/456');
      expect(res.status).toBe(200);
      expect(res.body.latestMessage).toBeNull();
    });

    it('目標用戶不存在', async () => {
      messageService.getLatestMessage
        .mockRejectedValueOnce(new APIError(404, '用戶不存在'));
      const res = await request(app).get('/latest/999');
      expect(res.status).toBe(404);
    });
  });
});