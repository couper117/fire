'use strict';
module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'FEMS - User Management Service',
    version: '1.0.0',
    description: 'Authentication, roles (Admin/Inspector/User), registration, JWT, and profile management for the Fire Extinguisher Management System (TZW LTD).',
  },
  servers: [{ url: 'http://localhost:4001', description: 'User service (direct)' },
    { url: 'http://localhost:4000/users', description: 'Via API gateway' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', format: 'email', example: 'jane@tzw.rw' },
          password: { type: 'string', format: 'password', example: 'Passw0rd1' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@tzw.rw' },
          password: { type: 'string', example: 'Admin@123' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' }, first_name: { type: 'string' }, last_name: { type: 'string' },
          email: { type: 'string' }, role: { type: 'string', enum: ['Admin', 'Inspector', 'User'] },
          is_active: { type: 'integer' }, created_at: { type: 'string' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register a new user', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
        responses: { 201: { description: 'Registered' }, 400: { description: 'Validation error' }, 409: { description: 'Email exists' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login and receive a JWT', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: { 200: { description: 'JWT issued' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout (revoke token)', responses: { 200: { description: 'Logged out' } } } },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'], summary: 'Request password reset token', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } } } } } },
        responses: { 200: { description: 'Reset token generated' } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'], summary: 'Reset password using token', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { resetToken: { type: 'string' }, newPassword: { type: 'string' } } } } } },
        responses: { 200: { description: 'Password reset' }, 400: { description: 'Invalid token' } },
      },
    },
    '/api/users/me': {
      get: { tags: ['Profile'], summary: 'Get own profile', responses: { 200: { description: 'Profile' } } },
      put: { tags: ['Profile'], summary: 'Update own profile', responses: { 200: { description: 'Updated' } } },
    },
    '/api/users/me/password': { put: { tags: ['Profile'], summary: 'Change password', responses: { 200: { description: 'Changed' } } } },
    '/api/users': {
      get: { tags: ['Admin'], summary: 'List all users (Admin)', responses: { 200: { description: 'List' }, 403: { description: 'Forbidden' } } },
      post: { tags: ['Admin'], summary: 'Create user with role (Admin)', responses: { 201: { description: 'Created' } } },
    },
    '/api/users/{id}': { patch: { tags: ['Admin'], summary: 'Update role / active (Admin)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated' } } } },
  },
};
