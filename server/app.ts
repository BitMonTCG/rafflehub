// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from 'cookie-parser';
// Import pino and pino-http with the correct ESM syntax
import pino from 'pino';
import pinoHttpDefault from 'pino-http';
// Use a type assertion to help TypeScript understand these imports
const pinoHttp: typeof pinoHttpDefault = pinoHttpDefault;
import { registerRoutes } from "./routes.js";
import { storage } from "./storage.js";
import type { IStorage } from "./storage.js";
import { validateEnv } from "./utils/validateEnv.js";
import { performanceMiddleware } from "./utils/performanceMiddleware.js";

// Prevent unhandled exceptions (especially from HMR WebSocket) from crashing the process
process.on('uncaughtException', (err) => {
  console.error(`Uncaught exception: ${err.message}`, 'process');
});
process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled Rejection: ${reason}`, 'process');
});

const app = express();

// Initialize pino-http logger
const pinoLogger = pinoHttp({
  logger: pino({
    level: process.env.LOG_LEVEL || 'info', // Default to 'info', can be configured via env
  }),
  // Use pino-pretty for local development for human-readable logs
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname', // Vercel adds these, so we can ignore them locally
      },
    },
  }),
  // Define custom serializers to control what is logged
  serializers: {
    req(req: any) {
      // Remove potentially sensitive headers from logs
      const headers = { ...req.headers };
      delete headers.authorization;
      delete headers.cookie;
      delete headers['x-csrf-token']; // if you use this header for CSRF
      delete headers['x-forwarded-for'];
      delete headers['x-real-ip'];

      return {
        method: req.method,
        url: req.url, // Includes query string
        // query: req.query, // Redundant if url includes query string
        // params: req.params, // Typically logged by router or controller if needed
        headers: headers, // Log filtered headers
        remoteAddress: req.remoteAddress,
      };
    },
    res(res: any) {
      // Remove potentially sensitive headers from logs
      const headers = { ...res.getHeaders() };
      delete headers['set-cookie'];
      return {
        statusCode: res.statusCode,
        headers: headers, // Log filtered headers
      };
    },
    err(err: any) {
      return {
        type: err.type,
        message: err.message,
        stack: err.stack,
        // any other err properties you want to log
      };
    }
  },
  // Customize log message format
  customSuccessMessage: function (req: any, res: any) {
    if (res.statusCode === 404) {
      return `${req.method} ${req.url} - ${res.statusCode} not found`;
    }
    return `${req.method} ${req.url} - ${res.statusCode} completed in ${(res as any).responseTime}ms`;
  },
  customErrorMessage: function (req: any, res: any, err: any) {
    return `${req.method} ${req.url} - ${res.statusCode} error in ${(res as any).responseTime}ms: ${err.message}`;
  },
  // Add a custom attribute to all logs
  customProps: function (req: any, res: any) {
    return {
      // Add any custom properties you want to log with every request
      // example: reqId: req.id (if you're using request IDs)
    };
  }
});

// Global middleware
app.use(pinoLogger); // Add pino-http logger as one of the first middleware
app.use(performanceMiddleware()); // Track API request performance
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || 'unknown'
  });
});

// Initialize app asynchronously
let isAppInitialized = false;

async function initializeApp() {
  if (isAppInitialized) {
    console.log("✅ App already initialized, returning existing instance");
    return app;
  }

  console.log("🚀 Starting Express app initialization...");
  
  // Validate environment variables
  try {
    const env = validateEnv();
    console.log("✅ Environment variables validated successfully");
  } catch (error) {
    console.error("❌ Environment validation failed:", error);
    if (process.env.NODE_ENV === 'production') {
      console.error("Exiting process due to invalid environment configuration in production.");
      process.exit(1);
    } else {
      console.warn("⚠️ Continuing with invalid environment in development mode - some features may not work.");
    }
  }

  try {
    // Initialize database with sample data (commented out to prevent seeding)
    console.log("📊 Database initialization skipped.");
    
    // BTCPay configuration is loaded via btcpayConfig module
    console.log("💰 BTCPay Service configuration loaded.")
    
    // Register routes without creating HTTP server
    console.log("🛣️  Registering routes...");
    await registerRoutes(app, storage as IStorage);
    console.log("✅ Routes registered successfully");
    
    // Global error handler
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

            // Use _req.log for structured logging if pino-http has attached it
      if (_req.log) {
        (_req as any).log.error({ err, status, req_id: (_req as any).id }, `Global Error Handler: ${message}`);
      } else {
        // Fallback to console.error if req.log is not available
        console.error(`❌ Global Error Handler: [${status}] ${message}`, err.stack ? { stack: err.stack } : { error: err });
      }

      res.status(status).json({ message });
    });

    isAppInitialized = true;
    console.log("✅ Express app initialized successfully for serverless deployment");
    
  } catch (error) {
    console.error(`❌ Error initializing app:`, error);
    console.error(`❌ Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }

  return app;
}

// Export the initialization function for Vercel handler
export { initializeApp }; 