import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/format';
import { Raffle } from '@/types';
import { useBuyTicket } from '@/hooks/useTicket';
import PurchaseTicketAnimation from './PurchaseTicketAnimation';

interface PurchaseTicketModalProps {
  raffle: Raffle;
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseTicketModal: React.FC<PurchaseTicketModalProps> = ({ raffle, isOpen, onClose }) => {
  const buyTicket = useBuyTicket();
  const [showPurchaseAnimation, setShowPurchaseAnimation] = useState(false);
  
  const handlePurchase = async () => {
    try {
      console.log("PurchaseTicketModal: Calling buyTicket.mutateAsync for raffle:", raffle.id);
      // Show the purchase animation right when the user clicks to provide immediate feedback
      setShowPurchaseAnimation(true);
      // Call the mutation. Success (including redirect) is handled by the hook's onSuccess.
      // Errors during the API call itself are handled by the hook's onError.
      await buyTicket.mutateAsync(raffle.id);
      // No need to check result or redirect here anymore.
      console.log("PurchaseTicketModal: mutateAsync call finished (success/redirect handled by hook).");
    } catch (error) {
      // This catch block handles errors thrown *synchronously* by mutateAsync
      // or if the mutation fails *before* the hook's onError can handle it.
      // The hook's onError will likely catch most API/backend related errors.
      console.error("PurchaseTicketModal: Error during mutateAsync call:", error);
      // Hide the animation if there was an error
      setShowPurchaseAnimation(false);
      // Optionally, add a fallback toast here if needed, though hook's onError should cover most cases.
    }
  };
  
  const handleAnimationClose = () => {
    setShowPurchaseAnimation(false);
  };
  
  const ticketsLeft = raffle.totalTickets - raffle.soldTickets;
  const totalCost = 1;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Purchase Raffle Ticket</DialogTitle>
            <DialogDescription>
              Buy 1 ticket for the {raffle.title} raffle. Cost: $1.00
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src={raffle.imageUrl} 
                  alt={raffle.title} 
                  className="w-16 h-24 object-cover rounded-md mr-4"
                />
                <div>
                  <h3 className="font-bold text-lg">{raffle.title}</h3>
                  <p className="text-sm text-gray-500">Winner pays: {formatPrice(raffle.winnerPrice)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div>
                <h4 className="font-semibold">Raffle Progress</h4>
                <p className="text-sm text-gray-500">{raffle.soldTickets} of {raffle.totalTickets} tickets sold</p>
              </div>
              <span className="text-lg font-bold">{ticketsLeft} left</span>
            </div>
            
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-lg font-semibold">Total Cost (1 Ticket)</span>
              <span className="text-lg font-bold text-[#FF5350]">${totalCost.toFixed(2)}</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={buyTicket.isPending}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#FF5350] hover:bg-red-600 text-white"
              onClick={handlePurchase}
              disabled={buyTicket.isPending || ticketsLeft <= 0}
            >
              {buyTicket.isPending 
                ? "Processing..." 
                : ticketsLeft <= 0 
                  ? "Sold Out" 
                  : `Pay $${totalCost.toFixed(2)} with BTC`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket purchase animation overlay */}
      <PurchaseTicketAnimation 
        isVisible={showPurchaseAnimation}
        onClose={handleAnimationClose}
        cardImage={raffle.imageUrl}
        cardName={raffle.title}
      />
    </>
  );
};

export default PurchaseTicketModal;
