import express, { type Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { storage } from "./storage.js";
import type { IStorage } from "./storage";
import { checkInitializationStatus } from "./btcpayDirectService.js";

// Prevent unhandled exceptions (especially from HMR WebSocket) from crashing the process
process.on('uncaughtException', (err) => {
  log(`Uncaught exception: ${err.message}`, 'process');
});
process.on('unhandledRejection', (reason) => {
  log(`Unhandled Rejection: ${reason}`, 'process');
});

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize database with sample data
    log("Initializing database and sample data...");
    try {
      // await storage.initializeData(); // Commented out to prevent seeding
      log("Database initialization skipped.");
      // log("Database and sample data initialized (if needed).");
    } catch (initError) {
      log(`Error initializing database: ${initError}`);
    }
    
    // Check BTCPay Service status (keys loaded/generated, verification attempted)
    // Note: Actual pairing requires user interaction via the pairing URL
    log("Checking BTCPay Service status...");
    const isBtcPayReady = await checkInitializationStatus();
    if (isBtcPayReady) {
       log("BTCPay Service is Initialized (API connection verified, Store ID obtained).");
    } else {
       log("BTCPay Service is NOT fully initialized. Pairing may be required or API check failed.");
       log("Please use the pairing endpoint if necessary.");
    }
    
    const server = await registerRoutes(app, storage as IStorage);

    // Add WebSocket error handling to prevent crashes
    server.on('upgrade', (request, socket, head) => {
      socket.on('error', (err) => {
        log(`WebSocket error: ${err.message}`);
        // Don't close the socket, just log the error
      });
    });

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      // It's often better not to re-throw the error here unless you have a top-level handler
      // throw err; 
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else if (!process.env.VERCEL) {
      // Only run serveStatic if NOT on Vercel and in production-like mode
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    log(`Error starting server: ${error}`);
    process.exit(1);
  }
})();
