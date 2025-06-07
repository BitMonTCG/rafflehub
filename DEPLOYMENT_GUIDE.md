# RaffleHub Deployment Guide

This document outlines the deployment process, rollback procedures, environment variable setup, and troubleshooting tips for the RaffleHub application.

## 1. Deployment Process

RaffleHub is deployed on Vercel and leverages Git integration (e.g., with GitHub, GitLab, Bitbucket) for automated deployments.

### Prerequisites:
- Vercel project linked to the Git repository.
- All required Environment Variables configured in the Vercel project settings (see Section 3).
- `vercel.json` correctly configured for builds and routing (already in place).
- `package.json` scripts (`build`, `build:server`, `build:client`) correctly configured (already in place).
- ESLint configured to enforce `.js` extensions on ES module imports to prevent production errors.

### Deployment Steps:

1.  **Development and Testing:**
    *   Develop features or fixes on a new Git branch.
    *   Ensure all local tests pass (`npm test`).
    *   Run ESLint to check for common issues: `npm run lint`.
    *   Verify all ES module imports have proper `.js` extensions: `npm run check:imports`.
    *   Test the build process locally: `npm run build`.
    *   Test thoroughly in a local development environment (`npm run dev:full`).
    *   Refer to `VERCEL_DEPLOYMENT_CHECKLIST.md` for a complete pre-deployment verification list.

2.  **Code Commit and Push:**
    *   Commit changes to the feature branch with clear, conventional commit messages.
    *   Push the branch to the remote Git repository.

3.  **Create a Pull Request (PR) / Merge Request (MR):**
    *   Open a PR from the feature branch to the main deployment branch (e.g., `main` or `master`).
    *   Vercel will automatically create a **Preview Deployment** for this PR.
    *   The URL for the preview deployment will be available on the PR page.

4.  **Review and Test Preview Deployment:**
    *   Thoroughly review the code changes in the PR.
    *   Test the Vercel Preview Deployment to ensure all functionality works as expected and there are no regressions. Check browser console for errors and inspect network requests.
    *   Verify API endpoints, user authentication, raffle creation, ticket purchase flow (if test BTCPay setup is available for previews or using mock data).

5.  **Merge to Production Branch:**
    *   Once the PR is approved and the Preview Deployment is verified, merge the PR into the main deployment branch (e.g., `main`).

6.  **Production Deployment:**
    *   Upon merging to the production branch, Vercel will automatically trigger a **Production Deployment**.
    *   Monitor the deployment progress in the Vercel dashboard.

7.  **Post-Deployment Verification:**
    *   Once the production deployment is complete, perform smoke tests on the live production application to ensure core functionalities are working correctly.
    *   Monitor Vercel logs (and any integrated logging/error tracking services) for any immediate issues.

### Manual Redeployments (If Needed):
- In the Vercel dashboard for the project, you can manually trigger a redeployment of the latest commit on a specific branch or promote a specific Preview Deployment to Production.

## 2. Rollback Procedures

Vercel keeps a history of all deployments, making it easy to roll back to a previous, stable version if a production deployment introduces critical issues.

### Immediate Rollback (Vercel Dashboard):

1.  **Identify the Issue:** Confirm that a recent production deployment is causing critical problems.
2.  **Navigate to Vercel Dashboard:** Open the RaffleHub project in your Vercel dashboard.
3.  **Go to Deployments Tab:** Select the "Deployments" tab. You will see a list of all deployments, with the current production deployment usually marked with a special indicator or alias (e.g., your production domain).
4.  **Find a Stable Previous Deployment:** Locate the last known good production deployment in the list. This will typically be the deployment immediately preceding the problematic one.
5.  **Redeploy the Stable Version:**
    *   Click the three-dots menu (options menu) next to the stable deployment you want to roll back to.
    *   Select **"Promote to Production"** (or a similar option like "Redeploy to Production").
    *   Confirm the action. Vercel will then switch the production alias to point to this older, stable deployment. This process is usually very fast.

6.  **Verify Rollback:** Once Vercel indicates the rollback is complete, thoroughly test the production application to ensure it's functioning correctly with the rolled-back version.
7.  **Investigate the Faulty Deployment:** After rolling back and stabilizing production, investigate the root cause of the issues in the faulty deployment. This can be done by examining its logs, inspecting the code changes, and testing its corresponding preview deployment (if it still exists).

### Git-Based Rollback (Long-Term Fix Strategy):

While Vercel's "Promote to Production" is excellent for immediate rollbacks, if the issue requires a code fix, the general Git strategy is:

1.  **Identify the Bad Commit(s):** Determine which commit(s) introduced the problem.
2.  **Revert or Fix Forward:**
    *   **Revert:** Use `git revert <commit-hash>` to create a new commit that undoes the changes from the problematic commit(s). Push this revert commit. Vercel will then deploy this new state. This is often the safest way to undo changes on a shared branch.
    *   **Fix Forward:** If the issue is minor and a fix is quickly identifiable, create a new branch, apply the fix, test it, and then merge this fix into the production branch. This will trigger a new deployment with the fix.
3.  **Follow Standard Deployment Process:** Once the code is corrected (either by reverting or fixing forward), follow the standard deployment process (PR, preview, merge) to deploy the corrected version to production.

### Important Considerations:
*   **Database Migrations:** If a faulty deployment included database schema changes (migrations), rolling back the code via Vercel **does not** automatically roll back database migrations. Database rollbacks are more complex and require a separate, carefully planned strategy (e.g., restoring from a backup, or applying "down" migrations if they exist and are reliable). Always be cautious with deployments that include schema changes.
*   **Environment Variable Changes:** If a deployment issue was caused by changes to environment variables, ensure the correct variables are in place for the version you are rolling back to. Vercel deployments use the environment variables configured at the time of their build.

## 3. Environment Variable Setup

Refer to the **"Environment Variable Documentation"** section in `PRODUCTION_DEPLOYMENT_FIX_PRD.md` for a comprehensive list and description of all required environment variables.

Key variables include:
- `DATABASE_URL`
- `SESSION_SECRET`
- `BTCPAY_URL`
- `BTCPAY_API_KEY`
- `BTCPAY_STORE_ID`
- `BTCPAY_WEBHOOK_SECRET`
- `BASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` (if email service is active)

These must be configured in the Vercel project settings under "Environment Variables".

## 4. Troubleshooting Guide

This section provides guidance on troubleshooting common deployment and runtime issues.

### A. General Investigation Steps:

1.  **Check Vercel Logs:**
    *   Go to the Vercel Dashboard > Project > Deployments.
    *   Select the specific deployment (either production or a preview).
    *   View the "Logs" tab (sometimes called "Functions" logs or "Build & Development Logs").
    *   Look for any error messages, stack traces, or unusual activity. `pino` structured logs will appear here.
    *   Filter logs by function if necessary.

2.  **Check Browser Developer Tools:**
    *   Open the application in your browser.
    *   Open Developer Tools (usually F12 or right-click > Inspect).
    *   **Console Tab:** Look for JavaScript errors, failed network requests, or warnings.
    *   **Network Tab:** Inspect failed HTTP requests. Check their status codes, request/response payloads, and timing.

3.  **Reproduce the Issue Locally:**
    *   If possible, try to reproduce the issue in your local development environment (`npm run dev:full`). This allows for easier debugging.
    *   Ensure your local environment variables and code match the deployed version as closely as possible.

### B. Common Issues and Solutions:

1.  **Deployment Fails (Build Stage):**
    *   **Symptom:** Vercel build logs show errors during `npm run build` (e.g., TypeScript errors, missing dependencies, build script failures).
    *   **Troubleshooting:**
        *   Examine the Vercel build logs carefully for the specific error message.
        *   Run the build command locally (`npm run build`) to see if the error is reproducible.
        *   Check for TypeScript errors (`npm run check`).
        *   Ensure all dependencies are correctly listed in `package.json`.
        *   Verify Node.js version compatibility (Vercel uses Node 18.x as per `package.json`).

2.  **Deployment Fails (Serverless Function Issues):**
    *   **Symptom:** Build succeeds, but API endpoints return 500 errors, or functions crash. Vercel function logs show runtime errors.
    *   **Troubleshooting:**
        *   **Check Vercel Function Logs:** This is the primary source for backend errors. Look for stack traces.
        *   **ES Module Import Errors:** Ensure all local imports in server-side code (`.ts` files compiled to `.js`) use the `.js` extension (e.g., `import ... from './module.js'`). This is a common Vercel deployment issue.
        *   **Environment Variables:** Verify all required backend environment variables are set correctly in Vercel project settings and are accessible by the functions. Missing or incorrect `DATABASE_URL` or `SESSION_SECRET` are common culprits.
        *   **Database Connectivity:** Ensure the database is accessible from Vercel's serverless functions (check firewall rules, connection strings, SSL settings).
        *   **Bundle Size:** Although we've worked on this, if serverless functions are too large, they might have issues.
        *   **Timeout:** Serverless functions have execution time limits. Long-running operations might time out. Optimize or use background tasks if needed.

3.  **Frontend Issues (Client-Side):**
    *   **Symptom:** Page doesn't load correctly, UI elements are missing/broken, client-side errors in browser console.
    *   **Troubleshooting:**
        *   **Browser Console:** Check for JavaScript errors.
        *   **Network Tab:** Look for failed requests for static assets (JS, CSS, images) or API calls.
        *   **API Connectivity:** Ensure the frontend can reach the backend API endpoints. Check for CORS errors if the frontend and backend are on different effective domains (though Vercel rewrites usually handle this).
        *   **Static Asset Paths:** Verify paths to assets are correct.
        *   **Vite Build Issues:** If `npm run build:client` had silent issues, it might lead to a broken frontend.

4.  **Authentication Issues:**
    *   **Symptom:** Users cannot log in, sessions are not persisted.
    *   **Troubleshooting:**
        *   **`SESSION_SECRET`:** Ensure it's set and consistent across deployments if sessions need to persist.
        *   **Cookie Settings:** Check `secure`, `httpOnly`, `sameSite` attributes for session cookies, especially in production.
        *   **CSRF Issues:** If CSRF protection is causing problems, check token generation and handling.
        *   **Database for Sessions:** If using `connect-pg-simple`, ensure the `user_sessions` table exists and the database connection is stable.
        *   **Password Hashing:** Verify `bcrypt` is working correctly and password comparison logic is sound.

5.  **BTCPay Integration Issues:**
    *   **Symptom:** Invoice creation fails, webhooks are not processed, payment statuses are not updated.
    *   **Troubleshooting:**
        *   **BTCPay Environment Variables:** Verify `BTCPAY_URL`, `BTCPAY_API_KEY`, `BTCPAY_STORE_ID`, `BTCPAY_WEBHOOK_SECRET` are correct in Vercel.
        *   **BTCPay Server Status:** Ensure your BTCPay Server instance is running and accessible.
        *   **Webhook Configuration:** Double-check the webhook URL configured in your BTCPay Server matches the one in your application (`/api/btcpay/webhook`). Ensure the webhook secret matches.
        *   **Webhook Signature Verification:** Errors here usually point to a mismatch in webhook secrets.
        *   **Vercel Function Logs:** Check logs for the `/api/btcpay/webhook` endpoint and any BTCPay service calls.

6.  **CORS Errors:**
    *   **Symptom:** Browser console shows "Cross-Origin Resource Sharing" errors.
    *   **Troubleshooting:**
        *   While Vercel rewrites often mitigate this for same-site deployments, ensure your CORS middleware in `server/routes.ts` correctly allows your frontend's origin, especially if custom domains are involved or if you're calling the API from a different context.
        *   Check `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`.

### C. Escalation:
- If issues persist and cannot be resolved through the above steps, consider:
    - Reviewing recent code changes for potential bugs.
    - Checking Vercel's status page for platform-wide issues.
    - Reviewing the BTCPay circuit breaker health status via `/api/health` endpoint
    - Enabling the `BTCPAY_BYPASS=true` environment variable temporarily (non-production only) to isolate BTCPay integration issues
    - Checking the server bundle cleanup logs for any issues with the build process
    - Reaching out to team members for assistance.

## 5. Enhanced Reliability Features

RaffleHub includes several features to enhance production reliability:

### A. Build Process Optimization

- **Automated Bundle Cleanup**: The `scripts/clean-build.js` script automatically removes client-only dependencies and unnecessary files from the server bundle, preventing deployment size issues.
- **Bundle Size Reporting**: Build scripts report bundle size metrics to help identify potential issues before deployment.
- **ES Module Import Validation**: Both ESLint rules and the custom `scripts/check-esm-imports.js` script ensure all local imports use proper `.js` extensions to prevent the common "Cannot find module" errors in production.

### B. Runtime Reliability

- **Circuit Breaker Pattern**: Critical external service calls (like BTCPay) use circuit breakers to prevent cascading failures when external services are unavailable.
- **Service Health Monitoring**: The `/api/health` endpoint provides real-time health information including circuit breaker states.
- **Environmental Bypasses**: Non-production environments can use feature flags like `BTCPAY_BYPASS` for testing without external dependencies.
- **Structured Logging**: Comprehensive pino-based logging with appropriate redaction of sensitive data helps with troubleshooting.

### C. Deployment Safety

- **Environment Validation**: Required environment variables are validated at startup with proper error handling.
- **Type Safety**: TypeScript is used throughout the codebase to prevent common runtime errors.
- **Automated Tests**: Unit and integration tests help catch issues before deployment.
- **Preview Deployments**: Vercel's preview deployments allow testing changes in an isolated environment before production deployment.
