'use strict';
const winston = require('winston');
const path = require('path');

/**
 * Create a logger instance for a microservice.
 * @param {string} serviceName - Name of the service (e.g., 'user-service')
 * @returns {winston.Logger} Configured logger instance
 */
function createLogger(serviceName = 'fems') {
  const logDir = path.join(process.cwd(), 'logs');
  const logLevel = process.env.LOG_LEVEL || 'info';

  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.metadata(),
      winston.format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      // File transport for all logs
      new winston.transports.File({
        filename: path.join(logDir, `${serviceName}.log`),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // File transport for errors only
      new winston.transports.File({
        filename: path.join(logDir, `${serviceName}-error.log`),
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5,
      }),
      // Combined logs
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 10485760, // 10MB
        maxFiles: 10,
      }),
    ],
  });
}

// Add console transport in non-production
function addConsoleTransport(logger) {
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }));
  }
  return logger;
}

/**
 * Logging middleware for Express
 * @param {winston.Logger} logger - Logger instance
 * @returns {Function} Express middleware
 */
function loggingMiddleware(logger) {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? 'warn' : 'info';

      logger.log({
        level,
        message: `${req.method} ${req.path}`,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.sub,
        ip: req.ip,
      });
    });

    next();
  };
}

module.exports = {
  createLogger,
  addConsoleTransport,
  loggingMiddleware,
};
