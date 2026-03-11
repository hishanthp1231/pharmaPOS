const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ success: false, message: 'No token provided.' });
    }

    // Remove Bearer prefix if present
    const tokenString = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }

    jwt.verify(tokenString, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
        }
        req.user = decoded;
        next();
    });
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to perform this action.'
            });
        }

        next();
    };
};

module.exports = { verifyToken, checkRole };
