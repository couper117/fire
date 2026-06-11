'use strict';
module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'FEMS - Fire Extinguisher Service',
    version: '1.0.0',
    description: 'Register, list, view, update, remove extinguishers and log maintenance activities.',
  },
  servers: [{ url: 'http://localhost:4002' }, { url: 'http://localhost:4000/extinguishers' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Extinguisher: {
        type: 'object',
        required: ['serialNumber', 'location', 'type', 'size', 'installationDate', 'expiryDate'],
        properties: {
          serialNumber: { type: 'string', example: 'EXT-0001' },
          location: { type: 'string', example: 'Building A - Floor 2' },
          type: { type: 'string', enum: ['Water', 'CO2', 'Foam', 'Dry Chemical'] },
          size: { type: 'string', enum: ['2.5 lbs', '5 lbs', '9 lbs', '12 lbs'] },
          installationDate: { type: 'string', format: 'date', example: '2025-01-15' },
          expiryDate: { type: 'string', format: 'date', example: '2030-01-15' },
          status: { type: 'string', enum: ['Active', 'Expired', 'Needs Maintenance', 'Decommissioned'] },
        },
      },
      Maintenance: {
        type: 'object',
        required: ['actionTaken', 'actionDate'],
        properties: {
          actionTaken: { type: 'string', example: 'Pressure check and refill' },
          actionDate: { type: 'string', format: 'date', example: '2026-06-01' },
          personnel: { type: 'string', example: 'inspector@tzw.rw' },
          conditionsNoted: { type: 'string', example: 'Gauge in green zone, no corrosion' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/extinguishers': {
      get: { tags: ['Extinguishers'], summary: 'List all extinguishers', parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'type', in: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'List' } } },
      post: { tags: ['Extinguishers'], summary: 'Register new extinguisher (Admin/Inspector)', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Extinguisher' } } } }, responses: { 201: { description: 'Created' }, 409: { description: 'Duplicate serial' } } },
    },
    '/api/extinguishers/{id}': {
      get: { tags: ['Extinguishers'], summary: 'View extinguisher by id', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Found' }, 404: { description: 'Not found' } } },
      put: { tags: ['Extinguishers'], summary: 'Update extinguisher (Admin/Inspector)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Extinguishers'], summary: 'Remove extinguisher (Admin)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Removed' } } },
    },
    '/api/extinguishers/{id}/maintenance': {
      get: { tags: ['Maintenance'], summary: 'List maintenance logs', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Logs' } } },
      post: { tags: ['Maintenance'], summary: 'Log maintenance (Admin/Inspector)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Maintenance' } } } }, responses: { 201: { description: 'Logged' } } },
    },
  },
};
