/**
 * Date formatting utilities for markdown generation
 * Ensures consistent date formatting across event-sourced storage
 */

/**
 * Format a timestamp for session markdown headers
 * 
 * @param timestamp - ISO 8601 timestamp string
 * @param locale - Locale for date formatting (default: 'en-US')
 * @returns Formatted date string (e.g., "Feb 15, 2026")
 * 
 * @example
 * const formatted = formatSessionDate('2026-02-15T14:30:00Z');
 * console.log(formatted); // "Feb 15, 2026"
 */
export function formatSessionDate(timestamp: string, locale = 'en-US'): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(locale, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Format a timestamp for plan markdown headers
 * Same as formatSessionDate but semantically distinct
 * 
 * @param timestamp - ISO 8601 timestamp string
 * @param locale - Locale for date formatting (default: 'en-US')
 * @returns Formatted date string (e.g., "Feb 15, 2026")
 */
export function formatPlanDate(timestamp: string, locale = 'en-US'): string {
  return formatSessionDate(timestamp, locale);
}
