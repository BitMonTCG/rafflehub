// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mung from "express-mung"; // Added import for express-mung
import { registerRoutes } from "./routes.js";
import { storage } from "./storage.js";
import type { IStorage } from "./storage.js";

// Prevent unhandled exceptions (especially from HMR WebSocket) from crashing the process
process.on('uncaughtException', (err) => {
  console.error(`Uncaught exception: ${err.message}`, 'process');
});
process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled Rejection: ${reason}`, 'process');
});

const app = express();

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware for API routes
// Request logging middleware for API routes
// Uses express-mung to safely capture the JSON response body
app.use(
  mung.json(function (body, req, res) {
    // Note: 'finish' event is used here as mung.json executes before the response is fully sent.
    // For logging purposes, we want to log after the response is completed.
    const start = Date.now();
    const path = req.path;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (body) {
          // body is the captured JSON response
          logLine += ` :: ${JSON.stringify(body)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        console.log(logLine);
      }
    });
    return body; // Important: return the body to pass it through
  })
);

// Initialize app asynchronously
let isAppInitialized = false;

async function initializeApp() {
  if (isAppInitialized) {
    return app;
  }

  try {
    // Initialize database with sample data (commented out to prevent seeding)
    console.log("Database initialization skipped.");
    
    // BTCPay configuration is loaded via btcpayConfig module
    console.log("BTCPay Service configuration loaded.")
    
    // Register routes without creating HTTP server
    await registerRoutes(app, storage as IStorage);
    
    // Global error handler
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`Global Error Handler: [${status}] ${message}`, err.stack ? { stack: err.stack } : { error: err });

      res.status(status).json({ message });
    });

    isAppInitialized = true;
    console.log("Express app initialized successfully for serverless deployment");
    
  } catch (error) {
    console.error(`Error initializing app: ${error}`);
    throw error;
  }

  return app;
}

// Export the initialization function for Vercel handler
export { initializeApp }; 