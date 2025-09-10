const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to authenticate user using JWT
async function authMiddleware(req, res, next) {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ message: 'Access denied: missing Authorization header' });

  const parts = header.split(' ');
  const token = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : header;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Check if user is banned
    if (user.banned) {
      return res.status(403).json({
        message: 'Your account has been banned. Please contact the admin at ahmed.magdy362006@gmail.com for assistance.'
      });
    }

    // Attach user info + superAdmin flag to request
    req.user = { ...payload, isSuperAdmin: user.isSuperAdmin };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Middleware to allow only admin or superAdmin
function adminMiddleware(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && !req.user.isSuperAdmin)) {
    return res.status(403).json({ message: 'Access denied: admin only' });
  }
  next();
}

// Middleware to allow only superAdmin
function superAdminMiddleware(req, res, next) {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({ message: 'Access denied: super admin only' });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware, superAdminMiddleware };
