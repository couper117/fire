'use strict';
/**
 * REPORTING MICROSERVICE
 * ----------------------
 * Activity 4: generate real-time reports (daily, monthly, yearly) including:
 *   - Total number of extinguishers in stock
 *   - Inspection status
 * Aggregates data from the extinguisher-service and inspection-service over HTTP,
 * and exposes a real-time stream via Server-Sent Events (SSE).
 */
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const openapi = require('./openapi');
const { authenticate, authorize } = require('../../shared/auth');
const { errorHandler, asyncHandler, badRequest } = require('../../shared/validation');

const app = express();
app.use(express.json());
const PORT = process.env.REPORT_PORT || 4004;
const EXT_URL = process.env.EXT_URL || 'http://localhost:4002';
const INSP_URL = process.env.INSP_URL || 'http://localhost:4003';

async function safeJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function buildReport(period) {
  const [extStats, inspStats] = await Promise.all([
    safeJson(`${EXT_URL}/api/internal/stats`),
    safeJson(`${INSP_URL}/api/internal/stats`),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    period,
    extinguishers: {
      totalInStock: extStats ? extStats.total : 0,
      byStatus: extStats ? extStats.byStatus : [],
      byType: extStats ? extStats.byType : [],
    },
    inspections: {
      total: inspStats ? inspStats.total : 0,
      byStatus: inspStats ? inspStats.byStatus : [],
    },
    sources: {
      extinguisherService: extStats ? 'online' : 'unavailable',
      inspectionService: inspStats ? 'online' : 'unavailable',
    },
  };
}

app.get('/health', (req, res) => res.json({ service: 'reporting-service', status: 'ok' }));

app.get('/', (req, res) => {
  res.json({
    service: 'reporting-service',
    description: 'FEMS Real-time Reporting Aggregator',
    endpoints: {
      health: '/health',
      docs: '/api/docs/',
      reports: 'GET /api/reports'
    }
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.get('/api/openapi.json', (req, res) => res.json(openapi));

const PERIODS = ['daily', 'monthly', 'yearly'];

// On-demand report for a given period
app.get('/api/reports/:period', authenticate, authorize('Admin', 'Inspector'), asyncHandler(async (req, res) => {
  const period = req.params.period;
  if (!PERIODS.includes(period)) throw badRequest(`period must be one of: ${PERIODS.join(', ')}`);
  res.json(await buildReport(period));
}));

// Summary across all periods
app.get('/api/reports', authenticate, authorize('Admin', 'Inspector'), asyncHandler(async (req, res) => {
  const report = await buildReport('summary');
  res.json(report);
}));

// Real-time stream (Server-Sent Events) - pushes a fresh report every few seconds
app.get('/api/reports/stream/live', authenticate, authorize('Admin', 'Inspector'), async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders?.();

  let active = true;
  const send = async () => {
    if (!active) return;
    const report = await buildReport('realtime');
    res.write(`data: ${JSON.stringify(report)}\n\n`);
  };
  await send();
  const interval = setInterval(send, Number(process.env.STREAM_INTERVAL_MS || 5000));
  req.on('close', () => { active = false; clearInterval(interval); res.end(); });
});

app.use(errorHandler);

async function bootstrap() { return app; } // no local DB to init

if (require.main === module) {
  bootstrap().then(() => {
    app.listen(PORT, () => console.log(`[reporting-service] listening on http://localhost:${PORT} (docs: /api/docs)`));
  });
}
module.exports = app;
module.exports.bootstrap = bootstrap;
