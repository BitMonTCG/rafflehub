// JavaScript version of the migration script that doesn't require TypeScript compilation
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

async function main() {
  console.log('Starting migration process for Vercel deployment...');
  console.log('Node.js version:', process.version);
  
  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    process.exit(1);
  }
  
  // Log partial URL (hide password)
  try {
    const urlObj = new URL(databaseUrl);
    console.log(`Database host: ${urlObj.hostname}, database: ${urlObj.pathname.slice(1)}`);
  } catch (e) {
    console.log('Could not parse DATABASE_URL for logging');
  }
  
  // Parse and reconstruct the URL to properly handle special characters in passwords
  try {
    // First attempt to parse the URL to see if it's valid
    const parsedUrl = new URL(databaseUrl);
    
    // Reconstruct the URL to ensure proper encoding
    // The format is: protocol://username:password@hostname:port/database
    const protocol = parsedUrl.protocol;
    const username = parsedUrl.username;
    const password = parsedUrl.password; // Already decoded by URL constructor
    const hostname = parsedUrl.hostname;
    const port = parsedUrl.port;
    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.searchParams;
    
    // Reconstruct the URL with properly encoded components
    databaseUrl = `${protocol}//${encodeURIComponent(username)}:${encodeURIComponent(password)}@${hostname}${port ? `:${port}` : ''}${pathname}`;
    
    // Add back any query parameters except sslmode which we'll handle separately
    let queryString = '';
    searchParams.forEach((value, key) => {
      if (key !== 'sslmode') {
        queryString += queryString ? `&${key}=${value}` : `?${key}=${value}`;
      }
    });
    databaseUrl += queryString;
    
    // Add SSL requirement if not already present
    if (!databaseUrl.includes('sslmode=')) {
      databaseUrl += databaseUrl.includes('?') ? '&sslmode=require' : '?sslmode=require';
    }

    console.log('Successfully parsed and reconstructed database URL');
  } catch (error) {
    console.warn('Could not parse DATABASE_URL, using as-is with SSL mode appended');
    // Add SSL requirement to the connection string if not already present
    if (!databaseUrl.includes('sslmode=')) {
      databaseUrl += databaseUrl.includes('?') 
        ? '&sslmode=require' 
        : '?sslmode=require';
    }
  }

  console.log('Connecting to the database to apply migrations...');
  // Use a optimized connection for serverless environment
  const migrationClient = postgres(databaseUrl, {
    max: 3,                          // Reduced pool size for serverless
    idle_timeout: 10,                // Shorter idle timeouts (10s)
    connect_timeout: 30,             // Connection timeout (30s)
    max_lifetime: 60 * 5,            // Limit connection lifetime (5 min)
    ssl: { rejectUnauthorized: false }, // Accept self-signed certificates
    prepare: false                   // Disable prepared statements to reduce overhead
  });
  
  // Test the connection before proceeding
  try {
    await migrationClient`SELECT 1`;
    console.log('Database connection test successful');
  } catch (error) {
    console.error('Database connection test failed:', error);
    process.exit(1);
  }
  const db = drizzle(migrationClient);

  try {
    // Verify migrations folder exists
    try {
      const fs = await import('fs/promises');
      await fs.access('./drizzle/postgresql');
      console.log('Found migrations folder at ./drizzle/postgresql');
      
      // List migration files
      const files = await fs.readdir('./drizzle/postgresql');
      console.log(`Found ${files.length} files in migrations folder:`, files);
    } catch (e) {
      console.warn('Could not access or read migrations folder:', e.message);
    }
    
    console.log('Applying database migrations from ./drizzle/postgresql folder...');
    // Use the correct migrations folder path as specified in drizzle.config.ts
    await migrate(db, { migrationsFolder: './drizzle/postgresql' });
    console.log('Database migrations applied successfully.');
  } catch (error) {
    console.error('Error applying database migrations:', error);
    if (error.message && error.message.includes('no such file or directory')) {
      console.error('Migration folder not found. This may be due to path resolution issues in Vercel environment.');
    }
    process.exit(1);
  } finally {
    console.log('Closing migration database connection...');
    try {
      await migrationClient.end();
      console.log('Database connection closed successfully.');
    } catch (e) {
      console.warn('Error closing database connection:', e);
    }
  }
}

main().catch((error) => {
  // Ensure any unhandled errors in the main function are caught
  console.error('Unhandled error in migration script:', error);
  process.exit(1);
});
