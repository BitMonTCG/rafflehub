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
// For serverless environments like Vercel, we need to be careful with connection management
console.log(`Configuring Postgres connection to ${pgOptions.host}:${pgOptions.port || 5432} for database ${pgOptions.database}`);

// Set up connection options with only the supported properties for postgres-js
// Define db variable outside try/catch for proper scoping
let db: PostgresJsDatabase<PgSchema>;

try {
  // Properly encode connection string components to handle special characters
  // Instead of using DATABASE_URL directly, we'll construct it with proper encoding
  let connectionString;
  
  if (process.env.DATABASE_URL) {
    // Parse the connection string components safely
    const dbUrlMatch = process.env.DATABASE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
    
    if (dbUrlMatch) {
      const [, user, password, hostPort, database] = dbUrlMatch;
      // Encode each component separately to handle special chars in password
      const encodedUser = encodeURIComponent(user);
      const encodedPassword = encodeURIComponent(password);
      const dbName = database.split('?')[0]; // Remove query params if any
      const queryParams = database.includes('?') ? '?' + database.split('?')[1] : '';
      
      connectionString = `postgres://${encodedUser}:${encodedPassword}@${hostPort}/${dbName}${queryParams}`;
      console.log(`Using properly encoded database connection string`);
    } else {
      console.warn('Could not parse DATABASE_URL, using original (may cause errors if it contains special characters)');
      connectionString = process.env.DATABASE_URL;
    }
  } else if (pgOptions.user && pgOptions.password && pgOptions.host && pgOptions.database) {
    // Construct from parsed components
    const port = pgOptions.port || 5432;
    connectionString = `postgres://${encodeURIComponent(pgOptions.user)}:${encodeURIComponent(pgOptions.password)}@${pgOptions.host}:${port}/${pgOptions.database}`;
    console.log('Using constructed connection string from parsed components');
  } else {
    throw new Error('No valid database connection information available');
  }
  
  // Create the postgres client using parsed parameters instead of raw connection string
  // This avoids issues with special characters in passwords
  const client = postgres({
    host: pgOptions.host,
    port: pgOptions.port || 5432,
    database: pgOptions.database,
    username: pgOptions.user,
    password: pgOptions.password,
    ssl: 'require',  // Always enforce SSL for security
    max: 5,          // Reduce connection pool size for serverless
    idle_timeout: 10, // Close idle connections faster
    max_lifetime: 60, // Close connections after a minute to prevent hanging connections
    connect_timeout: 30, // Timeout after 30s if cannot connect
    prepare: false,   // Don't prepare statements (reduces overhead)
  });
  
  console.log(`Using database connection with parsed options (host: ${pgOptions.host}, db: ${pgOptions.database})`);
  
  // Verify connection works by testing a simple query
  // Use immediate invocation to handle the async operation
  await (async () => {
    try {
      const testResult = await client`SELECT 1 as connection_test`;
      console.log('✅ Database connection verified successfully');  
    } catch (testError: any) { // Type as any to access .message property safely
      console.error('❌ Database connection test failed:', testError);
      throw new Error(`Database connection test failed: ${testError?.message || String(testError)}`);
    }
  })();
  
  // Initialize the Drizzle ORM with our client and schema
  db = drizzle(client, { schema });
  
  // Add connection validation test (don't block initialization)
  client.unsafe("SELECT 1 as connection_test").then(() => {
    console.log(`✅ PostgreSQL connection validated successfully to ${pgOptions.host}`);
  }).catch(err => {
    console.error(`❌ PostgreSQL connection validation failed:`, err);
  });
  
  console.log(`PostgreSQL client initialized successfully for ${pgOptions.host}`);
} catch (error) {
  console.error(`❌ Critical error creating PostgreSQL client:`, error);
  
  // Re-throw to prevent app from running with broken DB connection in production
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Failed to initialize PostgreSQL client: ${error instanceof Error ? error.message : String(error)}`);
  } else {
    console.warn(`⚠️ Running in development mode with potentially broken DB connection`);
    // Create a minimum viable client for development debugging
    const fallbackClient = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    db = drizzle(fallbackClient, { schema });
  }
}

// Export the db instance
export { db };

// Export all named exports from the schema module for easy access elsewhere
// This makes it easy to use your tables, relations, etc.
export * from '../shared/schema.js';

console.log(`Connected to PostgreSQL on ${pgOptions.host} as ${pgOptions.username}`);