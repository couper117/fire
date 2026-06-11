'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Inspector', 'User'], 
    default: 'User' 
  },
  isActive: { type: Boolean, default: true },
  resetToken: String,
  resetExpires: Date
}, { 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      delete ret.resetToken;
      delete ret.resetExpires;
      return ret;
    }
  }
});

/** Define models on a specific connection */
function initModels(conn) {
  const User = conn.model('User', userSchema);

  /** Seed default admin if none exists */
  const seedAdmin = async () => {
    const count = await User.countDocuments({ role: 'Admin' });
    if (count === 0) {
      const admin = new User({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@tzw.rw',
        passwordHash: bcrypt.hashSync('Admin@123', 10),
        role: 'Admin'
      });
      await admin.save();
      console.log('[user-service] Seeded default admin -> admin@tzw.rw / Admin@123');
    }
  };

  return { User, seedAdmin };
}

module.exports = { initModels };
