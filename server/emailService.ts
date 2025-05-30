import nodemailer from 'nodemailer';
import { log } from './vite.js';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email configuration
const emailConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Send an email
 * @param to Recipient email address
 * @param subject Email subject
 * @param html Email HTML content
 * @returns Promise that resolves when email is sent
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'BitMon Raffle Hub <noreply@bitmonraffles.com>',
      to,
      subject,
      html,
    });
    
    log(`Email sent: ${info.messageId}`);
  } catch (error) {
    log(`Error sending email: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Send a winner notification email
 * @param userEmail Recipient email address
 * @param username Recipient username
 * @param raffleTitle Title of the won raffle
 * @param cardName Name of the Pokémon card
 * @param retailPrice Original retail price
 * @param winnerPrice Discounted winner price
 * @param raffleId ID of the raffle for generating links
 * @returns Promise that resolves when email is sent
 */
export async function sendWinnerNotification(
  userEmail: string,
  username: string,
  raffleTitle: string,
  cardName: string,
  retailPrice: number,
  winnerPrice: number,
  raffleId: number
): Promise<void> {
  const subject = `🎉 Congratulations! You've Won the ${cardName} Raffle!`;
  
  // Calculate discount percentage
  const discountPercent = Math.round(100 - (winnerPrice / retailPrice * 100));
  
  // Format prices in dollars
  const formattedRetailPrice = (retailPrice / 100).toFixed(2);
  const formattedWinnerPrice = (winnerPrice / 100).toFixed(2);
  
  // Generate the claim URL
  const claimUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/raffles/${raffleId}?claim=true`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3B4CCA;">🎉 Congratulations, ${username}! 🎉</h1>
        <h2 style="color: #FF5350;">You've Won!</h2>
      </div>
      
      <p>Great news! You are the lucky winner of our <strong>${raffleTitle}</strong> raffle!</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #3B4CCA; margin-top: 0;">Your Prize Details:</h3>
        <p><strong>Card:</strong> ${cardName}</p>
        <p><strong>Original Price:</strong> $${formattedRetailPrice}</p>
        <p><strong>Your Special Winner Price:</strong> <span style="color: #FF5350; font-weight: bold;">$${formattedWinnerPrice}</span> (${discountPercent}% off!)</p>
      </div>
      
      <p>To claim your prize, please click the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${claimUrl}" style="background-color: #FFDE00; color: #212121; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Claim Your Prize</a>
      </div>
      
      <p>You have 7 days to claim your prize before it expires.</p>
      
      <p>Thank you for participating in our raffle!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #757575; font-size: 12px;">
        <p>BitMon Raffle Hub</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;
  
  return sendEmail(userEmail, subject, html);
} 