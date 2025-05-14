import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Raffle } from '@/types';
import { useToast } from './use-toast';

export function useRaffles(activeOnly = true) {
  return useQuery<Raffle[]>({
    queryKey: ['/api/raffles', { active: activeOnly }],
    staleTime: 10000, // 10 seconds
  });
}

export function useRaffle(id: number | undefined) {
  return useQuery<Raffle>({
    queryKey: ['/api/raffles', id],
    enabled: !!id,
  });
}

export function useFeaturedRaffle() {
  return useQuery<Raffle>({
    queryKey: ['/api/raffles/featured'],
    staleTime: 60000, // 1 minute
  });
}

export function useCreateRaffle() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (raffleData: Partial<Raffle>) => {
      return apiRequest<Raffle>('/api/raffles', {
        method: 'POST',
        body: raffleData
      });
    },
    onSuccess: () => {
      toast({
        title: 'Raffle Created',
        description: 'The raffle has been created successfully.',
      });
      // Invalidate raffle queries
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create raffle: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateRaffle() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Raffle> }) => {
      return apiRequest<Raffle>(`/api/raffles/${id}`, {
        method: 'PATCH',
        body: data
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Raffle Updated',
        description: 'The raffle has been updated successfully.',
      });
      // Invalidate specific raffle query and all raffles
      queryClient.invalidateQueries({ queryKey: ['/api/raffles', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update raffle: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useEndRaffle() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest<{ raffle: Raffle, winner: any }>(`/api/raffles/${id}/end`, {
        method: 'POST',
        body: {}
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Raffle Ended',
        description: 'The raffle has ended and a winner has been selected.',
      });
      // Invalidate specific raffle query, all raffles, and winners
      queryClient.invalidateQueries({ queryKey: ['/api/raffles', variables] });
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/winners'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to end raffle: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteRaffle() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest<Raffle>(`/api/raffles/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Raffle Deleted',
        description: 'The raffle has been deleted successfully.',
      });
      // Invalidate specific raffle query and all raffles
      queryClient.invalidateQueries({ queryKey: ['/api/raffles', variables] });
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete raffle: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
