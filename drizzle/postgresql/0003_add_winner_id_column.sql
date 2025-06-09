-- 0003_add_winner_id_column.sql
-- Add winner_id column and foreign key constraint for raffles

-- Add the column if it does not exist
ALTER TABLE "raffles"
  ADD COLUMN IF NOT EXISTS "winner_id" integer;

-- Add foreign key constraint if missing, catch errors for undefined column or existing constraint
DO $$
BEGIN
  ALTER TABLE "raffles"
    ADD CONSTRAINT "raffles_winner_id_users_id_fk"
    FOREIGN KEY ("winner_id")
    REFERENCES "users"("id")
    ON DELETE NO ACTION
    ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object OR undefined_column THEN NULL;
END $$;
