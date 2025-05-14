import { sql } from "drizzle-orm";
import { MigrationBuilder } from "drizzle-orm/migrator";

/**
 * Adds BTCPay integration fields to the tickets table for Postgres.
 */
export async function up({ db }: MigrationBuilder) {
    await db.run(sql`ALTER TABLE tickets ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'pending';`);
    await db.run(sql`ALTER TABLE tickets ADD COLUMN btcpay_invoice_id VARCHAR(255);`);
    await db.run(sql`ALTER TABLE tickets ADD COLUMN reserved_at TIMESTAMP;`);
}

export async function down({ db }: MigrationBuilder) {
    await db.run(sql`ALTER TABLE tickets DROP COLUMN reserved_at;`);
    await db.run(sql`ALTER TABLE tickets DROP COLUMN btcpay_invoice_id;`);
    await db.run(sql`ALTER TABLE tickets DROP COLUMN status;`);
}