'use strict';
module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'FEMS - Inspection Scheduling Service',
    version: '1.0.0',
    description: 'Schedule inspections (select extinguisher, choose date/time, notify personnel), update results, and track status.',
  },
  servers: [{ url: 'http://localhost:4003' }, { url: 'http://localhost:4000/inspections' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Inspection: {
        type: 'object',
        required: ['extinguisherId', 'scheduledAt'],
        properties: {
          extinguisherId: { type: 'string', example: 'a1b2c3' },
          scheduledAt: { type: 'string', format: 'date-time', example: '2026-07-01T09:00:00Z' },
          assignedTo: { type: 'string', example: 'inspector@tzw.rw' },
          notes: { type: 'string', example: 'Quarterly check' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/inspections': {
      get: { tags: ['Inspections'], summary: 'List inspections', parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'upcoming', in: 'query', schema: { type: 'boolean' } }], responses: { 200: { description: 'List' } } },
      post: { tags: ['Inspections'], summary: 'Schedule inspection (Admin/Inspector)', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Inspection' } } } }, responses: { 201: { description: 'Scheduled + personnel notified' } } },
    },
    '/api/inspections/{id}': {
      get: { tags: ['Inspections'], summary: 'View inspection', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Found' } } },
      put: { tags: ['Inspections'], summary: 'Update / complete inspection', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Inspections'], summary: 'Delete inspection (Admin)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deleted' } } },
    },
  },
};
