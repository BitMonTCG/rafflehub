-- drizzle/postgresql/0004_ensure_raffle_core_columns.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'raffles' AND column_name = 'retail_price') THEN
        ALTER TABLE "raffles" ADD COLUMN "retail_price" integer NOT NULL DEFAULT 0;
    END IF;
END;
$$;
--> statement-breakpoint
-- Ensure default is dropped and NOT NULL is set, mimicking 0002's final state for these columns
-- This assumes the column now exists (either pre-existing or just added)
DO $$ BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'raffles' AND column_name = 'retail_price') THEN 
        ALTER TABLE "raffles" ALTER COLUMN "retail_price" DROP DEFAULT;
        ALTER TABLE "raffles" ALTER COLUMN "retail_price" SET NOT NULL;
    END IF; 
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'raffles' AND column_name = 'winner_price') THEN
        ALTER TABLE "raffles" ADD COLUMN "winner_price" integer NOT NULL DEFAULT 0;
    END IF;
END;
$$;
--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'raffles' AND column_name = 'winner_price') THEN 
        ALTER TABLE "raffles" ALTER COLUMN "winner_price" DROP DEFAULT;
        ALTER TABLE "raffles" ALTER COLUMN "winner_price" SET NOT NULL;
    END IF; 
END $$;
--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'raffles' AND column_name = 'ticket_price') THEN
        ALTER TABLE "raffles" ADD COLUMN "ticket_price" integer NOT NULL DEFAULT 0;
    END IF;
END;
$$;
--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'raffles' AND column_name = 'ticket_price') THEN 
        ALTER TABLE "raffles" ALTER COLUMN "ticket_price" DROP DEFAULT;
        ALTER TABLE "raffles" ALTER COLUMN "ticket_price" SET NOT NULL;
    END IF; 
END $$;
