const jwt = require('jsonwebtoken');

// Verify JWT from Authorization header (supports "Bearer <token>" or raw token)
function authMiddleware(req, res, next) {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ message: 'Access denied: missing Authorization header' });

  // Extract token (allow both "Bearer <token>" and plain token)
  const parts = header.split(' ');
  const token = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : header;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // attach decoded payload
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
