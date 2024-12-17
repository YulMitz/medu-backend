const jwt = require('jsonwebtoken');
require('dotenv').config();
const { isTokenBlacklisted } = require('../services/userService');

module.exports = (req, res, next) => {
    // Get the token from the request headers
    const authHeader = req.headers.authorization;

    // Ensure authHeader is set
    if (!authHeader) {
        console.log('Token not provided');
        return res.status(401).json({ message: 'Token not provided' });
    }

    // Get the token part
    const token = authHeader.split(' ')[1];

    // Ensure the token is properly extracted
    if (!token) {
        console.log('Token format is incorrect');
        return res.status(401).json({ message: 'Token format is incorrect' });
    }

    // Check if SECRET_KEY is defined
    if (!process.env.SECRET_KEY) {
        console.error('Server error: SECRET_KEY not set');
        return res.status(500).json({ message: 'Server error' });
    }

    if (token && isTokenBlacklisted(token)) {
        return res.status(401).json({ message: 'Token has been invalidated, please log in again.' });
    }

    try {
        // Testing the token and secret key
        console.log('Received token:', token);
        console.log(
            'SECRET_KEY used for verification:',
            process.env.SECRET_KEY
        );

        // Verify the token
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log('Decoded token:', decoded);

        // Check if userId exists in token payload
        if (!decoded.userId) {
            console.log('Invalid token payload: userId missing');
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.error('JWT verification error: Token expired');
            return res.status(401).json({ message: 'Token expired' });
        } else {
            console.error('JWT verification error:', error);
            return res.status(401).json({ message: 'Invalid token' });
        }
    }
};
