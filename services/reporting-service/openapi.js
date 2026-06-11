'use strict';
module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'FEMS - Reporting Service',
    version: '1.0.0',
    description: 'Real-time reports (daily/monthly/yearly): total stock count and inspection status. Includes an SSE live stream.',
  },
  servers: [{ url: 'http://localhost:4004' }, { url: 'http://localhost:4000/reports' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/reports': { get: { tags: ['Reports'], summary: 'Summary report', responses: { 200: { description: 'Report' } } } },
    '/api/reports/{period}': {
      get: {
        tags: ['Reports'], summary: 'Report for a period (daily/monthly/yearly)',
        parameters: [{ name: 'period', in: 'path', required: true, schema: { type: 'string', enum: ['daily', 'monthly', 'yearly'] } }],
        responses: { 200: { description: 'Report' }, 400: { description: 'Invalid period' } },
      },
    },
    '/api/reports/stream/live': { get: { tags: ['Reports'], summary: 'Real-time SSE stream of reports', responses: { 200: { description: 'text/event-stream' } } } },
  },
};
