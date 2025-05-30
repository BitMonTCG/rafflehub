import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage, IStorage } from "./storage";
import { users, insertUserSchema, raffles, insertRaffleSchema, tickets, insertTicketSchema, winners, insertWinnerSchema, User, Winner, Raffle, Ticket, InsertUser } from "../shared/schema";
import { z, ZodError } from "zod";
import express, { NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from 'connect-pg-simple';
import MemoryStore from 'memorystore';
import bcrypt from 'bcrypt'; // Add bcrypt import
import { log } from "./vite";
import { eq, sql } from 'drizzle-orm';
import { fromZodError } from 'zod-validation-error';
import * as btcpayService from './btcpayService';
import { InvoiceStatus } from 'btcpay-greenfield-node-client';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import helmet from 'helmet';

// Define a simple interface for the expected webhook payload structure
interface BtcPayWebhookPayload {
  type: string; // e.g., "InvoiceSettled", "InvoiceExpired"
  invoiceId: string;
  // Include other fields if needed, e.g., metadata
  metadata?: { [key: string]: any };
}

// Setup session store based on environment
const usePgSession = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
const Store = usePgSession
  ? connectPgSimple(session)
  : MemoryStore(session);

const sessionStore = usePgSession
  ? new (Store as any)({
      connectionString: process.env.DATABASE_URL,
      tableName: 'user_sessions',
      createTableIfMissing: true,
      ssl: process.env.NODE_ENV === 'production', // Enable SSL for Supabase PostgreSQL
      pool: {
        max: 10, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000 // Close idle clients after 30 seconds
      }
    })
  : new (Store as any)({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

// Global WebSocketServer instance
let wss: WebSocketServer | null = null;

function broadcast(message: any) {
  if (!wss) {
    log("WebSocket server not initialized, cannot broadcast.");
    return;
  }
  const messageStr = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
         client.send(messageStr);
      } catch (err) {
         log(`Error sending WebSocket message: ${err}`);
      }
    }
  });
}

// --- Route Registration ---
export async function registerRoutes(app: Express, storageInstance: IStorage): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  wss = new WebSocketServer({ server: httpServer }); 
  
  wss.on('connection', (ws) => {
    log('Client connected via WebSocket');
    // clients.add(ws); // Manage clients if needed for targeted messages
    
    ws.on('message', async (message) => {
       log(`Received WebSocket message: ${message}`);
       try {
         const data = JSON.parse(message.toString());
         if (data.type === 'PING') {
           ws.send(JSON.stringify({ type: 'PONG' }));
         }
       } catch (error) {
         log(`Error processing WebSocket message: ${error}`);
       }
    });
    
    ws.on('close', () => {
      log('Client disconnected from WebSocket');
      // clients.delete(ws);
    });
    ws.on('error', (error) => {
      log(`WebSocket error: ${error}`);
      // clients.delete(ws);
    });
  });
  
  // --- Middleware ---
  // Security headers (completely disabled for development)
  if (process.env.NODE_ENV === 'production') {
    // Use full Helmet security in production
    app.use(helmet());
  } else {
    // In development, apply minimal Helmet settings
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      originAgentCluster: false,
      dnsPrefetchControl: false,
      referrerPolicy: false,
      strictTransportSecurity: false,
      xssFilter: false,
    }));
    
    // Add comprehensive CORS support for development and IDE preview
    app.use((req, res, next) => {
      // Allow all origins for development
      res.header('Access-Control-Allow-Origin', '*');
      
      // Allow common headers
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      // Allow all methods
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      
      // Allow credentials
      res.header('Access-Control-Allow-Credentials', 'true');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      
      // Set permissive framing policy for IDE preview
      res.removeHeader('X-Frame-Options');
      res.header('Content-Security-Policy', "frame-ancestors 'self' *");
      
      next();
    });
  }
  
  app.post('/api/btcpay/webhook', express.raw({ type: 'application/json' }));
  
  app.use(express.json());

  // Generate a secure session secret if not provided in environment variables
  const sessionSecret = process.env.SESSION_SECRET || 
    (() => {
      const secret = crypto.randomBytes(32).toString('hex');
      console.log('WARNING: Using auto-generated session secret. Set SESSION_SECRET env var for persistent sessions.');
      return secret;
    })();
    
  app.use(session({
    store: sessionStore,
    secret: sessionSecret,
    resave: true,  // Changed to true to ensure session is saved on each request
    saveUninitialized: false,
    cookie: {
      // Use secure cookies in production, non-secure in development
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      // In production, we want 'none' for cross-site cookies to work with Vercel deployment
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      // Set domain for production if needed
      // domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
    },
    name: 'bitmon_sid', // Custom session name (not the default 'connect.sid')
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport Local Strategy for authentication
  // Strategy for regular database users
  passport.use('user-local', new LocalStrategy(async (username, password, done) => {
    try {
      // Find user by username
      const user = await storageInstance.getUserByUsername(username);
      
      // If user not found, authentication fails
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      
      // Check password using bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      
      // If password doesn't match, authentication fails
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      // Authentication successful, return user without password
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      // Server error during authentication
      return done(error);
    }
  }));

  // Strategy for admin user from .env
  passport.use('admin-strategy', new LocalStrategy(
    {
      usernameField: 'username', // Ensure these match your form field names
      passwordField: 'password'
    },
    (username, password, done) => {
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminUsername || !adminPassword) {
        log('Admin credentials are not set in environment variables.');
        return done(null, false, { message: 'Admin configuration error.' });
      }

      if (username === adminUsername && password === adminPassword) {
        // Create a user-like object for the admin
        // IMPORTANT: Ensure this object structure is compatible with what passport.serializeUser expects
        // and what your ensureAdmin middleware might expect (e.g., an 'id' and 'role' or 'isAdmin' property)
        const adminUser = {
          id: 'admin_user_id', // Static ID for the admin user session
          username: adminUsername,
          role: 'admin', // Add a role property
          // Add any other properties your ensureAdmin or client-side might expect
        };
        return done(null, adminUser);
      } else {
        return done(null, false, { message: 'Incorrect admin username or password.' });
      }
    }
  ));

  // --- Passport Serialization/Deserialization --- 
  // Store only the user ID in the session
  passport.serializeUser((user: any, done) => {
    // Assuming 'user' object has an 'id' property based on your User type
    done(null, user.id);
  });

  // Retrieve the full user object from the database using the ID from the session
  passport.deserializeUser(async (id: string | number, done) => { // Allow id to be string or number
    try {
      if (id === 'admin_user_id') {
      // Reconstruct the .env admin user object
      const adminUsername = process.env.ADMIN_USERNAME;
      if (!adminUsername) {
        console.error('ADMIN_USERNAME not set, cannot deserialize .env admin');
        return done(new Error('Admin configuration error'), null);
      }
      const envAdminUser = { 
        id: 'admin_user_id', 
        username: adminUsername, 
        role: 'admin' 
      };
      // console.log(`Env Admin deserialized from session: ID=${envAdminUser.id}, Username=${envAdminUser.username}, Role=${envAdminUser.role}`);
      return done(null, envAdminUser);
    }

    // Existing logic for numeric IDs (database users)
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id; // Ensure it's a number for DB lookup
    if (isNaN(numericId)) { 
        console.warn(`deserializeUser received non-numeric, non-admin ID: ${id}`);
        return done(null, null); 
    }

    const user = await storageInstance.getUserById(numericId);
      
      if (user) {
        // Ensure proper type conversion and remove password
        const safeUser = {
          ...user,
          // Ensure isAdmin is properly converted to boolean (SQLite stores as 0/1)
          isAdmin: user.isAdmin === true || user.isAdmin === 1,
          // Remove password for security
          password: ''
        } as User; // Ensure TypeScript recognizes this as a User object
        
        // Log user details to help diagnose issues
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

  // --- Security Middleware ---
  
  // Rate limiting for authentication routes
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window per IP
    message: { message: 'Too many login attempts, please try again later' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // --- API Routes ---

  // Authentication routes
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
          // Ensure proper type conversion
          isAdmin: user.isAdmin === true || user.isAdmin === 1
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
      log(`Registration failed for ${req.body.username || 'unknown user'}: ${errorMessage}`); 
      // Also log the full error object if possible, for stack trace etc.
      console.error("Registration Error Object:", error); 
      
      res.status(500).json({ message: "Registration failed" }); // Keep generic message to client
    }
  });

  // Admin login route
  app.post('/api/auth/admin/login', loginLimiter, (req, res, next) => { // Added loginLimiter here too
    passport.authenticate('admin-strategy', (err: any, adminUser: any | false, info: { message: string }) => {
      if (err) {
        log(`Admin login error: ${err}`);
        return next(err);
      }
      if (!adminUser) {
        log(`Admin login failed: ${info.message}`);
        return res.status(401).json({ message: info.message || 'Admin login failed' });
      }
      req.logIn(adminUser, (loginErr) => { // Changed err to loginErr to avoid conflict
        if (loginErr) {
          log(`Admin session error after login: ${loginErr}`);
          return next(loginErr);
        }
        log(`Admin user ${adminUser.username} logged in successfully`);
        // Send back a success message or the admin user object
        return res.json({ message: 'Admin login successful', user: { username: adminUser.username, role: adminUser.role, id: adminUser.id } }); // Added id
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) { return next(err); }
      req.session.destroy((destroyErr) => {
         if (destroyErr) {
           log(`Error destroying session: ${destroyErr}`);
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
      log(`Error fetching users: ${error}`);
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
       log(`Error fetching raffles: ${error}`);
      res.status(500).json({ message: "Error fetching raffles" });
    }
  });
  
  app.get('/api/raffles/featured', async (req: Request, res: Response) => {
    try {
      const featured = await storageInstance.getFeaturedRaffle();
      res.status(200).json(featured || null); // Return raffle or null
    } catch (error) {
       log(`Error fetching featured raffle: ${error}`);
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
       log(`Error fetching raffle ${req.params.id}: ${error}`);
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
      log(`Error creating raffle: ${error}`);
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
      log(`Error updating raffle ${req.params.id}: ${error}`);
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
        log(`Winner notification for raffle ${id}: ${notificationSent ? 'Sent successfully' : 'Failed to send'}`);
      } catch (notifyError) {
        // Log the error but continue - don't fail the API call just because notification failed
        log(`Error sending winner notification for raffle ${id}: ${notifyError}`);
      }
      
      broadcast({ type: 'RAFFLE_ENDED', raffle: updatedRaffle, winner }); 
      res.status(200).json({ raffle: updatedRaffle, winner });
    } catch (error) {
      log(`Error ending raffle ${req.params.id}: ${error}`);
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

  // --- Ticket routes ---
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
        if (!raffle.active) {
          return res.status(400).json({ message: 'This raffle is no longer active.' });
        }

        // 2. Create a pending ticket first
        const pendingTicket = await storageInstance.createPendingTicket(userId, numericRaffleId);

        // Add null check for pendingTicket
        if (!pendingTicket) {
          log(`Failed to create pending ticket for raffle ${numericRaffleId}, user ${userId}. Possibly sold out or error.`);
          return res.status(400).json({ message: 'Could not reserve ticket. Raffle might be sold out or unavailable.' });
        }
        log(`Pending ticket ${pendingTicket.id} created for user ${userId}, raffle ${numericRaffleId}`);

        // 3. Create BTCPay Invoice, passing raffle details
        const btcpayInvoice = await btcpayService.createRaffleTicketInvoice(
          userId,
          numericRaffleId,
          pendingTicket.id.toString(),
          raffle.retailPrice || 100, // Default to 100 cents ($1.00)
          raffle.title,
          currentUser.email // Now properly handled in the function
        );

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
        log(`Error purchasing ticket: ${error}`);
        // If BTCPay creation failed after pending ticket was made, maybe clean up?
        // For now, just return a generic error.
        res.status(500).json({ message: 'Error processing ticket purchase' });
      }
    } catch (error) {
      log(`Error purchasing ticket: ${error}`);
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
       log(`Error fetching ticket ${req.params.id}: ${error}`);
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
       log(`Error fetching tickets for raffle ${req.params.raffleId}: ${error}`);
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
       log(`Error fetching tickets for user ${ (req.user as User).id }: ${error}`);
       res.status(500).json({ message: "Error fetching user tickets" });
     }
  });

  // --- Winner routes ---
  app.get('/api/winners', async (req: Request, res: Response) => {
    try {
      const winnersList = await storageInstance.getWinners();
      const publicWinners = winnersList.map((w: Winner) => ({
         ...w,
         user: w.user ? { id: w.user.id, username: w.user.username } : null
      }));
      res.status(200).json(publicWinners);
    } catch (error) {
      log(`Error fetching winners: ${error}`);
      res.status(500).json({ message: "Error fetching winners" });
    }
  });
  
  // --- BTCPay Webhook Route ---
  app.post('/api/btcpay/webhook', async (req: Request, res: Response) => {
    const signature = req.headers['btcpay-sig'] as string | undefined;
    const requestBody = req.body;

    if (!Buffer.isBuffer(requestBody)) {
        log('Webhook Error: Request body is not a Buffer. Check middleware order.');
        return res.status(400).send('Invalid request body type.');
    }

    // 1. Verify Signature
    if (!signature) { // Check if signature exists first
      log('Webhook Error: Missing btcpay-sig header');
      return res.status(400).send('Missing BTCPay Signature header');
    } 
    // If we reach here, signature is a string.
    if (!btcpayService.verifyWebhookSignature(requestBody, signature)) { 
      log('Webhook Error: Invalid signature');
      return res.status(400).send('Invalid BTCPay Signature');
    }

    // 2. Process Verified Webhook
    try {
      // Use the local interface for the parsed payload
      const event: BtcPayWebhookPayload = JSON.parse(requestBody.toString());
      log(`Received verified BTCPay webhook event: Type=${event.type}, InvoiceId=${event.invoiceId}`);

      const invoiceId = event.invoiceId;
      if (!invoiceId) {
          log('Webhook Error: Invoice ID missing in payload.');
          return res.status(400).send('Missing invoiceId'); // Bad request payload
      }

      // 3. Find corresponding ticket (implement getTicketByInvoiceId in storage)
      const ticket = await storageInstance.getTicketByInvoiceId(invoiceId);

      if (!ticket) {
        log(`Webhook Warning: Received event for unknown invoice ID ${invoiceId}. Ignoring.`);
        // Return 200 OK to BTCPay even if we don't know the invoice, 
        // prevents unnecessary retries for potentially old/mismatched webhooks.
        return res.status(200).send('Webhook received for unknown invoice.');
      }

      log(`Processing webhook for ticket ${ticket.id} (Invoice ${invoiceId}, Current Status: ${ticket.status})`);

      // 4. Update ticket status based on event type
      let updatePerformed = false;
      try {
        switch (event.type) {
          case 'InvoiceSettled':
            if (ticket.status === 'pending') {
              log(`Updating ticket ${ticket.id} to paid (Invoice Settled)`);
              await storageInstance.updateTicketStatus(ticket.id, 'paid');
              updatePerformed = true;
              // Broadcast update to clients
              broadcast({ type: 'TICKET_PAID', ticketId: ticket.id, raffleId: ticket.raffleId });
              // Also broadcast raffle update (sold count)
               const updatedRaffle = await storageInstance.getRaffle(ticket.raffleId);
               if (updatedRaffle) {
                 broadcast({ type: 'RAFFLE_UPDATED', raffle: updatedRaffle });
               }
            } else {
              log(`Webhook Info: Invoice ${invoiceId} settled, but ticket ${ticket.id} was already ${ticket.status}. Ignoring.`);
            }
            break;
          
          case 'InvoiceExpired':
          case 'InvoiceInvalid':
             if (ticket.status === 'pending') {
                 log(`Updating ticket ${ticket.id} to expired (Invoice ${event.type})`);
                 await storageInstance.updateTicketStatus(ticket.id, 'expired');
                 updatePerformed = true;
                 // Broadcast update to clients (optional)
                 broadcast({ type: 'TICKET_EXPIRED', ticketId: ticket.id, raffleId: ticket.raffleId });
             } else {
                 log(`Webhook Info: Invoice ${invoiceId} ${event.type}, but ticket ${ticket.id} was already ${ticket.status}. Ignoring.`);
             }
             break;
             
          case 'InvoiceProcessing':
             // Optional: Update status to 'processing' or just log
             log(`Webhook Info: Invoice ${invoiceId} is processing for ticket ${ticket.id}. Status remains '${ticket.status}'.`);
             // Could potentially update status to 'processing' if you add that state
             // await storageInstance.updateTicketStatus(ticket.id, 'processing');
             break;

          default:
            log(`Webhook Info: Received unhandled event type: ${event.type} for invoice ${invoiceId}`);
            break;
        }
      } catch (dbError) {
         log(`Webhook Error: Failed to update ticket ${ticket.id} status in DB: ${dbError}`);
         // Return 500 to indicate internal error, BTCPay might retry
         return res.status(500).send('Internal server error processing webhook.');
      }
      
      // 5. Acknowledge Webhook
      res.status(200).send('Webhook processed successfully');

    } catch (error) {
      log(`Webhook Error: Failed to parse or process webhook payload: ${error}`);
      res.status(500).send('Error processing webhook');
    }
  });
  
  // --- Stats routes ---
  app.get('/api/stats', async (req, res) => {
       try {
        const allRaffles = await storageInstance.getRaffles(false);
        const allWinners = await storageInstance.getWinners();
         
        const activeRaffles = allRaffles.filter((r: Raffle) => r.isActive).length;
        const totalRevenue = allRaffles.reduce((sum: number, r: Raffle) => sum + (r.soldTickets * 1), 0);
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
        log(`Error fetching stats: ${error}`);
        res.status(500).json({ message: "Error fetching statistics" });
      } 
    });

  return httpServer;
}
