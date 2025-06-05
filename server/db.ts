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

// Configure postgres.js client
const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

const client = postgres(connectionString, {
  ssl: isProduction ? 'require' : false, // Enforce SSL in production (e.g., for Supabase)
  max: 10, // Connection pool size
  idle_timeout: 20, // Optional: seconds before closing idle connections
  max_lifetime: 60 * 30, // Optional: seconds before closing connections (even if active)
});

export const db: PostgresJsDatabase<PgSchema> = drizzle(client, { schema });

// Export all named exports from the schema module for easy access elsewhere
// This makes it easy to use your tables, relations, etc.
export * from '../shared/schema.js'; // Export from unified PostgreSQL schema

console.log(
  isProduction
    ? 'Connected to PostgreSQL (Production - Supabase with SSL)'
    : 'Connected to PostgreSQL (Development)',
);