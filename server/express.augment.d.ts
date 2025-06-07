// File: server/express.augment.d.ts
import { Logger } from 'pino'; // Import the Logger type from pino

declare global {
  namespace Express {
    export interface Request {
      log: Logger; // Add the 'log' property to the Request interface
    }
  }
}

// Adding an empty export {} to make this file a module.
// This is sometimes necessary for global augmentations to be picked up correctly,
// especially if your tsconfig has isolatedModules or similar strictness.
// If it causes issues or is not needed, it can be removed.
export {};
