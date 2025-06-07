# Vercel Deployment Checklist

Use this checklist to ensure all preparation steps have been completed before deploying RaffleHub to Vercel production.

## Pre-Deployment Checks

### Code Quality
- [ ] Run TypeScript type checking: `npm run check`
- [ ] Run ESM import checking: `npm run check:imports`
- [ ] Run linting: `npm run lint`
- [ ] Run tests: `npm run test`

### Build Process
- [ ] Test local build: `npm run build`
- [ ] Verify server build artifacts in `build/server-out`
- [ ] Verify client build artifacts in `dist`
- [ ] Confirm `clean-build.js` has removed unnecessary files

### Environment Variables
- [ ] All required environment variables are defined in Vercel project settings:
  - [ ] `NODE_ENV=production`
  - [ ] `BTCPAY_URL`
  - [ ] `BTCPAY_API_KEY`
  - [ ] `BTCPAY_STORE_ID`
  - [ ] `BTCPAY_WEBHOOK_SECRET`
  - [ ] `DATABASE_URL`
  - [ ] `SESSION_SECRET`
  - [ ] `BASE_URL` (set to your Vercel deployment URL)
  - [ ] `JWT_SECRET`
  - [ ] `LOG_LEVEL=info`

## Deployment Process

### Code Repository
- [ ] All changes committed to version control
- [ ] Merged into main branch
- [ ] Tagged with version number `git tag v1.x.x`
- [ ] Pushed to remote repository

### Vercel Configuration
- [ ] Verify `vercel.json` contains correct configuration
- [ ] Configure project settings in Vercel dashboard
- [ ] Set build command to `npm run build`
- [ ] Set output directory to `dist`

### Post-Deployment Verification

#### Core Functionality
- [ ] Homepage loads correctly
- [ ] User authentication works (login/register)
- [ ] Admin panel accessible
- [ ] Raffle creation/management works
- [ ] BTCPay integration functioning
- [ ] Ticket purchases and status updates work

#### API Health
- [ ] `/api/health` endpoint returns 200 OK
- [ ] Check BTCPay circuit breakers health
- [ ] All API endpoints responding correctly

#### Monitoring
- [ ] Check server logs for errors
- [ ] Verify performance metrics are being logged
- [ ] Confirm structured logging is working correctly

## Rollback Plan

If deployment issues are detected:
1. Identify the issue through logs and monitoring
2. Check circuit breaker status for external services
3. If needed, roll back to previous deployment in Vercel dashboard
4. Fix issues in development and follow deployment process again

## Emergency Contacts

- DevOps Lead: [Contact Info]
- Backend Lead: [Contact Info]
- Product Owner: [Contact Info]

---

## Deployment Notes

**Last Successful Deployment:** [DATE]

**Deployed By:** [NAME]

**Version:** [VERSION]

**Notes:** [Any special considerations for this deployment]
