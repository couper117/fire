'use strict';
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

function buildUri(base, dbName) {
  const isAtlas = base.startsWith('mongodb+srv://');
  const scheme   = isAtlas ? 'mongodb+srv' : 'mongodb';
  try {
    const url = new URL(base.replace(/^mongodb(\+srv)?:\/\//, 'https://'));
    url.pathname = `/${dbName}`;
    return url.toString().replace(/^https:\/\//, `${scheme}://`);
  } catch {
    return `${base.replace(/\/?$/, '')}/${dbName}`;
  }
}

function tryConnect(uri, serviceName, dbName) {
  return new Promise((resolve, reject) => {
    const conn = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      tls: true,
    });
    conn.on('connected', () => {
      console.log(`[${serviceName}] Connected to MongoDB: ${dbName}`);
      resolve(conn);
    });
    conn.on('error', (err) => {
      conn.destroy().catch(() => {});
      reject(err);
    });
  });
}

async function initStorage(serviceName = 'fems') {
  const dbName = serviceName.includes('fems_') ? serviceName : `fems_${serviceName.replace('-service', '')}`;
  const uri = buildUri(MONGO_URI, dbName);

  const maxRetries = 4;
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await tryConnect(uri, serviceName, dbName);
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        const wait = attempt * 2000; // 2s, 4s, 6s
        console.warn(`[${serviceName}] Connection attempt ${attempt} failed, retrying in ${wait/1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

async function closeStorage() {
  await mongoose.disconnect();
}

module.exports = { initStorage, closeStorage };
