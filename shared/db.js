'use strict';
/**
 * Shared MongoDB/Mongoose connection helper.
 * 
 * Supports both single default connection (via mongoose.connect)
 * and multiple isolated connections (via mongoose.createConnection).
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

/**
 * Connects to a dedicated database for the given service.
 * @param {string} serviceName - e.g. 'user-service'
 */
async function initStorage(serviceName = 'fems') {
  const dbName = serviceName.includes('fems_') ? serviceName : `fems_${serviceName.replace('-service', '')}`;
  const uri = `${MONGO_URI}/${dbName}`;
  
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
