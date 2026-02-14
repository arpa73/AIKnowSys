/**
 * SQLite Query Core Functions
 * 
 * Pure functions for querying SQLite database. Used by MCP tools.
 * Following Phase 2 pattern: Core function = pure logic, no logger dependency.
 * 
 * Design note: These functions use SqliteStorage's queryFull* methods
 * to access complete records with content (not just metadata).
 */

import { SqliteStorage } from '../context/sqlite-storage.js';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  QuerySessionsOptions,
  QueryPlansOptions,
  QueryLearnedPatternsOptions,
  SearchContextOptions,
  DbStatsOptions,
  QuerySessionsResult,
  QueryPlansResult,
  QueryLearnedPatternsResult,
  SearchContextResult,
  DbStatsResult,
  SessionRecord,
  PlanRecord,
  LearnedPatternRecord,
} from '../types/index.js';

/**
 * Query sessions from SQLite database
 * 
 * @param options - Query filters (dateAfter, dateBefore, topic, status, includeContent)
 * @returns Session records matching filters (metadata-only by default for token efficiency)
 */
export async function querySessionsSqlite(
  options: QuerySessionsOptions
): Promise<QuerySessionsResult> {
  const dbPath = resolve(options.dbPath);
  const storage = new SqliteStorage();
  await storage.init(dbPath);
  
  try {
    const includeContent = options.includeContent ?? false; // Default to metadata-only
    
    if (includeContent) {
      // Full content mode
      const result = await storage.queryFullSessions({
        dateAfter: options.dateAfter,
        dateBefore: options.dateBefore,
        topic: options.topic,
        status: options.status,
      });
      
      const sessions: SessionRecord[] = result.sessions.map((row) => ({
        date: row.date,
        title: row.topic,
        goal: row.topic,
        status: row.status as 'active' | 'paused' | 'complete',
        topics: row.topics ? JSON.parse(row.topics) : [],
        content: row.content,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
      
      return {
        count: sessions.length,
        sessions,
      };
    } else {
      // Metadata-only mode (default) - 95% token savings
      const result = await storage.querySessionsMetadata({
        dateAfter: options.dateAfter,
        dateBefore: options.dateBefore,
        topic: options.topic,
        status: options.status,
      });
      
      const sessions = result.sessions.map((row: any) => ({
        date: row.date,
        title: row.topic,
        topic: row.topic, // Include for consistency with full mode
        goal: row.topic,
        status: row.status as 'active' | 'paused' | 'complete',
        topics: row.topics ? JSON.parse(row.topics) : [],
        created_at: row.created_at,
        updated_at: row.updated_at,
        // No content field - token efficient!
      }));
      
      return {
        count: sessions.length,
        sessions,
      };
    }
  } finally {
    storage.close();
  }
}

/**
 * Query plans from SQLite database
 * 
 * @param options - Query filters (status, author, topic, priority, includeContent)
 * @returns Plan records matching filters (metadata-only by default for token efficiency)
 */
export async function queryPlansSqlite(
  options: QueryPlansOptions
): Promise<QueryPlansResult> {
  const dbPath = resolve(options.dbPath);
  const storage = new SqliteStorage();
  await storage.init(dbPath);
  
  try {
    const includeContent = options.includeContent ?? false; // Default to metadata-only
    
    if (includeContent) {
      // Full content mode
      const result = await storage.queryFullPlans({
        status: options.status,
        author: options.author,
        topic: options.topic,
        priority: options.priority,
      });
      
      // Filter out learned patterns (they have separate query function)
      const plans: PlanRecord[] = result.plans
        .filter((row) => !row.id.startsWith('learned_'))
        .map((row) => ({
          id: row.id,
          title: row.title,
          status: row.status as 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED',
          author: row.author,
          priority: row.priority || 'medium',
          type: row.type || 'feature',
          content: row.content,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));
      
      return {
        count: plans.length,
        plans,
      };
    } else {
      // Metadata-only mode (default) - 95% token savings
      const result = await storage.queryPlansMetadata({
        status: options.status,
        author: options.author,
        topic: options.topic,
        priority: options.priority,
      });
      
      // Filter out learned patterns
      const plans = result.plans
        .filter((row: any) => !row.id.startsWith('learned_'))
        .map((row: any) => ({
          id: row.id,
          title: row.title,
          status: row.status as 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED',
          author: row.author,
          priority: row.priority || 'medium',
          type: row.type || 'feature',
          created_at: row.created_at,
          updated_at: row.updated_at,
          // No content field - token efficient!
        }));
      
      return {
        count: plans.length,
        plans,
      };
    }
  } finally {
    storage.close();
  }
}

/**
 * Query learned patterns from SQLite database
 * 
 * Note: Learned patterns are stored as plans with id starting with 'learned_'
 * 
 * @param options - Query filters (category, keywords, includeContent)
 * @returns Pattern records matching filters (metadata-only by default for token efficiency)
 */
export async function queryLearnedPatternsSqlite(
  options: QueryLearnedPatternsOptions
): Promise<QueryLearnedPatternsResult> {
  const dbPath = resolve(options.dbPath);
  const storage = new SqliteStorage();
  await storage.init(dbPath);
  
  try {
    const includeContent = options.includeContent ?? false; // Default to metadata-only
    
    if (includeContent) {
      // Full content mode
      const result = await storage.queryFullPlans({
        idStartsWith: 'learned_'
      });
      
      let patterns = result.plans.map((row): LearnedPatternRecord => ({
          id: row.id,
          category: row.type || 'general',
          title: row.title,
          content: row.content,
          keywords: row.topics ? JSON.parse(row.topics) : [],
          created_at: row.created_at,
        }));
      
      // Apply filters in memory
      if (options.category) {
        patterns = patterns.filter((p) => p.category === options.category);
      }
      
      if (options.keywords && options.keywords.length > 0) {
        patterns = patterns.filter((p) =>
          options.keywords!.some((keyword) => p.keywords.includes(keyword))
        );
      }
      
      return {
        count: patterns.length,
        patterns,
      };
    } else {
      // Metadata-only mode (default) - 95% token savings
      const result = await storage.queryLearnedPatternsMetadata({
        category: options.category,
        keywords: options.keywords,
      });
      
      const patterns = result.patterns.map((row: any) => ({
        id: row.id,
        category: row.type || 'general',
        title: row.title,
        keywords: row.topics ? JSON.parse(row.topics) : [],
        created_at: row.created_at,
        // No content field - token efficient!
      }));
      
      return {
        count: patterns.length,
        patterns,
      };
    }
  } finally {
    storage.close();
  }
}

/**
 * Full-text search across all content in SQLite database
 * 
 * @param options - Search query and optional result limit
 * @returns Search results with snippets and relevance scores
 */
export async function searchContextSqlite(
  options: SearchContextOptions
): Promise<SearchContextResult> {
  const dbPath = resolve(options.dbPath);
  const storage = new SqliteStorage();
  await storage.init(dbPath);
  
  try {
    const results: SearchContextResult['results'] = [];
    const query = options.query;
    
    // Search sessions with database filtering
    const sessions = await storage.queryFullSessions({
      contentContains: query
    });
    sessions.sessions.forEach((session) => {
      // Database already filtered, just extract snippets
      const lowerContent = session.content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const startIdx = lowerContent.indexOf(lowerQuery);
      if (startIdx >= 0) {
        const snippet = session.content.substring(
          Math.max(0, startIdx - 50),
          Math.min(session.content.length, startIdx + 100)
        );
        results.push({
          type: 'session',
          id: session.date,
          title: session.topic,
          snippet: '...' + snippet.trim() + '...',
          score: 1.0,
        });
      }
    });
    
    // Search plans with database filtering
    const plans = await storage.queryFullPlans({
      contentContains: query
    });
    plans.plans.forEach((plan) => {
      // Database already filtered, just extract snippets
      const lowerContent = plan.content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const startIdx = lowerContent.indexOf(lowerQuery);
      if (startIdx >= 0) {
        const snippet = plan.content.substring(
          Math.max(0, startIdx - 50),
          Math.min(plan.content.length, startIdx + 100)
        );
        
        // Distinguish learned patterns from regular plans
        const type = plan.id.startsWith('learned_') ? 'learned' : 'plan';
        results.push({
          type: type as 'plan' | 'learned',
          id: plan.id,
          title: plan.title,
          snippet: '...' + snippet.trim() + '...',
          score: 1.0,
        });
      }
    });
    
    // Apply limit if specified
    const limited = options.limit ? results.slice(0, options.limit) : results;
    
    return {
      count: limited.length,
      results: limited,
      query: options.query,
    };
  } finally {
    storage.close();
  }
}

/**
 * Get database statistics
 * 
 * @param options - Database path
 * @returns Record counts and database metadata
 */
export async function getDbStats(
  options: DbStatsOptions
): Promise<DbStatsResult> {
  const dbPath = resolve(options.dbPath);
  const storage = new SqliteStorage();
  await storage.init(dbPath);
  
  try {
    // Use optimized COUNT(*) queries instead of loading all records
    const stats = await storage.getStats();
    const dbSize = statSync(dbPath).size;
    
    return {
      sessions: stats.sessions,
      plans: stats.plans,
      learned: stats.learned,
      total: stats.sessions + stats.plans + stats.learned,
      dbSize,
      dbPath: dbPath,
    };
  } finally {
    storage.close();
  }
}
