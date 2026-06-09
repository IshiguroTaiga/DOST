const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[AuthMiddleware] Missing or invalid header for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
    req.user = decoded;
    // Log Super Admin actions specifically for debugging
    if (decoded.account_type === 'Super Admin' || decoded.role === 'Super Admin') {
      console.log(`[AuthMiddleware] Super Admin authenticated: ${decoded.email} for ${req.method} ${req.originalUrl}`);
    }
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      console.warn(`[AuthMiddleware] Token error (${err.name}) for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
    console.error('[AuthMiddleware] Unexpected Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { authenticate };
