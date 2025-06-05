import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema - PostgreSQL only
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
});

// Raffle schema - PostgreSQL only
export const raffles = pgTable("raffles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  backImageUrl: text("back_image_url"),
  retailPrice: integer("retail_price").notNull(), // in cents
  winnerPrice: integer("winner_price").notNull(), // in cents
  ticketPrice: integer("ticket_price").notNull(), // in cents
  priceSource: text("price_source"),
  rarity: text("rarity").notNull(),
  psaGrade: integer("psa_grade"),
  psaCertNumber: text("psa_cert_number"),
  series: text("series"),
  cardDetails: json("card_details").$type<string[]>().default([]),
  totalTickets: integer("total_tickets").default(100).notNull(),
  soldTickets: integer("sold_tickets").default(0).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  winnerId: integer("winner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRaffleSchema = createInsertSchema(raffles, {
  cardDetails: z.array(z.string()).optional()
}).omit({
  id: true,
  soldTickets: true,
  startDate: true,
  endDate: true,
  winnerId: true,
  createdAt: true,
});

// Ticket schema - PostgreSQL only
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  raffleId: integer("raffle_id").notNull().references(() => raffles.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default('pending'), // pending, paid, expired
  btcpayInvoiceId: text("btcpay_invoice_id"),
  reservedAt: timestamp("reserved_at"),
  purchasedAt: timestamp("purchased_at"),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  status: true,
  btcpayInvoiceId: true,
  reservedAt: true,
  purchasedAt: true,
});

// Winner schema - PostgreSQL only
export const winners = pgTable("winners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  raffleId: integer("raffle_id").notNull().references(() => raffles.id),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  claimed: boolean("claimed").default(false).notNull(),
  announcedAt: timestamp("announced_at").defaultNow().notNull(),
});

export const insertWinnerSchema = createInsertSchema(winners).omit({
  id: true,
  announcedAt: true,
});

// Type definitions - PostgreSQL only
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Raffle = typeof raffles.$inferSelect;
export type InsertRaffle = z.infer<typeof insertRaffleSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type Winner = typeof winners.$inferSelect;
export type InsertWinner = z.infer<typeof insertWinnerSchema>;
