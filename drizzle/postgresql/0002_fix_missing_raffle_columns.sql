ALTER TABLE "raffles" ADD COLUMN "retail_price" integer NOT NULL DEFAULT 0;
ALTER TABLE "raffles" ADD COLUMN "winner_price" integer NOT NULL DEFAULT 0;
ALTER TABLE "raffles" ADD COLUMN "ticket_price" integer NOT NULL DEFAULT 0;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.columns
        WHERE  table_schema = 'public' -- Or your specific schema if not public
        AND    table_name = 'raffles'
        AND    column_name = 'back_image_url'
    ) THEN
        ALTER TABLE "raffles" ADD COLUMN "back_image_url" text;
    END IF;
END;
$$;
ALTER TABLE "raffles" ADD COLUMN "price_source" text;
ALTER TABLE "raffles" ADD COLUMN "psa_grade" integer;
ALTER TABLE "raffles" ADD COLUMN "psa_cert_number" text;

-- Manually update the default value for existing rows before removing the default
UPDATE "raffles" SET "retail_price" = 10000, "winner_price" = 5000, "ticket_price" = 100 WHERE "retail_price" = 0;

-- Now remove the default value to match the schema
ALTER TABLE "raffles" ALTER COLUMN "retail_price" DROP DEFAULT;
ALTER TABLE "raffles" ALTER COLUMN "winner_price" DROP DEFAULT;
ALTER TABLE "raffles" ALTER COLUMN "ticket_price" DROP DEFAULT; 