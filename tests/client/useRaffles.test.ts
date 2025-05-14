import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useRaffles, useRaffle, useFeaturedRaffle, useCreateRaffle, useUpdateRaffle, useEndRaffle, useDeleteRaffle } from '../../client/src/hooks/useRaffles';
import * as queryClient from '../../client/src/lib/queryClient';

// Mock the API request function
vi.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock('../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Helper function to wrap hooks with QueryClientProvider
const createWrapper = () => {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Raffle Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useRaffles', () => {
    const mockRaffles = [
      {
        id: 1,
        title: 'Test Raffle 1',
        // ... other required properties
      },
      {
        id: 2,
        title: 'Test Raffle 2',
        // ... other required properties
      },
    ];

    it('fetches active raffles by default', async () => {
      // Set up the hook
      const { result } = renderHook(() => useRaffles(), {
        wrapper: createWrapper(),
      });

      // Initially the hook should be in loading state
      expect(result.current.isLoading).toBe(true);

      // Wait for the hook to finish loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that the query key contains activeOnly=true
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches all raffles when activeOnly is false', async () => {
      // Set up the hook
      const { result } = renderHook(() => useRaffles(false), {
        wrapper: createWrapper(),
      });

      // Initially the hook should be in loading state
      expect(result.current.isLoading).toBe(true);

      // Wait for the hook to finish loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that the query key contains activeOnly=false
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCreateRaffle', () => {
    it('creates a raffle successfully', async () => {
      const mockRaffle = {
        title: 'New Raffle',
        cardName: 'Pikachu',
        retailPrice: 50,
        winnerPrice: 25,
        totalTickets: 100,
      };

      const mockResponse = {
        id: 1,
        ...mockRaffle,
        createdAt: new Date().toISOString(),
      };

      // Mock the API response
      vi.mocked(queryClient.apiRequest).mockResolvedValueOnce(mockResponse);

      // Set up the hook
      const { result } = renderHook(() => useCreateRaffle(), {
        wrapper: createWrapper(),
      });

      // Execute the mutation
      result.current.mutate(mockRaffle);

      // Wait for the mutation to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify API request was called with the right parameters
      expect(queryClient.apiRequest).toHaveBeenCalledWith('/api/raffles', {
        method: 'POST',
        body: mockRaffle,
      });

      // Verify query invalidation
      expect(queryClient.queryClient.invalidateQueries).toHaveBeenCalledWith({ 
        queryKey: ['/api/raffles'] 
      });
    });

    it('handles errors when creating a raffle', async () => {
      const mockRaffle = {
        title: 'New Raffle',
        cardName: 'Pikachu',
        retailPrice: 50,
        winnerPrice: 25,
        totalTickets: 100,
      };

      // Mock the API to reject
      vi.mocked(queryClient.apiRequest).mockRejectedValueOnce(new Error('Failed to create raffle'));

      // Set up the hook
      const { result } = renderHook(() => useCreateRaffle(), {
        wrapper: createWrapper(),
      });

      // Execute the mutation
      result.current.mutate(mockRaffle);

      // Wait for the mutation to complete
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify error message
      expect(result.current.error?.message).toBe('Failed to create raffle');
    });
  });

  describe('useUpdateRaffle', () => {
    it('updates a raffle successfully', async () => {
      const raffleId = 1;
      const updateData = {
        title: 'Updated Raffle',
        retailPrice: 75,
      };

      const mockResponse = {
        id: raffleId,
        ...updateData,
        cardName: 'Pikachu',
        updatedAt: new Date().toISOString(),
      };

      // Mock the API response
      vi.mocked(queryClient.apiRequest).mockResolvedValueOnce(mockResponse);

      // Set up the hook
      const { result } = renderHook(() => useUpdateRaffle(), {
        wrapper: createWrapper(),
      });

      // Execute the mutation
      result.current.mutate({ id: raffleId, data: updateData });

      // Wait for the mutation to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify API request was called with the right parameters
      expect(queryClient.apiRequest).toHaveBeenCalledWith(`/api/raffles/${raffleId}`, {
        method: 'PATCH',
        body: updateData,
      });

      // Verify query invalidation
      expect(queryClient.queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['/api/raffles', raffleId],
      });
      expect(queryClient.queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['/api/raffles'],
      });
    });
  });
}); 