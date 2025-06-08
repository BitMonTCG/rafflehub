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
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire");

-- Alternative session table name for backward compatibility
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "sid" VARCHAR NOT NULL PRIMARY KEY,
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");

-- Add any additional indexes for performance
CREATE INDEX IF NOT EXISTS "idx_tickets_raffle_id" ON "tickets" ("raffle_id");
CREATE INDEX IF NOT EXISTS "idx_tickets_user_id" ON "tickets" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_winners_raffle_id" ON "winners" ("raffle_id");
