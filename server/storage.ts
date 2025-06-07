import { 
  User, InsertUser, 
  Raffle, InsertRaffle, 
  Ticket, InsertTicket, 
  Winner, InsertWinner, 
  users, raffles, tickets, winners 
} from "./db.js";
import { sendWinnerNotification } from './emailService.js';
import { log } from './utils/logger.js';

export interface IStorage {
  // Database initialization
  initializeData(): Promise<void>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  // Raffle methods
  getRaffle(id: number): Promise<Raffle | undefined>;
  getRaffles(activeOnly?: boolean): Promise<Raffle[]>;
  getFeaturedRaffle(): Promise<Raffle | undefined>;
  createRaffle(raffle: InsertRaffle): Promise<Raffle>;
  updateRaffle(id: number, data: Partial<Omit<Raffle, 'id' | 'createdAt' | 'userId'>>): Promise<Raffle | null>;
  endRaffle(id: number): Promise<Winner | undefined>;
  deleteRaffle(id: number): Promise<Raffle | null>;

  // Ticket methods
  getTicketById(id: number): Promise<Ticket | undefined>;
  getTicketsByRaffle(raffleId: number): Promise<Ticket[]>;
  getTicketsByUser(userId: number): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicketCount(raffleId: number): Promise<number>;
  createPendingTicket(raffleId: number, userId: number): Promise<Ticket | null>;
  updateTicketInvoiceDetails(ticketId: number, btcpayInvoiceId: string, reservedAt: Date): Promise<Ticket | null>;
  getTicketByInvoiceId(invoiceId: string): Promise<Ticket | null>;
  updateTicketStatus(ticketId: number, status: 'paid' | 'expired'): Promise<Ticket | null>;

  // Winner methods
  getWinner(id: number): Promise<Winner | undefined>;
  getWinners(): Promise<Winner[]>;
  getWinnerByRaffle(raffleId: number): Promise<Winner | undefined>;
  getWinnersByUser(userId: number): Promise<Winner[]>;
  createWinner(winner: InsertWinner): Promise<Winner>;
  updateWinner(id: number, winner: Partial<Winner>): Promise<Winner | undefined>;
  notifyWinner(winnerId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private raffles: Map<number, Raffle>;
  private tickets: Map<number, Ticket>;
  private winners: Map<number, Winner>;
  
  private userIdCounter: number;
  private raffleIdCounter: number;
  private ticketIdCounter: number;
  private winnerIdCounter: number;

  constructor() {
    this.users = new Map();
    this.raffles = new Map();
    this.tickets = new Map();
    this.winners = new Map();
    
    this.userIdCounter = 1;
    this.raffleIdCounter = 1;
    this.ticketIdCounter = 1;
    this.winnerIdCounter = 1;
    
    // Add admin user for testing
    this.createUser({
      username: "admin",
      password: "password",
      email: "admin@bitmon.com",
      isAdmin: true
    });
    
    // Add some initial raffles
    this.createInitialRaffles();
  }

  // Database initialization (satisfies interface, actual init in constructor)
  async initializeData(): Promise<void> {
    // MemStorage initializes in the constructor
    console.log("MemStorage initialized via constructor.");
    return Promise.resolve();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserById(id: number): Promise<User | null> {
    // Use Array.from for safer iteration
    const user = Array.from(this.users.values()).find(user => user.id === id);
    return user ?? null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    // Use type assertion for insertUser to access isAdmin property
    const isAdminValue = (insertUser as any).isAdmin || false;
    
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt, 
      isAdmin: isAdminValue
    };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Raffle methods
  async getRaffle(id: number): Promise<Raffle | undefined> {
    return this.raffles.get(id);
  }

  async getRaffles(activeOnly = false): Promise<Raffle[]> {
    const allRaffles = Array.from(this.raffles.values());
    return activeOnly 
      ? allRaffles.filter(raffle => raffle.isActive)
      : allRaffles;
  }

  async getFeaturedRaffle(): Promise<Raffle | undefined> {
    return Array.from(this.raffles.values()).find(
      (raffle) => raffle.isFeatured && raffle.isActive
    );
  }

  async createRaffle(insertRaffle: InsertRaffle): Promise<Raffle> {
    const id = this.raffleIdCounter++;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    const raffle: Raffle = {
      ...insertRaffle,
      id,
      soldTickets: 0,
      startDate,
      endDate,
      winnerId: null,
      createdAt: new Date(),
      ticketPrice: insertRaffle.ticketPrice ?? 500, // $5.00 default in cents
      backImageUrl: insertRaffle.backImageUrl ?? null,
      priceSource: insertRaffle.priceSource ?? null,
      psaGrade: insertRaffle.psaGrade ?? null,
      psaCertNumber: insertRaffle.psaCertNumber ?? null,
      series: insertRaffle.series ?? null,
      cardDetails: (insertRaffle.cardDetails as string[] | null) ?? [],
      totalTickets: insertRaffle.totalTickets ?? 100,
      isFeatured: insertRaffle.isFeatured ?? false,
      isActive: insertRaffle.isActive ?? true
    };
    
    this.raffles.set(id, raffle);
    return raffle;
  }

  async updateRaffle(id: number, raffleUpdate: Partial<Raffle>): Promise<Raffle | null> {
    const raffle = this.raffles.get(id);
    if (!raffle) {
      console.warn(`MemStorage: Raffle ${id} not found for update.`);
      return null; // Return null if not found
    }
    const updatedRaffle = { ...raffle, ...raffleUpdate };
    this.raffles.set(id, updatedRaffle);
    console.log(`MemStorage: Updated raffle ${id}.`);
    return updatedRaffle;
  }

  async endRaffle(raffleId: number): Promise<Winner | undefined> {
    const raffle = this.raffles.get(raffleId);
    if (!raffle || !raffle.isActive) return undefined;
    
    const raffleTickets = await this.getTicketsByRaffle(raffleId);
    // Filter for paid tickets only before selecting winner
    const paidTickets = raffleTickets.filter(ticket => ticket.status === 'paid');

    if (paidTickets.length === 0) {
       console.warn(`No paid tickets found for raffle ${raffleId} in MemStorage.`);
       return undefined;
    }
    
    // Randomly select a winner from paid tickets
    const winningTicketIndex = Math.floor(Math.random() * paidTickets.length);
    const winningTicket = paidTickets[winningTicketIndex];
    
    // Create winner record
    const winner = await this.createWinner({
      userId: winningTicket.userId,
      raffleId: raffleId,
      ticketId: winningTicket.id,
      claimed: false,
      // announcedAt will be set by createWinner
    } as unknown as InsertWinner);

    // Now update raffle with the correct winner ID
    const updatedRaffle = { 
      ...raffle, 
      isActive: false, 
      winnerId: winner.id, // Use the actual winner record ID
      endDate: new Date() // Set end date
    };
    this.raffles.set(raffleId, updatedRaffle);
        
    return winner;
  }

  // Ticket methods
  async getTicketById(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getTicketsByRaffle(raffleId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (ticket) => ticket.raffleId === raffleId
    );
  }

  async getTicketsByUser(userId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (ticket) => ticket.userId === userId
    );
  }

  async getTicketCount(raffleId: number): Promise<number> {
    const raffle = this.raffles.get(raffleId);
    return raffle ? raffle.soldTickets : 0;
  }

  async createPendingTicket(raffleId: number, userId: number): Promise<Ticket | null> {
    const id = this.ticketIdCounter++;
    const now = new Date();
    const ticket: Ticket = {
      id,
      raffleId,
      userId,
      status: 'pending',
      btcpayInvoiceId: null,
      reservedAt: now,
      purchasedAt: null,
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicketInvoiceDetails(ticketId: number, btcpayInvoiceId: string, reservedAt: Date): Promise<Ticket | null> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;
    const updatedTicket = { ...ticket, btcpayInvoiceId, reservedAt };
    this.tickets.set(ticketId, updatedTicket);
    return updatedTicket;
  }

  async getTicketByInvoiceId(invoiceId: string): Promise<Ticket | null> {
    return Array.from(this.tickets.values()).find(
      (ticket) => ticket.btcpayInvoiceId === invoiceId
    ) || null;
  }

  async updateTicketStatus(ticketId: number, status: 'paid' | 'expired'): Promise<Ticket | null> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;
    const updatedTicket = { ...ticket, status };
    this.tickets.set(ticketId, updatedTicket);
    return updatedTicket;
  }

  // Winner methods
  async getWinner(id: number): Promise<Winner | undefined> {
    return this.winners.get(id);
  }

  async getWinners(): Promise<Winner[]> {
    return Array.from(this.winners.values());
  }

  async getWinnerByRaffle(raffleId: number): Promise<Winner | undefined> {
    return Array.from(this.winners.values()).find(
      (winner) => winner.raffleId === raffleId
    );
  }

  async getWinnersByUser(userId: number): Promise<Winner[]> {
    return Array.from(this.winners.values()).filter(
      (winner) => winner.userId === userId
    );
  }

  async createWinner(insertWinner: InsertWinner): Promise<Winner> {
    const id = this.winnerIdCounter++;
    const announcedAt = new Date();
    
    const winner: Winner = { 
      ...insertWinner, 
      id, 
      announcedAt, 
      claimed: insertWinner.claimed ?? false
    };
    this.winners.set(id, winner);
    return winner;
  }

  async updateWinner(id: number, winnerUpdate: Partial<Winner>): Promise<Winner | undefined> {
    const winner = this.winners.get(id);
    if (!winner) return undefined;
    
    const updatedWinner = { ...winner, ...winnerUpdate };
    this.winners.set(id, updatedWinner);
    return updatedWinner;
  }

  // Add deleteRaffle implementation for MemStorage
  async deleteRaffle(id: number): Promise<Raffle | null> {
    const raffle = this.raffles.get(id);
    if (!raffle) {
      console.warn(`MemStorage: Raffle ${id} not found for deletion.`);
      return null; // Return null if not found
    }

    // Delete associated winners
    const winnersToDelete = Array.from(this.winners.values()).filter(w => w.raffleId === id);
    winnersToDelete.forEach(w => this.winners.delete(w.id));
    console.log(`MemStorage: Deleted ${winnersToDelete.length} winner(s) for raffle ${id}.`);

    // Delete associated tickets
    const ticketsToDelete = Array.from(this.tickets.values()).filter(t => t.raffleId === id);
    ticketsToDelete.forEach(t => this.tickets.delete(t.id));
    console.log(`MemStorage: Deleted ${ticketsToDelete.length} ticket(s) for raffle ${id}.`);

    // Delete the raffle
    this.raffles.delete(id);
    console.log(`MemStorage: Deleted raffle ${id}.`);
    return raffle;
  }

  // Add createTicket implementation for MemStorage (required by IStorage)
  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    // Use force number conversion for IDs
    const raffleId = typeof insertTicket.raffleId === 'object' ? 
      Number((insertTicket.raffleId as any)[0]) : Number(insertTicket.raffleId);
    
    const userId = typeof insertTicket.userId === 'object' ? 
      Number((insertTicket.userId as any)[0]) : Number(insertTicket.userId);
    
    const raffle = this.raffles.get(raffleId);
    if (!raffle) {
      throw new Error(`MemStorage: Raffle ${raffleId} not found for ticket creation.`);
    }

    const id = this.ticketIdCounter++;
    const now = new Date();
    const newTicket: Ticket = {
      id,
      raffleId: raffleId,
      userId: userId,
      status: 'paid', // Assume direct creation means paid
      btcpayInvoiceId: null, // Not applicable for direct creation?
      reservedAt: now, // Set reservation time
      purchasedAt: now, // Set purchase time
    };
    this.tickets.set(id, newTicket);

    // Increment soldTickets count on the raffle
    const updatedRaffle = { ...raffle, soldTickets: raffle.soldTickets + 1 };
    this.raffles.set(raffle.id, updatedRaffle);

    return newTicket;
  }

  // Helper method to create initial raffles
  private async createInitialRaffles() {
    // Create array of raffle data with proper type casting
    const raffleData = [
      {
        title: "Charizard VMAX",
        description: "Charizard VMAX is one of the most sought-after cards from the Sword & Shield series. This powerhouse Pokémon features stunning artwork and is a must-have for serious collectors.",
        imageUrl: "https://images.unsplash.com/photo-1628960198207-27ead1f96182?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        retailPrice: 29999, // $299.99
        winnerPrice: 14999, // $149.99
        ticketPrice: 999, // $9.99
        rarity: "Rare",
        series: "Sword & Shield Series",
        cardDetails: ["PSA Graded 9", "Special Holographic Pattern", "Released in 2021", "Limited Print Run"],
        totalTickets: 100,
        isActive: true,
        isFeatured: false
      } as unknown as InsertRaffle,
      {
        title: "Pikachu V-Union",
        description: "This special Pikachu V-Union card combines four cards to create one powerful Pokémon. A unique addition to any collection with stunning artwork.",
        imageUrl: "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        retailPrice: 24999, // $249.99
        winnerPrice: 12499, // $124.99
        ticketPrice: 799, // $7.99
        rarity: "Ultra Rare",
        series: "Celebrations",
        cardDetails: ["Mint Condition", "Special 25th Anniversary Edition", "Limited Availability", "Celebrates Pokemon History"],
        totalTickets: 100,
        isActive: true,
        isFeatured: false
      } as unknown as InsertRaffle,
      {
        title: "Lugia Legend (Top Half)",
        description: "Part of the LEGEND series, this Lugia card requires both halves to be played. Known for its unique artwork and game mechanics.",
        imageUrl: "https://images.unsplash.com/photo-1609845768478-3049829755a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        retailPrice: 19999, // $199.99
        winnerPrice: 9999, // $99.99
        ticketPrice: 599, // $5.99
        rarity: "Legend Rare",
        series: "HeartGold & SoulSilver",
        cardDetails: ["Top Half Only", "Requires Bottom Half to Play", "Holographic", "Collectible LEGEND Series"],
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
        ticketPrice: 1299, // $12.99
        rarity: "Ultra Premium",
        series: "Movie Promo",
        cardDetails: ["Sealed in Original Package", "Ancient Hieroglyphic Text", "Movie Promotional Item", "Collector's Item"],
        totalTickets: 100,
        isActive: true,
        isFeatured: true
      } as unknown as InsertRaffle
    ];

    for (const raffle of raffleData) {
      await this.createRaffle(raffle);
    }
    
    // Add some initial tickets to raffles
    const raffleList = await this.getRaffles();
    if (raffleList.length > 0) {
      const user = await this.getUserByUsername('admin');
      if (user) {
        for (const raffle of raffleList) {
          const initialTickets = Math.floor(Math.random() * 70) + 30; // 30-99 tickets
          for (let i = 0; i < initialTickets; i++) {
            await this.createTicket({
              raffleId: raffle.id,
              userId: user.id
            });
          }
        }
      }
    }
  }

  async notifyWinner(winnerId: number): Promise<boolean> {
    try {
      // Get the winner record
      const winner = this.winners.get(winnerId);
      if (!winner) {
        log(`Winner with ID ${winnerId} not found in MemStorage.`);
        return false;
      }

      // Get the user
      const user = this.users.get(winner.userId);
      if (!user) {
        log(`User associated with winner ID ${winnerId} not found in MemStorage.`);
        return false;
      }

      // Get the raffle
      const raffle = this.raffles.get(winner.raffleId);
      if (!raffle) {
        log(`Raffle associated with winner ID ${winnerId} not found in MemStorage.`);
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
      const updatedWinner = { ...winner, announcedAt: new Date() };
      this.winners.set(winnerId, updatedWinner);

      log(`Winner notification email sent successfully to ${user.email}`);
      return true;
    } catch (error) {
      log(`Error sending winner notification email: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

// Import the DatabaseStorage class
import { DatabaseStorage } from './DatabaseStorage.js';

// Create and export a DatabaseStorage instance instead of MemStorage
export const storage = new DatabaseStorage();

// Export MemStorage for development without DB
// export const storage = new MemStorage();
