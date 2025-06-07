// logger.ts - Wrapper to handle ESM compatibility issues with pino
import type { IncomingMessage, ServerResponse } from 'http';
import pinoLib from 'pino';
import pinoHttpLib from 'pino-http';

// Type-check and ensure correct function signatures
const pino: typeof pinoLib = pinoLib;
const pinoHttp: typeof pinoHttpLib = pinoHttpLib;

// Configure the pino logger
const logger = pino({
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
const httpLogger = pinoHttp({
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
