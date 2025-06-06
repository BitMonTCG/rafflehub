// Simple Vercel serverless function handler
import { initializeApp } from '../build/server-out/server/app.js';

// Initialize the Express app once
let appInstance = null;
let appPromise = null;

const getApp = async () => {
  if (appInstance) {
    return appInstance;
  }
  
  if (!appPromise) {
    appPromise = initializeApp();
  }
  
  appInstance = await appPromise;
  return appInstance;
};

export default async function handler(req, res) {
  // Add comprehensive logging for debugging
  console.log(`🔍 API Request: ${req.method} ${req.url}`);
  console.log(`🔍 VERCEL_ENV: ${process.env.VERCEL_ENV}`);
  console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV}`);
  
  try {
    const app = await getApp();
    
    if (!app) {
      console.error('❌ Express app is null or undefined');
      return res.status(500).json({ 
        message: 'Express app initialization failed',
        error: 'App instance is null'
      });
    }
    
    console.log(`✅ Express app initialized, processing ${req.method} ${req.url}`);
    
    // Convert Vercel request/response to Express format
    app(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-vercel-id'] || 'unknown'
    });
  }
} 