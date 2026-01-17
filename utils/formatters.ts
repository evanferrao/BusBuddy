/**
 * Formatters Utility
 * 
 * Common formatting functions used throughout the app.
 */

/**
 * Format a timestamp to a localized time string (HH:MM format)
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "09:30")
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a timestamp to a relative time string
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string (e.g., "Just now", "5m ago", "2h ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return new Date(timestamp).toLocaleDateString('en-IN');
}

/**
 * Format seconds into a countdown string (M:SS format)
 * 
 * @param seconds - Number of seconds
 * @returns Formatted countdown string (e.g., "4:30")
 */
export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format a date to a readable string
 * 
 * @param date - Date object or timestamp
 * @returns Formatted date string
 */
export function formatDate(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date and time together
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
