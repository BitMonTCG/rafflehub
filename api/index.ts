import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp } from '../build/server-out/server/app.js';

// Initialize the Express app
const appPromise = initializeApp();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await appPromise;
    
    // Convert Vercel request/response to Express format
    app(req as any, res as any);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      // Only show error details for debugging - remove in strict production if needed
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 