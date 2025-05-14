# Project TODOs

## BTCPay Server Configuration

- [x] Provide the `BTCPAY_PAIRING_CODE` (API Key) as an environment variable.
- [x] Set the `BTCPAY_API_URL` environment variable if not using the default testnet (`https://testnet.demo.btcpayserver.org`).
- [x] Set a strong `WEBHOOK_SECRET` environment variable for webhook security.
- [x] Set the `BASE_URL` environment variable to the application's public URL for correct payment redirect URLs (defaults to `http://localhost:5000`).
- [ ] Decide whether to remove the unused `server/btcpayService.ts` file which uses the official client library (currently `server/btcpayDirectService.ts` using direct `axios` calls is used). 