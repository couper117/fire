'use strict';
const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
  extinguisherId: { type: String, required: true },
  serialNumber: String,
  scheduledAt: { type: Date, required: true },
  assignedTo: String,
  status: { 
    type: String, 
    default: 'Scheduled', 
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Missed'] 
  },
  result: String,
  notes: String,
  createdBy: String
}, { 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.extinguisher_id = ret.extinguisherId;
      ret.serial_number = ret.serialNumber;
      ret.scheduled_at = ret.scheduledAt;
      ret.assigned_to = ret.assignedTo;
      ret.created_by = ret.createdBy;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const notificationSchema = new mongoose.Schema({
  inspectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inspection', required: true },
  recipient: { type: String, required: true },
  message: { type: String, required: true }
}, { 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.inspection_id = ret.inspectionId.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

function initModels(conn) {
  const Inspection = conn.model('Inspection', inspectionSchema);
  const Notification = conn.model('Notification', notificationSchema);
  return { Inspection, Notification };
}

module.exports = { initModels };
