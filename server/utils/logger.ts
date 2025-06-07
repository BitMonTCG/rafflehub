// logger.ts - Wrapper to handle ESM compatibility issues with pino
import type { IncomingMessage, ServerResponse } from 'http';
import * as pinoModule from 'pino';
import * as pinoHttpModule from 'pino-http';

// Explicitly access the default export from the module namespace
const pinoFunction = pinoModule.default;
const pinoHttpFunction = pinoHttpModule.default;

// Configure the pino logger
const logger = pinoFunction({
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
const httpLogger = pinoHttpFunction({
  logger,
  serializers: {
    req(req: any) {
      // Remove potentially sensitive headers from logs
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
      // Remove potentially sensitive headers from logs
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

export { logger, httpLogger };
