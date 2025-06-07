// Import env configuration FIRST to ensure environment variables are loaded
import './env.js';

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js'; // Import from unified PostgreSQL schema

// Type export for the schema
export type PgSchema = typeof schema;

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to set it in your .env file or environment variables?',
  );
}

// WORKAROUND: Instead of using connection string directly, which fails with special chars,
// we'll parse the connection string manually and provide connection parameters separately

// Default empty options
const pgOptions: any = {
  ssl: 'require', // Always enforce SSL for security
  max: 10, // Connection pool size
  idle_timeout: 20, // Seconds before closing idle connections
  max_lifetime: 60 * 30, // Seconds before closing connections (even if active)
};

// This is a fail-safe approach that bypasses Node's URL parsing
// for the connection string which breaks with special characters like # in the password
try {
  const connString = process.env.DATABASE_URL || '';
  
  // Find protocol end position
  const protoEndPos = connString.indexOf('://'); 
  if (protoEndPos === -1) {
    throw new Error('Invalid connection string format');
  }
  
  // Extract protocol (e.g., "postgres")
  pgOptions.protocol = connString.substring(0, protoEndPos);
  
  // Find start of credentials
  const credsStartPos = protoEndPos + 3;
  
  // Find end of credentials (@)
  const credsEndPos = connString.indexOf('@', credsStartPos);
  if (credsEndPos === -1) {
    throw new Error('Could not find credentials separator @');
  }
  
  // Extract credentials string
  const credsString = connString.substring(credsStartPos, credsEndPos);
  
  // Find username/password separator
  const credsDelimPos = credsString.indexOf(':');
  if (credsDelimPos === -1) {
    throw new Error('Could not find username/password delimiter');
  }
  
  // Extract username and password
  pgOptions.username = credsString.substring(0, credsDelimPos);
  pgOptions.password = credsString.substring(credsDelimPos + 1);
  
  // Process host/port/database
  const hostPortDbString = connString.substring(credsEndPos + 1);
  
  // Find database name separator
  const dbSepPos = hostPortDbString.indexOf('/');
  if (dbSepPos !== -1) {
    // Extract hostname and port
    const hostPortString = hostPortDbString.substring(0, dbSepPos);
    const portSepPos = hostPortString.indexOf(':');
    
    if (portSepPos !== -1) {
      pgOptions.host = hostPortString.substring(0, portSepPos);
      pgOptions.port = parseInt(hostPortString.substring(portSepPos + 1), 10);
    } else {
      pgOptions.host = hostPortString;
    }
    
    // Extract database name
    pgOptions.database = hostPortDbString.substring(dbSepPos + 1);
  } else {
    // No database specified, only host and maybe port
    const portSepPos = hostPortDbString.indexOf(':');
    
    if (portSepPos !== -1) {
      pgOptions.host = hostPortDbString.substring(0, portSepPos);
      pgOptions.port = parseInt(hostPortDbString.substring(portSepPos + 1), 10);
    } else {
      pgOptions.host = hostPortDbString;
    }
  }
  
  console.log(`Database connection configured for host: ${pgOptions.host}, database: ${pgOptions.database}`);
} catch (err) {
  console.error('Failed to parse database connection string:', err);
  // Will continue with the original connection string as fallback
}

// Create the postgres client with our extracted parameters
// CRITICAL: Use the parsed options instead of the problematic connection string
const client = postgres({
  host: pgOptions.host,
  port: pgOptions.port || 5432,
  database: pgOptions.database,
  username: pgOptions.username,
  password: pgOptions.password,

  ssl: 'require', // Always enforce SSL for security (works with Supabase)
  max: 10, // Connection pool size
  idle_timeout: 20, // Optional: seconds before closing idle connections
  max_lifetime: 60 * 30, // Optional: seconds before closing connections (even if active)
});

export const db: PostgresJsDatabase<PgSchema> = drizzle(client, { schema });

// Export all named exports from the schema module for easy access elsewhere
// This makes it easy to use your tables, relations, etc.
export * from '../shared/schema.js'; // Export from unified PostgreSQL schema

console.log(`Connected to PostgreSQL on ${pgOptions.host} as ${pgOptions.username}`);