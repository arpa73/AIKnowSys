/**
 * Natural language time expression parser for query tools
 * 
 * Parses conversational time expressions like:
 * - "yesterday", "today", "last week", "last month"
 * - "3 days ago", "2 weeks ago", "1 month ago"
 * - "this week", "this month"
 * 
 * Returns structured date filters for SQLite queries.
 * 
 * @module time-parser
 */

export interface TimeRange {
  dateAfter?: string;
  dateBefore?: string;
}

/**
 * Format date as YYYY-MM-DD for SQLite
 * Uses UTC to avoid timezone issues
 */
export function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start of current week (Monday)
 */
function getStartOfWeek(now: Date): Date {
  const date = new Date(now);
  const day = date.getUTCDay();
  // Calculate days to subtract to get to Monday (1)
  // Sunday = 0, Monday = 1, ..., Saturday = 6
  const daysToMonday = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - daysToMonday);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Get start of current month
 */
function getStartOfMonth(now: Date): Date {
  const date = new Date(now);
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Add days to a date (UTC-aware)
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Parse natural language time expressions into structured date filters
 * 
 * @param query - Natural language query (e.g., "last week", "3 days ago")
 * @param now - Current date (defaults to new Date(), injectable for testing)
 * @returns Object with dateAfter and/or dateBefore fields
 * 
 * @example
 * parseTimeExpression("last week")
 * // Returns: { dateAfter: "2026-02-07" }
 * 
 * parseTimeExpression("today")
 * // Returns: { dateAfter: "2026-02-14", dateBefore: "2026-02-14" }
 * 
 * parseTimeExpression("3 days ago")
 * // Returns: { dateAfter: "2026-02-11" }
 */
export function parseTimeExpression(query: string, now: Date = new Date()): TimeRange {
  if (!query || typeof query !== 'string') {
    return {};
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  // Pattern 1: Exact relative keywords
  const keywordPatterns: Record<string, () => TimeRange> = {
    'yesterday': () => ({
      dateAfter: formatDate(addDays(now, -1))
    }),
    'today': () => ({
      dateAfter: formatDate(now),
      dateBefore: formatDate(now)
    }),
    'last week': () => ({
      dateAfter: formatDate(addDays(now, -7))
    }),
    'last month': () => ({
      dateAfter: formatDate(addDays(now, -30))
    }),
    'this week': () => ({
      dateAfter: formatDate(getStartOfWeek(now))
    }),
    'this month': () => ({
      dateAfter: formatDate(getStartOfMonth(now))
    })
  };
  
  // Check for keyword matches
  for (const [pattern, handler] of Object.entries(keywordPatterns)) {
    if (lowerQuery.includes(pattern)) {
      return handler();
    }
  }
  
  // Pattern 2: N units ago (e.g., "3 days ago", "2 weeks ago")
  const regexPatterns: Array<[RegExp, (match: RegExpMatchArray) => TimeRange]> = [
    // Days: "3 days ago", "1 day ago"
    [
      /(\d+)\s+days?\s+ago/,
      (match) => {
        const count = parseInt(match[1], 10);
        return { dateAfter: formatDate(addDays(now, -count)) };
      }
    ],
    // Weeks: "2 weeks ago", "1 week ago"
    [
      /(\d+)\s+weeks?\s+ago/,
      (match) => {
        const count = parseInt(match[1], 10);
        return { dateAfter: formatDate(addDays(now, -count * 7)) };
      }
    ],
    // Months: "2 months ago", "1 month ago"
    [
      /(\d+)\s+months?\s+ago/,
      (match) => {
        const count = parseInt(match[1], 10);
        return { dateAfter: formatDate(addDays(now, -count * 30)) };
      }
    ]
  ];
  
  // Check for regex matches
  for (const [pattern, handler] of regexPatterns) {
    const match = lowerQuery.match(pattern);
    if (match) {
      return handler(match);
    }
  }
  
  // No match found
  return {};
}
