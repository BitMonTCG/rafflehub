import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User schema
export const users = sqliteTable('users', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull().unique(),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(new Date()).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
});

// Raffle schema
export const raffles = sqliteTable('raffles', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  retailPrice: integer('retail_price').notNull(),
  winnerPrice: integer('winner_price').notNull(),
  rarity: text('rarity').notNull(),
  series: text('series'),
  cardDetails: text('card_details', { mode: 'json' }).$type<string[]>().default([]),
  totalTickets: integer('total_tickets').default(100).notNull(),
  soldTickets: integer('sold_tickets').default(0).notNull(),
  startDate: integer('start_date', { mode: 'timestamp_ms' }).default(new Date()).notNull(),
  endDate: integer('end_date', { mode: 'timestamp_ms' }),
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  winnerId: integer('winner_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(new Date()).notNull(),
});

// Use pick instead of omit for potentially clearer type inference
export const insertRaffleSchema = createInsertSchema(raffles).pick({
  title: true,
  description: true,
  imageUrl: true,
  retailPrice: true,
  winnerPrice: true,
  rarity: true,
  series: true,
  cardDetails: true, // Keep this included
  totalTickets: true,
  isFeatured: true,
  isActive: true,
  // Omitted fields: id, soldTickets, startDate, endDate, winnerId, createdAt
});

// Ticket schema
export const tickets = sqliteTable('tickets', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  raffleId: integer('raffle_id').notNull(),
  userId: integer('user_id').notNull(),
  // Ticket payment timestamp: null until paid
  purchasedAt: integer('purchased_at', { mode: 'timestamp_ms' }),
  // BTCPay integration fields
  status: text('status').notNull().default('pending'),
  btcpayInvoiceId: text('btcpay_invoice_id'),
  reservedAt: integer('reserved_at', { mode: 'timestamp_ms' }),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  status: true,
  btcpayInvoiceId: true,
  reservedAt: true,
  purchasedAt: true,
});

// Winner schema
export const winners = sqliteTable('winners', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  raffleId: integer('raffle_id').notNull(),
  ticketId: integer('ticket_id').notNull(),
  claimed: integer('claimed', { mode: 'boolean' }).default(false).notNull(),
  announcedAt: integer('announced_at', { mode: 'timestamp_ms' }).default(new Date()).notNull(),
});

export const insertWinnerSchema = createInsertSchema(winners).omit({
  id: true,
  announcedAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Raffle = typeof raffles.$inferSelect;
export type InsertRaffle = z.infer<typeof insertRaffleSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type Winner = typeof winners.$inferSelect;
export type InsertWinner = z.infer<typeof insertWinnerSchema>; 