// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import { initializeApp } from "./app.js";

// Prevent unhandled exceptions (especially from HMR WebSocket) from crashing the process
process.on('uncaughtException', (err) => {
  console.error(`Uncaught exception: ${err.message}`, 'process');
});
process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled Rejection: ${reason}`, 'process');
});

const port = process.env.PORT || 3000;

(async () => {
  try {
    console.log("Starting development server...");
    
    // Initialize the Express app
    const app = await initializeApp();
    
    // Start the server for development
    app.listen(port, () => {
      console.log(`Development server running on port ${port}`);
    });
    
  } catch (error) {
    console.error(`Error starting development server: ${error}`);
    process.exit(1);
  }
})();
