import type { Express, Request, Response } from "express";
import { storage, IStorage } from "./storage.js";
import { users, insertUserSchema, raffles, insertRaffleSchema, tickets, insertTicketSchema, winners, insertWinnerSchema, User, Winner, Raffle, Ticket, InsertUser } from "./db.js";
import { z, ZodError } from "zod";
import express, { NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from 'connect-pg-simple';
import MemoryStore from 'memorystore';
import bcrypt from 'bcrypt'; // Add bcrypt import
import { eq, sql } from 'drizzle-orm';
import { fromZodError } from 'zod-validation-error';
import * as btcpayService from './btcpayService.js';
import { InvoiceStatus } from 'btcpay-greenfield-node-client';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import helmet from 'helmet';
import csurf from 'csurf'; // Import csurf
import { Pool } from 'pg'; // Import Pool from pg

// Define a simple interface for the expected webhook payload structure
interface BtcPayWebhookPayload {
  type: string; // e.g., "InvoiceSettled", "InvoiceExpired"
  invoiceId: string;
  // Include other fields if needed, e.g., metadata
  metadata?: { [key: string]: any };
}

// Setup session store
// Use PostgreSQL for session storage on Vercel (production & preview), MemoryStore for local development.
const vercelEnv = process.env.VERCEL_ENV; // 'production', 'preview', or 'development'
const isProduction = vercelEnv === 'production' || process.env.NODE_ENV === 'production';

// Determine session store type based on environment
// Force PostgreSQL in production, even if VERCEL_ENV isn't set (safety measure)
const usePgSession = isProduction || vercelEnv === 'preview';

// Critical safety check for production
if (isProduction && !usePgSession) {
  console.error("🚨 CRITICAL ERROR: Cannot use MemoryStore in production. Exiting.");
  process.exit(1); // Exit immediately to prevent unstable behavior
}

console.log(`Session store: ${usePgSession ? 'PostgreSQL (connect-pg-simple)' : 'MemoryStore (memorystore)'} (ENV=${isProduction ? 'production' : 'development'}, VERCEL_ENV=${vercelEnv || 'not set'})`);

const PgSessionStore = connectPgSimple(session);
const InMemoryStore = MemoryStore(session);

let sessionStoreInstance;

if (usePgSession) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required for PostgreSQL session store');
    }
    
    // Configure PostgreSQL connection pool with reasonable defaults for serverless
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false, // SSL required in production
      max: 5, // Smaller pool size for serverless
      idleTimeoutMillis: 10000, // Close idle clients faster (10 seconds)
      connectionTimeoutMillis: 5000, // Timeout after 5 seconds if can't connect
    });
    
    // Test the connection without blocking initialization
    pool.query('SELECT NOW() as connection_test').then((result) => {
      console.log(`✅ PostgreSQL session store connection successful: ${result?.rows?.[0]?.connection_test || 'OK'}`);
    }).catch((error) => {
      console.error('❌ PostgreSQL session store connection test failed:', error);
    });
    
    // Initialize PG Session Store
    sessionStoreInstance = new PgSessionStore({
      pool, // Pass the pre-configured pool
      tableName: 'user_sessions', // Standard table name
      createTableIfMissing: true, // Create table if it doesn't exist
      // Optimize for serverless: clean expired sessions more frequently
      pruneSessionInterval: 60, // prune expired sessions every minute
    });
    
    console.log('🔐 Using PostgreSQL session store for persistence');
  } catch (error) {
    console.error('❌ PostgreSQL session store initialization failed:', error);
    
    if (isProduction) {
      // In production, PG session store failure is critical
      console.error('🚨 Cannot continue in production without persistent session store. Exiting.');
      process.exit(1);
    } else {
      // In dev, fall back to memory store with warning
      console.warn('⚠️  Falling back to MemoryStore for development - sessions will not persist');
      sessionStoreInstance = new InMemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
    }
  }
} else {
  // Development environment - use in-memory store
  sessionStoreInstance = new InMemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
  console.log('💾 Using in-memory session store (development only)');
}

const sessionStore = sessionStoreInstance;

// WebSocket functionality disabled for Vercel serverless compatibility

// Initialize csurf protection
// IMPORTANT: csurf middleware must come AFTER session middleware and cookie-parser

// Ensure we have a CSRF secret in production
if (process.env.NODE_ENV === 'production' && !process.env.CSRF_SECRET) {
  console.error('🚨 CRITICAL: Missing CSRF_SECRET environment variable in production!');
  // Don't exit process, but log warning - this should be fixed ASAP
  console.warn('Security vulnerability: Using fallback secret instead of secure CSRF_SECRET');
}

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict',
    // The CSRF_SECRET is used by the server to sign the cookie, not as the cookie value itself
  }
});

// Log CSRF protection status
console.log(`CSRF Protection enabled with ${process.env.CSRF_SECRET ? 'custom secret' : 'default secret'}`);

function broadcast(message: any) {
  // WebSocket functionality disabled for Vercel serverless compatibility
  // Consider implementing Server-Sent Events (SSE) or using a third-party service
  console.log("Broadcast attempted (WebSocket disabled):", JSON.stringify(message));
}

// --- Route Registration ---
export async function registerRoutes(app: Express, storageInstance: IStorage): Promise<void> {
  // Note: WebSocket functionality removed for Vercel serverless compatibility
  // Consider using Server-Sent Events (SSE) or third-party services like Pusher for real-time features
  
  console.log('Registering routes for serverless deployment (WebSocket disabled)');

  // --- Health Check Route ---
  // This route should be accessible without authentication or CSRF for monitoring purposes.
  app.get('/api/health', (req: Request, res: Response) => {
    try {
      // Optional: Add more checks here (e.g., database connectivity)
      // For now, a simple 200 OK is sufficient.
      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        // You can add more info like current git commit, version, etc.
        // VERCEL_GIT_COMMIT_SHA is available in Vercel build environment
        commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      });
    } catch (error) {
      // req.log might not be available if pino-http is added after this route
      // or if this route is hit before pino-http initializes fully.
      const log = (req as any).log || console;
      log.error({ err: error }, 'Health check endpoint failed');
      res.status(503).json({
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Session middleware
  const usePgSession = false; // As per existing logic, but ensure SESSION_SECRET is strong
  const Store = usePgSession
    ? connectPgSimple(session)
    : MemoryStore(session);

  const sessionStoreInstance = usePgSession
    ? new (Store as any)({
        connectionString: process.env.DATABASE_URL,
        tableName: 'user_sessions',
        createTableIfMissing: true,
        ssl: true,
        pool: { max: 10, idleTimeoutMillis: 30000 }
      })
    : new (Store as any)({ checkPeriod: 86400000 });

  app.use(
    session({
      store: sessionStoreInstance,
      secret: process.env.SESSION_SECRET || "default_fallback_secret_CHANGE_ME", // IMPORTANT: Use a strong secret from env
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      },
    })
  );

  // --- CSRF Token Route ---
  // IMPORTANT: This route MUST be defined BEFORE global CSRF protection is applied
  // However, we need to apply the csrfProtection middleware to this specific route
  app.get('/api/csrf-token', csrfProtection, (req: Request, res: Response) => {
    // Ensure session is established before generating CSRF token
    if (!req.session) {
      console.error('Session not available for CSRF token generation. Ensure session middleware is correctly configured and runs before this route.');
      return res.status(500).json({ message: 'Session not available for CSRF token.' });
    }
    try {
      const token = req.csrfToken();
      console.log('✅ CSRF token generated successfully');
      res.json({ csrfToken: token });
    } catch (error) {
      console.error('❌ Error generating CSRF token:', error);
      res.status(500).json({ message: 'Failed to generate CSRF token' });
    }
  });

  // Apply csurf middleware selectively to routes that need protection
  // Rather than globally applying it, we'll apply it to specific routes that need it
  // This gives us more control and avoids issues with certain routes

  // --- Middleware ---
  // Security headers and CORS configuration
  // Use production-ready security settings
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for frontend compatibility
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));
  
  // CORS setup for both development and production
  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const allowedOrigins = [
      'https://www.bitmontcg.io',
      'https://bitmontcg.io',
      'https://rafflehub.vercel.app',
      'http://localhost:3000', // Allow local development
      'http://localhost:5173', // Allow Vite dev server
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    // If requestOrigin is not in allowedOrigins, Access-Control-Allow-Origin is not set.
    // This will typically cause the browser to block the cross-origin request.

    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH'); // Added standard methods

    if (req.method === 'OPTIONS') {
      // For OPTIONS pre-flight requests, setting the headers and returning 200 is sufficient.
      return res.status(200).end();
    }

    next();
  });
  
  // --- Middleware Order is Important --- 

  // 1. Special route middleware (like raw body parser for webhooks)
  // BTCPay Webhook - uses raw body, so define before express.json() and CSRF
  app.post('/api/btcpay/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const signature = req.headers['btcpay-sig'] as string | undefined;
    const requestBody = req.body;

    if (!Buffer.isBuffer(requestBody)) {
        // Using console.error as 'log' might be undefined or incorrect
        console.error('Webhook Error: Request body is not a Buffer. Check middleware order.');
        return res.status(400).send('Invalid request body type.');
    }
    if (!signature) { 
      console.error('Webhook Error: Missing btcpay-sig header');
      return res.status(400).send('Missing BTCPay Signature header');
    } 
    if (!btcpayService.verifyWebhookSignature(requestBody, signature)) { 
      console.error('Webhook Error: Invalid signature');
      return res.status(400).send('Invalid BTCPay Signature');
    }
    try {
      const event: BtcPayWebhookPayload = JSON.parse(requestBody.toString());
      console.log(`Received verified BTCPay webhook event: Type=${event.type}, InvoiceId=${event.invoiceId}`);
      const invoiceId = event.invoiceId;
      if (!invoiceId) {
          console.error('Webhook Error: Invoice ID missing in payload.');
          return res.status(400).send('Missing invoiceId');
      }
      const ticket = await storageInstance.getTicketByInvoiceId(invoiceId);
      if (!ticket) {
        console.warn(`Webhook Warning: Received event for unknown invoice ID ${invoiceId}. Ignoring.`);
        return res.status(200).send('Webhook received for unknown invoice.');
      }
      console.log(`Processing webhook for ticket ${ticket.id} (Invoice ${invoiceId}, Current Status: ${ticket.status})`);
      let updatePerformed = false;
      switch (event.type) {
          case 'InvoiceSettled':
            if (ticket.status === 'pending') {
              console.log(`Updating ticket ${ticket.id} to paid (Invoice Settled)`);
              await storageInstance.updateTicketStatus(ticket.id, 'paid');
              updatePerformed = true;
              broadcast({ type: 'TICKET_PAID', ticketId: ticket.id, raffleId: ticket.raffleId });
               const updatedRaffle = await storageInstance.getRaffle(ticket.raffleId);
               if (updatedRaffle) {
                 broadcast({ type: 'RAFFLE_UPDATED', raffle: updatedRaffle });
               }
            } else {
              console.log(`Webhook Info: Invoice ${invoiceId} settled, but ticket ${ticket.id} was already ${ticket.status}. Ignoring.`);
            }
            break;
          case 'InvoiceExpired':
          case 'InvoiceInvalid':
             if (ticket.status === 'pending') {
                 console.log(`Updating ticket ${ticket.id} to expired (Invoice ${event.type})`);
                 await storageInstance.updateTicketStatus(ticket.id, 'expired');
                 updatePerformed = true;
                 broadcast({ type: 'TICKET_EXPIRED', ticketId: ticket.id, raffleId: ticket.raffleId });
             } else {
                 console.log(`Webhook Info: Invoice ${invoiceId} ${event.type}, but ticket ${ticket.id} was already ${ticket.status}. Ignoring.`);
             }
             break;
          case 'InvoiceProcessing':
             console.log(`Webhook Info: Invoice ${invoiceId} is processing for ticket ${ticket.id}. Status remains '${ticket.status}'.`);
             break;
          default:
            console.log(`Webhook Info: Received unhandled event type: ${event.type} for invoice ${invoiceId}`);
            break;
        }
      res.status(200).send('Webhook processed successfully');
    } catch (error) {
      console.error(`Webhook Error: Failed to parse or process webhook payload: ${error}`);
      res.status(500).send('Error processing webhook');
    }
  });

  // 2. Global middlewares (body parsers, session, passport, CSRF)
  app.use(express.json());
  app.use(express.urlencoded({ extended: false })); // Add urlencoded parser for form submissions if any

  // Session setup (ensure sessionSecret is defined)
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in environment variables.');
}
const sessionSecret = process.env.SESSION_SECRET;
  
  // Cookie configuration for production-ready security
  const cookieConfig = {
    secure: false, // Set to false to work in both HTTP (dev) and HTTPS (prod) - Vercel handles HTTPS termination
    httpOnly: true,
    sameSite: 'lax' as const, // Use 'lax' for better compatibility
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  };
  
  // Add session store debug logging
  console.log('Session store type:', usePgSession ? 'PostgreSQL' : 'Memory');
  console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
  
  app.use(session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false, // Changed from true to false for better session handling
    saveUninitialized: false,
    cookie: cookieConfig,
    name: 'bitmon_sid',
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // CSRF Protection - use session-based tokens since sessions are working
  const csrfProtectionOptions = { 
    // Use session store for CSRF tokens (default behavior)
    // Remove cookie configuration to use session-based tokens
  };
  const csrf = csurf(csrfProtectionOptions);

  app.use((req, res, next) => {
    if (req.path === '/api/btcpay/webhook') { 
      // Skip CSRF for webhook route only
      return next();
    }
    // Apply CSRF to routes that need protection
    // Use the proper csrfProtection middleware instance
    csrfProtection(req, res, next);
  });
  
  // Health check endpoint is already defined at the top of the route registration
  // to ensure it's available before the CSRF middleware

  // CSRF token route is already defined above
  
  // CSRF Error Handler (must be after CSRF middleware and before other error handlers)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === 'EBADCSRFTOKEN') {
      console.warn(`CSRF token validation failed for ${req.method} ${req.path}:`, err.message);
      res.status(403).json({ message: 'Invalid or missing CSRF token. Please refresh and try again.' });
    } else {
      next(err);
    }
  });

  // 3. Passport Strategy Configurations (moved here for clarity, needs storageInstance)
  // Strategy for regular database users
  passport.use('user-local', new LocalStrategy(async (username, password, done) => {
      // ... (existing user-local strategy logic) ...
    try {
      const user = await storageInstance.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  }));

  // Strategy for admin user from .env
  passport.use('admin-strategy', new LocalStrategy(
    { usernameField: 'username', passwordField: 'password' },
    (username, password, done) => {
      // ... (existing admin-strategy logic) ...
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminUsername || !adminPassword) {
        console.error('Admin credentials are not set in environment variables.');
        return done(null, false, { message: 'Admin configuration error.' });
      }
      if (username === adminUsername && password === adminPassword) {
        const adminUser = { id: 'admin_user_id', username: adminUsername, role: 'admin' };
        return done(null, adminUser);
      } else {
        return done(null, false, { message: 'Incorrect admin username or password.' });
      }
    }
  ));

  // Passport Serialization/Deserialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id: string | number, done) => {
    // ... (existing deserializeUser logic) ...
    try {
      if (id === 'admin_user_id') {
      const adminUsername = process.env.ADMIN_USERNAME;
      if (!adminUsername) {
        console.error('ADMIN_USERNAME not set, cannot deserialize .env admin');
        return done(new Error('Admin configuration error'), null);
      }
      const envAdminUser = { id: 'admin_user_id', username: adminUsername, role: 'admin' };
      return done(null, envAdminUser);
    }
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) { 
        console.warn(`deserializeUser received non-numeric, non-admin ID: ${id}`);
        return done(null, null); 
    }
    const user = await storageInstance.getUserById(numericId);
      if (user) {
        const safeUser = {
          ...user,
          isAdmin: user.isAdmin === true || (user.isAdmin as any) === 1
        } as User;
        console.log(`User deserialized from session: ID=${safeUser.id}, Username=${safeUser.username}, Admin=${safeUser.isAdmin}`);
        done(null, safeUser);
      } else {
        done(null, null);
      }
    } catch (err) {
      console.error('Error deserializing user:', err);
      done(err, null);
    }
  });

  // 4. Rate Limiters, Route-specific middleware, and API Routes
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window per IP
    message: { message: 'Too many login attempts, please try again later' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Authentication routes (POST will be CSRF protected by middleware above)
  app.post('/api/login', loginLimiter, (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('user-local', (err: any, user: User | false, info: { message: string }) => {
      if (err) { return next(err); }
      
      // Authentication failed
      if (!user) {
        console.log('Login failed:', info?.message || 'Unknown reason');
        return res.status(401).json({ message: info?.message || 'Authentication failed' });
      }
      
      // Log in the user
      req.login(user, (loginErr) => {
        if (loginErr) { 
          console.error('Login error:', loginErr);
          return next(loginErr); 
        }
        
        // Convert isAdmin to proper boolean
        const safeUser = {
          ...user,
          isAdmin: user.isAdmin === true || (user.isAdmin as any) === 1
        } as User;
        
        console.log('Login successful for:', safeUser.username, 'Admin:', safeUser.isAdmin);
        return res.status(200).json(safeUser);
      });
    })(req, res, next);
  });

  app.post('/api/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // --- Explicitly extract data from body ---
      const { username, password, email, isAdmin, confirmPassword } = req.body;

      // --- Input Validation (still use schema for this) ---
      // Validate the entire body structure
      insertUserSchema.parse(req.body);

      // --- Additional Manual Validations ---
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // --- Check if user already exists ---
      const existingUser = await storageInstance.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const existingEmail = await storageInstance.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      // --- Hash Password & Create User ---
      const saltRounds = 10; // Standard salt rounds
      const hashedPassword = await bcrypt.hash(password, saltRounds); // <<< Use explicitly extracted password
    
      const newUser = await storageInstance.createUser({ 
         username: username,
         email: email,
         password: hashedPassword, // <<< Use hashed password
         isAdmin: isAdmin ?? false, 
      });
      
      req.login(newUser, (err) => {
        if (err) { return next(err); }
        const { password, ...userResponse } = newUser;
        return res.status(201).json(userResponse);
      });
    } catch (error) {
       if (error instanceof ZodError) {
         return res.status(400).json({ message: fromZodError(error).message });
      }
      // Generic error handling
      // Log the specific error message for better debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Registration failed for ${req.body.username || 'unknown user'}: ${errorMessage}`); 
      // Also log the full error object if possible, for stack trace etc.
      console.error("Registration Error Object:", error); 
      
      res.status(500).json({ message: "Registration failed" }); // Keep generic message to client
    }
  });

  // Admin login route
  app.post('/api/auth/admin/login', loginLimiter, (req, res, next) => {
    passport.authenticate('admin-strategy', (err: any, adminUser: any | false, info: { message: string }) => {
      if (err) {
        console.log(`Admin login error: ${err}`);
        return next(err);
      }
      if (!adminUser) {
        console.log(`Admin login failed: ${info.message}`);
        return res.status(401).json({ message: info.message || 'Admin login failed' });
      }
      req.logIn(adminUser, (loginErr) => {
        if (loginErr) {
          console.log(`Admin session error after login: ${loginErr}`);
          return next(loginErr);
        }
        console.log(`Admin user ${adminUser.username} logged in successfully`);
        return res.json({ message: 'Admin login successful', user: { username: adminUser.username, role: adminUser.role, id: adminUser.id } });
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) { return next(err); }
      req.session.destroy((destroyErr) => {
         if (destroyErr) {
           console.log(`Error destroying session: ${destroyErr}`);
         }
         const sessionCookieName = 'connect.sid'; 
         res.clearCookie(sessionCookieName); 
         res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  app.get('/api/user/me', (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
       const { password, ...userResponse } = req.user as User;
      res.status(200).json(userResponse);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Auth Middleware
  const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Authentication required' });
  };
  
  const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
    // Log detailed information for debugging
    console.log('Admin check - Auth status:', req.isAuthenticated());
    if (req.user) {
      console.log('Admin check - User:', { 
        id: (req.user as any).id,
        username: (req.user as any).username,
        isAdmin: (req.user as any).isAdmin,
        isAdminType: typeof (req.user as any).isAdmin
      });
    }
    
    // Properly check admin privileges with explicit type handling
    if (req.isAuthenticated() && req.user) {
      const userFromDb = req.user as User; // For users coming from DB via deserializeUser
      const envAdminUser = req.user as { username?: string, role?: string }; // For .env admin user

      const isDatabaseAdmin = userFromDb.isAdmin === true || (userFromDb.isAdmin as any) === 1;
      const isEnvAdmin = envAdminUser.role === 'admin';

      if (isDatabaseAdmin || isEnvAdmin) {
        // Log which type of admin is accessing
        // if (isEnvAdmin) {
        //   console.log(`Admin access granted for .env admin: ${envAdminUser.username || 'N/A'}`);
        // } else {
        //   console.log(`Admin access granted for database admin: ${userFromDb.username}`);
        // }
        return next();
      } else {
        // Log details if check fails but user object exists
        console.log('Admin check failed. User details:', {
          id: (req.user as any).id,
          username: (req.user as any).username,
          isAdmin: (req.user as any).isAdmin,
          role: (req.user as any).role,
        });
      }
    } else {
      console.log('Admin check failed: Not authenticated or no user object.');
    }
    
    // If we get here, user is not admin
    res.status(403).json({ message: 'Admin privileges required' });
  };

  // User routes
  app.get('/api/users', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const allUsers = await storageInstance.getUsers();
      // Add explicit type for map callback parameter
      const usersResponse = allUsers.map(({ password, ...user }: User) => user);
      res.status(200).json(usersResponse);
    } catch (error) {
      console.log(`Error fetching users: ${error}`);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Raffle routes
  app.get('/api/raffles', async (req: Request, res: Response) => {
    try {
       const activeOnly = req.query.active === 'true'; 
      const rafflesList = await storageInstance.getRaffles(activeOnly); 
      res.status(200).json(rafflesList);
    } catch (error) {
       console.log(`Error fetching raffles: ${error}`);
      res.status(500).json({ message: "Error fetching raffles" });
    }
  });
  
  app.get('/api/raffles/featured', async (req: Request, res: Response) => {
    try {
      const featured = await storageInstance.getFeaturedRaffle();
      res.status(200).json(featured || null); // Return raffle or null
    } catch (error) {
       console.log(`Error fetching featured raffle: ${error}`);
      res.status(500).json({ message: "Error fetching featured raffle" });
    }
  });

  app.get('/api/raffles/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      const raffle = await storageInstance.getRaffle(id);
      if (raffle) {
        res.status(200).json(raffle);
      } else {
        res.status(404).json({ message: "Raffle not found" });
      }
    } catch (error) {
       console.log(`Error fetching raffle ${req.params.id}: ${error}`);
      res.status(500).json({ message: "Error fetching raffle" });
    }
  });

  app.post('/api/raffles', ensureAdmin, async (req: Request, res: Response) => {
    try {
      // Parse request body against the schema
      const raffleData = insertRaffleSchema.parse(req.body);
      // Pass the parsed and validated data to storage
      const newRaffle = await storageInstance.createRaffle(raffleData);
      broadcast({ type: 'RAFFLE_CREATED', raffle: newRaffle });
      res.status(201).json(newRaffle);
    } catch (error) {
       if (error instanceof ZodError) {
         return res.status(400).json({ message: fromZodError(error).message });
      }
      console.log(`Error creating raffle: ${error}`);
      res.status(500).json({ message: "Error creating raffle" });
    }
  });
  
  app.patch('/api/raffles/:id', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const raffle = await storageInstance.getRaffle(id);
      if (!raffle) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      
      const { soldTickets, createdAt, winnerId, ...updateData } = req.body;
      const parsedUpdateData = insertRaffleSchema.partial().parse(updateData); 
      
      const updatedRaffle = await storageInstance.updateRaffle(id, parsedUpdateData);
      if (!updatedRaffle) {
         return res.status(404).json({ message: "Raffle not found after update attempt" });
      }
      
      broadcast({ type: 'RAFFLE_UPDATED', raffle: updatedRaffle }); 
      res.status(200).json(updatedRaffle);
    } catch (error) {
       if (error instanceof ZodError) {
         return res.status(400).json({ message: fromZodError(error).message });
      }
      console.log(`Error updating raffle ${req.params.id}: ${error}`);
      res.status(500).json({ message: "Error updating raffle" });
    }
  });
  
  app.post('/api/raffles/:id/end', ensureAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const raffle = await storageInstance.getRaffle(id);
      if (!raffle) {
        return res.status(404).json({ message: "Raffle not found" });
      }
      
      if (!raffle.isActive) {
        return res.status(400).json({ message: "Raffle already ended" });
      }
      
      const winner = await storageInstance.endRaffle(id);
      const updatedRaffle = await storageInstance.getRaffle(id); 
      if (!updatedRaffle) {
         return res.status(404).json({ message: "Raffle not found after ending" });
      }

      if (!winner) {
        broadcast({ type: 'RAFFLE_UPDATED', raffle: updatedRaffle });
        return res.status(200).json({ message: "Raffle ended, but no winner selected (no tickets sold?).", raffle: updatedRaffle });
      }
      
      // Send winner notification email
      try {
        const notificationSent = await storageInstance.notifyWinner(winner.id);
        console.log(`Winner notification for raffle ${id}: ${notificationSent ? 'Sent successfully' : 'Failed to send'}`);
      } catch (notifyError) {
        // Log the error but continue - don't fail the API call just because notification failed
        console.log(`Error sending winner notification for raffle ${id}: ${notifyError}`);
      }
      
      broadcast({ type: 'RAFFLE_ENDED', raffle: updatedRaffle, winner }); 
      res.status(200).json({ raffle: updatedRaffle, winner });
    } catch (error) {
      console.log(`Error ending raffle ${req.params.id}: ${error}`);
      res.status(500).json({ message: `Error ending raffle: ${error instanceof Error ? error.message : error}` });
    }
  });
  
  app.delete('/api/raffles/:id', ensureAdmin, async (req: Request, res: Response, next: NextFunction) => {
    const raffleId = parseInt(req.params.id, 10);
    if (isNaN(raffleId)) {
      return res.status(400).json({ message: "Invalid raffle ID." });
    }

    try {
      const deletedRaffle = await storageInstance.deleteRaffle(raffleId);
      if (!deletedRaffle) {
        // This case might not be reachable if deleteRaffle throws for not found
        return res.status(404).json({ message: `Raffle with ID ${raffleId} not found.` });
      }
      res.status(200).json(deletedRaffle);
    } catch (error: any) {
      // Handle specific errors thrown by deleteRaffle
      if (error.message.includes("tickets have been sold")) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      // Pass other errors to the general error handler
      next(error);
    }
  });

  // Ticket routes
  app.post('/api/tickets', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user || typeof (req.user as User).id !== 'number') { 
        return res.status(401).json({ message: 'Authentication required' });
      }

      const currentUser = req.user as User; 
      const userId = currentUser.id;
      const { raffleId } = req.body; // Get raffleId from body
      const numericRaffleId = parseInt(raffleId, 10);

      if (isNaN(numericRaffleId)) {
        return res.status(400).json({ message: 'Invalid raffle ID format.' });
      }

      try {
        // 1. Fetch Raffle Details (including name and price)
        const raffle = await storageInstance.getRaffle(numericRaffleId); 
        if (!raffle) {
          return res.status(404).json({ message: 'Raffle not found.' });
        }
        if (!raffle.isActive) {
          return res.status(400).json({ message: 'This raffle is no longer active.' });
        }

        // 2. Create a pending ticket first
        const pendingTicket = await storageInstance.createPendingTicket(userId, numericRaffleId);

        // Add null check for pendingTicket
        if (!pendingTicket) {
          console.log(`Failed to create pending ticket for raffle ${numericRaffleId}, user ${userId}. Possibly sold out or error.`);
          return res.status(400).json({ message: 'Could not reserve ticket. Raffle might be sold out or unavailable.' });
        }
        console.log(`Pending ticket ${pendingTicket.id} created for user ${userId}, raffle ${numericRaffleId}`);

        // 3. Create BTCPay Invoice, passing raffle details
        const btcpayInvoice = await btcpayService.createRaffleTicketInvoice(
          userId,
          numericRaffleId,
          pendingTicket.id.toString(),
          raffle.retailPrice || 100, // Default to 100 cents ($1.00)
          raffle.title,
          currentUser.email // Now properly handled in the function
        );

        // Check if BTCPay invoice ID exists and is a string
        if (typeof btcpayInvoice.id !== 'string' || !btcpayInvoice.id.trim()) {
          console.log('Error: BTCPay invoice ID is missing, not a string, or empty.', 'btcpayInvoice.id: ' + String(btcpayInvoice.id));
          // It's crucial to not proceed if we don't have a valid invoice ID
          // as this would lead to an orphaned ticket or incorrect data.
          return res.status(500).json({ error: 'Failed to create payment invoice. Missing invoice ID from payment provider.' });
        }

        // 4. Update the pending ticket with the invoice ID
        await storageInstance.updateTicketInvoiceDetails(
          pendingTicket.id,
          btcpayInvoice.id, // The ID from BTCPay
          new Date() // reservedAt timestamp
        );

        // 5. Return BTCPay Checkout Link
        return res.status(201).json({
          checkoutLink: btcpayInvoice.checkoutLink, 
          ticketId: pendingTicket.id, 
          invoiceId: btcpayInvoice.id
        });

      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        console.log(`Error purchasing ticket: ${error}`);
        // If BTCPay creation failed after pending ticket was made, maybe clean up?
        // For now, just return a generic error.
        res.status(500).json({ message: 'Error processing ticket purchase' });
      }
    } catch (error) {
      console.log(`Error purchasing ticket: ${error}`);
      res.status(500).json({ message: 'Error purchasing ticket' });
    }
  });

  app.get('/api/tickets/:id', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
       const user = req.user as User;
       const ticketId = parseInt(req.params.id);
       if (isNaN(ticketId)) {
         return res.status(400).json({ message: "Invalid ticket ID" });
       }
       
       const ticket = await storageInstance.getTicketById(ticketId); 
       
       if (!ticket) {
         return res.status(404).json({ message: "Ticket not found" });
       }
       
       // Ensure user owns the ticket or is admin
       if (ticket.userId !== user.id && !user.isAdmin) {
         return res.status(403).json({ message: "Forbidden: You do not own this ticket" });
       }
       
       res.status(200).json(ticket);
    } catch (error) {
       console.log(`Error fetching ticket ${req.params.id}: ${error}`);
       res.status(500).json({ message: "Error fetching ticket" });
    }
  });

  // Get tickets for a specific raffle
  app.get('/api/raffles/:raffleId/tickets', async (req: Request, res: Response) => {
     try {
       const raffleId = parseInt(req.params.raffleId);
       if (isNaN(raffleId)) {
         return res.status(400).json({ message: "Invalid raffle ID" });
       }
       const ticketsList = await storageInstance.getTicketsByRaffle(raffleId);
       res.status(200).json(ticketsList);
     } catch (error) {
       console.log(`Error fetching tickets for raffle ${req.params.raffleId}: ${error}`);
       res.status(500).json({ message: "Error fetching tickets" });
     }
  });
  
  // Get tickets for the logged-in user
  app.get('/api/user/tickets', ensureAuthenticated, async (req: Request, res: Response) => {
     try {
       const user = req.user as User;
       const ticketsList = await storageInstance.getTicketsByUser(user.id);
       res.status(200).json(ticketsList);
     } catch (error) {
       console.log(`Error fetching tickets for user ${ (req.user as User).id }: ${error}`);
       res.status(500).json({ message: "Error fetching user tickets" });
     }
  });

  // Winner routes
  app.get('/api/winners', async (req: Request, res: Response) => {
    try {
      const winnersList = await storageInstance.getWinners();
      res.status(200).json(winnersList);
    } catch (error) {
      console.log(`Error fetching winners: ${error}`);
      res.status(500).json({ message: "Error fetching winners" });
    }
  });
  
  // Stats routes
  app.get('/api/stats', async (req, res) => {
       try {
        const allRaffles = await storageInstance.getRaffles(false);
        const allWinners = await storageInstance.getWinners();
         
        const activeRaffles = allRaffles.filter((r: Raffle) => r.isActive).length;
        const totalRevenue = allRaffles.reduce((sum: number, r: Raffle) => sum + (r.soldTickets * r.ticketPrice), 0);
        const totalValueRaffled = allRaffles.reduce((sum: number, r: Raffle) => sum + r.retailPrice, 0);
        const totalTicketsSold = allRaffles.reduce((sum: number, r: Raffle) => sum + r.soldTickets, 0);
        
        const claimedWinners = allWinners.filter((w: Winner) => w.claimed).length;
        const totalPrizesClaimedValue = allWinners
          .filter((w: Winner) => w.claimed)
          .reduce((sum: number, w: Winner) => {
              const raffle = allRaffles.find((r: Raffle) => r.id === w.raffleId); 
              return sum + (raffle?.winnerPrice || 0);
          }, 0);

        res.json({
          totalRaffles: allRaffles.length,
          activeRaffles,
          totalTicketsSold,
          totalRevenue,
          totalValueRaffled,
          totalWinners: allWinners.length,
          claimedWinners,
          totalPrizesClaimedValue
        });
      } catch (error) {
        console.log(`Error fetching stats: ${error}`);
        res.status(500).json({ message: "Error fetching statistics" });
      } 
    });

  // CSRF Error Handler - place it after all routes that use CSRF, or before a generic error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === 'EBADCSRFTOKEN') {
      console.warn('Invalid CSRF token detected:', { path: req.path, method: req.method, ip: req.ip });
      res.status(403).json({ message: 'Invalid CSRF token. Please refresh and try again.' });
    } else {
      next(err);
    }
  });

  console.log('Routes registered successfully with CSRF protection for serverless deployment');
}
