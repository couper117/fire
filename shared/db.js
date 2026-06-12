'use strict';
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

// One shared connection to the cluster — avoids multiple TLS handshakes
let sharedConn = null;

function buildBaseUri(base) {
  const isAtlas = base.startsWith('mongodb+srv://');
  const scheme   = isAtlas ? 'mongodb+srv' : 'mongodb';
  try {
    const url = new URL(base.replace(/^mongodb(\+srv)?:\/\//, 'https://'));
    url.pathname = '/';
    return url.toString().replace(/^https:\/\//, `${scheme}://`);
  } catch {
    return base.replace(/\/?$/, '/');
  }
}

async function getSharedConnection() {
  if (sharedConn && sharedConn.readyState === 1) return sharedConn;

  const uri = buildBaseUri(MONGO_URI);
  sharedConn = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  }).asPromise();

  return sharedConn;
}

async function initStorage(serviceName = 'fems') {
  const dbName = serviceName.includes('fems_')
    ? serviceName
    : `fems_${serviceName.replace('-service', '')}`;

  const conn = await getSharedConnection();
  const db   = conn.useDb(dbName, { useCache: true });
  console.log(`[${serviceName}] Connected to MongoDB: ${dbName}`);
  return db;
}

async function closeStorage() {
  if (sharedConn) await sharedConn.close();
}

module.exports = { initStorage, closeStorage };
