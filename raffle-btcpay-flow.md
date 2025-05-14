# Raffle Ticket Purchase Flow with BTCPay Server

## Overview

This document describes the architecture and flow for integrating BTCPay Server into the raffle ticket purchase process. It ensures that tickets are only finalized upon confirmed crypto payment, with a buffer period (matching the BTCPay invoice expiration) during which the ticket is reserved. If payment is not received in time, the ticket is released back to the pool.

---

## Implementation Steps (Project-Specific)

### 1. Update Ticket Schema

- Add the following fields to the `tickets` table and type definitions:
    - `status`: enum (`pending`, `paid`, `expired`)
    - `btcpayInvoiceId`: string (nullable)
    - `reservedAt`: timestamp (nullable)
- Update all relevant type definitions and database logic to support these fields.

### 2. Update `/api/tickets` Endpoint Logic

- On ticket purchase request:
    1. Validate raffle and user as before.
    2. Create a ticket with:
        - `status: 'pending'`
        - `reservedAt: new Date()`
        - `btcpayInvoiceId: null` (initially)
        - Do **not** set `purchasedAt` yet.
    3. Create a BTCPay invoice using the BTCPay API.
    4. Update the ticket with the generated `btcpayInvoiceId`.
    5. Return the invoice URL and ticket info to the client.
    6. Do **not** increment `soldTickets` until payment is confirmed.

### 3. Add/Update BTCPay Webhook Endpoint

- Add or update an endpoint (e.g., `/api/btcpay/webhook`) to handle BTCPay invoice status events.
- On webhook event:
    1. Parse the event and extract the invoice ID and status.
    2. Find the ticket by `btcpayInvoiceId`.
    3. If status is `paid` or `confirmed`:
        - Set ticket `status` to `paid`.
        - Set `purchasedAt` to now.
        - Increment `soldTickets` for the raffle.
    4. If status is `expired` or `invalid`:
        - Set ticket `status` to `expired`.
        - Optionally, release the ticket for others to purchase.
    5. Ensure all updates are atomic and idempotent.

### 4. Frontend Changes

- On ticket purchase, call the new endpoint and redirect/show the BTCPay invoice.
- Poll or listen for payment status.
- If payment is confirmed, show success.
- If payment expires, inform the user and allow retry.

### 5. Testing & Validation

- Add unit tests for ticket status transitions and BTCPay webhook handling.
- Simulate BTCPay webhook events for all invoice states.
- Test edge cases: double-purchase, payment after expiration, etc.

---

## Notes

- The buffer time for ticket reservation is determined by the BTCPay invoice expiration (default: 15 minutes, configurable in BTCPay).
- All ticket status transitions should be atomic and idempotent.
- Ensure all sensitive data (e.g., BTCPay API keys) are managed via environment variables.
- Update this document as the payment flow evolves.

---

## 1. Purchase Flow

1. **User initiates ticket purchase**  
   - User selects a raffle and requests to buy a ticket.

2. **Backend creates a pending ticket and BTCPay invoice**  
   - A ticket is created in the database with status `pending`.
   - A BTCPay invoice is created via the BTCPay API, with an expiration (buffer) time (e.g., 15 minutes, as set in BTCPay).
   - The ticket is reserved for the user and associated with the BTCPay invoice ID.

3. **Frontend displays payment instructions**  
   - The user is redirected to or shown the BTCPay payment page.
   - The UI polls or listens for payment confirmation.

4. **BTCPay Server notifies backend via webhook**  
   - On payment confirmation, BTCPay sends a webhook to the backend.
   - The backend updates the ticket status to `paid`.

5. **If payment is not received before invoice expiration**  
   - BTCPay marks the invoice as `expired`.
   - The backend updates the ticket status to `expired` and releases the ticket for others to purchase.

---

## 2. Database Schema Changes

Add the following fields to the `tickets` table:

- `status`: enum (`pending`, `paid`, `expired`)
- `btcpay_invoice_id`: string (nullable)
- `reserved_at`: timestamp (optional, for tracking reservation time)

Example (TypeScript type):

```typescript
// shared/types.ts
export type TicketStatus = 'pending' | 'paid' | 'expired';

export interface Ticket {
    id: number;
    raffleId: number;
    userId: number;
    purchasedAt: Date | null;
    status: TicketStatus;
    btcpayInvoiceId?: string;
    reservedAt?: Date;
    // ...other fields
}
```

---

## 3. Backend API Changes

### a. Purchase Ticket Endpoint

- **Route:** `POST /api/tickets`
- **Logic:**
    1. Create a ticket with `pending` status.
    2. Create a BTCPay invoice (set expiration to desired buffer time).
    3. Store the invoice ID with the ticket.
    4. Return the invoice URL to the client.

### b. BTCPay Webhook Endpoint

- **Route:** `POST /api/btcpay/webhook`
- **Logic:**
    1. Parse the BTCPay event.
    2. Find the ticket by `btcpay_invoice_id`.
    3. If invoice is `paid` or `confirmed`, set ticket status to `paid`.
    4. If invoice is `expired` or `invalid`, set ticket status to `expired` and release the ticket.

### c. Periodic Cleanup (Optional)

- Periodically check for `pending` tickets with expired invoices and mark them as `expired`.

---

## 4. Frontend Changes

- On ticket purchase, call the new endpoint and redirect/show the BTCPay invoice.
- Poll or listen for payment status.
- If payment is confirmed, show success.
- If payment expires, inform the user and allow retry.

---

## 5. Edge Cases & Error Handling

- **User abandons payment:** Ticket is released after invoice expiration.
- **Partial/overpayment:** Handle according to BTCPay invoice status.
- **Webhook failures:** Implement retries and idempotency.
- **Double-purchase attempts:** Prevent multiple pending tickets for the same user/raffle.

---

## 6. Testing

- Unit tests for ticket status transitions.
- Simulate BTCPay webhook events for all invoice states.
- Test edge cases: double-purchase, payment after expiration, etc.

---

## 7. Example: Webhook Handler (Express)

```typescript
/**
 * Handles BTCPay webhook events for invoice status updates.
 * Updates ticket status based on invoice state.
 */
app.post('/api/btcpay/webhook', async (req, res) => {
    try {
        const event = req.body;
        const invoiceId = event.invoiceId;
        const status = event.status; // e.g., 'paid', 'confirmed', 'expired'

        // Find ticket by invoice ID
        const ticket = await db.tickets.findFirst({ where: { btcpayInvoiceId: invoiceId } });
        if (!ticket) return res.status(404).send('Ticket not found');

        if (status === 'paid' || status === 'confirmed') {
            ticket.status = 'paid';
            ticket.purchasedAt = new Date();
        } else if (status === 'expired' || status === 'invalid') {
            ticket.status = 'expired';
            // Optionally, remove or re-open the ticket for others
        }
        await db.tickets.update({ where: { id: ticket.id }, data: ticket });
        res.sendStatus(200);
    } catch (err) {
        // Log and handle error
        res.status(500).send('Webhook error');
    }
});
```

---

## 8. References

- [BTCPay Server API Docs](https://docs.btcpayserver.org/API/)
- [How to Format Code in Markdown (freeCodeCamp)](https://www.freecodecamp.org/news/how-to-format-code-in-markdown/)
- [GitHub: Creating and Highlighting Code Blocks](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks)

---

**This document should be kept up to date as the payment flow evolves.** 