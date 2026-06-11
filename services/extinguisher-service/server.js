'use strict';
/**
 * FIRE EXTINGUISHER MANAGEMENT MICROSERVICE (Mongoose version)
 */
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const { initStorage } = require('../../shared/db');
const { initModels } = require('./model');
const openapi = require('./openapi');
const { authenticate, authorize } = require('../../shared/auth');
const {
  isNonEmptyString, errorHandler, asyncHandler, badRequest, notFound, conflict,
} = require('../../shared/validation');

const app = express();
app.use(express.json());

const PORT = process.env.EXT_PORT || 4002;
const TYPES = ['Water', 'CO2', 'Foam', 'Dry Chemical'];
const SIZES = ['2.5 lbs', '5 lbs', '9 lbs', '12 lbs'];
const STATUSES = ['Active', 'Expired', 'Needs Maintenance', 'Decommissioned'];

let Extinguisher, MaintenanceLog;

function isDate(v) { return typeof v === 'string' && !Number.isNaN(Date.parse(v)); }

app.get('/health', (req, res) => res.json({ service: 'extinguisher-service', status: 'ok' }));

app.get('/', (req, res) => {
  res.json({
    service: 'extinguisher-service',
    description: 'FEMS Fire Extinguisher Management',
    endpoints: {
      health: '/health',
      docs: '/api/docs/',
      extinguishers: 'GET /api/extinguishers'
    }
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.get('/api/openapi.json', (req, res) => res.json(openapi));

app.post('/api/extinguishers', authenticate, authorize('Admin', 'Inspector'), asyncHandler(async (req, res) => {
  const { serialNumber, location, type, size, installationDate, expiryDate, status } = req.body || {};
  if (!isNonEmptyString(serialNumber) || !isNonEmptyString(location)) throw badRequest('serialNumber/location required');
  if (!TYPES.includes(type) || !SIZES.includes(size)) throw badRequest('Invalid type/size');
  if (!isDate(installationDate) || !isDate(expiryDate)) throw badRequest('Invalid dates');
  
  if (await Extinguisher.findOne({ serialNumber: serialNumber.trim() })) throw conflict('Serial number exists');

  const extinguisher = new Extinguisher({
    serialNumber: serialNumber.trim(),
    location: location.trim(),
    type, size, installationDate, expiryDate,
    status: (status && STATUSES.includes(status)) ? status : 'Active'
  });
  await extinguisher.save();
  res.status(201).json({ message: 'Extinguisher registered', extinguisher: extinguisher.toJSON() });
}));

app.get('/api/extinguishers', authenticate, asyncHandler(async (req, res) => {
  const { status, type, location } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (location) filter.location = { $regex: location, $options: 'i' };
  const list = await Extinguisher.find(filter).sort({ createdAt: -1 });
  res.json({ count: list.length, extinguishers: list.map(e => e.toJSON()) });
}));

app.get('/api/extinguishers/:id', authenticate, asyncHandler(async (req, res) => {
  const extinguisher = await Extinguisher.findById(req.params.id);
  if (!extinguisher) throw notFound('Extinguisher not found');
  const logs = await MaintenanceLog.find({ extinguisherId: extinguisher._id }).sort({ actionDate: -1 });
  res.json({ extinguisher: extinguisher.toJSON(), maintenanceLogs: logs.map(l => l.toJSON()) });
}));

app.put('/api/extinguishers/:id', authenticate, authorize('Admin', 'Inspector'), asyncHandler(async (req, res) => {
  const extinguisher = await Extinguisher.findById(req.params.id);
  if (!extinguisher) throw notFound('Extinguisher not found');
  const b = req.body || {};
  if (b.location !== undefined) extinguisher.location = b.location.trim();
  if (b.type !== undefined) extinguisher.type = b.type;
  if (b.size !== undefined) extinguisher.size = b.size;
  if (b.installationDate !== undefined) extinguisher.installationDate = b.installationDate;
  if (b.expiryDate !== undefined) extinguisher.expiryDate = b.expiryDate;
  if (b.status !== undefined) extinguisher.status = b.status;
  await extinguisher.save();
  res.json({ message: 'Extinguisher updated', extinguisher: extinguisher.toJSON() });
}));

app.delete('/api/extinguishers/:id', authenticate, authorize('Admin'), asyncHandler(async (req, res) => {
  if (!await Extinguisher.findByIdAndDelete(req.params.id)) throw notFound('Extinguisher not found');
  await MaintenanceLog.deleteMany({ extinguisherId: req.params.id });
  res.json({ message: 'Extinguisher removed', id: req.params.id });
}));

app.post('/api/extinguishers/:id/maintenance', authenticate, authorize('Admin', 'Inspector'), asyncHandler(async (req, res) => {
  const ext = await Extinguisher.findById(req.params.id);
  if (!ext) throw notFound('Extinguisher not found');
  const { actionTaken, actionDate, personnel, conditionsNoted } = req.body || {};
  if (!isNonEmptyString(actionTaken) || !isDate(actionDate)) throw badRequest('actionTaken/Date required');
  const log = new MaintenanceLog({ extinguisherId: ext._id, actionTaken: actionTaken.trim(), actionDate, personnel: personnel || req.user.email, conditionsNoted });
  await log.save();
  res.status(201).json({ message: 'Maintenance logged', log: log.toJSON() });
}));

app.get('/api/extinguishers/:id/maintenance', authenticate, asyncHandler(async (req, res) => {
  const logs = await MaintenanceLog.find({ extinguisherId: req.params.id }).sort({ actionDate: -1 });
  res.json({ count: logs.length, maintenanceLogs: logs.map(l => l.toJSON()) });
}));

app.get('/api/internal/stats', asyncHandler(async (req, res) => {
  const total = await Extinguisher.countDocuments();
  const byStatus = await Extinguisher.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { status: "$_id", c: "$count", _id: 0 } }]);
  const byType = await Extinguisher.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }, { $project: { type: "$_id", c: "$count", _id: 0 } }]);
  res.json({ total, byStatus, byType });
}));

app.use(errorHandler);

async function bootstrap() {
  const conn = await initStorage('extinguisher-service');
  const models = initModels(conn);
  Extinguisher = models.Extinguisher;
  MaintenanceLog = models.MaintenanceLog;
  return app;
}

if (require.main === module) {
  bootstrap().then(() => {
    app.listen(PORT, () => console.log(`[extinguisher-service] listening on http://localhost:${PORT}`));
  });
}
module.exports = app;
module.exports.bootstrap = bootstrap;
