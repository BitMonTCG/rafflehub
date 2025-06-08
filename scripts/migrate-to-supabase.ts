/**
 * Supabase Schema Migration Guide
 * 
 * This script provides instructions for migrating your schema to Supabase
 * using Drizzle Kit's migration tools.
 * 
 * Usage:
 * 1. Make sure DATABASE_URL is set in your environment
 * 2. Run with: npx tsx scripts/migrate-to-supabase.ts
 * 3. Follow the instructions to complete the migration
 */

// Import env configuration first
import '../server/env.js';
import { initializeDbClient } from '../server/db.js';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

/**
 * Creates the sessions table needed for connect-pg-simple
 */
async function createSessionsTableSQL(): Promise<string> {
  return `
-- Create sessions table for connect-pg-simple if it doesn't exist
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar NOT NULL,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire");
`;
}

async function generateDrizzleMigrations() {
  try {
    console.log('🔄 Generating SQL migrations with Drizzle Kit...');
    
    // Generate migrations with drizzle-kit
    const { stdout, stderr } = await execPromise('npx drizzle-kit generate:pg');
    
    if (stderr && !stderr.includes('Generated')) {
      console.error('Error generating migrations:', stderr);
      return false;
    }
    
    console.log(stdout);
    return true;
  } catch (error) {
    console.error('❌ Failed to generate migrations:', error);
    return false;
  }
}

async function migrateToSupabase() {
  console.log('🚀 Starting schema migration to Supabase...');
  
  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    await initializeDbClient();
    console.log('✅ Database connection successful');
    
    // Step 1: Generate migrations using Drizzle Kit
    const migrationsGenerated = await generateDrizzleMigrations();
    if (!migrationsGenerated) {
      throw new Error('Migration generation failed');
    }
    
    // Find the most recent migration SQL file
    const drizzleDir = path.join(process.cwd(), 'drizzle', 'postgresql');
    const files = fs.readdirSync(drizzleDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
      .reverse();
    
    if (!files.length) {
      throw new Error('No migration files found');
    }
    
    const latestMigrationFile = path.join(drizzleDir, files[0]);
    console.log(`✅ Latest migration file: ${latestMigrationFile}`);
    
    // Read the migration SQL
    let migrationSQL = fs.readFileSync(latestMigrationFile, 'utf-8');
    
// Add sessions table SQL
    const sessionsTableSQL = createSessionsTableSQL();
     migrationSQL += sessionsTableSQL;
    
    // Output full migration path
    const outputDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const filePath = path.join(outputDir, `${timestamp}_supabase_migration.sql`);
    fs.writeFileSync(filePath, migrationSQL);
    
    console.log(`\n✅ Migration SQL generated successfully! File: ${filePath}`);
    console.log(`\n📝 Migration Summary:\n`);
    console.log(`• Generated SQL schema from your Drizzle schema`); 
    console.log(`• Added sessions table for express-session storage`); 
    console.log(`• Combined into a single migration file\n`);
    
    console.log(`🔄 To complete the migration to Supabase:\n`);
    console.log(`1. Go to your Supabase project dashboard`); 
    console.log(`2. Navigate to SQL Editor`); 
    console.log(`3. Create a new query`); 
    console.log(`4. Copy and paste the contents of the generated SQL file:`); 
    console.log(`   ${filePath}`); 
    console.log(`5. Execute the query`); 
    
    console.log(`\n💡 For robust migrations in production environments, consider:\n`); 
    console.log(`• Setting up a CI/CD pipeline to run migrations automatically`); 
    console.log(`• Using Supabase's connection pooling for better performance`); 
    console.log(`• Implementing a migration version check in your application\n`); 
    
    console.log('🎉 Migration preparation complete');
  } catch (error) {
    console.error('❌ Migration preparation failed:', error);
    process.exit(1);
  }
}

migrateToSupabase().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
