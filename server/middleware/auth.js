const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'examdesk_super_secret_jwt_key_2026';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
  });
}

function requireStudent(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'student') {
      next();
    } else {
      return res.status(403).json({ error: 'Access denied. Student privileges required.' });
    }
  });
}

module.exports = {
  JWT_SECRET,
  requireAuth,
  requireAdmin,
  requireStudent
};
