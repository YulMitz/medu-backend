// user.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('User Model', () => {
    it('should create a new user with a hashed password', async () => {
        const userData = {
            username: 'testuser',
            password: 'password123',
            profile: {
                nickname: 'TestUser',
                birthDate: new Date('2000-01-01'),
                gender: 'male',
                bio: 'This is a test user.',
            },
        };

        const user = new User(userData);
        await user.save();

        expect(user.username).toBe('testuser');
        expect(user.password).not.toBe('password123'); // password should be hashed
        expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt 
    });

    it('should hash password when saving a new user', async () => {
        const user = new User({
            username: 'newuser',
            password: 'securepassword',
            profile: {
                nickname: 'NewUser',
                birthDate: new Date('2000-01-01'),
                gender: 'female',
                bio: 'New test user.',
            },
        });

        await user.save();

        // check for password hashed
        expect(user.password).not.toBe('securepassword'); // password should be hashed
        const isMatch = await bcrypt.compare('securepassword', user.password);
        expect(isMatch).toBe(true); 
    });

    it('should compare passwords correctly', async () => {
        const user = new User({
            username: 'passwordUser',
            password: 'password123',
            profile: {
                nickname: 'PasswordUser',
                birthDate: new Date('2000-01-01'),
                gender: 'male',
                bio: 'User with password.',
            },
        });

        await user.save();

        const isMatch = await user.comparePassword('password123');
        expect(isMatch).toBe(true); // correct password should match

        const isMatchWrong = await user.comparePassword('wrongpassword');
        expect(isMatchWrong).toBe(false); // incorrect password should match
    });

    it('should validate required fields', async () => {
        const userData = {
            username: 'userwithoutpassword',
            // should thorow when password lost
            profile: {
                nickname: 'NoPasswordUser',
                birthDate: new Date('2000-01-01'),
                gender: 'female',
                bio: 'No password.',
            },
        };

        const user = new User(userData);

        await expect(user.save()).rejects.toThrowError(/password/);
    });
});
