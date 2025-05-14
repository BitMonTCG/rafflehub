/**
 * Format cents to a dollar string
 * @param cents Amount in cents
 * @returns String representation in dollars (e.g., "$19.99")
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Calculate time remaining in a human-readable format
 * @param endDate The end date string
 * @returns Human-readable time remaining (e.g., "3h 45m")
 */
export function getTimeRemaining(endDate: string | Date | undefined): string {
  if (!endDate) return "N/A";
  
  const end = new Date(endDate);
  const now = new Date();
  
  if (end <= now) return "Ended";
  
  const diff = end.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

/**
 * Calculate detailed time remaining
 * @param endDate The end date string
 * @returns Object with days, hours, minutes, seconds remaining
 */
export function getDetailedTimeRemaining(endDate: string | Date | undefined): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  if (!endDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  const end = new Date(endDate);
  const now = new Date();
  
  if (end <= now) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  const diff = end.getTime() - now.getTime();
  
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000)
  };
}

/**
 * Format a date to a relative time string
 * @param date The date string
 * @returns Human-readable relative time (e.g., "2 days ago")
 */
export function getRelativeTimeString(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  
  if (weeks > 0) {
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  return 'Just now';
}

/**
 * Format large numbers with commas
 * @param num The number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
