import { log } from './utils/logger.js';
// Import necessary services and types from btcpay-greenfield-node-client
import { 
    InvoicesService, 
    InvoiceData,
    ApiError // For typed error handling
} from 'btcpay-greenfield-node-client';
import { btcpayConfig } from '../config/btcpay.js'; // Import shared BTCPay configuration

// --- Public API Methods (Using Official Client) ---
// The btcpay-greenfield-node-client is expected to be configured globally 
// (OpenAPI.BASE, OpenAPI.TOKEN) by the imported btcpayConfig module.


/**
 * Create a new invoice using the official client.
 * @param amount Amount in currency (e.g., USD).
 * @param metadata Optional metadata.
 */
export async function createInvoice(
  amount: number,
  metadata?: {
    userId?: number;
    raffleId?: number;
    ticketCount?: number;
    buyerEmail?: string;
  }
): Promise<InvoiceData> {
  if (!btcpayConfig.storeId) {
    log('BTCPay store ID missing. Cannot create invoice.');
    throw new Error('BTCPay store ID missing.');
  }

  const metadataObj: Record<string, any> = {};
  if (metadata) {
    if (metadata.userId !== undefined) metadataObj.buyer = { ...(metadataObj.buyer || {}), userId: metadata.userId.toString() };
    if (metadata.raffleId !== undefined) metadataObj.raffleId = metadata.raffleId.toString();
    if (metadata.ticketCount !== undefined) metadataObj.ticketCount = metadata.ticketCount.toString();
    if (metadata.buyerEmail) metadataObj.buyer = { ...(metadataObj.buyer || {}), email: metadata.buyerEmail };
    metadataObj.orderId = `order-${Date.now()}-${metadata?.userId || 'guest'}-${metadata?.raffleId || 'unknown'}`;
  }

  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const redirectURL = `${baseUrl}/raffle/${metadata?.raffleId || ''}?paymentResult=success&invoiceId={{InvoiceId}}`;
  
  const invoiceRequestBody: Omit<InvoiceData, 'id' | 'status' | 'checkoutLink' | 'createdTime' | 'expirationTime' | 'monitoringExpiration' | 'archived'> = { 
    amount: amount.toFixed(2),
    currency: 'USD', 
    metadata: metadataObj,
    checkout: {
      redirectURL: redirectURL,
    }
  };

  try {
    log(`Creating invoice for ${amount} USD with store ID: ${btcpayConfig.storeId}...`);
    // API permission needed: btcpay.store.cancreateinvoice
    const invoice = await InvoicesService.invoicesCreateInvoice({ 
        storeId: btcpayConfig.storeId, 
        requestBody: invoiceRequestBody 
    });
    log(`Invoice created successfully: ID=${invoice.id}, CheckoutLink: ${invoice.checkoutLink}`);
    return invoice;
  } catch (error) {
    log(`Failed to create BTCPay invoice: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof ApiError) {
      log(`BTCPay API Error (Status ${error.status}): ${JSON.stringify(error.body)}`);
      if (error.status === 403) {
        log('BTCPay API Key may lack permission btcpay.store.cancreateinvoice (403 Forbidden).');
      }
    }
    throw new Error(`Failed to create BTCPay invoice: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get invoice by ID using the official client.
 * @param invoiceId The invoice ID.
 */
export async function getInvoice(invoiceId: string): Promise<InvoiceData | null> { 
  if (!btcpayConfig.storeId) {
    log('BTCPay store ID missing. Cannot get invoice.');
    // Optionally throw an error or return null based on desired strictness
    return null; 
  }
  
  try {
    log(`Getting invoice ${invoiceId} from store ID: ${btcpayConfig.storeId}...`);
    // API permission needed: btcpay.store.canviewinvoices
    const invoice = await InvoicesService.invoicesGetInvoice({ 
        storeId: btcpayConfig.storeId, 
        invoiceId: invoiceId 
    });
    return invoice;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      log(`Invoice ${invoiceId} not found via API.`);
      return null;
    }
    log(`Failed to get BTCPay invoice ${invoiceId}: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof ApiError) {
      log(`BTCPay API Error (Status ${error.status}): ${JSON.stringify(error.body)}`);
    }
    // Re-throw other errors or return null based on desired handling for non-404 errors
    // For consistency with btcpayService.ts, we'll throw for other errors.
    throw new Error(`Failed to retrieve BTCPay invoice ${invoiceId}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Removed initializeWithApiKey, initializationPromise, and checkInitializationStatus
// as initialization is now expected to be handled globally by btcpayConfig.js