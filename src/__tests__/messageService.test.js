const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const messageService = require('../services/messageService');
const userService = require('../services/userService');
const Message = require('../models/Message');

jest.mock('../services/userService');

describe('MessageService', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Message.deleteMany({});
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('成功發送訊息', async () => {
      const mockFromUser = { _id: new mongoose.Types.ObjectId() };
      const mockToUser = { _id: new mongoose.Types.ObjectId() };
      
      userService.getUserById.mockImplementation((id) => {
        if (id.equals(mockFromUser._id)) return Promise.resolve(mockFromUser);
        if (id.equals(mockToUser._id)) return Promise.resolve(mockToUser);
        return Promise.resolve(null);
      });

      const result = await messageService.sendMessage(
        mockFromUser._id.toString(),
        mockToUser._id.toString(),
        '測試訊息'
      );

      expect(result.message).toBe('測試訊息');
      expect(result.fromUserId.toString()).toBe(mockFromUser._id.toString());
      expect(result.toUserId.toString()).toBe(mockToUser._id.toString());
    });

    it('傳送給自己應該失敗', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      await expect(
        messageService.sendMessage(userId, userId, '測試訊息')
      ).rejects.toThrow('不能對自己進行操作');
    });

    it('發送者不存在應該失敗', async () => {
      userService.getUserById.mockResolvedValue(null);
      const fromUserId = new mongoose.Types.ObjectId().toString();
      const toUserId = new mongoose.Types.ObjectId().toString();
      
      await expect(
        messageService.sendMessage(fromUserId, toUserId, '測試訊息')
      ).rejects.toThrow('用戶不存在');
    });

    it('接收者不存在應該失敗', async () => {
      const mockFromUser = { _id: new mongoose.Types.ObjectId() };
      userService.getUserById.mockImplementation((id) => {
        if (id.equals(mockFromUser._id)) return Promise.resolve(mockFromUser);
        return Promise.resolve(null);
      });

      const toUserId = new mongoose.Types.ObjectId().toString();
      
      await expect(
        messageService.sendMessage(mockFromUser._id.toString(), toUserId, '測試訊息')
      ).rejects.toThrow('用戶不存在');
    });

    it('發送空訊息應該失敗', async () => {
      const mockFromUser = { _id: new mongoose.Types.ObjectId() };
      const mockToUser = { _id: new mongoose.Types.ObjectId() };
      
      userService.getUserById.mockImplementation(id => {
        if (id.equals(mockFromUser._id)) return Promise.resolve(mockFromUser);
        if (id.equals(mockToUser._id)) return Promise.resolve(mockToUser);
        return Promise.resolve(null);
      });

      await expect(
        messageService.sendMessage(
          mockFromUser._id.toString(),
          mockToUser._id.toString(),
          ''
        )
      ).rejects.toThrow('Message validation failed: message: Path `message` is required.');
    });
  });

  describe('getAllMessageHistoryByUserId', () => {
    it('成功獲取訊息歷史', async () => {
      const mockUserA = { _id: new mongoose.Types.ObjectId() };
      const mockUserB = { _id: new mongoose.Types.ObjectId() };
      
      userService.getUserById.mockImplementation((id) => {
        if (id.equals(mockUserA._id)) return Promise.resolve(mockUserA);
        if (id.equals(mockUserB._id)) return Promise.resolve(mockUserB);
        return Promise.resolve(null);
      });

      // 先建立舊訊息
      await Message.create({
        fromUserId: mockUserA._id,
        toUserId: mockUserB._id,
        message: '訊息1',
        createdAt: new Date('2024-01-01')
      });

      // 建立較新的訊息
      await Message.create({
        fromUserId: mockUserB._id,
        toUserId: mockUserA._id,
        message: '訊息2',
        createdAt: new Date('2024-01-02')
      });

      const result = await messageService.getAllMessageHistoryByUserId(
        mockUserA._id.toString(),
        mockUserB._id.toString()
      );

      expect(result).toHaveLength(2);
      expect(result[0].message).toBe('訊息2');
      expect(result[1].message).toBe('訊息1');
    });

    it('查詢自己的訊息歷史應該失敗', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      await expect(
        messageService.getAllMessageHistoryByUserId(userId, userId)
      ).rejects.toThrow('不能對自己進行操作');
    });

    it('無訊息歷史應返回null', async () => {
      const mockUserA = { _id: new mongoose.Types.ObjectId() };
      const mockUserB = { _id: new mongoose.Types.ObjectId() };
      
      userService.getUserById.mockImplementation((id) => {
        if (id.equals(mockUserA._id)) return Promise.resolve(mockUserA);
        if (id.equals(mockUserB._id)) return Promise.resolve(mockUserB);
        return Promise.resolve(null);
      });

      const result = await messageService.getAllMessageHistoryByUserId(
        mockUserA._id.toString(),
        mockUserB._id.toString()
      );

      expect(result).toBeNull();
    });
  });

  describe('getLatestMessage', () => {
    it('成功獲取最新訊息', async () => {
      const mockUserA = { _id: new mongoose.Types.ObjectId() };
      const mockUserB = { _id: new mongoose.Types.ObjectId() };
      
      userService.getUserById.mockImplementation((id) => {
        if (id.equals(mockUserA._id)) return Promise.resolve(mockUserA);
        if (id.equals(mockUserB._id)) return Promise.resolve(mockUserB);
        return Promise.resolve(null);
      });

      // 創建測試訊息
      await Message.create([
        {
          fromUserId: mockUserA._id,
          toUserId: mockUserB._id,
          message: '舊訊息',
          createdAt: new Date('2024-01-01')
        },
        {
          fromUserId: mockUserB._id,
          toUserId: mockUserA._id,
          message: '新訊息',
          createdAt: new Date('2024-01-02')
        }
      ]);

      const result = await messageService.getLatestMessage(
        mockUserA._id.toString(),
        mockUserB._id.toString()
      );

      expect(result.message).toBe('新訊息');
    });

    it('查詢自己的最新訊息應該失敗', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      await expect(
        messageService.getLatestMessage(userId, userId)
      ).rejects.toThrow('不能對自己進行操作');
    });

    it('無最新訊息應返回null', async () => {
      const mockUserA = { _id: new mongoose.Types.ObjectId() };
      const mockUserB = { _id: new mongoose.Types.ObjectId() };
      
      userService.getUserById.mockImplementation((id) => {
        if (id.equals(mockUserA._id)) return Promise.resolve(mockUserA);
        if (id.equals(mockUserB._id)) return Promise.resolve(mockUserB);
        return Promise.resolve(null);
      });

      const result = await messageService.getLatestMessage(
        mockUserA._id.toString(),
        mockUserB._id.toString()
      );

      expect(result).toBeNull();
    });

    it('用戶不存在應該失敗', async () => {
      userService.getUserById.mockResolvedValue(null);
      const userAId = new mongoose.Types.ObjectId().toString();
      const userBId = new mongoose.Types.ObjectId().toString();
      
      await expect(
        messageService.getLatestMessage(userAId, userBId)
      ).rejects.toThrow('用戶不存在');
    });
  });
});