import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp } from '../build/server-out/server/app.js';

// Cache the initialized app instance
let cachedApp: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Initialize app only once and cache it
    if (!cachedApp) {
      console.log('Initializing Express app for Vercel serverless...');
      cachedApp = await initializeApp();
    }
    
    // Handle the request with the Express app
    return cachedApp(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
} 