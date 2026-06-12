'use strict';
/**
 * Shared MongoDB/Mongoose connection helper.
 * 
 * Supports both single default connection (via mongoose.connect)
 * and multiple isolated connections (via mongoose.createConnection).
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

function buildUri(base, dbName) {
  // Parse properly so dbName is injected before any ?querystring,
  // and any existing path (e.g. trailing /) is replaced.
  const isAtlas = base.startsWith('mongodb+srv://');
  const scheme   = isAtlas ? 'mongodb+srv' : 'mongodb';
  try {
    const url = new URL(base.replace(/^mongodb(\+srv)?:\/\//, 'https://'));
    url.pathname = `/${dbName}`;
    return url.toString().replace(/^https:\/\//, `${scheme}://`);
  } catch {
    // Fallback for bare URIs like mongodb://localhost:27017
    return `${base.replace(/\/?$/, '')}/${dbName}`;
  }
}

async function initStorage(serviceName = 'fems') {
  const dbName = serviceName.includes('fems_') ? serviceName : `fems_${serviceName.replace('-service', '')}`;
  const uri = buildUri(MONGO_URI, dbName);
  
  // Use a named connection to allow multiple databases in the same process (test mode)
  // If we're just running one service, mongoose.connect() is fine, 
  // but for start-all.js or smoke-test.js we need createConnection().
  
  const conn = mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  
  return new Promise((resolve, reject) => {
    conn.on('connected', () => {
      console.log(`[${serviceName}] Connected to MongoDB: ${dbName}`);
      resolve(conn);
    });
    conn.on('error', (err) => {
      console.error(`[${serviceName}] MongoDB connection error:`, err);
      reject(err);
    });
  });
}

async function closeStorage() {
  await mongoose.disconnect();
}

module.exports = { initStorage, closeStorage };
