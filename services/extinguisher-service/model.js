'use strict';
const mongoose = require('mongoose');

const extinguisherSchema = new mongoose.Schema({
  serialNumber: { type: String, required: true, unique: true, trim: true },
  location: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['Water', 'CO2', 'Foam', 'Dry Chemical'] 
  },
  size: { 
    type: String, 
    required: true, 
    enum: ['2.5 lbs', '5 lbs', '9 lbs', '12 lbs'] 
  },
  installationDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: { 
    type: String, 
    default: 'Active', 
    enum: ['Active', 'Expired', 'Needs Maintenance', 'Decommissioned'] 
  }
}, { 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.serial_number = ret.serialNumber;
      ret.installation_date = ret.installationDate;
      ret.expiry_date = ret.expiryDate;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const maintenanceLogSchema = new mongoose.Schema({
  extinguisherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Extinguisher', required: true },
  actionTaken: { type: String, required: true },
  actionDate: { type: Date, required: true },
  personnel: String,
  conditionsNoted: String
}, { 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.extinguisher_id = ret.extinguisherId.toString();
      ret.action_taken = ret.actionTaken;
      ret.action_date = ret.actionDate;
      ret.conditions_noted = ret.conditionsNoted;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

function initModels(conn) {
  const Extinguisher = conn.model('Extinguisher', extinguisherSchema);
  const MaintenanceLog = conn.model('MaintenanceLog', maintenanceLogSchema);
  return { Extinguisher, MaintenanceLog };
}

module.exports = { initModels };
