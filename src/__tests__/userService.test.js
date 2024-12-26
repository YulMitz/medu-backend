const mongoose = require('mongoose');
const userService = require('../services/userService');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const APIError = require('../errors/APIError');

// Mock 相關套件/Model
jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

/**
 * 每次測試後都清除 Mock 狀態，避免資料污染
 */
afterEach(() => {
    jest.clearAllMocks();
});

/**
 * 在測試開始前，確保 refreshTokenSet 和 blacklistedTokens 是空的
 */
beforeEach(() => {
    userService.refreshTokenSet.clear(); // 清空 refreshTokenSet
    userService.blacklistedTokens.clear(); // 清空 blacklistedTokens
    jwt.sign.mockReturnValue('newAccessToken'); // 設定 jwt mock
});

describe('User Service', () => {
    //
    // ================================
    // 1. register
    // ================================
    describe('register', () => {
        it('should throw an error if username is missing', async () => {
            const userData = {
                username: '',
                password: 'password123',
                nickname: 'Test',
                birthDate: '2000-01-01',
                gender: 'Male',
            };
            await expect(userService.register(userData)).rejects.toThrow(APIError);
        });

        it('should throw an error if user already exists', async () => {
            // Mock 查詢 username 已存在
            User.exists.mockResolvedValue(true);
            const userData = {
                username: 'testuser',
                password: 'password123',
                nickname: 'Test',
                birthDate: '2000-01-01',
                gender: 'Male',
            };
            await expect(userService.register(userData)).rejects.toThrow(APIError);
        });

        it('should throw an error if username and password have validation error', async () => {
            // 模擬 Mongoose 的 ValidationError
            const mockSave = jest.fn().mockRejectedValue({
                name: 'ValidationError',
                errors: {
                    username: {
                        path: 'username',
                        message: 'Username is required',
                    },
                    password: {
                        path: 'password',
                        message: 'Password is too short',
                    },
                },
            });
            User.prototype.save = mockSave;

            // mock user不存在
            User.exists.mockResolvedValue(false);

            const userData = {
                username: 'testuser',
                password: '123', // too short
                nickname: 'TestNickname',
                birthDate: '1990-01-01',
                gender: 'male',
            };

            await expect(userService.register(userData)).rejects.toThrowError(
                new APIError(400, '請提供有效的用戶名密碼長度應至少為6個字符')
            );
        });

        it('should throw an error if all have validation error', async () => {
            // 模擬 Mongoose 的 ValidationError（包含所有欄位）
            const mockSave = jest.fn().mockRejectedValue({
                name: 'ValidationError',
                errors: {
                    username: {
                        path: 'username',
                        message: 'Username is not valid',
                    },
                    password: {
                        path: 'password',
                        message: 'Password is too short',
                    },
                    'profile.nickname': {
                        path: 'profile.nickname',
                        message: 'Nickname is not valid',
                    },
                    'profile.gender': {
                        path: 'profile.gender',
                        message: 'Gender is not valid',
                    },
                    'profile.birthDate': {
                        path: 'profile.birthDate',
                        message: 'Birhtdate is not valid',
                    },
                    other: { path: 'other', message: 'not valid' },
                },
            });
            User.prototype.save = mockSave;

            User.exists.mockResolvedValue(false); // mock user不存在

            const userData = {
                username: 'testuser',
                password: '123', // 密碼太短
                nickname: 'TestNickname',
                birthDate: '1990-01-01',
                gender: 'male',
            };

            await expect(userService.register(userData)).rejects.toThrowError(
                new APIError(
                    400,
                    '請提供有效的用戶名密碼長度應至少為6個字符' +
                        '請提供有效的暱稱請提供有效的性別請提供有效的生日not valid'
                )
            );
        });

        it('should throw a general error if an unexpected error occurs', async () => {
            const mockSave = jest.fn().mockRejectedValue(new Error('Unknown Error'));
            User.prototype.save = mockSave;

            const userData = {
                username: 'testuser',
                password: 'password123',
                nickname: 'TestNickname',
                birthDate: '1990-01-01',
                gender: 'male',
            };

            await expect(userService.register(userData)).rejects.toThrowError(
                new Error('Error createUser : Unknown Error')
            );
        });

        it('should successfully register a new user', async () => {
            User.exists.mockResolvedValue(false); // mock user不存在
            User.prototype.save = jest.fn().mockResolvedValue(true); // mock user 存檔成功
            const userData = {
                username: 'newuser',
                password: 'password123',
                nickname: 'Newbie',
                birthDate: '2000-01-01',
                gender: 'Female',
            };
            await expect(userService.register(userData)).resolves.not.toThrow();
            expect(User.prototype.save).toHaveBeenCalled();
        });
    });

    //
    // ================================
    // 2. login
    // ================================
    describe('login', () => {
        it('should throw an error if username or password is missing', async () => {
            await expect(userService.login('', 'password123')).rejects.toThrow(APIError);
            await expect(userService.login('testuser', '')).rejects.toThrow(APIError);
        });

        it('should throw an error if user does not exist', async () => {
            User.findOne.mockResolvedValue(null); // 模擬查無此 user
            await expect(
                userService.login('nonexistentuser', 'password123')
            ).rejects.toThrow(APIError);
        });

        it('should throw an error if password is incorrect', async () => {
            User.findOne.mockResolvedValue({
                username: 'testuser',
                password: 'hashedpassword',
            });
            bcrypt.compare.mockResolvedValue(false); // 模擬 bcrypt 驗證失敗
            await expect(
                userService.login('testuser', 'wrongpassword')
            ).rejects.toThrow(APIError);
        });

        it('should return a token on successful login', async () => {
            User.findOne.mockResolvedValue({
                _id: new mongoose.Types.ObjectId(), // 使用 ObjectId
                username: 'testuser',
                password: 'hashedpassword',
                profile: { nickname: 'TestUser', birthDate: '1990-01-01', gender: 'male' },
            });
            bcrypt.compare.mockResolvedValue(true); // 模擬 bcrypt 驗證成功
            jwt.sign.mockReturnValue('token'); // 模擬簽發的 JWT
            const token = await userService.login('testuser', 'password123');
            expect(token.accessToken).toBe('token');
            expect(token.refreshToken).toBe('token'); // 根據你的實作，可能需要調整
            expect(token.userProfile).toBeDefined();
            expect(token.userProfile.nickname).toBe('TestUser');
        });
    });

    //
    // ================================
    // 3. Token Management
    // ================================
    describe('Token Management', () => {
        describe('getNewToken', () => {
            beforeEach(() => {
                userService.refreshTokenSet.clear(); // 確保測試前清空 refreshTokenSet
            });

            it('應使用有效的 refresh token 生成新的 access token', async () => {
                const userId = new mongoose.Types.ObjectId();
                const refreshToken = 'validRefreshToken'; // 定義測試用的 refreshToken

                // 將 refreshToken 添加至 refreshTokenSet
                userService.refreshTokenSet.add(refreshToken);
                console.log('Set after adding:', Array.from(userService.refreshTokenSet)); // 調試用

                // 模擬 jwt.sign 方法
                jwt.sign.mockReturnValueOnce('newAccessToken');

                // 調用函式
                const newToken = await userService.getNewToken(userId, refreshToken);

                // 驗證
                expect(newToken).toBe('newAccessToken');
                expect(jwt.sign).toHaveBeenCalledWith(
                    { userId },
                    process.env.SECRET_KEY,
                    { expiresIn: '1m' }
                );
            });

            it('若 refresh token 已失效或不存在，應拋出錯誤', async () => {
                const userId = new mongoose.Types.ObjectId(); // 模擬用戶 ID
                const invalidToken = 'invalidRefreshToken'; // 模擬無效 refresh token

                // 注意：此處未添加 invalidToken 至 refreshTokenSet

                // 斷言應拋出 APIError
                await expect(
                    userService.getNewToken(userId, invalidToken)
                ).rejects.toThrow(APIError);
                await expect(
                    userService.getNewToken(userId, invalidToken)
                ).rejects.toThrow('Invalid or expired refresh token');
            });
        });
    });

    //
    // ================================
    // 4. Random User （這有點問題，之後改...）
    // ================================
    /*
    describe('Random User', () => {
        it('應返回未被排除的隨機用戶', async () => {
            const mockId = new mongoose.Types.ObjectId();
            // 要排除 mockId
            const excludeIds = new Set([mockId.toString()]);
            // 假設只剩下另一個用戶
            const mockUsers = [{ _id: new mongoose.Types.ObjectId() }];

            // Mock回傳
            User.aggregate.mockImplementation(() => Promise.resolve(mockUsers));

            const result = await userService.getRandomUserExcludeCollection(
                excludeIds
            );
            expect(result).toEqual(mockUsers[0]);
        });
    });*/

    //
    // ================================
    // 5. User Profile Management
    // ================================
    describe('Profile Management', () => {
        describe('getUserById', () => {
            it('應返回用戶資料', async () => {
                const mockUserId = new mongoose.Types.ObjectId();
                const mockUser = { _id: mockUserId, profile: {} };
                User.findById.mockResolvedValue(mockUser);

                const user = await userService.getUserById(mockUserId);
                expect(user).toEqual(mockUser);
            });

            it('若找不到用戶，應丟出錯誤或回傳 null (依照你的實作需求)', async () => {
                User.findById.mockResolvedValue(null);
                const mockUserId = new mongoose.Types.ObjectId();

                // 假設此時我們的 service 會丟錯，可以依據你實際實作修改
                await expect(
                    userService.getUserById(mockUserId)
                ).rejects.toThrow(APIError);
            });
        });

        describe('getUserNicknameById', () => {
            it('應返回用戶暱稱', async () => {
                const mockUserId = new mongoose.Types.ObjectId();
                const mockUser = {
                    _id: mockUserId,
                    profile: { nickname: 'TestUser' },
                };
                User.findById.mockResolvedValue(mockUser);

                const nickname = await userService.getUserNicknameById(
                    mockUserId
                );
                expect(nickname).toBe('TestUser');
            });
        });

        describe('updatePicturePath', () => {
            it('應更新用戶頭像路徑', async () => {
                const mockUserId = new mongoose.Types.ObjectId();
                const mockUser = {
                    _id: mockUserId,
                    profile: { profilePicturePath: '' },
                    save: jest.fn(),
                };
                User.findById.mockResolvedValue(mockUser);

                await userService.updatePicturePath('/new/path', mockUserId);
                expect(mockUser.profile.profilePicturePath).toBe('/new/path');
                expect(mockUser.save).toHaveBeenCalled();
            });
        });
    });
});
