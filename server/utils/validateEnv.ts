import { z } from 'zod';
import crypto from 'crypto';

// Schema for validating environment variables
export const envSchema = z.object({
  // Database connection
  DATABASE_URL: z.string().min(1).describe('PostgreSQL connection string'),
  
  // Security
  SESSION_SECRET: z.string().min(16).describe('Secret for session management'),
  CSRF_SECRET: z.string().min(32)
    .describe('Secret for CSRF token generation (required)'),
  
  // BTCPay integration
  BTCPAY_URL: z.string().url().describe('BTCPay Server URL'),
  BTCPAY_API_KEY: z.string().min(1).describe('BTCPay API Key'),
  BTCPAY_STORE_ID: z.string().min(1).describe('BTCPay Store ID'),
  BTCPAY_WEBHOOK_SECRET: z.string().min(1).describe('Secret for BTCPay webhook validation'),
  
  // Application settings
  BASE_URL: z.string().url().describe('Base URL of the application'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
    .describe('Application environment'),
  
  // Optional email config
  EMAIL_HOST: z.string().optional().describe('SMTP server hostname'),
  EMAIL_PORT: z.coerce.number().optional().describe('SMTP server port'),
  EMAIL_SECURE: z.boolean().optional().describe('Use SSL for email'),
  EMAIL_USER: z.string().optional().describe('SMTP username'),
  EMAIL_PASS: z.string().optional().describe('SMTP password'),
  EMAIL_FROM: z.string().optional().describe('From email address'),
});

// Type definition for validated environment
export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables against the schema
 * @returns The validated environment object
 * @throws If validation fails
 */
/**
 * Generates a cryptographically secure random string for use as a CSRF token
 * @returns A secure random string
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateEnv(): Env {
  try {
    // If CSRF_SECRET is not provided, generate a secure one
    if (!process.env.CSRF_SECRET) {
      const generatedSecret = generateSecureToken();
      process.env.CSRF_SECRET = generatedSecret;
      console.warn('⚠️ No CSRF_SECRET provided in environment. A secure random token has been generated for this session.');
      
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ Warning: Using a generated CSRF_SECRET in production. This will change on server restart!');
        console.warn('   Consider setting a permanent CSRF_SECRET environment variable.');
      }
    }
    
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      
      console.error('\nPlease check your environment variables and try again.');
      
      // In production, we should exit. In development, we might want to continue with warnings
      if (process.env.NODE_ENV === 'production') {
        console.error('Exiting process due to invalid environment configuration.');
        process.exit(1);
      }
    }
    throw error;
  }
}
