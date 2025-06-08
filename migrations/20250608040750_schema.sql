ALTER TABLE "raffles" ADD COLUMN "back_image_url" text;--> statement-breakpoint
ALTER TABLE "raffles" ADD COLUMN "ticket_price" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "raffles" ADD COLUMN "price_source" text;--> statement-breakpoint
ALTER TABLE "raffles" ADD COLUMN "psa_grade" integer;--> statement-breakpoint
ALTER TABLE "raffles" ADD COLUMN "psa_cert_number" text;
-- Create sessions table for connect-pg-simple
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar NOT NULL,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire");

-- Create user_sessions table (alternative name sometimes used)
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "sid" varchar NOT NULL,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");
