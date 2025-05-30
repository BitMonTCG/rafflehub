import axios from 'axios'; // Keep axios for potential non-client use, or remove if unused
import { log } from './vite.js';
// Import OpenAPI for configuration and specific services/types
import { 
    OpenAPI, 
    StoresService, // Assuming service for stores
    InvoicesService, // Assuming service for invoices
    InvoiceData // Assuming type is exported directly
} from 'btcpay-greenfield-node-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Import necessary function from url module

// --- Configuration and State ---
// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let config = {
  apiUrl: process.env.BTCPAY_URL, // Required
  apiKey: process.env.BTCPAY_API_KEY, // Use API Key
  storeId: process.env.BTCPAY_STORE_ID, // Required Store ID
};

// No client instance needed, services are used statically after config
let isInitialized = false;

// --- Initialization ---

/**
 * Initializes the BTCPay Greenfield client connection by configuring OpenAPI.
 */
async function initializeWithApiKey(): Promise<void> {
  if (!config.apiUrl || !config.apiKey || !config.storeId) {
    log('BTCPay configuration missing: Requires BTCPAY_URL, BTCPAY_API_KEY, and BTCPAY_STORE_ID in .env');
    isInitialized = false;
    return;
  }

  try {
    log(`Configuring BTCPay Client for URL: ${config.apiUrl} and Store ID: ${config.storeId}`);
    OpenAPI.BASE = config.apiUrl;
    OpenAPI.TOKEN = config.apiKey;

    // Verify connection by fetching the store data using StoresService
    // Note: Ensure the API key has permission: btcpay.store.canviewstoresettings
    // Method signature likely StoresService.storesGetStore({ storeId: string })
    const storeData = await StoresService.storesGetStore({ storeId: config.storeId });

    if (storeData.id === config.storeId) {
        log(`Successfully connected to BTCPay Store: ${storeData.name} (ID: ${storeData.id})`);
        isInitialized = true;
    } else {
        log(`Error: Could not verify connection to configured Store ID ${config.storeId}. Store ID mismatch or invalid response.`);
        isInitialized = false;
    }
  } catch (error: any) {
    // The library might throw specific error types or use axios errors internally
    log(`Failed to initialize BTCPay client configuration: ${error.message || error}`);
    isInitialized = false;
    // Check for specific error status codes if available
    if (error.status === 401) { // OpenAPI generated clients often have status property on errors
        log('BTCPay API Key is likely invalid or lacks permissions (401 Unauthorized).');
    }
     else if (error.status === 403) {
       log('BTCPay API Key lacks necessary permissions (403 Forbidden). Required: btcpay.store.canviewstoresettings, etc.');
     }
  }
}

// Start initialization immediately and export the promise for other modules to await
export const initializationPromise = initializeWithApiKey();

// --- Public API Methods (Using Official Client) ---

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
): Promise<InvoiceData> { // Return type should match the library's InvoiceData
  if (!isInitialized || !config.storeId) {
    throw new Error('BTCPay service not initialized or store ID not configured.');
  }

  const metadataObj: Record<string, any> = {};
  if (metadata) {
    if (metadata.userId !== undefined) metadataObj.buyer = { ...(metadataObj.buyer || {}), userId: metadata.userId.toString() };
    if (metadata.raffleId !== undefined) metadataObj.raffleId = metadata.raffleId.toString();
    if (metadata.ticketCount !== undefined) metadataObj.ticketCount = metadata.ticketCount.toString();
    if (metadata.buyerEmail) metadataObj.buyer = { ...(metadataObj.buyer || {}), email: metadata.buyerEmail };
    metadataObj.orderId = `order-${Date.now()}-${metadata?.userId || 'guest'}-${metadata?.raffleId || 'unknown'}`;
  }

  // redirectURL needs careful construction if BASE_URL is needed
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const redirectURL = `${baseUrl}/raffle/${metadata?.raffleId || ''}?paymentResult=success&invoiceId={{InvoiceId}}`;
  
  // Construct invoice request according to library specs (might be direct args or an object)
  // Assuming it takes storeId and a request body object based on OpenAPI patterns
  // The actual request body type might be defined by the library, e.g., InvoiceData
  const invoiceRequestBody: Omit<InvoiceData, 'id' | 'status' | 'checkoutLink'> = { 
    amount: amount.toFixed(2),
    currency: 'USD', 
    metadata: metadataObj,
    checkout: {
      redirectURL: redirectURL,
    }
  };

  try {
    log(`Creating invoice for ${amount} USD...`);
    // Ensure API key has permission: btcpay.store.cancreateinvoice
    // Method signature likely InvoicesService.invoicesCreateInvoice({ storeId: string, requestBody: InvoiceRequestBody })
    const invoice = await InvoicesService.invoicesCreateInvoice({ 
        storeId: config.storeId, 
        requestBody: invoiceRequestBody 
    });
    log(`Invoice created successfully: ID=${invoice.id}`);
    // Ensure the returned 'invoice' matches the Promise type InvoiceData
    return invoice as InvoiceData; // Cast if necessary, or ensure types align
  } catch (error: any) {
    log(`Failed to create BTCPay invoice: ${error.message || error}`);
     if (error.status === 403) {
       log('BTCPay API Key lacks permission btcpay.store.cancreateinvoice (403 Forbidden).');
     }
    throw new Error(`Failed to create BTCPay invoice: ${error.message || error}`);
  }
}

/**
 * Get invoice by ID using the official client.
 * @param invoiceId The invoice ID.
 */
export async function getInvoice(invoiceId: string): Promise<InvoiceData | null> { 
  if (!isInitialized || !config.storeId) {
    log('Cannot get invoice, BTCPay service not initialized or store ID not configured.');
    return null; 
  }
  
  try {
    // Ensure API key has permission: btcpay.store.canviewinvoices
    // Method signature likely InvoicesService.invoicesGetInvoice({ storeId: string, invoiceId: string })
    const invoice = await InvoicesService.invoicesGetInvoice({ 
        storeId: config.storeId, 
        invoiceId: invoiceId 
    });
    return invoice as InvoiceData; // Cast if necessary
  } catch (error: any) {
    if (error.status === 404) { // Check for 404 status from the error object
      log(`Invoice ${invoiceId} not found via API.`);
      return null;
    } else {
        log(`Failed to get BTCPay invoice ${invoiceId}: ${error.message || error}`);
        // Re-throw other errors or return null based on desired handling
        throw error; 
    }
  }
}

// --- Initial Load ---
// Initialization is now handled by initializationPromise export

// Replace the synchronous check with an async version that waits for initialization
export async function checkInitializationStatus(): Promise<boolean> {
  await initializationPromise;
  return isInitialized;
}