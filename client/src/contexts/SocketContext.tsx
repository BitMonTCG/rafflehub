import React, { createContext, useContext, useEffect, useState } from 'react';
import { webSocketService } from '@/lib/websocket';
import { Raffle, Winner, SocketMessage } from '@/types';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SocketContextValue {
  connected: boolean;
  raffles: Raffle[];
  winners: Winner[];
  latestMessage: SocketMessage | null;
}

const SocketContext = createContext<SocketContextValue>({
  connected: false,
  raffles: [],
  winners: [],
  latestMessage: null,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [latestMessage, setLatestMessage] = useState<SocketMessage | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Connect to WebSocket
    webSocketService.connect();
    
    // Handle initial data
    const initialDataUnsubscribe = webSocketService.on('INITIAL_DATA', (data) => {
      setRaffles(data.raffles || []);
      setWinners(data.winners || []);
      setConnected(true);
    });
    
    // Handle PONG (connection alive)
    const pongUnsubscribe = webSocketService.on('PONG', () => {
      setConnected(true);
    });
    
    // Handle raffle updates
    const raffleCreatedUnsubscribe = webSocketService.on('RAFFLE_CREATED', (data) => {
      setLatestMessage(data);
      setRaffles(prev => [...prev, data.raffle]);
    });
    
    const raffleUpdatedUnsubscribe = webSocketService.on('RAFFLE_UPDATED', (data) => {
      setLatestMessage(data);
      setRaffles(prev => prev.map(raffle => 
        raffle.id === data.raffle.id ? data.raffle : raffle
      ));
    });
    
    const raffleEndedUnsubscribe = webSocketService.on('RAFFLE_ENDED', (data) => {
      setLatestMessage(data);
      setRaffles(prev => prev.map(raffle => 
        raffle.id === data.raffle.id ? data.raffle : raffle
      ));
      setWinners(prev => [...prev, data.winner]);
    });
    
    // Handle ticket purchase
    const ticketPurchasedUnsubscribe = webSocketService.on('TICKET_PURCHASED', (data) => {
      setLatestMessage(data);
      setRaffles(prev => prev.map(raffle => 
        raffle.id === data.raffle.id ? data.raffle : raffle
      ));
    });
    
    // Handle winner updates
    const winnerUpdatedUnsubscribe = webSocketService.on('WINNER_UPDATED', (data) => {
      setLatestMessage(data);
      setWinners(prev => prev.map(winner => 
        winner.id === data.winner.id ? data.winner : winner
      ));
    });
    
    // --- NEW LISTENERS for Ticket Status ---
    const ticketPaidUnsubscribe = webSocketService.on('TICKET_PAID', (data) => {
      console.log('WS Received: TICKET_PAID', data);
      setLatestMessage(data);
      toast({
        title: "✅ Payment Successful",
        description: `Ticket ${data.ticketId} for raffle ${data.raffleId} confirmed!`,
        variant: "default",
      });
      // Invalidate raffles list/details and user tickets
      queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/tickets'] });
    });
    
    const ticketExpiredUnsubscribe = webSocketService.on('TICKET_EXPIRED', (data) => {
      console.log('WS Received: TICKET_EXPIRED', data);
      setLatestMessage(data);
      toast({
        title: "⚠️ Payment Expired",
        description: `Invoice for ticket ${data.ticketId} (raffle ${data.raffleId}) has expired.`,
        variant: "default",
      });
      // Optionally invalidate raffle data if needed, but less critical than payment
      // queryClient.invalidateQueries({ queryKey: ['/api/raffles'] });
    });
    
    // Cleanup on unmount
    return () => {
      initialDataUnsubscribe();
      pongUnsubscribe();
      raffleCreatedUnsubscribe();
      raffleUpdatedUnsubscribe();
      raffleEndedUnsubscribe();
      ticketPurchasedUnsubscribe();
      winnerUpdatedUnsubscribe();
      // Cleanup new listeners
      ticketPaidUnsubscribe();
      ticketExpiredUnsubscribe();
    };
  }, [toast]);

  return (
    <SocketContext.Provider value={{ connected, raffles, winners, latestMessage }}>
      {children}
    </SocketContext.Provider>
  );
};
