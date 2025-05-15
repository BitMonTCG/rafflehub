
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
    schema: './shared/schema.pg.ts',
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
  // SQLite configuration (Development)
  drizzleConfig = {
    out: './drizzle/sqlite', // Separate output directory for sqlite migrations
    schema: './shared/schema.sqlite.ts',
    dialect: 'sqlite',
    dbCredentials: {
      url: 'sqlite.db', // Or use a URL from .env if you prefer e.g. process.env.SQLITE_DB_PATH
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

