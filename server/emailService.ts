import nodemailer from 'nodemailer';
// import { log } from './vite.js'; // Removed as vite.js doesn't exist or log methods are incorrect
import { TransportOptions } from 'nodemailer';

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'your_email_host', // Placeholder
  port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587, // Placeholder
  secure: process.env.EMAIL_SECURE === 'true', // Placeholder, defaults to false (true for 465, false for other ports)
  auth: {
    user: process.env.EMAIL_USER || 'your_email_user', // Placeholder
    pass: process.env.EMAIL_PASSWORD || 'your_email_password', // Placeholder
  },
} as TransportOptions);

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
    
    // log(`Email sent: ${info.messageId}`);
  } catch (error) {
    // log(`Error sending email: ${error instanceof Error ? error.message : String(error)}`);
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
export const sendWinnerNotification = async (
  userEmail: string,
  username: string,
  raffleTitle: string,
  cardName: string,
  retailPrice: number,
  winnerPrice: number,
  raffleId: number
): Promise<void> => {
  // Fallback to console.log if critical email variables are placeholders or EMAIL_FROM is missing
  if (
    process.env.EMAIL_HOST === 'your_email_host' ||
    process.env.EMAIL_USER === 'your_email_user' ||
    process.env.EMAIL_PASSWORD === 'your_email_password' ||
    !process.env.EMAIL_FROM || process.env.EMAIL_FROM === '"Rafflehub" <noreply@example.com>'
  ) {
    console.log(
      `Skipping email notification due to placeholder or missing email config. Winner: ${userEmail}, Raffle: ${raffleTitle}, Prize: ${cardName}, RaffleID: ${raffleId}`
    );
    return;
  }

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
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Rafflehub" <noreply@example.com>', // Sender address (EMAIL_FROM placeholder)
    to: userEmail, // List of receivers
    subject: subject, // Subject line
    html: html, // HTML body content
  };

  try {
    await transporter.sendMail(mailOptions);
    // log.info(`Winner notification email sent to ${userEmail} for raffle ${raffleId}`);
    console.info(`Winner notification email sent to ${userEmail} for raffle ${raffleId}`);
  } catch (error) {
    // log.error(`Error sending winner notification email to ${userEmail}:`, error);
    console.error(`Error sending winner notification email to ${userEmail}:`, error);
    // Do not re-throw, allow the process to continue if email fails
  }
}; 