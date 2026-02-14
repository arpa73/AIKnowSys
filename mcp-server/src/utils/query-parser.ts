/**
 * Parameter parser for natural language query tools
 * 
 * Converts flexible query parameters (natural language, relative dates, structured)
 * into normalized SQLite query parameters.
 * 
 * @module query-parser
 */

import { parseTimeExpression, formatDate } from '../utils/time-parser.js';

interface FlexibleQueryParams {
  // Natural language
  when?: string;
  about?: string;
  // Relative dates
  last?: number;
  unit?: 'days' | 'weeks' | 'months';
  // Structured (backwards compatible)
  dateAfter?: string;
  dateBefore?: string;
  topic?: string;
  // Common
  dbPath?: string;
  includeContent?: boolean;
  // Plan-specific
  status?: string;
  author?: string;
  priority?: string;
  // Pattern-specific
  category?: string;
  keywords?: string[];
}

// Superset type containing all possible query parameters
// Each specific query function (sessions/plans/patterns) uses a subset of these fields
// Type safety enforced by:
// 1. Zod validation at MCP tool registration (server.ts)
// 2. Core query functions ignore irrelevant fields
// 3. Explicit type narrowing in tool handlers (sqlite-query.ts)
interface ParsedQueryParams {
  dbPath: string;
  // Date filters (all query types)
  dateAfter?: string;
  dateBefore?: string;
  // Topic/content filters
  topic?: string;
  // Session-specific
  status?: string; // Sessions use flexible string
  // Plan-specific
  author?: string;
  priority?: 'high' | 'medium' | 'low';
  // Pattern-specific
  category?: string;
  keywords?: string[];
  // Performance optimization (all query types)
  includeContent?: boolean;
}

/**
 * Parse flexible query parameters into structured SQLite parameters
 * 
 * Priority order:
 * 1. Natural language (`when`, `about`)
 * 2. Relative dates (`last`, `unit`)
 * 3. Absolute dates (`dateAfter`, `dateBefore`)
 * 4. Topics (`topic` or parsed from `about`)
 * 
 * @param params - Flexible query parameters
 * @param now - Current date (injectable for testing)
 * @returns Normalized query parameters for SQLite
 * 
 * @example
 * // Natural language
 * parseQueryParams({ when: "last week", about: "MCP testing" })
 * // Returns: { dbPath: "...", dateAfter: "2026-02-07", topic: "MCP testing" }
 * 
 * // Relative dates
 * parseQueryParams({ last: 7, unit: "days", topic: "sqlite" })
 * // Returns: { dbPath: "...", dateAfter: "2026-02-07", topic: "sqlite" }
 * 
 * // Absolute dates
 * parseQueryParams({ dateAfter: "2026-02-06", topic: "mcp-tools" })
 * // Returns: { dbPath: "...", dateAfter: "2026-02-06", topic: "mcp-tools" }
 */
export function parseQueryParams(
  params: FlexibleQueryParams,
  now: Date = new Date()
): ParsedQueryParams {
  const result: ParsedQueryParams = {
    dbPath: params.dbPath || '.aiknowsys/knowledge.db',
    includeContent: params.includeContent ?? false,
  };

  // 1. Parse time expressions (priority order: when > last/unit > dateAfter/dateBefore)
  if (params.when) {
    // Natural language time: "last week", "3 days ago", etc.
    const timeRange = parseTimeExpression(params.when, now);
    if (timeRange.dateAfter) result.dateAfter = timeRange.dateAfter;
    if (timeRange.dateBefore) result.dateBefore = timeRange.dateBefore;
  } else if (params.last !== undefined && params.unit) {
    // Relative dates: { last: 7, unit: "days" }
    const date = new Date(now);
    
    if (params.unit === 'days') {
      date.setUTCDate(date.getUTCDate() - params.last);
    } else if (params.unit === 'weeks') {
      date.setUTCDate(date.getUTCDate() - params.last * 7);
    } else if (params.unit === 'months') {
      // Use setUTCMonth for accurate month calculation
      // Handles month boundaries correctly (Jan 31 - 1 month = Feb 28/29)
      date.setUTCMonth(date.getUTCMonth() - params.last);
    }
    
    result.dateAfter = formatDate(date);
  } else {
    // Absolute dates
    if (params.dateAfter) result.dateAfter = params.dateAfter;
    if (params.dateBefore) result.dateBefore = params.dateBefore;
  }

  // 2. Parse topic/about
  if (params.about) {
    // Natural language topic - use as-is for now
    // Future: could do keyword extraction or stemming
    result.topic = params.about;
  } else if (params.topic) {
    result.topic = params.topic;
  }

  // 3. Pass through other structured parameters (type checking happens at call site)
  if (params.status) result.status = params.status;
  if (params.author) result.author = params.author;
  if (params.priority) result.priority = params.priority as 'high' | 'medium' | 'low';
  if (params.category) result.category = params.category;
  if (params.keywords) result.keywords = params.keywords;

  return result;
}
