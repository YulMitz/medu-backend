const userService = require('../services/userService');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const APIError = require('../errors/APIError');

jest.mock('../models/User');  
jest.mock('bcryptjs'); 
jest.mock('jsonwebtoken');  

afterEach(() => {
    jest.clearAllMocks();
});

describe('User Service', () => {

    // register
    describe('register', () => {
        it('should throw an error if username is missing', async () => {
            const userData = {
                username: '',
                password: 'password123',
                nickname: 'Test',
                birthDate: '2000-01-01',
                gender: 'Male'
            };
            await expect(userService.register(userData)).rejects.toThrow(APIError);
        });

        it('should throw an error if user already exists', async () => {
            User.exists.mockResolvedValue(true);  // mock user existed
            const userData = {
                username: 'testuser',
                password: 'password123',
                nickname: 'Test',
                birthDate: '2000-01-01',
                gender: 'Male'
            };
            await expect(userService.register(userData)).rejects.toThrow(APIError);
        });

        it('should throw an error if username and password have validation error', async () => {
            // mock save() to throw ValidationError
            const mockSave = jest.fn().mockRejectedValue({
                name: 'ValidationError',
                errors: {
                    username: { path: 'username', message: 'Username is required' },
                    password: { path: 'password', message: 'Password is too short' },
                },
            });
            User.prototype.save = mockSave;

            User.exists.mockResolvedValue(false);  // mock user isnt existed
            
            const userData = {
                username: 'testuser',
                password: '123', // pasword too short
                nickname: 'TestNickname',
                birthDate: '1990-01-01',
                gender: 'male',
            };
    
            await expect(userService.register(userData)).rejects.toThrowError(
                new APIError(400, '請提供有效的用戶名密碼長度應至少為6個字符')
            );
        });

        it('should throw an error if all have validation error', async () => {
            // mock save() to throw ValidationError
            const mockSave = jest.fn().mockRejectedValue({
                name: 'ValidationError',
                errors: {
                    username: { path: 'username', message: 'Username is not valid' },
                    password: { path: 'password', message: 'Password is too short' },
                    'profile.nickname': { path: 'profile.nickname', message: 'Nickname is not valid' },
                    'profile.gender': { path: 'profile.gender', message: 'Gender is not valid' },
                    'profile.birthDate': { path: 'profile.birthDate', message: 'Birhtdate is not valid' },
                    other: { path: 'other', message: 'not valid' },
                },
            });
            User.prototype.save = mockSave;

            User.exists.mockResolvedValue(false);  // mock user isnt existed
            
            const userData = {
                username: 'testuser',
                password: '123', // password too short
                nickname: 'TestNickname',
                birthDate: '1990-01-01',
                gender: 'male',
            };
    
            await expect(userService.register(userData)).rejects.toThrowError(
                new APIError(400, '請提供有效的用戶名密碼長度應至少為6個字符' +
                    '請提供有效的暱稱請提供有效的性別請提供有效的生日not valid')
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
            User.exists.mockResolvedValue(false);  // mock user isnt existed
            User.prototype.save = jest.fn().mockResolvedValue(true);  // mock user save successfully
            const userData = {
                username: 'newuser',
                password: 'password123',
                nickname: 'Newbie',
                birthDate: '2000-01-01',
                gender: 'Female'
            };
            await expect(userService.register(userData)).resolves.not.toThrow();
            expect(User.prototype.save).toHaveBeenCalled();
        });
    });

    // login
    describe('login', () => {
        it('should throw an error if username or password is missing', async () => {
            await expect(userService.login('', 'password123')).rejects.toThrow(APIError);
            await expect(userService.login('testuser', '')).rejects.toThrow(APIError);
        });

        it('should throw an error if user does not exist', async () => {
            User.findOne.mockResolvedValue(null);  // mock user isnt existed
            await expect(userService.login('nonexistentuser', 'password123')).rejects.toThrow(APIError);
        });

        it('should throw an error if password is incorrect', async () => {
            User.findOne.mockResolvedValue({ username: 'testuser', password: 'hashedpassword' });
            bcrypt.compare.mockResolvedValue(false);  // mock bcrypt compare incorrect
            await expect(userService.login('testuser', 'wrongpassword')).rejects.toThrow(APIError);
        });

        it('should return a token on successful login', async () => {
            User.findOne.mockResolvedValue({ _id: 'userId', username: 'testuser', password: 'hashedpassword' });
            bcrypt.compare.mockResolvedValue(true);  // mock bcrypt compare correct
            jwt.sign.mockReturnValue('token');  // mock JWT token
            const token = await userService.login('testuser', 'password123');
            expect(token.accessToken).toBe('token');
        });
    });
});
