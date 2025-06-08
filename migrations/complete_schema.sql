-- Complete RaffleHub Schema for Supabase
-- This script creates all necessary tables from scratch

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(100) NOT NULL UNIQUE,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "wallet_address" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Raffles table
CREATE TABLE IF NOT EXISTS "raffles" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "image_url" TEXT,
  "back_image_url" TEXT,
  "ticket_price" INTEGER NOT NULL,
  "price_source" TEXT,
  "total_tickets" INTEGER NOT NULL,
  "start_date" TIMESTAMP WITH TIME ZONE,
  "end_date" TIMESTAMP WITH TIME ZONE,
  "status" VARCHAR(50) DEFAULT 'draft',
  "psa_grade" INTEGER,
  "psa_cert_number" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE
);

-- Tickets table
CREATE TABLE IF NOT EXISTS "tickets" (
  "id" SERIAL PRIMARY KEY,
  "raffle_id" INTEGER NOT NULL REFERENCES "raffles"("id") ON DELETE CASCADE,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "ticket_number" VARCHAR(100) NOT NULL,
  "purchased" BOOLEAN DEFAULT FALSE,
  "status" VARCHAR(50) DEFAULT 'available',
  "btcpay_invoice_id" VARCHAR(255),
  "reserved_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("raffle_id", "ticket_number")
);

-- Winners table
CREATE TABLE IF NOT EXISTS "winners" (
  "id" SERIAL PRIMARY KEY,
  "raffle_id" INTEGER NOT NULL REFERENCES "raffles"("id") ON DELETE CASCADE,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "ticket_id" INTEGER REFERENCES "tickets"("id") ON DELETE SET NULL,
  "prize_description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session store for Express sessions
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" VARCHAR NOT NULL PRIMARY KEY,
  "sess" JSONB NOT NULL, -- Changed from JSON to JSONB for better performance and space efficiency
  "expire" TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire");

-- Alternative session table name for backward compatibility
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "sid" VARCHAR NOT NULL PRIMARY KEY,
  "sess" JSONB NOT NULL, -- Changed from JSON to JSONB for better performance and space efficiency
  "expire" TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");

-- Add any additional indexes for performance
CREATE INDEX IF NOT EXISTS "idx_tickets_raffle_id" ON "tickets" ("raffle_id");
CREATE INDEX IF NOT EXISTS "idx_tickets_user_id" ON "tickets" ("user_id");

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at columns
-- Users table trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Raffles table trigger
DROP TRIGGER IF EXISTS update_raffles_updated_at ON "raffles";
CREATE TRIGGER update_raffles_updated_at
    BEFORE UPDATE ON "raffles"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Tickets table trigger
DROP TRIGGER IF EXISTS update_tickets_updated_at ON "tickets";
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON "tickets"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Winners table trigger
DROP TRIGGER IF EXISTS update_winners_updated_at ON "winners";
CREATE TRIGGER update_winners_updated_at
    BEFORE UPDATE ON "winners"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS "idx_winners_raffle_id" ON "winners" ("raffle_id");
