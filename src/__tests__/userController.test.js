const request = require('supertest');
const express = require('express');
const userController = require('../controllers/userController');
const userService = require('../services/userService');

// 建立一個測試用的 Express 應用程序
const app = express();
app.use(express.json());
app.post('/register', userController.register);
app.post('/login', userController.login);

// Mock userService
jest.mock('../services/userService');

describe('User Controller', () => {
    describe('register', () => {
        it('should return 201 and success message when registration is successful', async () => {
            userService.register.mockResolvedValueOnce(); // 模擬成功的註冊

            const response = await request(app)
                .post('/register')
                .send({
                    username: 'testuser1',
                    password: 'password123',
                    nickname: 'Tester',
                    birthDate: '1990-01-01',
                    gender: 'male'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('register success');
        });
        
        it('should return custom error when APIError is thrown', async () => {
            userService.register.mockRejectedValueOnce({
                name: 'APIError',
                statusCode: 400,
                message: 'Invalid data'
            });

            const response = await request(app)
                .post('/register')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid data');
        });

        it('should return 500 when an unexpected error occurs', async () => {
            userService.register.mockRejectedValueOnce(new Error("server error"));

            const response = await request(app)
                .post('/register')
                .send({
                    username: 'testuser',
                    password: 'password123',
                    nickname: 'Tester',
                    birthDate: '1990-01-01',
                    gender: 'male'
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('server error');
        });
        
    });

    describe('login', () => {
        it('should return token when login is successful', async () => {
            const mockRes = {
                "token" : "fake-token",
                "userProfile" : "fake-user"
            };
            userService.login.mockResolvedValue(mockRes);

            const response = await request(app)
                .post('/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.token).toBe(mockRes.token);
            expect(response.body.userProfile).toBe(mockRes.userProfile);
        });

        it('should return custom error when APIError is thrown in login', async () => {
            userService.login.mockRejectedValue({
                name: 'APIError',
                statusCode: 401,
                message: 'Invalid credentials'
            });

            const response = await request(app)
                .post('/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should return 500 when an unexpected error occurs in login', async () => {
            userService.login.mockRejectedValue(new Error('Unexpected error'));

            const response = await request(app)
                .post('/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Unexpected error');
        });
    });
});
