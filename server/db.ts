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

// Configure postgres.js client with production-ready settings
const connectionString = process.env.DATABASE_URL;

const client = postgres(connectionString, {
  ssl: 'require', // Always enforce SSL for security (works with Supabase)
  max: 10, // Connection pool size
  idle_timeout: 20, // Optional: seconds before closing idle connections
  max_lifetime: 60 * 30, // Optional: seconds before closing connections (even if active)
});

export const db: PostgresJsDatabase<PgSchema> = drizzle(client, { schema });

// Export all named exports from the schema module for easy access elsewhere
// This makes it easy to use your tables, relations, etc.
export * from '../shared/schema.js'; // Export from unified PostgreSQL schema

console.log('Connected to PostgreSQL with SSL');