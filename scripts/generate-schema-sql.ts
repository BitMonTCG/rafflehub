/**
 * Generate Schema SQL Script
 * 
 * This script extracts your Drizzle schema and generates SQL that can be directly 
 * executed in Supabase's SQL Editor without requiring a database connection.
 * 
 * Usage:
 * 1. Run with: npx tsx scripts/generate-schema-sql.ts
 * 2. Copy the output SQL and run it in Supabase's SQL Editor
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Create sessions table SQL
function createSessionsTableSQL(): string {
  return `
-- Create sessions table for connect-pg-simple
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar NOT NULL,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire");
`;
}

// Create user_sessions table (alternative if needed)
function createUserSessionsTableSQL(): string {
  return `
-- Create user_sessions table (alternative name sometimes used)
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "sid" varchar NOT NULL,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");
`;
}

async function generateSchemaSQL(): Promise<void> {
  try {
    console.log('🔍 Analyzing project schema...');
    
    // First, try to find existing schema.ts file
    const schemaPath = path.join(process.cwd(), 'shared', 'schema.ts');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at expected path: ${schemaPath}`);
    }
    
    console.log('✅ Found schema file');
    console.log('📝 Generating SQL from schema...');

    // Output directory for the SQL
    const outputDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    try {
      // First try to generate migration SQL using drizzle-kit
      console.log('🔄 Using drizzle-kit to generate migration...');
      await execPromise('npx drizzle-kit generate:pg');
      
      // Find the latest migration file
      const drizzleDir = path.join(process.cwd(), 'drizzle', 'postgresql');
      if (fs.existsSync(drizzleDir)) {
        const files = fs.readdirSync(drizzleDir)
          .filter(file => file.endsWith('.sql'))
          .sort()
          .reverse();
        
        if (files.length > 0) {
          const latestMigrationFile = path.join(drizzleDir, files[0]);
          console.log(`✅ Found generated migration: ${latestMigrationFile}`);
          
          // Read migration SQL and append sessions tables
          let sql = fs.readFileSync(latestMigrationFile, 'utf-8');
          sql += createSessionsTableSQL();
          sql += createUserSessionsTableSQL();
          
          // Write to migrations folder
          const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
          const filePath = path.join(outputDir, `${timestamp}_schema.sql`);
          fs.writeFileSync(filePath, sql);
          
          console.log(`\n✅ Schema SQL generated successfully: ${filePath}`);
          console.log('\n--- SQL FILE CONTENTS ---\n');
          console.log(sql);
          console.log('\n-------------------------\n');
          
          console.log(`📋 Instructions for Supabase Migration:\n`);
          console.log(`1. Go to your Supabase project dashboard`);
          console.log(`2. Navigate to "SQL Editor" in the sidebar`);
          console.log(`3. Create a new query`);
          console.log(`4. Copy and paste the SQL from: ${filePath}`);
          console.log(`5. Execute the query`);
          console.log(`\n🔑 Note: This will create your tables and the session tables needed for authentication.`);
          return;
        }
      }
      
      throw new Error('No migration files found after generation');
    } catch (migrationError) {
      console.error('⚠️ Drizzle migration generation failed:', migrationError.message);
      console.log('🔄 Falling back to manual schema extraction...');
      
      // Manual fallback - create a basic schema SQL
      const fallbackSQL = `
-- Basic tables needed for RaffleHub app
-- NOTE: This is a fallback basic schema, may not include all columns

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(50) UNIQUE NOT NULL,
  "email" VARCHAR(100) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(100) NOT NULL,
  "walletAddress" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Raffles table
CREATE TABLE IF NOT EXISTS "raffles" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "imageUrl" VARCHAR(255),
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "status" VARCHAR(20) DEFAULT 'active',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "userId" INTEGER REFERENCES "users"("id")
);

-- Tickets table
CREATE TABLE IF NOT EXISTS "tickets" (
  "id" SERIAL PRIMARY KEY,
  "raffleId" INTEGER REFERENCES "raffles"("id"),
  "userId" INTEGER REFERENCES "users"("id"),
  "ticketNumber" VARCHAR(100) NOT NULL,
  "purchased" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Winners table
CREATE TABLE IF NOT EXISTS "winners" (
  "id" SERIAL PRIMARY KEY,
  "raffleId" INTEGER REFERENCES "raffles"("id"),
  "userId" INTEGER REFERENCES "users"("id"),
  "ticketId" INTEGER REFERENCES "tickets"("id"),
  "prizeDescription" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

${createSessionsTableSQL()}
${createUserSessionsTableSQL()}
      `;
      
      // Write fallback SQL to file
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const filePath = path.join(outputDir, `${timestamp}_fallback_schema.sql`);
      fs.writeFileSync(filePath, fallbackSQL);
      
      console.log(`\n⚠️ Generated a fallback basic schema: ${filePath}`);
      console.log('\n--- SQL FILE CONTENTS ---\n');
      console.log(fallbackSQL);
      console.log('\n-------------------------\n');
      
      console.log(`📋 Instructions for Supabase Migration:\n`);
      console.log(`1. Go to your Supabase project dashboard`);
      console.log(`2. Navigate to "SQL Editor" in the sidebar`);
      console.log(`3. Create a new query`);
      console.log(`4. Copy and paste the SQL from: ${filePath}`);
      console.log(`5. Review the SQL before executing - this is a fallback schema`);
      console.log(`6. Execute the query`);
      console.log(`\n⚠️ Note: This is a basic schema that may need adjustments`);
    }
  } catch (error) {
    console.error('❌ Schema generation failed:', error);
    process.exit(1);
  }
}

// Run the function
generateSchemaSQL().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
