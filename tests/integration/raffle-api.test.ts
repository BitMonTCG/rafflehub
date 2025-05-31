import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { MemStorage } from '../../server/storage.js';
import { registerRoutes } from '../../server/routes.js';
import { Server } from 'http';

// Mock the BTCPay service
vi.mock('../../server/btcpayService', () => ({
  createBTCPayInvoice: vi.fn().mockResolvedValue({ 
    id: 'mock-invoice-id', 
    checkoutLink: 'https://mock-btcpay.com/invoice/mock-invoice-id'
  }),
  getBTCPayInvoiceStatus: vi.fn().mockResolvedValue('Paid'),
}));

// Mock the email service
vi.mock('../../server/emailService', () => ({
  sendWinnerNotification: vi.fn().mockResolvedValue(true),
}));

describe('Raffle API Integration Tests', () => {
  let app: Express;
  let server: Server;
  let storage: MemStorage;
  let agent: any;
  let testUser: any;
  let adminUser: any;
  
  beforeAll(async () => {
    // Create Express app
    app = express();
    server = new Server(app);
    
    // Setup middleware
    app.use(express.json());
    app.use(session({
      secret: 'test-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    // Initialize storage
    storage = new MemStorage();
    
    // Setup routes
    server = await registerRoutes(app, storage);
    
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    testUser = await storage.createUser({
      username: 'testuser',
      password: hashedPassword,
      email: 'test@example.com',
      isAdmin: false,
    });
    
    adminUser = await storage.createUser({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      isAdmin: true,
    });
    
    // Create supertest agent
    agent = request.agent(app);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  afterAll(() => {
    // Cleanup
    return new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  });
  
  describe('GET /api/raffles', () => {
    it('should return all raffles', async () => {
      // Create a test raffle first
      await storage.createRaffle({
        title: 'Test Raffle',
        cardName: 'Charizard',
        description: 'Test raffle description',
        imageUrl: 'charizard.jpg',
        retailPrice: 100,
        winnerPrice: 50,
        rarity: 'Rare',
        totalTickets: 10,
        isActive: true,
        userId: adminUser.id,
      });
      
      const response = await agent.get('/api/raffles');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('title', 'Test Raffle');
    });
    
    it('should filter active raffles when query param is provided', async () => {
      // Create an inactive raffle
      await storage.createRaffle({
        title: 'Inactive Raffle',
        cardName: 'Pikachu',
        description: 'Inactive raffle',
        imageUrl: 'pikachu.jpg',
        retailPrice: 50,
        winnerPrice: 25,
        rarity: 'Common',
        totalTickets: 5,
        isActive: false,
        userId: adminUser.id,
      });
      
      const response = await agent.get('/api/raffles?active=true');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Verify all returned raffles are active
      expect(response.body.every((raffle: any) => raffle.isActive)).toBe(true);
      // Verify the inactive raffle is not included
      expect(response.body.some((raffle: any) => raffle.title === 'Inactive Raffle')).toBe(false);
    });
  });
  
  describe('GET /api/raffles/:id', () => {
    it('should return a specific raffle by id', async () => {
      // Create a test raffle
      const raffle = await storage.createRaffle({
        title: 'Specific Raffle',
        cardName: 'Mew',
        description: 'Specific raffle for testing',
        imageUrl: 'mew.jpg',
        retailPrice: 200,
        winnerPrice: 100,
        rarity: 'Ultra Rare',
        totalTickets: 20,
        isActive: true,
        userId: adminUser.id,
      });
      
      const response = await agent.get(`/api/raffles/${raffle.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', raffle.id);
      expect(response.body).toHaveProperty('title', 'Specific Raffle');
      expect(response.body).toHaveProperty('cardName', 'Mew');
    });
    
    it('should return 404 for non-existent raffle id', async () => {
      const response = await agent.get('/api/raffles/9999');
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('POST /api/raffles', () => {
    it('should require authentication', async () => {
      const response = await agent.post('/api/raffles').send({
        title: 'New Raffle',
        cardName: 'Blastoise',
        description: 'New raffle description',
        imageUrl: 'blastoise.jpg',
        retailPrice: 150,
        winnerPrice: 75,
        rarity: 'Rare',
        totalTickets: 15,
      });
      
      expect(response.status).toBe(401);
    });
    
    it('should require admin privileges', async () => {
      // Login as regular user
      await agent.post('/api/login').send({
        username: 'testuser',
        password: 'password123',
      });
      
      const response = await agent.post('/api/raffles').send({
        title: 'New Raffle',
        cardName: 'Blastoise',
        description: 'New raffle description',
        imageUrl: 'blastoise.jpg',
        retailPrice: 150,
        winnerPrice: 75,
        rarity: 'Rare',
        totalTickets: 15,
      });
      
      expect(response.status).toBe(403);
    });
    
    it('should create a new raffle when admin is authenticated', async () => {
      // Login as admin
      await agent.post('/api/login').send({
        username: 'admin',
        password: 'password123',
      });
      
      const newRaffle = {
        title: 'Admin Raffle',
        cardName: 'Venusaur',
        description: 'Admin created raffle',
        imageUrl: 'venusaur.jpg',
        retailPrice: 120,
        winnerPrice: 60,
        rarity: 'Rare',
        totalTickets: 12,
      };
      
      const response = await agent.post('/api/raffles').send(newRaffle);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Admin Raffle');
      expect(response.body).toHaveProperty('isActive', true);
    });
  });
  
  describe('POST /api/raffles/:id/end', () => {
    it('should end a raffle with tickets and select a winner', async () => {
      // Login as admin
      await agent.post('/api/login').send({
        username: 'admin',
        password: 'password123',
      });
      
      // Create a raffle
      const raffle = await storage.createRaffle({
        title: 'Raffle to End',
        cardName: 'Raichu',
        description: 'Raffle that will be ended',
        imageUrl: 'raichu.jpg',
        retailPrice: 80,
        winnerPrice: 40,
        rarity: 'Uncommon',
        totalTickets: 8,
        isActive: true,
        userId: adminUser.id,
      });
      
      // Create some paid tickets
      await storage.createTicket({
        raffleId: raffle.id,
        userId: testUser.id,
        status: 'paid',
      });
      
      // End the raffle
      const response = await agent.post(`/api/raffles/${raffle.id}/end`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('raffle');
      expect(response.body).toHaveProperty('winner');
      expect(response.body.raffle).toHaveProperty('isActive', false);
      expect(response.body.raffle).toHaveProperty('winnerId');
      expect(response.body.winner).toHaveProperty('userId', testUser.id);
    });
    
    it('should return 404 for non-existent raffle', async () => {
      // Login as admin
      await agent.post('/api/login').send({
        username: 'admin',
        password: 'password123',
      });
      
      const response = await agent.post('/api/raffles/9999/end');
      
      expect(response.status).toBe(404);
    });
  });
}); 