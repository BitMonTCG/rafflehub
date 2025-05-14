import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Ticket } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

// Define the expected response structure from the POST /api/tickets endpoint
interface InitiateCheckoutResponse {
  checkoutLink: string;
  ticketId: number;
  invoiceId: string;
}

export function useBuyTicket() {
  const { user } = useAuth();
  const { toast } = useToast();

  console.log("useBuyTicket hook initialized."); // Log hook initialization

  return useMutation({
    // Expect the InitiateCheckoutResponse type
    mutationFn: async (raffleId: number): Promise<InitiateCheckoutResponse> => {
      console.log("useBuyTicket: mutationFn started for raffle:", raffleId); // Log start of mutation
      if (!user) {
        console.error("useBuyTicket: User is not logged in. Aborting purchase."); // Log missing user
        throw new Error('You must be logged in to buy tickets');
      }
      console.log("useBuyTicket: User check passed. User:", user.username); // Log user check success

      console.log("useBuyTicket: Calling apiRequest for /api/tickets"); // Log before API call
      try {
        const response = await apiRequest<InitiateCheckoutResponse>('/api/tickets', {
          method: 'POST',
          body: {
            raffleId, // Only send raffleId, userId comes from session on backend
          }
        });
        console.log("useBuyTicket: apiRequest successful, response:", response); // Log API success
        return response;
      } catch (apiRequestError) {
        console.error("useBuyTicket: apiRequest failed:", apiRequestError); // Log API error
        throw apiRequestError; // Re-throw error to be caught by onError or component
      }
    },
    onError: (error) => {
      console.error("useBuyTicket: onError triggered:", error); // Log onError callback
      toast({
        title: 'Purchase Failed',
        // Attempt to parse backend error message if available
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
        console.log("useBuyTicket: onSuccess triggered with data:", data); // Log onSuccess callback
        if (data?.checkoutLink) {
          console.log("useBuyTicket: Checkout link found in onSuccess:", data.checkoutLink);
          window.location.href = data.checkoutLink;
          console.log("useBuyTicket: Redirect attempted from onSuccess.");
        } else {
          console.error("useBuyTicket: Checkout link missing in onSuccess data:", data);
          // Optionally, show a toast error here if the link is missing despite API success
          toast({
            title: 'Purchase Error',
            description: 'Failed to get payment link. Please try again.',
            variant: 'destructive',
          });
        }
    }
  });
}

export function useUserTickets(userId: number | undefined) {
  return useQuery({
    queryKey: ['/api/tickets/user', userId],
    // Return type needs adjustment if the API returns tickets
    // Assuming it returns Ticket[] for now
    queryFn: () => apiRequest<Ticket[]>(`/api/user/tickets`), 
    enabled: !!userId,
  });
}

// Placeholder hook for fetching a single ticket by ID
// Needed for the optional redirect handling
export function useTicketById(ticketId: number | null) {
  return useQuery({
    queryKey: ['/api/tickets', ticketId],
    queryFn: () => apiRequest<Ticket>(`/api/tickets/${ticketId}`),
    enabled: !!ticketId, // Only run query if ticketId is not null
  });
}
