import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ticket } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface BTCPayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
  onPaymentSuccess: () => void;
  onPaymentExpired: () => void;
}

type PaymentStatus = 'loading' | 'pending' | 'paid' | 'expired' | 'error';

const BTCPayPaymentModal: React.FC<BTCPayPaymentModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  onPaymentSuccess,
  onPaymentExpired
}) => {
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;
    
    const initializePayment = async () => {
      if (!ticketId || !isOpen) return;
      
      setStatus('loading');
      setErrorMessage(null);
      
      try {
        // Call the API to get the BTCPay invoice URL
        const response = await apiRequest<{ invoiceUrl: string, invoiceId: string }>('/api/tickets/btcpay-invoice', {
          method: 'POST',
          body: { ticketId }
        });
        
        setInvoiceUrl(response.invoiceUrl);
        setStatus('pending');
        
        // Start polling for payment status
        pollingInterval = setInterval(async () => {
          try {
            const statusResponse = await apiRequest<{ status: string }>(`/api/tickets/payment-status/${ticketId}`, {
              method: 'GET'
            });
            
            if (statusResponse.status === 'paid') {
              setStatus('paid');
              clearInterval(pollingInterval as NodeJS.Timeout);
              onPaymentSuccess();
              toast({
                title: 'Payment Successful',
                description: 'Your payment has been confirmed!',
              });
            } else if (statusResponse.status === 'expired') {
              setStatus('expired');
              clearInterval(pollingInterval as NodeJS.Timeout);
              onPaymentExpired();
              toast({
                title: 'Payment Expired',
                description: 'Your payment time has expired. The ticket has been released.',
                variant: 'destructive',
              });
            }
          } catch (error) {
            console.error('Error checking payment status:', error);
          }
        }, 5000); // Poll every 5 seconds
      } catch (error) {
        console.error('Failed to initialize payment:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to create invoice');
      }
    };
    
    initializePayment();
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [ticketId, isOpen, onPaymentSuccess, onPaymentExpired, toast]);
  
  const handleOpenBTCPayInvoice = () => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {status === 'loading' && 'Creating Invoice...'}
            {status === 'pending' && 'Pay with Cryptocurrency'}
            {status === 'paid' && 'Payment Successful'}
            {status === 'expired' && 'Payment Expired'}
            {status === 'error' && 'Error Creating Invoice'}
          </DialogTitle>
          <DialogDescription>
            {status === 'loading' && 'Please wait while we create your invoice...'}
            {status === 'pending' && 'Complete your payment to secure your raffle ticket.'}
            {status === 'paid' && 'Your payment has been confirmed! Your ticket is now secured.'}
            {status === 'expired' && 'The payment time has expired. Your ticket has been released.'}
            {status === 'error' && (errorMessage || 'Failed to create invoice. Please try again.')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          {status === 'loading' && (
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
          )}
          
          {status === 'pending' && (
            <>
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg mb-2">Payment Instructions</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Click the button below to open the payment page. The invoice will expire in 15 minutes.
                </p>
                
                <Button
                  className="bg-[#FF5350] hover:bg-red-600 text-white font-bold py-2 px-4 w-full mb-2"
                  onClick={handleOpenBTCPayInvoice}
                >
                  Open Payment Page
                </Button>
                
                <p className="text-xs text-gray-400 mt-1">
                  This page will automatically update when payment is detected.
                </p>
              </div>
              
              <div className="flex items-center text-amber-500 mt-2">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span>Waiting for payment...</span>
              </div>
            </>
          )}
          
          {status === 'paid' && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="font-semibold text-lg">Payment Confirmed!</h3>
              <p className="text-sm text-gray-500 mt-2">
                Your raffle ticket has been secured.
              </p>
            </div>
          )}
          
          {status === 'expired' && (
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
              <h3 className="font-semibold text-lg">Payment Time Expired</h3>
              <p className="text-sm text-gray-500 mt-2">
                The payment window has closed and your ticket has been released.
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <h3 className="font-semibold text-lg">Something Went Wrong</h3>
              <p className="text-sm text-gray-500 mt-2">
                {errorMessage || 'Failed to create invoice. Please try again.'}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          {status === 'pending' && (
            <Button variant="outline" onClick={onClose}>
              Cancel Payment
            </Button>
          )}
          
          {(status === 'paid' || status === 'expired' || status === 'error') && (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BTCPayPaymentModal; 