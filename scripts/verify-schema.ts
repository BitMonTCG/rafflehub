/**
 * Database Schema Verification Script
 * 
 * This script verifies that the expected tables from our schema exist in the database
 * after migrations have been applied. It's designed to run in CI/CD to confirm successful migrations.
 */

import '../server/env.js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js';

async function verifySchema() {
  console.log('🔍 Verifying database schema...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }
  
  let sql: ReturnType<typeof postgres> | null = null;
  
  try {
    // Connect to database
    sql = postgres(process.env.DATABASE_URL, {
      ssl: { rejectUnauthorized: false },
      max: 1,
      idle_timeout: 10,
      connect_timeout: 30
    });
    
    console.log('✅ Connected to database');
    
    // Get list of all tables in our schema
    // Direct access to expected table names for more reliable detection
    const schemaTables = ['users', 'raffles', 'tickets', 'winners', 'sessions', 'user_sessions'];
    
    // Alternative dynamic detection if schema structure allows:
    // const schemaTables = Object.entries(schema)
    //  .filter(([_, value]) => value && typeof value === 'object' && 'name' in value)
    //  .map(([key]) => key.toLowerCase());
    
    console.log(`📋 Expected tables from schema: ${schemaTables.join(', ')}`);
    
    // Query existing tables in database
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const existingTables = result.map(row => row.table_name);
    console.log(`📊 Existing tables in database: ${existingTables.join(', ')}`);
    
    // Check if all required tables exist
    const missingTables = schemaTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.error(`❌ Missing tables: ${missingTables.join(', ')}`);
      process.exit(1);
    }
    
    console.log('✅ All required tables exist in the database');
    
    // Optional: Check for critical columns in specific tables
    // For example, verify 'sessions' table has the required columns for connect-pg-simple
    const sessionsColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sessions'
    `;
    
    const requiredSessionColumns = ['sid', 'sess', 'expire'];
    const existingSessionColumns = sessionsColumns.map(row => row.column_name);
    
    const missingSessionColumns = requiredSessionColumns.filter(
      col => !existingSessionColumns.includes(col)
    );
    
    if (missingSessionColumns.length > 0) {
      console.error(`❌ Sessions table missing required columns: ${missingSessionColumns.join(', ')}`);
      process.exit(1);
    }
    
    console.log('✅ Sessions table has all required columns');
    console.log('🎉 Schema verification completed successfully');
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

verifySchema().catch(err => {
  console.error('❌ Unhandled error in schema verification:', err);
  process.exit(1);
});
