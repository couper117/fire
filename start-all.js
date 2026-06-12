'use strict';
/**
 * Boots every microservice in-process (one Node process) for an easy local demo.
 * In production each service would run in its own container/host behind the gateway.
 */
process.env.USER_PORT = process.env.USER_PORT || '4001';
process.env.EXT_PORT = process.env.EXT_PORT || '4002';
process.env.INSP_PORT = process.env.INSP_PORT || '4003';
process.env.REPORT_PORT = process.env.REPORT_PORT || '4004';
process.env.GATEWAY_PORT = process.env.GATEWAY_PORT || '4000';
process.env.EXT_URL = process.env.EXT_URL || `http://localhost:${process.env.EXT_PORT}`;
process.env.INSP_URL = process.env.INSP_URL || `http://localhost:${process.env.INSP_PORT}`;

const userApp = require('./services/user-service/server');
const extApp = require('./services/extinguisher-service/server');
const inspApp = require('./services/inspection-service/server');
const reportApp = require('./services/reporting-service/server');
const gatewayApp = require('./services/api-gateway/server');

function boot(name, app, port) {
  app.listen(port, () => console.log(`[${name}] http://localhost:${port}`));
}

async function tryBootstrap(name, app) {
  try {
    await app.bootstrap();
    console.log(`[${name}] DB connected`);
  } catch (e) {
    console.error(`[${name}] DB bootstrap failed (service will start but DB ops will fail): ${e.message}`);
  }
}

async function main() {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('cluster0.mongodb.net') && !process.env.MONGO_URI.match(/cluster0\.[a-z0-9]+\.mongodb\.net/)) {
    console.warn('\n⚠️  MONGO_URI is not set or still uses the placeholder.');
    console.warn('   Set MONGO_URI in your Render environment variables to a real Atlas connection string.\n');
  }

  await tryBootstrap('user-service', userApp);
  await tryBootstrap('extinguisher-service', extApp);
  await tryBootstrap('inspection-service', inspApp);
  await tryBootstrap('reporting-service', reportApp);

  boot('user-service', userApp, process.env.USER_PORT);
  boot('extinguisher-service', extApp, process.env.EXT_PORT);
  boot('inspection-service', inspApp, process.env.INSP_PORT);
  boot('reporting-service', reportApp, process.env.REPORT_PORT);
  boot('api-gateway', gatewayApp, process.env.GATEWAY_PORT);

  console.log('\nFEMS is up.');
  console.log('  Gateway:        http://localhost:' + process.env.GATEWAY_PORT);
  console.log('  Default admin:  admin@tzw.rw / Admin@123\n');
}

main().catch((e) => { console.error('Fatal startup error:', e.message); process.exit(1); });
