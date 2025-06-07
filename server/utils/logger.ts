// logger.ts - Wrapper to handle ESM compatibility issues with pino
import type { IncomingMessage, ServerResponse } from 'http';
import { createRequire } from 'node:module';

// Create a require function scoped to the current module
const require = createRequire(import.meta.url);

// Load pino and pino-http using CJS require semantics
// This should leverage pino's CJS loader and pino-http's CJS nature.
const pino = require('pino');
const pinoHttp = require('pino-http');

// Configure the pino logger
const logger = pino({ // pino should now be the callable function
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

// Configure the HTTP logger middleware
const httpLogger = pinoHttp({ // pinoHttp should now be the callable function
  logger,
  serializers: {
    req(req: any) {
      const headers = { ...req.headers };
      delete headers.authorization;
      delete headers.cookie;
      delete headers['x-csrf-token'];
      delete headers['x-forwarded-for'];
      delete headers['x-real-ip'];
      return {
        method: req.method,
        url: req.url,
        headers: headers,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res: any) {
      const headers = { ...res.getHeaders() };
      delete headers['set-cookie'];
      return {
        statusCode: res.statusCode,
        headers: headers,
      };
    },
    err(err: any) {
      return {
        type: err.type,
        message: err.message,
        stack: err.stack,
      };
    }
  },
  customSuccessMessage: function (req: any, res: any) {
    if (res.statusCode === 404) {
      return `${req.method} ${req.url} - ${res.statusCode} not found`;
    }
    return `${req.method} ${req.url} - ${res.statusCode} completed in ${(res as any).responseTime}ms`;
  },
  customErrorMessage: function (req: any, res: any, err: any) {
    return `${req.method} ${req.url} - ${res.statusCode} error in ${(res as any).responseTime}ms: ${err.message}`;
  },
  customProps: function (req: any, res: any) {
    return {};
  }
});

// Simple log function to match what vite.js exports
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export { logger, httpLogger };
