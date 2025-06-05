// This file MUST be imported first to load environment variables
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Export process.env for convenience
export const env = process.env; 