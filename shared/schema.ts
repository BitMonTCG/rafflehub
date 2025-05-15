import { pgTable, text as pgText, serial, integer as pgInteger, boolean as pgBoolean, timestamp as pgTimestamp, json } from "drizzle-orm/pg-core";
import { sqliteTable, text as sqliteText, integer as sqliteInteger, real as sqliteReal } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from 'drizzle-orm';

const isProduction = process.env.NODE_ENV === 'production';

// Define common column types or use conditional logic
const primaryKey = () => isProduction ? serial("id").primaryKey() : sqliteInteger('id', { mode: 'number' }).primaryKey({ autoIncrement: true });
const text = (name: string) => isProduction ? pgText(name) : sqliteText(name);
const textNotNull = (name: string) => isProduction ? pgText(name).notNull() : sqliteText(name).notNull();
const textUniqueNotNull = (name: string) => isProduction ? pgText(name).notNull().unique() : sqliteText(name).notNull().unique();
const integer = (name: string) => isProduction ? pgInteger(name) : sqliteInteger(name, { mode: 'number' });
const integerNotNull = (name: string) => isProduction ? pgInteger(name).notNull() : sqliteInteger(name, { mode: 'number' }).notNull();
const boolean = (name: string, defaultValue: boolean) => isProduction ? pgBoolean(name).default(defaultValue).notNull() : sqliteInteger(name, { mode: 'boolean' }).default(defaultValue).notNull();
const timestamp = (name: string) => isProduction ? pgTimestamp(name).defaultNow().notNull() : sqliteInteger(name, { mode: 'timestamp_ms' }).default(sql`(strftime('%s', 'now') * 1000)`).notNull();
const timestampNullable = (name: string) => isProduction ? pgTimestamp(name) : sqliteInteger(name, { mode: 'timestamp_ms' });
const jsonText = <T>(name: string, defaultValue?: T) => isProduction 
  ? json(name).$type<T>().default(defaultValue as any) // PG uses json
  : sqliteText(name, { mode: 'json' }).$type<T>().default(defaultValue as any); // SQLite uses text with json mode

// Use a conditional table function
const table = (name: string, columns: any) => isProduction ? pgTable(name, columns) : sqliteTable(name, columns);

// --- Schemas using conditional types ---

// User schema
export const users = table("users", {
  id: primaryKey(),
  username: textUniqueNotNull("username"),
  password: textNotNull("password"),
  email: textUniqueNotNull("email"),
  isAdmin: boolean("is_admin", false),
  createdAt: timestamp("created_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
});

// Raffle schema
export const raffles = table("raffles", {
  id: primaryKey(),
  title: textNotNull("title"),
  description: textNotNull("description"),
  imageUrl: textNotNull("image_url"), // Front image URL
  backImageUrl: text("back_image_url"), // Back image URL
  retailPrice: integerNotNull("retail_price"), // in cents
  winnerPrice: integerNotNull("winner_price"), // in cents
  priceSource: text("price_source"), // Source of pricing data (e.g., eBay, PSA, pricecharting, collectr)
  rarity: textNotNull("rarity"),
  psaGrade: integer("psa_grade"), // PSA grade (1-10)
  psaCertNumber: text("psa_cert_number"), // PSA certification number
  series: text("series"),
  cardDetails: jsonText<string[]>("card_details", []),
  totalTickets: integerNotNull("total_tickets").default(100),
  soldTickets: integerNotNull("sold_tickets").default(0),
  startDate: timestamp("start_date"),
  endDate: timestampNullable("end_date"),
  isFeatured: boolean("is_featured", false),
  isActive: boolean("is_active", true),
  winnerId: integer("winner_id"), //.references(() => users.id), // References might need conditional handling or removal for simplicity across DBs
  createdAt: timestamp("created_at"),
});

// TODO: Review if foreign key references work seamlessly between pg/sqlite or need adjustments
// For now, commented out raffle -> user reference in definition

export const insertRaffleSchema = createInsertSchema(raffles).omit({
  id: true,
  soldTickets: true,
  startDate: true,
  endDate: true,
  winnerId: true,
  createdAt: true,
});

// Ticket schema
export const tickets = table("tickets", {
  id: primaryKey(),
  raffleId: integerNotNull("raffle_id"), //.references(() => raffles.id),
  userId: integerNotNull("user_id"), //.references(() => users.id),
  // Timestamp of when the ticket was paid; null for pending/expired
  purchasedAt: timestampNullable("purchased_at"),
  // New fields for BTCPay integration and ticket reservation
  status: textNotNull("status").default('pending'), // 'pending', 'paid', 'expired'
  btcpayInvoiceId: text("btcpay_invoice_id"), // Invoice ID from BTCPay
  reservedAt: timestampNullable("reserved_at"), // When reservation was created
});

// TODO: Review FKs for tickets table

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  purchasedAt: true,
  status: true,
  btcpayInvoiceId: true,
  reservedAt: true,
});

// Winner schema
export const winners = table("winners", {
  id: primaryKey(),
  userId: integerNotNull("user_id"), //.references(() => users.id),
  raffleId: integerNotNull("raffle_id"), //.references(() => raffles.id),
  ticketId: integerNotNull("ticket_id"), //.references(() => tickets.id),
  claimed: boolean("claimed", false),
  announcedAt: timestamp("announced_at"),
});

// TODO: Review FKs for winners table

export const insertWinnerSchema = createInsertSchema(winners).omit({
  id: true,
  announcedAt: true,
});

// Type definitions (should remain compatible)
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Raffle = typeof raffles.$inferSelect;
export type InsertRaffle = z.infer<typeof insertRaffleSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type Winner = typeof winners.$inferSelect;
export type InsertWinner = z.infer<typeof insertWinnerSchema>;
