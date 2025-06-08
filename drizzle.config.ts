import dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in environment variables.');
}

console.log('Using DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 25) + '...');

// Get the DATABASE_URL with a modified SSL mode parameter for connection without certificate verification
let connectionString = process.env.DATABASE_URL;

// Add sslmode=require parameter if not present
if (!connectionString.includes('sslmode=')) {
  connectionString += connectionString.includes('?') 
    ? '&sslmode=require' 
    : '?sslmode=require';
}

// Always use PostgreSQL configuration
export default {
  schema: './shared/schema.ts',
  out: './drizzle/postgresql',
  driver: 'pg',  // Use 'pg' driver for PostgreSQL
  dbCredentials: {
    connectionString: connectionString,
  },
  verbose: true,
  strict: true,
} satisfies Config;
