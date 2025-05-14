import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RaffleCard from '../../client/src/components/raffle/RaffleCard';
import * as useTicketHook from '../../client/src/hooks/useTicket';
import * as useAuthHook from '../../client/src/hooks/useAuth';
import * as toastHook from '../../client/src/hooks/use-toast';

// Mock the required dependencies
vi.mock('wouter', () => ({
  useLocation: () => ['/raffles', vi.fn()],
}));

vi.mock('../../client/src/hooks/useTicket', () => ({
  useBuyTicket: vi.fn(),
}));

vi.mock('../../client/src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../client/src/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, transition, ...props }: any) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
}));

vi.mock('../../client/src/components/raffle/CardViewModal', () => ({
  default: ({ isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="card-view-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

describe('RaffleCard', () => {
  const mockRaffle = {
    id: 1,
    title: 'Test Raffle',
    description: 'Test description',
    imageUrl: 'test-image.jpg',
    cardName: 'Charizard',
    retailPrice: 100,
    winnerPrice: 50,
    rarity: 'Ultra Rare',
    totalTickets: 100,
    soldTickets: 50,
    endDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    isActive: true,
    isFeatured: false,
    startDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    userId: 1,
    winnerId: null,
    series: 'Base Set',
    cardDetails: ['Detail 1', 'Detail 2'],
  };

  const mockBuyTicket = {
    mutate: vi.fn(),
    isPending: false,
  };

  const mockAuthHook = {
    isAuthenticated: true,
    requireAuth: vi.fn((callback) => callback()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTicketHook.useBuyTicket).mockReturnValue(mockBuyTicket);
    vi.mocked(useAuthHook.useAuth).mockReturnValue(mockAuthHook);
  });

  it('renders raffle card correctly', () => {
    render(<RaffleCard raffle={mockRaffle} />);
    
    // Check if important elements are rendered
    expect(screen.getByAltText('Test Raffle')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Test Raffle/i })).toBeInTheDocument();
    expect(screen.getByText('Ultra Rare')).toBeInTheDocument();
    expect(screen.getByText('50/100')).toBeInTheDocument();
    expect(screen.getByText(/Buy Ticket - \$1/)).toBeInTheDocument();
  });

  it('handles buy ticket click when user is authenticated', async () => {
    render(<RaffleCard raffle={mockRaffle} />);
    
    // Click buy ticket button
    const buyButton = screen.getByText(/Buy Ticket - \$1/);
    fireEvent.click(buyButton);
    
    // Verify requireAuth was called
    expect(mockAuthHook.requireAuth).toHaveBeenCalled();
    
    // Verify buyTicket.mutate was called with raffle id
    expect(mockBuyTicket.mutate).toHaveBeenCalledWith(1);
  });

  it('shows sold out message when tickets are sold out', () => {
    const soldOutRaffle = {
      ...mockRaffle,
      soldTickets: 100,
    };
    
    render(<RaffleCard raffle={soldOutRaffle} />);
    
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
  });

  it('shows raffle ended message when raffle is not active', () => {
    const endedRaffle = {
      ...mockRaffle,
      isActive: false,
    };
    
    render(<RaffleCard raffle={endedRaffle} />);
    
    expect(screen.getByText('Raffle Ended')).toBeInTheDocument();
  });

  it('shows processing message when ticket purchase is in progress', () => {
    vi.mocked(useTicketHook.useBuyTicket).mockReturnValue({
      ...mockBuyTicket,
      isPending: true,
    });
    
    render(<RaffleCard raffle={mockRaffle} />);
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('opens card view modal when quick view button is clicked', async () => {
    render(<RaffleCard raffle={mockRaffle} />);
    
    // Card view modal should not be visible initially
    expect(screen.queryByTestId('card-view-modal')).not.toBeInTheDocument();
    
    // Find and click the quick view button
    const quickViewButton = screen.getByText('Quick View');
    fireEvent.click(quickViewButton);
    
    // Card view modal should be visible after clicking
    await waitFor(() => {
      expect(screen.getByTestId('card-view-modal')).toBeInTheDocument();
    });
  });
}); 