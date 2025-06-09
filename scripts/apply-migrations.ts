import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config'; // Ensure environment variables are loaded

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  console.log('Connecting to the database to apply migrations...');
  // Use a single connection for the migration script
  const migrationClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    console.log('Applying database migrations from ./drizzle folder...');
    // Use the correct migrations folder path as specified in drizzle.config.ts
    // This ensures compatibility with Vercel deployment
    await migrate(db, { migrationsFolder: './drizzle/postgresql' });
    console.log('Database migrations applied successfully.');
  } catch (error) {
    console.error('Error applying database migrations:', error);
    process.exit(1);
  } finally {
    console.log('Closing migration database connection...');
    await migrationClient.end();
  }
}

main().catch((error) => {
  // Ensure any unhandled errors in the main function are caught
  console.error('Unhandled error in migration script:', error);
  process.exit(1);
});
