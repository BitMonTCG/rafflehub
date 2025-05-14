import { sql } from "drizzle-orm";

export async function up({ db }: { db: any }) {
    // Add status column with default 'pending'
    await db.run(sql`ALTER TABLE tickets ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';`);
    // Add btcpay_invoice_id column (nullable)
    await db.run(sql`ALTER TABLE tickets ADD COLUMN btcpay_invoice_id TEXT;`);
    // Add reserved_at column (nullable, store as INTEGER for timestamp_ms)
    await db.run(sql`ALTER TABLE tickets ADD COLUMN reserved_at INTEGER;`);
}

export async function down({ db }: { db: any }) {
    // SQLite does not support DROP COLUMN directly; you would need to recreate the table if rolling back.
    // For dev, you can leave this empty or log a warning.
    // For production, consider a more robust migration strategy.
    console.warn("Down migration not implemented for SQLite (DROP COLUMN not supported).");
}