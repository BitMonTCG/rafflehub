export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Raffle {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  backImageUrl?: string; // Optional back image URL
  retailPrice: number; // in cents
  winnerPrice: number; // in cents
  ticketPrice: number; // in cents
  priceSource?: string; // Source of pricing data (e.g., eBay, PSA, pricecharting, collectr)
  rarity: string;
  psaGrade?: number; // PSA grade (1-10)
  psaCertNumber?: string; // PSA certification number
  series?: string;
  cardDetails: string[];
  totalTickets: number;
  soldTickets: number;
  startDate: string;
  endDate?: string;
  isFeatured: boolean;
  isActive: boolean;
  winnerId: number | null;
  createdAt: string;
}

// Ticket status values for BTCPay integration
export type TicketStatus = 'pending' | 'paid' | 'expired';

export interface Ticket {
  id: number;
  raffleId: number;
  userId: number;
  purchasedAt: string;
  /**
   * Current status of the ticket: 'pending', 'paid', or 'expired'.
   */
  status: TicketStatus;
  /**
   * BTCPay invoice ID associated with this ticket (null if not yet created).
   */
  btcpayInvoiceId?: string | null;
  /**
   * Timestamp when the ticket was reserved (null if not reserved).
   */
  reservedAt?: string | null;
}

export interface Winner {
  id: number;
  userId: number;
  raffleId: number;
  ticketId: number;
  claimed: boolean;
  announcedAt: string;
}

// Extended types with relationships
export interface WinnerWithDetails extends Winner {
  user?: User;
  raffle?: Raffle;
}

export interface RaffleWithWinner extends Raffle {
  winner?: Winner;
  winnerUser?: User;
}

// WebSocket message types
export interface SocketMessage {
  type: string;
  [key: string]: any;
}

export interface Stats {
  activeRaffles: number;
  totalTicketsSold: number;
  winnersThisMonth: number;
  totalSavings: number;
}
