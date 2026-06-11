'use strict';
/**
 * Shared authentication / authorization helpers.
 * - JWT signing & verification
 * - `authenticate` middleware: validates the Bearer token
 * - `authorize(...roles)` middleware: role-based access control (RBAC)
 *
 * The same JWT_SECRET is shared (via env) so any microservice can validate a
 * token minted by the user-service without an extra network round-trip.
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tzw-fems-dev-secret-change-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// In-memory token blocklist for logout (per process). In production this would
// live in Redis so all gateway/service instances share it.
const blocklist = new Set();

function signToken(payload) {
  const jti = `${payload.sub}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return jwt.sign({ ...payload, jti }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.jti && blocklist.has(decoded.jti)) {
    throw new Error('Token has been revoked');
  }
  return decoded;
}

function revokeToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    if (decoded.jti) blocklist.add(decoded.jti);
    return true;
  } catch {
    return false;
  }
}

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer token' });
  }
  try {
    req.user = verifyToken(token);
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: err.message });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
    }
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Requires one of roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  signToken,
  verifyToken,
  revokeToken,
  authenticate,
  authorize,
  extractToken,
};
