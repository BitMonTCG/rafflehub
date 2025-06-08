// Import env configuration FIRST to ensure environment variables are loaded
import './env.js';

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js'; // Import from unified PostgreSQL schema with .js extension
import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current file's directory for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type export for the schema
export type PgSchema = typeof schema;

// Declare variables at module level for exports
let db: PostgresJsDatabase<PgSchema>;
let sql: ReturnType<typeof postgres>;
let isInitialized = false;

/**
 * Initializes the database client for connection to Supabase
 * This function supports both development and production environments,
 * with special handling for Vercel serverless functions
 */
export async function initializeDbClient(): Promise<PostgresJsDatabase<PgSchema>> {
  // If already initialized, return existing instance
  if (isInitialized && db) {
    return db;
  }

  try {
    console.log('Initializing PostgreSQL client with Supabase DATABASE_URL');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Create the postgres client with optimized settings for serverless
    // Detect environment for appropriate connection handling
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV !== undefined;
    const isPooled = process.env.DATABASE_URL.includes('pooler.supabase.com');
    console.log(`Using ${isPooled ? 'pooled' : 'direct'} database connection in ${isProduction ? 'production' : 'development'} environment`);
    
    // Path to SSL certificate
    const certPath = path.resolve(process.cwd(), 'prod-ca-2021.crt');
    
    // Use asynchronous methods for file operations to avoid blocking the event loop
    // Define proper type for the SSL config to match postgres.js requirements
    // postgres.js accepts boolean | object with SSL options
    // Set rejectUnauthorized based on environment for security
    let sslConfig: boolean | { ca?: string; rejectUnauthorized?: boolean } = { 
      rejectUnauthorized: isProduction // Enforce TLS verification in production, allow self-signed in dev
    };
    
    try {
      // Use async file access check instead of existsSync
      await fs.access(certPath, fsConstants.R_OK)
        .then(async () => {
          // File exists and is readable, load it asynchronously
          const certContent = await fs.readFile(certPath, 'utf8');
          sslConfig = {
            ca: certContent,
            rejectUnauthorized: isProduction // Only enforce in production
          };
          console.log('SSL certificate found and loaded');
        })
        .catch(() => {
          // File doesn't exist or isn't readable
          console.log(`SSL certificate not found at ${certPath}`);
        });
    } catch (err: unknown) {
      // Handle error with proper type checking
      const error = err as Error;
      console.log(`Error loading SSL certificate: ${error.message}`);
    }
    
    try {
      sql = postgres(process.env.DATABASE_URL, {
        ssl: sslConfig,       // Use SSL with certificate if available
        max: isPooled ? 10 : 5, // Larger pool for pooled connections
        idle_timeout: 10,     // Close idle connections faster
        max_lifetime: 60,     // Close connections after a minute
        connect_timeout: 30,  // Timeout after 30s if cannot connect
        prepare: false,       // Don't prepare statements (reduces overhead)
      });
    } catch (error: unknown) {
      if (error instanceof URIError) {
        console.error('❌ CRITICAL: Database connection string is malformed. Please check for special characters in the password or username that need to be URL-encoded.');
        throw new Error(`Critical database connection failure: ${error.message}`);
      }
      // Re-throw other errors
      throw error;
    }
    
    // Test the connection with timeout and retries
    let connected = false;
    let retries = 3;
    let lastError: Error | unknown = null;

    while (retries > 0 && !connected) {
      try {
        console.log(`Testing database connection (attempt ${4 - retries}/3)...`);
        await sql`SELECT 1`;
        connected = true;
        console.log('✅ Supabase database connection successful');
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          const delay = 1000 * Math.pow(2, 3 - retries - 1); // Exponential backoff
          console.log(`⚠️ Database connection failed, retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    if (!connected) {
      throw new Error(`Database connection failed after multiple attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    }
    
    // Initialize Drizzle with our schema
    db = drizzle(sql, { schema });
    isInitialized = true;
    
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to Supabase database:', error);
    
    // In production, fail hard on connection errors
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV) {
      throw new Error(`Critical database connection failure: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // In development, create a minimal connection for debugging purposes
    console.warn('⚠️ Running in development mode with potentially broken DB connection');
    const fallbackClient = postgres(process.env.DATABASE_URL || '', { ssl: 'require' });
    db = drizzle(fallbackClient, { schema });
    isInitialized = true; // Set the flag to prevent retry loops on subsequent calls
    return db;
  }
}

// Initialize the connection immediately if not in a serverless environment
// In serverless, we'll initialize on-demand when the function is called
if (typeof process.env.AWS_LAMBDA_FUNCTION_NAME === 'undefined' && 
    typeof process.env.VERCEL === 'undefined') {
  console.log('Non-serverless environment detected, initializing database connection');
  initializeDbClient().catch(err => {
    console.error('Failed to initialize database on startup:', err);
  });
} else {
  console.log('Serverless environment detected, database will initialize on first request');
}

// Export the db instance and sql client
export { db, sql };

// Export all named exports from the schema module for easy access elsewhere
export * from '../shared/schema.js';