import {
  InvoicesService,
  ApiError,
  InvoiceStatus,
  InvoiceData,
} from 'btcpay-greenfield-node-client';
import crypto from 'crypto';
import { log } from './vite.js';
import { btcpayConfig } from '../config/btcpay.js'; // Import configured storeId and webhookSecret
import { CircuitBreaker } from './utils/circuitBreaker.js';

// Constants
const TICKET_PRICE_USD = 1.00; // Assuming $1 per ticket
const CURRENCY = 'USD';

// Create circuit breakers for BTCPay API calls
const invoiceCreationBreaker = new CircuitBreaker('btcpay-invoice-creation', {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  timeout: 10000 // 10 second timeout
});

const invoiceFetchBreaker = new CircuitBreaker('btcpay-invoice-fetch', {
  failureThreshold: 5,  // More tolerant for read operations
  resetTimeout: 15000,   // 15 seconds
  timeout: 5000          // 5 second timeout
});

/**
 * Creates a BTCPay Server invoice for a raffle ticket purchase.
 *
 * @param userId The ID of the user purchasing the ticket.
 * @param raffleId The ID of the raffle.
 * @param ticketId The ID of the newly created pending ticket.
 * @param rafflePrice The price of the raffle ticket.
 * @param raffleName The name of the raffle.
 * @param buyerEmail Optional email for the invoice.
 * @returns The created BTCPay invoice data, including id and checkoutLink.
 * @throws Throws an error if invoice creation fails.
 */
export async function createRaffleTicketInvoice(
  userId: number,
  raffleId: number,
  ticketId: string,
  rafflePrice: number,
  raffleName: string,
  buyerEmail: string | undefined = undefined
): Promise<InvoiceData> {
  // Add feature flag for bypassing BTCPay in emergency situations
  if (process.env.BTCPAY_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
    log('⚠️ BTCPay BYPASS mode active (non-production only) - returning mock invoice');
    // Create mock invoice with appropriate type conversion
    const mockInvoice = {
      id: `mock-${Date.now()}`,
      checkoutLink: `${process.env.BASE_URL || 'http://localhost:5000'}/mock-checkout/${ticketId}`,
      status: InvoiceStatus.NEW,
      amount: rafflePrice.toString(),
      currency: CURRENCY,
      createdTime: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
      expirationTime: Math.floor(Date.now() / 1000) + 900, // 15 minutes from now
      metadata: {
        orderId: `raffle-${raffleId}-ticket-${ticketId}`,
        itemDesc: `${raffleName} Ticket`,
        buyerId: userId.toString(),
        ticketId: ticketId.toString(),
        raffleId: raffleId.toString(),
      }
    };
    
    return mockInvoice as InvoiceData;
  }
  const orderId = `raffle-${raffleId}-ticket-${ticketId}`;
  const metadata: { [key: string]: string | number | boolean | object | null } = {
    orderId: orderId,
    itemDesc: `${raffleName} Ticket`,
    buyerId: userId.toString(),
    ticketId: ticketId.toString(),
    raffleId: raffleId.toString(),
  };
  if (buyerEmail) {
    metadata.buyerEmail = buyerEmail;
  }

  const invoiceRequest = {
    amount: rafflePrice.toFixed(2),
    currency: CURRENCY,
    metadata: metadata,
    checkout: {
      redirectURL: `${process.env.BASE_URL || 'http://localhost:5000'}/raffles/${raffleId}?ticketId=${ticketId}`,
    },
  };

  log(`Creating BTCPay invoice for ticket ${ticketId} (Raffle ${raffleId}) for user ${userId}`);

  // Use circuit breaker for invoice creation
  try {
    const invoice = await invoiceCreationBreaker.execute(async () => {
      return await InvoicesService.invoicesCreateInvoice({ 
        storeId: btcpayConfig.storeId, 
        requestBody: invoiceRequest 
      });
    });
    
    log(`BTCPay invoice created: ${invoice.id} - Checkout: ${invoice.checkoutLink}`);
    return invoice;
  } catch (error) {
    log(`Failed to create BTCPay invoice for ticket ${ticketId}: ${error}`);
    if (error instanceof ApiError) {
      log(`BTCPay API Error (${error.status}): ${JSON.stringify(error.body)}`);
    }
    throw new Error(`Failed to create payment invoice: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Verifies the signature of an incoming BTCPay webhook request.
 *
 * @param requestBody The raw request body buffer.
 * @param signatureHeader The value of the 'BTCPay-Sig' header (e.g., "sha256=...").
 * @returns True if the signature is valid, false otherwise.
 */
export function verifyWebhookSignature(
  requestBody: Buffer,
  signatureHeader: string | undefined
): boolean {
  if (!signatureHeader) {
    log('Webhook verification failed: Missing BTCPay-Sig header');
    return false;
  }

  if (!btcpayConfig.webhookSecret) {
    log('Webhook verification failed: BTCPAY_WEBHOOK_SECRET is not configured.');
    // In a real application, you might want to throw an error here or handle it differently.
    return false;
  }

  const sigHashAlg = 'sha256';
  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== sigHashAlg) {
    log(`Webhook verification failed: Invalid signature format: ${signatureHeader}`);
    return false;
  }

  const receivedChecksum = Buffer.from(parts[1], 'hex'); // Use 'hex' encoding

  const hmac = crypto.createHmac(sigHashAlg, btcpayConfig.webhookSecret);
  const expectedDigest = hmac.update(requestBody).digest();

  if (receivedChecksum.length !== expectedDigest.length || !crypto.timingSafeEqual(expectedDigest, receivedChecksum)) {
    log(`Webhook verification failed: Signature mismatch.`);
    return false;
  }

  log('Webhook signature verified successfully.');
  return true;
}

/**
 * Get an invoice by ID.
 *
 * @param invoiceId The ID of the invoice.
 * @returns The invoice data or null if not found.
 * @throws Throws an error for non-404 errors.
 */
export async function getInvoice(invoiceId: string): Promise<InvoiceData | null> {
  try {
    const invoice = await invoiceFetchBreaker.execute(async () => {
      return await InvoicesService.invoicesGetInvoice({ 
        storeId: btcpayConfig.storeId, 
        invoiceId: invoiceId 
      });
    });
    return invoice;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      log(`Invoice ${invoiceId} not found.`);
      return null;
    }
    log(`Failed to get invoice ${invoiceId}: ${error}`);
    if (error instanceof ApiError) {
      log(`BTCPay API Error (${error.status}): ${JSON.stringify(error.body)}`);
    }
    throw new Error(`Failed to retrieve invoice details: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if an invoice status indicates it's paid (Settled).
 *
 * Note: 'Processing' might mean paid but not yet confirmed/settled.
 * We only consider 'Settled' as fully paid for finalizing the ticket.
 *
 * @param invoiceId The invoice ID to check.
 * @returns boolean indicating if the invoice is settled.
 */
export async function isInvoiceSettled(invoiceId: string): Promise<boolean> {
  try {
    const invoice = await getInvoice(invoiceId);
    // Consider only 'Settled' as definitively paid for raffle purposes
    return invoice?.status === InvoiceStatus.SETTLED;
  } catch (error) {
    // Errors during fetch are already logged by getInvoice
    log(`Error checking if invoice ${invoiceId} is settled.`);
    return false; // Treat errors as not settled
  }
}

/**
 * Fetches the status of a given invoice.
 *
 * @param invoiceId The invoice ID.
 * @returns The status of the invoice or null if not found or on error.
 */
export async function getInvoiceStatus(invoiceId: string): Promise<InvoiceStatus | null> {
    try {
        const invoice = await getInvoice(invoiceId);
        return invoice?.status ?? null;
    } catch (error) {
        log(`Error fetching status for invoice ${invoiceId}.`);
        return null;
    }
}

// Remove old initialization and unused functions/variables
// - initializeBTCPayClient
// - checkServices
// - registerWebhook
// - StoresService, ServerInfoService usage

// TODO: Consider adding functions to handle refunds if needed later.

/**
 * Get the health status of the BTCPay integration
 * @returns Object containing health information and circuit status
 */
/**
 * Get the health status of the BTCPay integration
 * @returns Object containing health information and circuit status
 */
export function getBTCPayHealth(): any {
  // Get BTCPay URL from environment variable directly since it's not in the config
  const btcpayUrl = process.env.BTCPAY_URL || null;
  
  return {
    serviceName: 'BTCPay Server',
    endpoint: btcpayUrl ? new URL(btcpayUrl).origin : 'Not configured',
    status: btcpayConfig.storeId ? 'Configured' : 'Not configured',
    circuits: {
      invoiceCreation: invoiceCreationBreaker.getState(),
      invoiceFetch: invoiceFetchBreaker.getState()
    },
    storeId: btcpayConfig.storeId ? `${btcpayConfig.storeId.substring(0, 5)}...` : 'Missing',
    webhook: btcpayConfig.webhookSecret ? 'Configured' : 'Not configured'
  };
}