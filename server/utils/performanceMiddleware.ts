import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to track API request performance metrics
 * 
 * Captures timing data for each request and logs it on completion,
 * providing valuable performance insights for monitoring and optimization.
 */
export function performanceMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip for static assets to avoid noise
    if (req.path.startsWith('/static/') || req.path.includes('.')) {
      return next();
    }
    
    // Start the timer
    const startTime = process.hrtime();
    
    // Function to calculate duration in ms
    const getDurationInMs = () => {
      const diff = process.hrtime(startTime);
      return (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    };
    
    // Track original end method
    const originalEnd = res.end;
    
    // Override end method to include performance metrics
    res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void): Response {
      const duration = getDurationInMs();
      const route = req.originalUrl || req.url;
      const { method } = req;
      const { statusCode } = res;
      
      // Add headers for tracking (useful for debugging and client-side monitoring)
      res.setHeader('X-Response-Time', `${duration}ms`);
      
      if (req.log) {
        // Log detailed performance metrics if pino logger is attached to the request
        req.log.info({
          type: 'request_completed',
          route,
          method,
          statusCode,
          duration: parseFloat(duration),
          contentType: res.getHeader('Content-Type'),
          contentLength: res.getHeader('Content-Length'),
          requestId: req.headers['x-request-id'] || 'unknown'
        }, `${method} ${route} completed in ${duration}ms with status ${statusCode}`);
      } else {
        // Fallback to console if pino logger isn't available
        console.log(`[PERF] ${method} ${route} - ${statusCode} - ${duration}ms`);
      }
      
      return originalEnd.call(this, chunk, encoding as any, cb);
    };
    
    next();
  };
}
