'use strict';
/** Small reusable validators and a consistent error responder. */
const z = require('zod');

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isValidEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isStrongPassword(v) {
  // >= 8 chars, at least one letter and one number
  return typeof v === 'string' && v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
}

/** Express error-handling middleware (4 args). */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  res.status(status).json({
    error: err.name || 'Error',
    message: err.message || 'Internal server error',
  });
}

/** Wrap async route handlers so thrown errors reach errorHandler. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function badRequest(message) {
  const e = new Error(message);
  e.name = 'BadRequest';
  e.status = 400;
  return e;
}

function notFound(message) {
  const e = new Error(message || 'Resource not found');
  e.name = 'NotFound';
  e.status = 404;
  return e;
}

function conflict(message) {
  const e = new Error(message);
  e.name = 'Conflict';
  e.status = 409;
  return e;
}

function unauthorized(message) {
  const e = new Error(message || 'Unauthorized');
  e.name = 'Unauthorized';
  e.status = 401;
  return e;
}

function forbidden(message) {
  const e = new Error(message || 'Forbidden');
  e.name = 'Forbidden';
  e.status = 403;
  return e;
}

// Zod validation middleware factory
function validateBody(schema) {
  return asyncHandler(async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Request validation failed',
          issues: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      throw error;
    }
  });
}

// Common schemas
const schemas = {
  loginSchema: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password required'),
  }),

  registerSchema: z.object({
    firstName: z.string().min(1, 'First name required'),
    lastName: z.string().min(1, 'Last name required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be 8+ characters'),
  }),

  extinguisherSchema: z.object({
    serialNumber: z.string().min(3, 'Serial number required'),
    location: z.string().min(1, 'Location required'),
    type: z.enum(['Water', 'CO2', 'Foam', 'Dry Chemical']),
    size: z.string().min(1, 'Size required'),
    installationDate: z.string().datetime('Invalid date'),
    expiryDate: z.string().datetime('Invalid date'),
    status: z.enum(['Active', 'Expired', 'Needs Maintenance', 'Decommissioned']).optional(),
  }),

  inspectionSchema: z.object({
    extinguisherId: z.string().min(1, 'Extinguisher required'),
    scheduledAt: z.string().datetime('Invalid date'),
    assignedTo: z.string().email('Invalid email').optional(),
    notes: z.string().optional(),
  }),

  maintenanceLogSchema: z.object({
    actionTaken: z.string().min(10, 'Action details required'),
    actionDate: z.string().datetime('Invalid date'),
    conditionsNoted: z.string().min(10, 'Conditions noted required'),
  }),
};

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isStrongPassword,
  errorHandler,
  asyncHandler,
  badRequest,
  notFound,
  conflict,
  unauthorized,
  forbidden,
  validateBody,
  schemas,
};
