import dotenv from 'dotenv';
dotenv.config(); // Ensure .env variables are loaded before reading them

import { OpenAPI } from 'btcpay-greenfield-node-client';
// import fs from 'fs'; // No longer needed
// import path from 'path'; // No longer needed

/**
 * Loads and validates BTCPay configuration from environment variables.
 * Sets the global configuration for the BTCPay client library.
 * Throws an error if required config is missing.
 */

// Removed .env file checking and creation logic

const btcpayUrl = process.env.BTCPAY_URL; // e.g., 'https://btcpay412113.lndyn.com'
const btcpayApiKey = process.env.BTCPAY_API_KEY; // Use BTCPAY_KEY as requested
const btcpayStoreId = process.env.BTCPAY_STORE_ID;
const btcpayWebhookSecret = process.env.BTCPAY_WEBHOOK_SECRET;

console.log('BTCPay Configuration:');
console.log(`- URL: ${btcpayUrl ? btcpayUrl : 'Not set'}`);
console.log(`- API Key: ${btcpayApiKey ? 'Set (hidden)' : 'Not set'}`);
console.log(`- Store ID: ${btcpayStoreId ? btcpayStoreId : 'Not set'}`);
console.log(`- Webhook Secret: ${btcpayWebhookSecret ? 'Set (hidden)' : 'Not set'}`);

if (!btcpayUrl || !btcpayApiKey || !btcpayStoreId || !btcpayWebhookSecret) {
    console.error('Missing BTCPay environment variables:', {
        url: !!btcpayUrl,
        apiKey: !!btcpayApiKey,
        storeId: !!btcpayStoreId,
        webhookSecret: !!btcpayWebhookSecret,
    });
    throw new Error('BTCPay configuration missing: Ensure BTCPAY_URL, BTCPAY_API_KEY, BTCPAY_STORE_ID, and BTCPAY_WEBHOOK_SECRET are set.');
}

// Set global configuration for the library
OpenAPI.BASE = btcpayUrl;
OpenAPI.TOKEN = btcpayApiKey;

// Export config values needed elsewhere (like storeId and webhookSecret)
export const btcpayConfig = {
    storeId: btcpayStoreId,
    webhookSecret: btcpayWebhookSecret,
    // We don't export url and apiKey as they are set globally via OpenAPI
};