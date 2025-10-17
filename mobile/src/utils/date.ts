import { format, parseISO } from 'date-fns';

/**
 * Formats a date string or Date object into a more readable format.
 * @param date - The date to format.
 * @param formatString - The format string (e.g., 'MMMM d, yyyy, h:mm a').
 * @returns The formatted date string.
 */
export const formatDate = (
  date: string | Date,
  formatString = 'MMMM d, yyyy, h:mm a'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats a date for display in a list item.
 * @param date - The date to format.
 * @returns The formatted date string (e.g., 'Oct 17, 2025').
 */
export const formatDateForList = (date: string | Date): string => {
  return formatDate(date, 'MMM d, yyyy');
};

/**
 * Formats a date and time for a detailed view.
 * @param date - The date to format.
 * @returns The formatted date and time string (e.g., 'October 17, 2025 at 3:30 PM').
 */
export const formatDateTimeDetails = (date: string | Date): string => {
  return formatDate(date, "MMMM d, yyyy 'at' h:mm a");
};

/**
 * Returns a relative time string (e.g., '2 hours ago').
 * Note: `date-fns` has `formatRelative` and `formatDistanceToNow` for this.
 * This is a simplified example.
 * @param date - The date to compare.
 * @returns A relative time string.
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const seconds = Math.round((now.getTime() - dateObj.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return formatDate(dateObj, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
};
