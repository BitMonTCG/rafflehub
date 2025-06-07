// Clean Vercel serverless function handler
// Bypasses complex build system to avoid Rollup/Vite dependency issues

import { initializeApp } from '../build/server-out/server/app.js';

// Configuration
const INITIALIZATION_POLLING_INTERVAL_MS = 10;

// Initialize the Express app once and reuse across requests
let appInstance = null;
let isInitializing = false;

async function getApp() {
  // If app is already initialized, return it
  if (appInstance) {
    return appInstance;
  }
  
  // If currently initializing, wait for it
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, INITIALIZATION_POLLING_INTERVAL_MS));
    }
    return appInstance;
  }
  
  // Start initialization
  isInitializing = true;
  
  try {
    console.log('🚀 Initializing Express app for serverless...');
    appInstance = await initializeApp();
    console.log('✅ Express app initialized successfully');
    return appInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Express app:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

// Main serverless handler
export default async function handler(req, res) {
  const startTime = Date.now();
  
  // Function to sanitize headers before logging
  function sanitizeHeaders(headers) {
    const sensitiveHeaders = [
      'authorization',
      'x-api-key',
      'api-key',
      'token',
      'cookie',
      'session',
      'x-auth-token',
      'x-access-token',
      'apikey',
      'secret',
      'password',
      'credential'
    ];
    
    const sanitized = { ...headers };
    
    // Replace sensitive header values with placeholders
    for (const header of Object.keys(sanitized)) {
      if (sensitiveHeaders.some(h => header.toLowerCase().includes(h))) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  // Log request for debugging (with sanitized headers)
  console.log(`🔍 ${req.method} ${req.url} - Headers: ${JSON.stringify(sanitizeHeaders(req.headers), null, 2)}`);
  
  try {
    // Get the Express app instance
    const app = await getApp();
    
    if (!app) {
      console.error('❌ Express app instance is null');
      return res.status(500).json({
        success: false,
        message: 'Server initialization failed',
        error: 'Express app instance is null'
      });
    }
    
    // Convert Vercel request/response to Express format and handle the request
    app(req, res);
    
    // Log completion time
    const duration = Date.now() - startTime;
    console.log(`✅ Request ${req.method} ${req.url} completed in ${duration}ms`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Handler error for ${req.method} ${req.url} after ${duration}ms:`, error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Ensure we don't send response twice
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-vercel-id'] || 'unknown'
      });
    }
  }
}

// Named export for compatibility
export { handler }; 