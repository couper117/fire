'use strict';
/**
 * USER MANAGEMENT MICROSERVICE (Mongoose version)
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const swaggerUi = require('swagger-ui-express');

const { initStorage } = require('../../shared/db');
const { initModels } = require('./model');
const openapi = require('./openapi');
const {
  signToken, revokeToken, authenticate, authorize,
} = require('../../shared/auth');
const {
  isNonEmptyString, isValidEmail, isStrongPassword,
  errorHandler, asyncHandler, badRequest, notFound, conflict,
} = require('../../shared/validation');

const app = express();
app.use(express.json());

const PORT = process.env.USER_PORT || 4001;
const ROLES = ['Admin', 'Inspector', 'User'];

let User; // assigned during bootstrap

app.get('/health', (req, res) => res.json({ service: 'user-service', status: 'ok' }));

app.get('/', (req, res) => {
  res.json({
    service: 'user-service',
    description: 'FEMS User Management (Auth, Roles, Profiles)',
    endpoints: {
      health: '/health',
      docs: '/api/docs/',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      }
    }
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.get('/api/openapi.json', (req, res) => res.json(openapi));

/* ----------------------------- AUTH ----------------------------- */

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body || {};
  if (!isNonEmptyString(firstName) || !isNonEmptyString(lastName)) throw badRequest('firstName/lastName required');
  if (!isValidEmail(email)) throw badRequest('A valid email is required');
  if (!isStrongPassword(password)) throw badRequest('Strong password required');

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw conflict('A user with this email already exists');

  const user = new User({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'User'
  });
  await user.save();
  res.status(201).json({ message: 'Registration successful', user: user.toJSON() });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user || !user.isActive || !bcrypt.compareSync(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
  }
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  res.json({ message: 'Login successful', token, user: user.toJSON() });
}));

app.post('/api/auth/logout', authenticate, (req, res) => {
  revokeToken(req.token);
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/users/me', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) throw notFound('User not found');
  res.json({ user: user.toJSON() });
}));

app.put('/api/users/me', authenticate, asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body || {};
  const user = await User.findById(req.user.sub);
  if (!user) throw notFound('User not found');
  if (isNonEmptyString(firstName)) user.firstName = firstName.trim();
  if (isNonEmptyString(lastName)) user.lastName = lastName.trim();
  if (email !== undefined) {
    if (!isValidEmail(email)) throw badRequest('Invalid email');
    if (await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } })) throw conflict('Email in use');
    user.email = email.toLowerCase();
  }
  await user.save();
  res.json({ message: 'Profile updated', user: user.toJSON() });
}));

app.put('/api/users/me/password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const user = await User.findById(req.user.sub);
  if (!user || !bcrypt.compareSync(currentPassword || '', user.passwordHash)) throw badRequest('Invalid password');
  if (!isStrongPassword(newPassword)) throw badRequest('Strong password required');
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  await user.save();
  res.json({ message: 'Password changed' });
}));

app.post('/api/auth/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (user) {
    user.resetToken = crypto.randomBytes(24).toString('hex');
    user.resetExpires = Date.now() + 1000 * 60 * 30;
    await user.save();
    return res.json({ message: 'Reset token generated', resetToken: user.resetToken });
  }
  res.json({ message: 'If the email exists, a reset token has been generated' });
}));

app.post('/api/auth/reset-password', asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body || {};
  const user = await User.findOne({ resetToken, resetExpires: { $gt: Date.now() } });
  if (!user) throw badRequest('Invalid or expired reset token');
  if (!isStrongPassword(newPassword)) throw badRequest('Strong password required');
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  user.resetToken = undefined;
  user.resetExpires = undefined;
  await user.save();
  res.json({ message: 'Password reset' });
}));

app.get('/api/users', authenticate, authorize('Admin'), asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ count: users.length, users: users.map(u => u.toJSON()) });
}));

app.post('/api/users', authenticate, authorize('Admin'), asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body || {};
  if (!ROLES.includes(role)) throw badRequest('Invalid role');
  if (await User.findOne({ email: email?.toLowerCase() })) throw conflict('Email exists');
  const user = new User({ firstName, lastName, email: email.toLowerCase(), passwordHash: bcrypt.hashSync(password, 10), role });
  await user.save();
  res.status(201).json({ message: 'User created', user: user.toJSON() });
}));

app.patch('/api/users/:id', authenticate, authorize('Admin'), asyncHandler(async (req, res) => {
  const { role, isActive } = req.body || {};
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = !!isActive;
  await user.save();
  res.json({ message: 'User updated', user: user.toJSON() });
}));

app.get('/api/internal/verify', authenticate, (req, res) => {
  res.json({ valid: true, user: { id: req.user.sub, email: req.user.email, role: req.user.role } });
});

app.use(errorHandler);

async function bootstrap() {
  const conn = await initStorage('user-service');
  const models = initModels(conn);
  User = models.User;
  await models.seedAdmin();
  return app;
}

if (require.main === module) {
  bootstrap().then(() => {
    app.listen(PORT, () => console.log(`[user-service] listening on http://localhost:${PORT}`));
  });
}
module.exports = app;
module.exports.bootstrap = bootstrap;
