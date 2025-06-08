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
      // Initialize with empty headers object
      let headers = {};
      let statusCode = 0;
      
      try {
        // Safely extract status code
        statusCode = typeof res.statusCode === 'number' ? res.statusCode : 0;
        
        // Handle multiple possible header sources in different environments
        if (typeof res.getHeaders === 'function') {
          // Express response with getHeaders() method
          try {
            headers = { ...res.getHeaders() };
          } catch (headerError) {
            // Silent fail - sometimes getHeaders() throws
            // This happens especially in serverless environments
          }
        } else if (res.headers && typeof res.headers === 'object') {
          // Node.js standard response headers object
          headers = { ...res.headers };
        } else if (res._headers && typeof res._headers === 'object') {
          // Some versions expose headers via _headers
          headers = { ...res._headers };
        }
        
        // Sanitize headers - remove sensitive information
        // Use type-safe operations that won't throw
        const sensitiveHeaders = ['set-cookie', 'cookie', 'authorization'];
        for (const header of sensitiveHeaders) {
          if (headers && typeof headers === 'object' && header in headers) {
            // Use type assertion to satisfy TypeScript
            delete (headers as Record<string, unknown>)[header];
          }
        }
      } catch (error) {
        // If anything goes wrong, log it but don't crash
        console.warn('Error in response serializer:', error instanceof Error ? error.message : String(error));
      }
      
      return {
        statusCode,
        headers,
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
