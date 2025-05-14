import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Winner, WinnerWithDetails } from '@/types';
import { useToast } from './use-toast';

export function useWinners() {
  return useQuery<Winner[]>({
    queryKey: ['/api/winners'],
    staleTime: 60000, // 1 minute
  });
}

export function useWinnersByUser(userId: number | undefined) {
  return useQuery<Winner[]>({
    queryKey: ['/api/winners/user', userId],
    enabled: !!userId,
  });
}

export function useWinnerByRaffle(raffleId: number | undefined) {
  return useQuery<Winner>({
    queryKey: ['/api/winners/raffle', raffleId],
    enabled: !!raffleId,
  });
}

export function useClaimPrize() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (winnerId: number) => {
      const res = await apiRequest('PATCH', `/api/winners/${winnerId}`, { claimed: true });
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Prize Claimed',
        description: 'Congratulations! You have claimed your prize.',
      });
      // Invalidate specific winner query and all winners
      queryClient.invalidateQueries({ queryKey: ['/api/winners', variables] });
      queryClient.invalidateQueries({ queryKey: ['/api/winners'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to claim prize: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
