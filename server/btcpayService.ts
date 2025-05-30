import {
  InvoicesService,
  ApiError,
  InvoiceStatus,
  InvoiceData,
} from 'btcpay-greenfield-node-client';
import crypto from 'crypto';
import { log } from './vite.js';
import { btcpayConfig } from '../config/btcpay'; // Import configured storeId and webhookSecret

// Constants
const TICKET_PRICE_USD = 1.00; // Assuming $1 per ticket
const CURRENCY = 'USD';

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

  try {
    const invoice = await InvoicesService.invoicesCreateInvoice({ 
      storeId: btcpayConfig.storeId, 
      requestBody: invoiceRequest 
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
    const invoice = await InvoicesService.invoicesGetInvoice({ 
      storeId: btcpayConfig.storeId, 
      invoiceId: invoiceId 
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