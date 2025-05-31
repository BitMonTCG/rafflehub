import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemStorage } from '../../server/storage.js';
import { InsertRaffle, InsertTicket, InsertUser } from '../../shared/schema.js';

// Mock the emailService
vi.mock('../../server/emailService', () => ({
  sendWinnerNotification: vi.fn().mockResolvedValue(true),
}));

describe('MemStorage', () => {
  let storage: MemStorage;
  let testUser: any;
  let testRaffle: any;
  
  beforeEach(async () => {
    // Create a new storage instance for each test
    storage = new MemStorage();
    
    // Create a test user
    testUser = await storage.createUser({
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    } as InsertUser);
    
    // Create a test raffle
    testRaffle = await storage.createRaffle({
      title: 'Test Raffle',
      cardName: 'Charizard',
      description: 'A test raffle',
      imageUrl: 'charizard.jpg',
      retailPrice: 100,
      winnerPrice: 50,
      rarity: 'Rare',
      totalTickets: 5,
      isActive: true,
      userId: testUser.id,
    } as InsertRaffle);
  });
  
  describe('getRaffle', () => {
    it('should get a raffle by id', async () => {
      const raffle = await storage.getRaffle(testRaffle.id);
      expect(raffle).toBeDefined();
      expect(raffle?.id).toBe(testRaffle.id);
      expect(raffle?.title).toBe('Test Raffle');
    });
    
    it('should return undefined for non-existent raffle', async () => {
      const raffle = await storage.getRaffle(999);
      expect(raffle).toBeUndefined();
    });
  });
  
  describe('endRaffle', () => {
    it('should return undefined if raffle does not exist', async () => {
      const winner = await storage.endRaffle(999);
      expect(winner).toBeUndefined();
    });
    
    it('should return undefined if raffle is not active', async () => {
      // Update raffle to inactive
      await storage.updateRaffle(testRaffle.id, { isActive: false });
      
      const winner = await storage.endRaffle(testRaffle.id);
      expect(winner).toBeUndefined();
    });
    
    it('should return undefined if no tickets are purchased', async () => {
      const winner = await storage.endRaffle(testRaffle.id);
      expect(winner).toBeUndefined();
    });
    
    it('should return winner when a raffle with tickets ends', async () => {
      // Create a few test tickets for the raffle
      for (let i = 0; i < 3; i++) {
        await storage.createTicket({
          raffleId: testRaffle.id,
          userId: testUser.id,
          status: 'paid',
        } as InsertTicket);
      }
      
      // End the raffle
      const winner = await storage.endRaffle(testRaffle.id);
      
      // Verify winner is selected
      expect(winner).toBeDefined();
      expect(winner?.raffleId).toBe(testRaffle.id);
      expect(winner?.userId).toBe(testUser.id);
      
      // Verify raffle is marked as inactive
      const updatedRaffle = await storage.getRaffle(testRaffle.id);
      expect(updatedRaffle?.isActive).toBe(false);
      expect(updatedRaffle?.winnerId).toBe(winner?.id);
    });
    
    it('should only select from paid tickets', async () => {
      // Create a paid ticket
      await storage.createTicket({
        raffleId: testRaffle.id,
        userId: testUser.id,
        status: 'paid',
      } as InsertTicket);
      
      // Create a pending ticket
      await storage.createTicket({
        raffleId: testRaffle.id,
        userId: testUser.id,
        status: 'pending',
      } as InsertTicket);
      
      // Create an expired ticket
      await storage.createTicket({
        raffleId: testRaffle.id,
        userId: testUser.id,
        status: 'expired',
      } as InsertTicket);
      
      // End the raffle
      const winner = await storage.endRaffle(testRaffle.id);
      
      // Verify winner is selected and it's from the paid ticket
      expect(winner).toBeDefined();
      
      // Get the winner's ticket to verify it was a paid one
      const tickets = await storage.getTicketsByUser(testUser.id);
      const winnerTicket = tickets.find(ticket => 
        ticket.raffleId === testRaffle.id && 
        ticket.userId === winner?.userId && 
        ticket.status === 'paid'
      );
      
      expect(winnerTicket).toBeDefined();
    });
  });
  
  describe('notifyWinner', () => {
    it('should return false if winner does not exist', async () => {
      const result = await storage.notifyWinner(999);
      expect(result).toBe(false);
    });
    
    it('should return true when notification is successful', async () => {
      // Create a ticket
      await storage.createTicket({
        raffleId: testRaffle.id,
        userId: testUser.id,
        status: 'paid',
      } as InsertTicket);
      
      // End the raffle to create a winner
      const winner = await storage.endRaffle(testRaffle.id);
      expect(winner).toBeDefined();
      
      // Notify the winner
      const result = await storage.notifyWinner(winner!.id);
      expect(result).toBe(true);
      
      // Verify winner is marked as notified
      const updatedWinner = await storage.getWinner(winner!.id);
      expect(updatedWinner?.notifiedAt).toBeDefined();
    });
  });
}); 