ALTER TABLE "raffles" ADD COLUMN "back_image_url" text;--> statement-breakpoint
ALTER TABLE "raffles" ADD COLUMN "ticket_price" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "raffles" ADD COLUMN "price_source" text;--> statement-breakpoint
ALTER TABLE "raffles" ADD COLUMN "psa_grade" integer;--> statement-breakpoint
ALTER TABLE "raffles" ADD COLUMN "psa_cert_number" text;