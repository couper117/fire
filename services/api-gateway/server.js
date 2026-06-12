'use strict';
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.GATEWAY_PORT || 4000;

const ALLOWED_ORIGINS = [
  /\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
  process.env.FRONTEND_URL,
].filter(Boolean);

function isAllowed(origin) {
  return ALLOWED_ORIGINS.some((rule) =>
    rule instanceof RegExp ? rule.test(origin) : rule === origin
  );
}

// Handle CORS preflight before anything else
app.options('*', (req, res) => {
  const origin = req.headers.origin || '';
  if (isAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  res.sendStatus(204);
});

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use('/users/api/auth/login', authLimiter);
app.use('/users/api/auth/register', authLimiter);

app.get('/health', (req, res) => res.json({ service: 'api-gateway', status: 'ok', routes: ['users','extinguishers','inspections','reports'], rateLimit: 'enabled' }));

app.get('/', (req, res) => res.json({ name: 'FEMS API Gateway', status: 'ok' }));

const TARGETS = {
  users:         process.env.USER_URL    || 'http://localhost:4001',
  extinguishers: process.env.EXT_URL     || 'http://localhost:4002',
  inspections:   process.env.INSP_URL    || 'http://localhost:4003',
  reports:       process.env.REPORT_URL  || 'http://localhost:4004',
};

for (const [prefix, target] of Object.entries(TARGETS)) {
  app.use(
    `/${prefix}`,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^/${prefix}`]: '' },
      on: {
        proxyRes: (proxyRes, req) => {
          // Inject CORS headers into every proxied response
          const origin = req.headers.origin || '';
          if (isAllowed(origin)) {
            proxyRes.headers['access-control-allow-origin'] = origin;
            proxyRes.headers['access-control-allow-credentials'] = 'true';
          }
          // Fix proxy redirects
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
    console.log(`[api-gateway] http://localhost:${PORT}`);
    for (const [p, t] of Object.entries(TARGETS)) console.log(`  /${p} -> ${t}`);
  });
}
module.exports = app;
