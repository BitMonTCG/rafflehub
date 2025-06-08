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
      console.log('🔄 Attempting to generate schema directly from schema.ts file...');
      
      try {
        // Import the schema file directly and extract table definitions
        // We need to check if the schema module is available
        const schemaModule = await import('../shared/schema.js');
        if (!schemaModule) {
          throw new Error('Unable to import schema.ts module');
        }
        
        // Extract tables from the schema
        const tables = [
          { name: 'users', schema: schemaModule.users },
          { name: 'raffles', schema: schemaModule.raffles },
          { name: 'tickets', schema: schemaModule.tickets },
          { name: 'winners', schema: schemaModule.winners },
        ];
        
        if (tables.some(t => !t.schema)) {
          throw new Error('One or more required tables not found in schema');
        }
        
        console.log('✅ Successfully parsed schema.ts file');
        console.log('📝 Generating SQL schema from parsed schema definitions...');
        
        // Generate a complete SQL schema based on the schema.ts file
        // This would ideally use Drizzle's own schema-to-SQL functionality
        // For now, we'll fail fast and refer to the alternative approach
        
        // If we're here, we couldn't generate the SQL automatically
        console.error('⚠️ Automatic SQL generation from schema.ts is not fully implemented');
        console.log('👉 Using complete_schema.sql as a stable reference instead');
        
        // Check if complete_schema.sql exists
        const completeSchemaPath = path.join(outputDir, 'complete_schema.sql');
        if (!fs.existsSync(completeSchemaPath)) {
          throw new Error('complete_schema.sql not found. Please run `drizzle-kit generate:pg` manually and update this file.');
        }
        
        // Use the complete schema file
        let sql = fs.readFileSync(completeSchemaPath, 'utf-8');
        
        // Add session tables
        sql += '\n\n-- Adding session management tables\n';
        sql += createSessionsTableSQL();
        sql += createUserSessionsTableSQL();
        
        // Write enhanced schema to file
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const filePath = path.join(outputDir, `${timestamp}_enhanced_schema.sql`);
        fs.writeFileSync(filePath, sql);
        
        console.log(`\n✅ Generated an enhanced schema from complete_schema.sql: ${filePath}`);
        console.log('\n--- SQL FILE CONTENTS ---\n');
        console.log(sql);
        console.log('\n-------------------------\n');
      } catch (innerError) {
        console.error('❌ Failed to generate schema from schema.ts or complete_schema.sql:', innerError.message);
        throw new Error('Could not generate schema SQL: ' + innerError.message);
      }
      
      // Get the most recent file path (from either the try or catch block)
      const recentFiles = fs.readdirSync(outputDir)
        .filter(f => f.endsWith('.sql'))
        .map(f => path.join(outputDir, f))
        .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
      
      const latestFilePath = recentFiles[0] || 'No SQL file generated';
      
      console.log(`📋 Instructions for Supabase Migration:\n`);
      console.log(`1. Go to your Supabase project dashboard`);
      console.log(`2. Navigate to "SQL Editor" in the sidebar`);
      console.log(`3. Create a new query`);
      console.log(`4. Copy and paste the SQL from: ${latestFilePath}`);
      console.log(`5. Review the SQL carefully before executing`);
      console.log(`6. Execute the query`);
      console.log(`\nℹ️ Note: Always review the schema for completeness before executing`);
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
