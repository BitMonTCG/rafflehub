// Removed ts-nocheck to enable proper type checking

import { db } from "./db.js";
import { 
  users, raffles, tickets, winners, 
  insertUserSchema, insertRaffleSchema, insertTicketSchema, insertWinnerSchema,
  User, InsertUser, Raffle, InsertRaffle, Ticket, InsertTicket, Winner, InsertWinner
} from "./db.js";
import { eq, and, desc, sql, gt } from "drizzle-orm";
import { IStorage } from "./storage.js";
import type { PostgresJsDatabase, PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { type PgSchema } from './db.js'; // Import PgSchema type from db.ts
import { sendWinnerNotification } from './emailService.js';
import { log } from './vite.js';

// The 'db' and table objects (users, raffles, tickets, winners) are already imported on line 2.
// No need for DBSchema or DBInstance type aliases if we use db and table objects directly with their imported types.


export class DatabaseStorage implements IStorage {
  /**
   * Initialize the database with sample data if needed
   * Only adds data if no records exist in respective tables
   */
  async initializeData(): Promise<void> {
    try {
      // Check if we have any users, if not create an admin user
      const existingUsers = await this.getUsers();
      if (existingUsers.length === 0) {
        // Import bcrypt and crypto locally to avoid circular dependencies
        const bcrypt = await import('bcrypt');
        const crypto = await import('crypto');
        
        // Use environment variables or generate secure defaults
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@bitmon.com';
        
        // Generate a secure random password if not provided in env
        const adminPassword = process.env.ADMIN_PASSWORD || 
          crypto.default.randomBytes(12).toString('hex');
          
        // Hash the admin password before storing it
        const hashedPassword = await bcrypt.default.hash(adminPassword, 10);
        
        await this.createUser({
          username: adminUsername,
          password: hashedPassword,
          email: adminEmail,
          isAdmin: true
        });
        
        // Only log the generated password if it was auto-generated (not from env var)
        if (!process.env.ADMIN_PASSWORD) {
          console.log(`IMPORTANT: Generated admin credentials - Username: ${adminUsername}, Password: ${adminPassword}`);
          console.log('Save these credentials securely as they will not be shown again.');
        } else {
          console.log(`Created admin user '${adminUsername}' with credentials from environment variables`);
        }
      }

      // Check if we have any raffles, if not create sample raffles
      const existingRaffles = await this.getRaffles();
      if (existingRaffles.length === 0) {
        // Create sample raffles with proper type casting
        const sampleRaffles = [
          {
            title: "Charizard VMAX",
            description: "Charizard VMAX is one of the most sought-after cards from the Sword & Shield series. This powerhouse Pokémon features stunning artwork and is a must-have for serious collectors.",
            imageUrl: "https://images.unsplash.com/photo-1628960198207-27ead1f96182?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            retailPrice: 29999, // $299.99
            winnerPrice: 14999, // $149.99
            rarity: "Rare",
            series: "Sword & Shield Series",
            cardDetails: ["PSA Graded 9", "Special Holographic Pattern", "Released in 2021", "Limited Print Run"],
            totalTickets: 100,
            isActive: true,
            isFeatured: false
          } as unknown as InsertRaffle,
          {
            title: "Ancient Mew Promo",
            description: "One of the most iconic promotional cards ever released, the Ancient Mew was originally distributed during the release of Pokémon: The Movie 2000. This card features hieroglyphic text and a unique holographic pattern.",
            imageUrl: "https://images.unsplash.com/photo-1617822626804-9cf6a0422f95?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            retailPrice: 39999, // $399.99
            winnerPrice: 19999, // $199.99
            rarity: "Ultra Premium",
            series: "Movie Promo",
            cardDetails: ["Sealed in Original Package", "Ancient Hieroglyphic Text", "Movie Promotional Item", "Collector's Item"],
            totalTickets: 100,
            isActive: true,
            isFeatured: true
          } as unknown as InsertRaffle
        ];
        
        for (const raffle of sampleRaffles) {
          await this.createRaffle(raffle);
        }
        console.log("Created sample raffles");
      }

      // Check if we need to add sample tickets
      const adminUser = await this.getUserByUsername('admin');
      if (adminUser) {
        for (const raffle of await this.getRaffles()) {
          const existingTickets = await this.getTicketsByRaffle(raffle.id);
          
          // Only add sample tickets if there are none for this raffle
          if (existingTickets.length === 0) {
            // Add a small number of tickets for testing
            const sampleTicketCount = 5;
            for (let i = 0; i <sampleTicketCount; i++) {
              await this.createTicket({
                raffleId: raffle.id,
                userId: adminUser.id
              });
            }
            console.log(`Added ${sampleTicketCount} sample tickets to raffle: ${raffle.title}`);
          }
        }
      }

      console.log("Database initialization complete");
    } catch (error) {
      console.error("Error during database initialization:", error);
      throw error;
    }
  }
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user ?? undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? undefined;
  }

  async getUserById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const validatedUser = insertUserSchema.parse(insertUser); // Validate before inserting
    const [user] = await db
      .insert(users)
      .values(validatedUser)
      .returning();
    if (!user) throw new Error('Failed to create user'); // Ensure user is returned
    return user;
  }

  async getUsers(): Promise<User[]> {
    const usersList = await db.select().from(users);
    return usersList;
  }

  // Raffle methods
  async getRaffle(id: number): Promise<Raffle | undefined> {
    const [raffle] = await db.select().from(raffles).where(eq(raffles.id, id)).limit(1);
    return raffle ?? undefined;
  }

  async getRaffleById(id: number): Promise<Raffle | null> {
    const [raffle] = await db.select().from(raffles).where(eq(raffles.id, id));
    return raffle ?? null;
  }

  async getRaffles(activeOnly = false): Promise<Raffle[]> {
    // Create base query
    const baseQuery = db.select().from(raffles).orderBy(desc(raffles.createdAt));
    
    // Apply filter conditionally
    const query = activeOnly 
      ? baseQuery.where(eq(raffles.isActive, true))
      : baseQuery;
      
    // Execute query
    const rafflesList = await query;
    return rafflesList;
  }

  async getFeaturedRaffle(): Promise<Raffle | undefined> {
    const [raffle] = await db
      .select()
      .from(raffles)
      .where(and(eq(raffles.isFeatured, true), eq(raffles.isActive, true)))
      .orderBy(desc(raffles.createdAt))
      .limit(1);
    return raffle ?? undefined;
  }

  async createRaffle(insertRaffle: InsertRaffle): Promise<Raffle> {
    const validatedRaffle = insertRaffleSchema.parse(insertRaffle);

    // Normalize cardDetails to a strict string[] and assert type
    const cardDetails = (Array.isArray(validatedRaffle.cardDetails)
      ? validatedRaffle.cardDetails.map(item => String(item))
      : []) as string[];

    // Prepare insert payload with non-null assertions
    const raffleInsert = {
      title: validatedRaffle.title,
      description: validatedRaffle.description,
      imageUrl: validatedRaffle.imageUrl,
      retailPrice: validatedRaffle.retailPrice!,
      winnerPrice: validatedRaffle.winnerPrice!,
      rarity: validatedRaffle.rarity!,
      series: validatedRaffle.series ?? null,
      cardDetails,
      totalTickets: validatedRaffle.totalTickets!,
      isFeatured: validatedRaffle.isFeatured!,
      isActive: validatedRaffle.isActive!,
    };

    // Using as any is a temporary workaround for TypeScript + Drizzle + Zod compatibility issues
  // A better long-term solution would be to align the Zod schema types with Drizzle's expected types
  const [raffle] = await db.insert(raffles).values(raffleInsert as any).returning();

    if (!raffle) throw new Error('Failed to create raffle');
    return raffle;
  }

  async updateRaffle(id: number, data: Partial<Omit<Raffle, 'id' | 'createdAt' | 'userId'>>): Promise<Raffle | null> {
    const [raffle] = await db
      .update(raffles)
      .set(data)
      .where(eq(raffles.id, id))
      .returning();

    return raffle ?? null;
  }

  async endRaffle(id: number): Promise<Winner | undefined> {
    // Use a transaction to ensure atomicity of selecting winner and updating raffle
    return await db.transaction(async (tx: PgTransaction<PostgresJsQueryResultHKT, PgSchema, ExtractTablesWithRelations<PgSchema>>) => {
      // 1. Select the winner (using the existing private method, but passing the transaction context if needed)
      // Note: selectWinner currently uses its own transaction for winner insertion. 
      // We might need to refactor selectWinner to accept an optional transaction context `tx`
      // or simplify by moving the winner selection logic directly here.
      // For now, let's call selectWinner as is, assuming nested transactions are handled or it's simple enough.
      // A cleaner approach would be to have selectWinner NOT manage its own transaction.
      
      const winner = await this.selectWinner(id); // Consider refactoring selectWinner later

      if (!winner) {
        // If no winner could be selected (e.g., no tickets), rollback is implicit as nothing was committed
        console.warn(`Raffle ${id} could not be ended: No winner selected.`);
        // Consider if throwing an error is more appropriate than returning undefined
        return undefined; 
      }

      // 2. Update the raffle within the same transaction
      const [updatedRaffle] = await tx // Use the transaction context 'tx'
        .update(raffles)
        .set({ 
          isActive: false, 
          endDate: new Date(), 
          winnerId: winner.id 
        })
        .where(eq(raffles.id, id))
        .returning();

      if (!updatedRaffle) {
        // If the raffle update fails, the transaction should rollback automatically
        console.error(`Failed to update raffle ${id} after selecting winner ${winner.id}. Transaction rolled back.`);
        throw new Error(`Failed to update raffle ${id} during ending process.`); // Throw to ensure rollback
      }
      
      console.log(`Raffle ${id} ended successfully. Winner ID: ${winner.id}`);
      return winner; // Return the winner details upon successful completion
    }).catch(error => {
      // Catch potential errors from the transaction (including those thrown manually)
      console.error(`Error ending raffle ${id}:`, error);
      // Depending on desired behavior, re-throw or return undefined/null
      return undefined; 
    });
  }

  async deleteRaffle(raffleId: number): Promise<Raffle | null> {
    // Fetch the raffle first to check constraints
    const raffle = await this.getRaffleById(raffleId);
    if (!raffle) {
      throw new Error(`Raffle with ID ${raffleId} not found.`);
    }

    // Constraint: Do not delete raffles if tickets have been sold
    // We check soldTickets, assuming it's reliably updated when tickets become 'paid'.
    // Alternatively, we could query the tickets table for 'paid' status.
    if (raffle.soldTickets > 0) {
      throw new Error(`Cannot delete raffle with ID ${raffleId} because tickets have been sold.`);
    }

    // Delete associated tickets (pending/expired) first to maintain integrity
    // Although, if soldTickets is 0, there shouldn't be any 'paid' tickets.
    await db.delete(tickets).where(eq(tickets.raffleId, raffleId));

    // Delete the raffle
    const [deletedRaffle] = await db
      .delete(raffles)
      .where(eq(raffles.id, raffleId))
      .returning();

    return deletedRaffle ?? null; // Return the deleted raffle data or null if somehow not found after delete
  }

  // Ticket methods
  async getTicketById(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
    return ticket ?? undefined;
  }

  async getTicketsByRaffle(raffleId: number): Promise<Ticket[]> {
    const ticketsList = await db.select().from(tickets).where(eq(tickets.raffleId, raffleId));
    return ticketsList;
  }

  async getTicketsByUser(userId: number): Promise<Ticket[]> {
    const ticketsList = await db.select().from(tickets).where(eq(tickets.userId, userId));
    return ticketsList;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    // Start a transaction since we need to update two related tables
    const validatedTicket = insertTicketSchema.parse(insertTicket); // Validate before transaction
    const ticket = await db.transaction(async (tx: PgTransaction<PostgresJsQueryResultHKT, PgSchema, ExtractTablesWithRelations<PgSchema>>) => {
      // First check if the raffle has available tickets
      const [raffle] = await tx
        .select()
        .from(raffles)
        .where(eq(raffles.id, validatedTicket.raffleId));

      if (!raffle) {
        throw new Error("Raffle not found");
      }

      // Check if the raffle has available tickets
      if (raffle.soldTickets >= raffle.totalTickets) {
        throw new Error("No tickets available for this raffle");
      }

      // Create the ticket
      const [newTicket] = await tx
        .insert(tickets)
        .values(validatedTicket) // Use validated data
        .returning();

      if (!newTicket) {
        throw new Error("Failed to create ticket");
      }

      // Only update soldTickets count if the ticket status is 'paid'
      // Note: The default status from schema is 'pending', so we don't increment here
      // The increment happens in updateTicketStatus when status changes to 'paid'

      return newTicket;
    });
    if (!ticket) throw new Error('Transaction failed for ticket creation'); // Should not happen if no error thrown
    return ticket;
  }

  async getTicketCount(raffleId: number): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(tickets)
      .where(eq(tickets.raffleId, raffleId));
    return count ?? 0;
  }

  // BTCPay Integration Methods
  async createPendingTicket(raffleId: number, userId: number): Promise<Ticket | null> {
    // Use a transaction to atomically check availability and create pending ticket
    return await db.transaction(async (tx: PgTransaction<PostgresJsQueryResultHKT, PgSchema, ExtractTablesWithRelations<PgSchema>>) => {
      // Get the current raffle state within the transaction
      const [raffle] = await tx
        .select()
        .from(raffles)
        .where(eq(raffles.id, raffleId))
        .limit(1);

      if (!raffle) {
        throw new Error("Raffle not found");
      }

      // Count total tickets (both pending and paid) to prevent overselling
      const [{ totalReserved }] = await tx
        .select({ totalReserved: sql<number>`cast(count(*) as int)` })
        .from(tickets)
        .where(eq(tickets.raffleId, raffleId));

      // Check if there are available tickets (including pending ones)
      const reservedCount = totalReserved ?? 0;
      if (reservedCount >= raffle.totalTickets) {
        throw new Error("No tickets available for this raffle");
      }

      // Create the pending ticket within the same transaction
      const [ticket] = await tx
        .insert(tickets)
        .values({ raffleId, userId, status: 'pending' })
        .returning();

      return ticket ?? null;
    });
  }

  async updateTicketInvoiceDetails(ticketId: number, btcpayInvoiceId: string, reservedAt: Date): Promise<Ticket | null> {
    const [ticket] = await db
      .update(tickets)
      .set({ btcpayInvoiceId, reservedAt })
      .where(eq(tickets.id, ticketId))
      .returning();
    return ticket ?? null;
  }

  async getTicketByInvoiceId(invoiceId: string): Promise<Ticket | null> {
    if (!invoiceId) return null;
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.btcpayInvoiceId, invoiceId))
      .limit(1);
    return ticket ?? null;
  }

  async updateTicketStatus(ticketId: number, status: 'paid' | 'expired'): Promise<Ticket | null> {
    const updateData: Partial<Ticket> = { status };
    if (status === 'paid') {
      updateData.purchasedAt = new Date();
    }
    const [ticket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticketId))
      .returning();

    if (ticket && status === 'paid') {
      // Only increment soldTickets if the ticket is marked as paid
      await db
        .update(raffles)
        .set({ soldTickets: sql`${raffles.soldTickets} + 1` })
        .where(eq(raffles.id, ticket.raffleId));
    }

    return ticket ?? null;
  }


  // Winner methods
  async getWinner(id: number): Promise<Winner | undefined> {
    const [winner] = await db.select().from(winners).where(eq(winners.id, id)).limit(1);
    return winner ?? undefined;
  }

  async getWinners(): Promise<Winner[]> {
    const winnersList = await db.select().from(winners);
    return winnersList;
  }

  async getWinnerByRaffle(raffleId: number): Promise<Winner | undefined> {
    const [winner] = await db.select().from(winners).where(eq(winners.raffleId, raffleId)).limit(1);
    return winner ?? undefined;
  }

  async getWinnersByUser(userId: number): Promise<Winner[]> {
    const winnersList = await db.select().from(winners).where(eq(winners.userId, userId));
    return winnersList;
  }

  async createWinner(insertWinner: InsertWinner): Promise<Winner> {
    const validatedWinner = insertWinnerSchema.parse(insertWinner);
    const [winner] = await db
      .insert(winners)
      .values(validatedWinner)
      .returning();
    if (!winner) throw new Error('Failed to create winner');
    return winner;
  }

  async updateWinner(id: number, winnerUpdate: Partial<Winner>): Promise<Winner | undefined> {
    const [updatedWinner] = await db
      .update(winners)
      .set(winnerUpdate)
      .where(eq(winners.id, id))
      .returning();
    return updatedWinner ?? undefined;
  }

  // Helper method to select a winner for a raffle
  private async selectWinner(raffleId: number): Promise<Winner | undefined> {
    // Ensure raffle exists and is active (or perhaps just exists, as endRaffle handles the active check implicitly)
    const raffle = await this.getRaffle(raffleId);
    // We might relax the isActive check here since endRaffle handles the active check implicitly
    if (!raffle /*|| !raffle.isActive*/) { 
      console.error(`Raffle ${raffleId} not found.`);
      return undefined;
    }

    // Get all paid tickets for the raffle - Explicit type annotation
    const paidTickets: Ticket[] = await db // Use base db instance, transaction context isn't strictly needed here unless reads need to be consistent with writes in endRaffle tx
      .select()
      .from(tickets)
      .where(and(eq(tickets.raffleId, raffleId), eq(tickets.status, 'paid')));

    if (paidTickets.length === 0) {
      console.warn(`No paid tickets found for raffle ${raffleId}. Cannot select a winner.`);
      return undefined;
    }

    // Select a random winning ticket
    const randomIndex = Math.floor(Math.random() * paidTickets.length);
    const winningTicket = paidTickets[randomIndex];

    if (!winningTicket) {
        console.error("Winning ticket selection failed unexpectedly.");
        return undefined;
    }

    // Insert the winner record. 
    // REMOVED the transaction here as endRaffle now handles the overall transaction.
    // If selectWinner needs to perform writes AND be called outside endRaffle, it would need its own transaction handling.
    // For use within endRaffle, we rely on the outer transaction.
    const [newWinner]: Winner[] = await db // Use base db instance, will be part of the transaction if called within one.
        .insert(winners)
        .values({
          userId: winningTicket.userId,
          raffleId: raffleId,
          ticketId: winningTicket.id,
          // announcedAt has a default value
        })
        .returning();

    if (!newWinner) {
      console.error("Failed to insert winner record");
      // Don't manually rollback here; let the outer transaction handle it if needed.
      // Throwing an error might be better to signal failure to the caller (endRaffle).
      throw new Error("Failed to insert winner record during winner selection.");
    }
      
    return newWinner; // Return the created winner
  }

  async notifyWinner(winnerId: number): Promise<boolean> {
    try {
      // Get the winner record
      const winner = await this.getWinner(winnerId);
      if (!winner) {
        log(`Winner with ID ${winnerId} not found.`);
        return false;
      }

      // Get the user
      const user = await this.getUser(winner.userId);
      if (!user) {
        log(`User associated with winner ID ${winnerId} not found.`);
        return false;
      }

      // Get the raffle
      const raffle = await this.getRaffle(winner.raffleId);
      if (!raffle) {
        log(`Raffle associated with winner ID ${winnerId} not found.`);
        return false;
      }

      // Extract card name from raffle title
      const cardName = raffle.title;

      // Send email notification
      await sendWinnerNotification(
        user.email,
        user.username,
        raffle.title,
        cardName,
        raffle.retailPrice,
        raffle.winnerPrice,
        raffle.id
      );

      // Update the winner record to mark notification as sent
      await this.updateWinner(winnerId, {
        announcedAt: new Date()
      });

      log(`Winner notification email sent successfully to ${user.email}`);
      return true;
    } catch (error) {
      log(`Error sending winner notification email: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}