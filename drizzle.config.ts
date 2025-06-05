
import dotenv from 'dotenv';

dotenv.config({ path: '.env' }); // Ensure .env is loaded

const isProduction = process.env.NODE_ENV === 'production';
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL is not set in .env file. Please ensure it is configured.');
}

let drizzleConfig;

if (isProduction && dbUrl.startsWith('postgres')) {
  // PostgreSQL configuration (Supabase)
  drizzleConfig = {
    out: './drizzle/postgresql', // Separate output directory for pg migrations
    schema: './shared/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
      url: dbUrl,
      // Add SSL configuration if your Supabase connection string doesn't include ?sslmode=require
      // ssl: 'require', // Uncomment if needed, or ensure it's in DATABASE_URL
    },
    verbose: true,
    strict: true,
};
} else if (!isProduction) {
  // PostgreSQL configuration (Development) - Now using PostgreSQL
  drizzleConfig = {
    out: './drizzle/postgresql', // Using the same output directory as production for consistency
    schema: './shared/schema.ts', // Pointing to the unified PostgreSQL schema
    dialect: 'postgresql',        // Changed to postgresql
    dbCredentials: {
      url: dbUrl,               // Using DATABASE_URL for PostgreSQL connection
      // For local development, SSL is typically not required unless your local PG server is configured for it.
      // If dbUrl includes sslmode, postgres driver should handle it. Otherwise, set ssl: false if needed.
    },
    verbose: true,
    strict: true,
};
} else {
  throw new Error(
    'Could not determine database configuration. Ensure NODE_ENV and DATABASE_URL are correctly set.'
  );
}

export default drizzleConfig;

