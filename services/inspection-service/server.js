'use strict';
/**
 * INSPECTION SCHEDULING MICROSERVICE (Mongoose version)
 */
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const { initStorage } = require('../../shared/db');
const { initModels } = require('./model');
const openapi = require('./openapi');
const { authenticate, authorize } = require('../../shared/auth');
const {
  isNonEmptyString, errorHandler, asyncHandler, badRequest, notFound,
} = require('../../shared/validation');

const app = express();
app.use(express.json());

const PORT = process.env.INSP_PORT || 4003;
const EXT_URL = process.env.EXT_URL || 'http://localhost:4002';
const EMAIL_URL = process.env.EMAIL_URL || 'http://localhost:4005';

let Inspection, Notification;

function isDateTime(v) { return typeof v === 'string' && !Number.isNaN(Date.parse(v)); }

async function fetchExtinguisher(id, token) {
  try {
    const r = await fetch(`${EXT_URL}/api/extinguishers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.extinguisher;
  } catch {
    return null;
  }
}

async function sendInspectionEmail(to, extinguisher, scheduledAt, inspectorName) {
  try {
    const emailData = {
      to,
      templateName: 'inspectionScheduled',
      data: {
        inspectorName,
        extinguisherLocation: extinguisher?.location || 'Unknown',
        serialNumber: extinguisher?.serialNumber || 'N/A',
        type: extinguisher?.type || 'N/A',
        scheduledAt,
      },
    };

    await fetch(`${EMAIL_URL}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    }).catch(err => console.log('[inspection-service] Email send failed:', err.message));
  } catch (error) {
    console.log('[inspection-service] Email notification error:', error.message);
  }
}

app.get('/health', (req, res) => res.json({ service: 'inspection-service', status: 'ok' }));

app.get('/', (req, res) => {
  res.json({
    service: 'inspection-service',
    description: 'FEMS Inspection Scheduling & Tracking',
    endpoints: {
      health: '/health',
      docs: '/api/docs/',
      inspections: 'GET /api/inspections'
    }
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.get('/api/openapi.json', (req, res) => res.json(openapi));

app.post('/api/inspections', authenticate, authorize('Admin', 'Inspector'), asyncHandler(async (req, res) => {
  const { extinguisherId, scheduledAt, assignedTo, notes } = req.body || {};
  if (!isNonEmptyString(extinguisherId) || !isDateTime(scheduledAt)) throw badRequest('extinguisherId/scheduledAt required');

  const ext = await fetchExtinguisher(extinguisherId, req.token);
  if (ext === null && process.env.STRICT_EXT_CHECK === 'true') throw notFound('Extinguisher not found');

  const serial = ext ? (ext.serialNumber || ext.serial_number) : null;
  const recipient = assignedTo || req.user.email;

  const inspection = new Inspection({ extinguisherId, serialNumber: serial, scheduledAt, assignedTo: recipient, notes, createdBy: req.user.email });
  await inspection.save();

  const message = `Inspection scheduled for extinguisher ${serial || extinguisherId} at ${scheduledAt}.`;
  const notification = new Notification({ inspectionId: inspection._id, recipient, message });
  await notification.save();

  // Send email notification asynchronously
  sendInspectionEmail(recipient, ext, scheduledAt, recipient.split('@')[0]);

  res.status(201).json({ message: 'Inspection scheduled', inspection: inspection.toJSON(), notification: { recipient, message } });
}));

app.get('/api/inspections', authenticate, asyncHandler(async (req, res) => {
  const { status, upcoming } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (upcoming === 'true') filter.scheduledAt = { $gte: new Date() };
  const list = await Inspection.find(filter).sort({ scheduledAt: 1 });
  res.json({ count: list.length, inspections: list.map(i => i.toJSON()) });
}));

app.get('/api/inspections/:id', authenticate, asyncHandler(async (req, res) => {
  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) throw notFound('Inspection not found');
  const notifs = await Notification.find({ inspectionId: inspection._id }).sort({ createdAt: -1 });
  res.json({ inspection: inspection.toJSON(), notifications: notifs.map(n => n.toJSON()) });
}));

app.put('/api/inspections/:id', authenticate, authorize('Admin', 'Inspector'), asyncHandler(async (req, res) => {
  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) throw notFound('Inspection not found');
  const b = req.body || {};
  const VALID = ['Scheduled', 'Completed', 'Cancelled', 'Missed'];
  if (b.status !== undefined) {
    if (!VALID.includes(b.status)) throw badRequest('Invalid status');
    inspection.status = b.status;
  }
  if (b.scheduledAt !== undefined) inspection.scheduledAt = b.scheduledAt;
  if (b.assignedTo !== undefined) inspection.assignedTo = b.assignedTo;
  if (b.result !== undefined) inspection.result = b.result;
  if (b.notes !== undefined) inspection.notes = b.notes;
  await inspection.save();
  res.json({ message: 'Inspection updated', inspection: inspection.toJSON() });
}));

app.delete('/api/inspections/:id', authenticate, authorize('Admin'), asyncHandler(async (req, res) => {
  if (!await Inspection.findByIdAndDelete(req.params.id)) throw notFound('Inspection not found');
  await Notification.deleteMany({ inspectionId: req.params.id });
  res.json({ message: 'Inspection deleted', id: req.params.id });
}));

app.get('/api/internal/stats', asyncHandler(async (req, res) => {
  const total = await Inspection.countDocuments();
  const byStatus = await Inspection.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { status: "$_id", c: "$count", _id: 0 } }]);
  res.json({ total, byStatus });
}));

app.use(errorHandler);

async function bootstrap() {
  const conn = await initStorage('inspection-service');
  const models = initModels(conn);
  Inspection = models.Inspection;
  Notification = models.Notification;
  return app;
}

if (require.main === module) {
  bootstrap().then(() => {
    app.listen(PORT, () => console.log(`[inspection-service] listening on http://localhost:${PORT}`));
  });
}
module.exports = app;
module.exports.bootstrap = bootstrap;
