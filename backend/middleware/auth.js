const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get token from header (try both formats)
  let token = req.header('x-auth-token') || req.header('Authorization');

  // Handle Bearer token format (Authorization: Bearer token)
  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7);
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // For backward compatibility, some parts of the code expect req.user.id
    // while others might expect req.user to be the entire payload
    req.user = decoded.id ? { id: decoded.id } : decoded;
    
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 