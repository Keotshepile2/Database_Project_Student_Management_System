const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    console.log('🔐 Auth middleware - Token present:', !!token);
    
    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        req.user = decoded;
        console.log('✅ Token valid for user:', decoded.email);
        next();
    } catch (error) {
        console.log('❌ Token invalid:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
