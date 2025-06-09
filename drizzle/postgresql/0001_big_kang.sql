DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' -- Adjust if schema is not 'public'
        AND table_name = 'raffles'
        AND column_name = 'back_image_url'
    ) THEN
        ALTER TABLE "raffles" ADD COLUMN "back_image_url" text;
    END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'raffles' AND column_name = 'ticket_price'
    ) THEN
        ALTER TABLE "raffles" ADD COLUMN "ticket_price" integer NOT NULL;
    END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'raffles' AND column_name = 'price_source'
    ) THEN
        ALTER TABLE "raffles" ADD COLUMN "price_source" text;
    END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'raffles' AND column_name = 'psa_grade'
    ) THEN
        ALTER TABLE "raffles" ADD COLUMN "psa_grade" integer;
    END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'raffles' AND column_name = 'psa_cert_number'
    ) THEN
        ALTER TABLE "raffles" ADD COLUMN "psa_cert_number" text;
    END IF;
END$$;