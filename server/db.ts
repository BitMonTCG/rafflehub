import { drizzle as drizzleNeon, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleSqlite, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as pgSchema from '../shared/schema.pg';
import * as sqliteSchema from '../shared/schema.sqlite';

// Type exports for both schemas
export type PgSchema = typeof pgSchema;
export type SqliteSchema = typeof sqliteSchema;

let db: NeonHttpDatabase<PgSchema> | BetterSQLite3Database<SqliteSchema>;
let users: PgSchema['users'] | SqliteSchema['users'];
let raffles: PgSchema['raffles'] | SqliteSchema['raffles'];
let tickets: PgSchema['tickets'] | SqliteSchema['tickets'];
let winners: PgSchema['winners'] | SqliteSchema['winners'];
let insertUserSchema: PgSchema['insertUserSchema'] | SqliteSchema['insertUserSchema'];
let insertRaffleSchema: PgSchema['insertRaffleSchema'] | SqliteSchema['insertRaffleSchema'];
let insertTicketSchema: PgSchema['insertTicketSchema'] | SqliteSchema['insertTicketSchema'];
let insertWinnerSchema: PgSchema['insertWinnerSchema'] | SqliteSchema['insertWinnerSchema'];

if (process.env.NODE_ENV === 'production') {
  // Postgres
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set in production. Did you forget to provision a database?",
    );
  }
  const client = neon(process.env.DATABASE_URL);
  db = drizzleNeon(client, { schema: pgSchema });
  ({ users, raffles, tickets, winners, insertUserSchema, insertRaffleSchema, insertTicketSchema, insertWinnerSchema } = pgSchema);
  console.log('Connected to PostgreSQL (Production)');
} else {
  // SQLite
  const sqlite = new Database('sqlite.db');
  sqlite.pragma('journal_mode = WAL');
  
  // Initialize SQLite connection with Drizzle
  db = drizzleSqlite(sqlite, { schema: sqliteSchema });
  ({ users, raffles, tickets, winners, insertUserSchema, insertRaffleSchema, insertTicketSchema, insertWinnerSchema } = sqliteSchema);
  
  // Create tables if they don't exist
  try {
    console.log('Ensuring SQLite tables exist...');
    
    // Basic schema creation for development
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (unixepoch('now'))
      );
      
      CREATE TABLE IF NOT EXISTS raffles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        retail_price INTEGER NOT NULL,
        winner_price INTEGER NOT NULL,
        rarity TEXT NOT NULL,
        series TEXT,
        card_details TEXT DEFAULT '[]',
        total_tickets INTEGER NOT NULL DEFAULT 100,
        sold_tickets INTEGER NOT NULL DEFAULT 0,
        start_date INTEGER NOT NULL DEFAULT (unixepoch('now')),
        end_date INTEGER,
        is_featured INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        winner_id INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch('now'))
      );
      
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raffle_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        purchased_at INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        btcpay_invoice_id TEXT,
        reserved_at INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS winners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        raffle_id INTEGER NOT NULL,
        ticket_id INTEGER NOT NULL,
        claimed INTEGER NOT NULL DEFAULT 0,
        announced_at INTEGER NOT NULL DEFAULT (unixepoch('now'))
      );
    `);
    
    console.log('Connected to SQLite (Development)');
  } catch (error) {
    console.error('Error setting up SQLite database:', error);
  }
}

export { db, users, raffles, tickets, winners, insertUserSchema, insertRaffleSchema, insertTicketSchema, insertWinnerSchema };