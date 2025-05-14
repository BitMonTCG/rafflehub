import { apiRequest } from './queryClient';

/**
 * Client-side functions for interacting with BTCPay Server through our backend API
 */

export interface Invoice {
  id: string;
  amount: string;
  currency: string;
  status: string;
  checkoutLink: string;
  expiresAt: string;
  createdAt: string;
  metadata: Record<string, string>;
}

export interface InvoiceStatus {
  isPaid: boolean;
  status: string;
}

/**
 * Create a new invoice for ticket purchase
 * @param amount The amount in USD
 * @param metadata Additional metadata for the invoice
 * @returns The created invoice
 */
export async function createInvoice(
  amount: number,
  metadata: {
    userId: number;
    raffleId: number;
    ticketCount: number;
    buyerEmail?: string;
  }
): Promise<Invoice> {
  try {
    const response = await apiRequest<Invoice>('/api/payments/btcpay/invoices', {
      method: 'POST',
      body: {
        amount,
        metadata
      }
    });
    
    return response;
  } catch (error) {
    console.error('Failed to create invoice:', error);
    throw error;
  }
}

/**
 * Get an invoice by ID
 * @param invoiceId The ID of the invoice
 * @returns The invoice
 */
export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  try {
    const response = await apiRequest<Invoice | null>(`/api/payments/btcpay/invoices/${invoiceId}`, {
      method: 'GET'
    });
    
    return response;
  } catch (error) {
    console.error(`Failed to get invoice ${invoiceId}:`, error);
    return null;
  }
}

/**
 * Check if an invoice is paid
 * @param invoiceId The ID of the invoice
 * @returns True if the invoice is paid, false otherwise
 */
export async function isInvoicePaid(invoiceId: string): Promise<boolean> {
  try {
    const response = await apiRequest<InvoiceStatus>(`/api/payments/btcpay/invoices/${invoiceId}/status`, {
      method: 'GET'
    });
    
    return response.isPaid;
  } catch (error) {
    console.error(`Failed to check if invoice ${invoiceId} is paid:`, error);
    return false;
  }
}