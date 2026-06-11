'use strict';
/**
 * API GATEWAY
 * -----------
 * Single public entry point for the FEMS microservices. Routes:
 *   /users/*         -> user-service        (4001)
 *   /extinguishers/* -> extinguisher-service (4002)
 *   /inspections/*   -> inspection-service   (4003)
 *   /reports/*       -> reporting-service    (4004)
 * This is the typical microservice edge pattern: clients talk to ONE host,
 * the gateway forwards to the right internal service.
 */
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.GATEWAY_PORT || 4000;

// Rate limiting middleware
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', // Skip health checks
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful login attempts
  standardHeaders: true,
  legacyHeaders: false,
});

const TARGETS = {
  users: process.env.USER_URL || 'http://localhost:4001',
  extinguishers: process.env.EXT_URL || 'http://localhost:4002',
  inspections: process.env.INSP_URL || 'http://localhost:4003',
  reports: process.env.REPORT_URL || 'http://localhost:4004',
};

// Apply general rate limiting
app.use(generalLimiter);

// Apply stricter rate limiting to auth endpoints
app.use('/users/api/auth/login', authLimiter);
app.use('/users/api/auth/register', authLimiter);

app.get('/health', (req, res) => res.json({ service: 'api-gateway', status: 'ok', routes: Object.keys(TARGETS), rateLimit: 'enabled' }));

app.get('/', (req, res) => {
  res.json({
    name: 'FEMS API Gateway',
    description: 'Central entry point for FEMS microservices',
    endpoints: {
      auth: {
        register: 'POST /users/api/auth/register',
        login: 'POST /users/api/auth/login',
      },
      documentation: {
        users: '/users/api/docs/',
        extinguishers: '/extinguishers/api/docs/',
        inspections: '/inspections/api/docs/',
        reports: '/reports/api/docs/',
      },
      health: {
        gateway: '/health',
        users: '/users/health',
        extinguishers: '/extinguishers/health',
        inspections: '/inspections/health',
        reports: '/reports/health',
      }
    },
  });
});

for (const [prefix, target] of Object.entries(TARGETS)) {
  app.use(
    `/${prefix}`,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^/${prefix}`]: '' },
      on: {
        proxyRes: (proxyRes) => {
          // Fix redirects (e.g. from /api/docs to /api/docs/) by re-adding the service prefix
          if (proxyRes.headers.location && proxyRes.headers.location.startsWith('/')) {
            proxyRes.headers.location = `/${prefix}${proxyRes.headers.location}`;
          }
        },
      },
    })
  );
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[api-gateway] listening on http://localhost:${PORT}`);
    for (const [p, t] of Object.entries(TARGETS)) console.log(`   /${p} -> ${t}`);
  });
}
module.exports = app;
