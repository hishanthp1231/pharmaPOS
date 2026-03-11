const jwt = require('jsonwebtoken');
const db = require('../db');

const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is not set');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const [user] = await db.query('SELECT * FROM workers WHERE id = ?', [decoded.userId]);

        if (!user || user.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Add user to request object
        req.user = user[0];
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

module.exports = {
    authenticate
};
