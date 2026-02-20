/**
 * SQLite-based storage adapter implementation
 * Stores knowledge in ~/.aiknowsys/knowledge.db (user-level)
 * or per-project .aiknowsys/knowledge.db
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { StorageAdapter } from './storage-adapter.js';
import { wrapDatabaseError } from '../utils/database-errors.js';
import { QUERY_LIMITS } from '../utils/query-modes.js';
import { AIFriendlyErrorBuilder } from '../utils/error-builder.js';
import type {
  PlanMetadata,
  SessionMetadata,
  SearchResult,
  PlanFilters,
  SessionFilters,
  SearchScope
} from './types.js';
import type { 
  KnowledgeEvent, 
  EventFilters, 
  EventData,
  SemanticSearchOptions, 
  SemanticSearchResult 
} from '../events/types.js';
import { EventType } from '../events/types.js';
import { MarkdownGenerator } from '../events/markdown-generator.js';
import { EmbeddingGenerator } from '../embeddings/generator.js';
import { batchCosineSimilarity } from '../embeddings/similarity.js';

/**
 * Database row interfaces for type-safe query results
 * Exported for use by core query functions that need full record access
 */

/** Knowledge event row from database */
interface KnowledgeEventRow {
  event_id: string;
  project_id: string;
  session_id: string | null;
  plan_id: string | null;
  timestamp: string;
  event_type: string;
  data: string;  // JSON string
  embedding: Buffer | null;  // BLOB 384-dimensional vector (Phase 2.4)
  created_at: string;
}

export interface PlanRow {
  id: string;
  project_id: string;
  title: string;
  status: string;
  author: string;
  created_at: string;
  updated_at: string;
  topics: string | null;
  description: string | null;
  priority: string | null;
  type: string | null;
  content: string;
}

export interface SessionRow {
  id: string;
  project_id: string;
  date: string;
  topic: string;
  status: string;
  plan_id: string | null;
  duration: string | null;
  content: string;
  topics: string | null;
  phases: string | null;
  created_at: string;
  updated_at: string;
}

interface SearchRow {
  plan_id?: string;
  session_id?: string;
  title?: string;  // Present for plan searches
  topic?: string;  // Present for session searches
  content: string;
}

type SqliteValue = string | number | null | Buffer | bigint;

interface QueryResult<T> {
  count: number;
  items: T[];
}

interface SessionMetadataRecord {
  id: string;
  projectId: string;
  date: string;
  topic: string;
  status: string;
  planId: string | null;
  duration: string | null;
  topics: string[];
  phases: string[] | undefined;
  createdAt: string;
  updatedAt: string;
}

interface PlanMetadataRecord {
  id: string;
  projectId: string;
  title: string;
  status: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  topics: string[];
  description: string | null;
  priority: string | null;
  type: string | null;
}

type ReviewStatus = 'PENDING' | 'ACTIVE' | 'ADDRESSED';

interface ReviewRecord {
  id: string;
  projectId: string | null;
  targetId: string;
  author: string;
  status: ReviewStatus;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface LinkRecord {
  sourceId: string;
  targetId: string;
  type: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface UserStateRecord {
  userId: string;
  projectId: string | null;
  activePlanId: string | null;
  lastSessionId: string | null;
  focusContext: Record<string, unknown> | null;
  updatedAt: string;
}

/**
 * SQLite storage adapter for cross-repository knowledge management
 */
export class SqliteStorage extends StorageAdapter {
  /**
   * Maximum search results to return per query
   * Prevents excessive memory usage and token consumption
   * Can be made configurable in future versions
   */
  private static readonly MAX_SEARCH_RESULTS = 50;
  
  private db: Database.Database | null = null;

  /**
   * Initialize the SQLite database
   * Creates .aiknowsys/knowledge.db if it doesn't exist
   * Loads schema and enables foreign key constraints
   * @param targetDir - Directory to create database in (will be resolved to absolute path) OR absolute database path if it ends with .db
   * @throws Error if schema loading fails
   */
  async init(targetDir: string): Promise<void> {
    // Validate and resolve user-provided path (Critical Invariant #2)
    const resolvedPath = path.resolve(targetDir);
    
    // Determine if this is a database file path or a directory
    let dbPath: string;
    if (resolvedPath.endsWith('.db') || resolvedPath.endsWith('.sqlite')) {
      // Direct database path provided
      dbPath = resolvedPath;
    } else {
      // Directory provided - create database in .aiknowsys subdirectory
      const aiknowsysDir = path.join(resolvedPath, '.aiknowsys');
      await fs.mkdir(aiknowsysDir, { recursive: true });
      dbPath = path.join(aiknowsysDir, 'knowledge.db');
    }
    
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    await fs.mkdir(dbDir, { recursive: true });
    
    try {
      // Open/create database
      this.db = new Database(dbPath);
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Initialize schema
      await this.initSchema();
    } catch (error) {
      // Wrap database errors with helpful troubleshooting context
      throw wrapDatabaseError(error, 'initialize database', dbPath);
    }
  }

  private async initSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection failed. Unable to initialize schema.');
    }
    
    // Read schema.sql and execute
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    
    // Execute schema (multiple statements)
    this.db.exec(schema);
    
    // Migration: Add embedding column if it doesn't exist (Phase 2.4)
    // Check if embedding column exists
    const tableInfo = this.db.pragma('table_info(knowledge_events)') as Array<{
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: unknown;
      pk: number;
    }>;
    
    const hasEmbeddingColumn = tableInfo.some(col => col.name === 'embedding');
    
    if (!hasEmbeddingColumn) {
      // Add embedding column to existing database
      this.db.exec('ALTER TABLE knowledge_events ADD COLUMN embedding BLOB;');
    }
  }

  /**
   * Query plans with optional filters
   * @param filters - Optional filters for status, author, topic, date range
   * @returns Promise resolving to plan count and metadata array
   * @throws Error if database not initialized
   */
  async queryPlans(filters?: PlanFilters): Promise<{ count: number; plans: PlanMetadata[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    let query = 'SELECT * FROM plans WHERE 1=1';
    const params: SqliteValue[] = [];
    
    if (filters) {
      // Phase 1: Cross-Repository support
      // If allProjects is NOT set (default behavior), filter by projectId
      // If projectId is explicitly provided, use that
      // If allProjects is true, no project filtering
      if (!filters.allProjects) {
        if (filters.projectId) {
          query += ' AND project_id = ?';
          params.push(filters.projectId);
        }
      }
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      if (filters.author) {
        query += ' AND author = ?';
        params.push(filters.author);
      }
      
      if (filters.topic) {
        query += ' AND (title LIKE ? OR json_each.value LIKE ?)';
        params.push(`%${filters.topic}%`, `%${filters.topic}%`);
        // Join with json_each for topics array search
        query = query.replace('FROM plans WHERE', 
          'FROM plans LEFT JOIN json_each(plans.topics) WHERE');
      }
      
      if (filters.updatedAfter) {
        query += ' AND updated_at > ?';
        params.push(filters.updatedAfter);
      }
      
      if (filters.updatedBefore) {
        query += ' AND updated_at < ?';
        params.push(filters.updatedBefore);
      }
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as PlanRow[];
    
    const plans: PlanMetadata[] = rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      status: row.status as PlanMetadata['status'],
      author: row.author,
      created: row.created_at,
      updated: row.updated_at,
      topics: row.topics ? JSON.parse(row.topics) : [],
      description: row.description || undefined,
      file: `PLAN_${row.id}.md` // Virtual file path for compatibility
    }));
    
    return {
      count: plans.length,
      plans
    };
  }

  /**
   * Query sessions with optional filters
   * @param filters - Optional filters for date, date range, last N days, topic, plan reference
   * @returns Promise resolving to session count and metadata array
   * @throws Error if database not initialized
   */
  async querySessions(filters?: SessionFilters): Promise<{ count: number; sessions: SessionMetadata[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params: SqliteValue[] = [];
    
    if (filters) {
      // Phase 1: Cross-Repository support
      // If allProjects is NOT set (default behavior), filter by projectId
      // If projectId is explicitly provided, use that
      // If allProjects is true, no project filtering
      if (!filters.allProjects) {
        if (filters.projectId) {
          query += ' AND project_id = ?';
          params.push(filters.projectId);
        }
      }
      
      if (filters.date) {
        query += ' AND date = ?';
        params.push(filters.date);
      }
      
      if (filters.dateAfter) {
        query += ' AND date >= ?';
        params.push(filters.dateAfter);
      }
      
      if (filters.dateBefore) {
        query += ' AND date <= ?';
        params.push(filters.dateBefore);
      }
      
      if (filters.days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - filters.days);
        query += ' AND date >= ?';
        params.push(daysAgo.toISOString().split('T')[0]); // YYYY-MM-DD
      }
      
      if (filters.topic) {
        query += ' AND (topic LIKE ? OR json_each.value LIKE ?)';
        params.push(`%${filters.topic}%`, `%${filters.topic}%`);
        query = query.replace('FROM sessions WHERE',
          'FROM sessions LEFT JOIN json_each(sessions.topics) WHERE');
      }
      
      if (filters.plan) {
        query += ' AND plan_id = ?';
        params.push(filters.plan);
      }
    }
    
    query += ' ORDER BY date DESC';
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as SessionRow[];
    
    const sessions: SessionMetadata[] = rows.map(row => {
      const session: SessionMetadata = {
        id: row.id, // Phase 1: Include session ID for cross-repository support
        date: row.date,
        projectId: row.project_id,
        topic: row.topic,
        topics: row.topics ? JSON.parse(row.topics) : [],
        file: `sessions/${row.date}-session.md`, // Virtual file path
        created: row.created_at,
        updated: row.updated_at
      };
      
      // Add optional fields only if present
      if (row.plan_id) session.plan = row.plan_id;
      if (row.duration) session.duration = row.duration;
      if (row.phases) session.phases = JSON.parse(row.phases);
      
      return session;
    });
    
    return {
      count: sessions.length,
      sessions
    };
  }

  /**
   * Build FTS query with optional project filtering
   * @param ftsTableName - FTS table name (plans_fts, sessions_fts)
   * @param sourceTable - Source table name (plans, sessions)
   * @param tableAlias - Table alias for source table (p, s)
   * @param selectColumns - Column names with aliases (id as plan_id, title, content)
   * @param ftsQuery - FTS5 query string
   * @param filterByProject - Whether to filter by project
   * @param projectId - Project ID to filter by
   * @returns Object with { sql, params }
   */
  private buildFtsQuery(
    ftsTableName: string,
    sourceTable: string,
    tableAlias: string,
    selectColumns: string,
    ftsQuery: string,
    filterByProject: boolean,
    projectId?: string
  ): { sql: string; params: string[] } {
    let sql = `
      SELECT ${selectColumns}
      FROM ${ftsTableName}
      JOIN ${sourceTable} ${tableAlias} ON ${tableAlias}.rowid = ${ftsTableName}.rowid
      WHERE ${ftsTableName} MATCH ?
    `;
    
    const params = [ftsQuery];
    
    if (filterByProject && projectId) {
      sql += ` AND ${tableAlias}.project_id = ?`;
      params.push(projectId);
    }
    
    sql += ` LIMIT ${SqliteStorage.MAX_SEARCH_RESULTS}`;
    
    return { sql, params };
  }

  /**
   * Full-text search across plans and sessions using SQLite FTS5
   * @param query - Search query (will be wrapped in quotes for phrase search)
   * @param scope - Search scope: 'all', 'plans', 'sessions', 'learned', 'essentials'
   * @returns Promise resolving to query string, result count, and search results
   * @throws Error if database not initialized
   */
  async search(
    query: string, 
    scope: SearchScope,
    options?: { projectId?: string; allProjects?: boolean }
  ): Promise<{ query: string; count: number; results: SearchResult[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before searching. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    const results: SearchResult[] = [];
    
    // Prepare query for FTS5 - wrap in quotes for phrase search to avoid syntax errors
    const ftsQuery = `"${query.replace(/"/g, '""')}"`;
    
    // Determine if we need project filtering
    const filterByProject = !options?.allProjects;
    const projectId = options?.projectId; // Use projectId from options (passed by caller)
    
    // Search in plans if scope includes them
    if (scope === 'all' || scope === 'plans') {
      const { sql: planQuery, params: planParams } = this.buildFtsQuery(
        'plans_fts',
        'plans',
        'p',
        'p.id as plan_id, p.title, p.content',
        ftsQuery,
        filterByProject,
        projectId
      );
      
      const stmt = this.db.prepare(planQuery);
      const rows = stmt.all(...planParams) as SearchRow[];
      
      for (const row of rows) {
        // Extract snippet from content (first 100 chars)
        const contextSnippet = row.content ? row.content.substring(0, 100).replace(/\n/g, ' ') : (row.title || '');
        
        results.push({
          file: `PLAN_${row.plan_id}.md`,
          line: 1, // SQLite FTS doesn't track line numbers
          context: contextSnippet,
          // FTS5 rank calculation deferred to Phase 1 (migration tools)
          // Using fixed score for Phase 0 - all results equally relevant
          relevance: 100,
          type: 'plan'
        });
      }
    }
    
    // Search in sessions if scope includes them
    if (scope === 'all' || scope === 'sessions') {
      const { sql: sessionQuery, params: sessionParams } = this.buildFtsQuery(
        'sessions_fts',
        'sessions',
        's',
        's.id as session_id, s.topic, s.content',
        ftsQuery,
        filterByProject,
        projectId
      );
      
      const stmt = this.db.prepare(sessionQuery);
      const rows = stmt.all(...sessionParams) as SearchRow[];
      
      for (const row of rows) {
        // Extract snippet from content (first 100 chars)
        const contextSnippet = row.content ? row.content.substring(0, 100).replace(/\n/g, ' ') : (row.topic || '');
        
        results.push({
          file: `sessions/${row.session_id}.md`,
          line: 1,
          context: contextSnippet,
          // FTS5 rank calculation deferred to Phase 1 (migration tools)
          // Using fixed score for Phase 0 - all results equally relevant
          relevance: 100,
          type: 'session'
        });
      }
    }
    
    return {
      query,
      count: results.length,
      results
    };
  }

  /**
   * Rebuild FTS indices (SQLite FTS5 auto-maintains indices via triggers)
   * This method returns current counts without rebuilding
   * @returns Promise resolving to counts of indexed items
   * @throws Error if database not initialized
   */
  async rebuildIndex(): Promise<{ plansIndexed: number; sessionsIndexed: number; learnedIndexed: number }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before rebuilding index. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    // SQLite FTS indices are automatically maintained by triggers
    // This method returns current counts
    const plansCount = this.db.prepare('SELECT COUNT(*) as count FROM plans').get() as { count: number };
    const sessionsCount = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number };
    const patternsCount = this.db.prepare('SELECT COUNT(*) as count FROM patterns').get() as { count: number };
    
    return {
      plansIndexed: plansCount.count,
      sessionsIndexed: sessionsCount.count,
      learnedIndexed: patternsCount.count
    };
  }

  /**
   * Query full plan records (including content) with optional filters
   * Used by MCP tools that need access to full plan content
   * @param filters - Optional filters for status, author, topic, priority
   *  @returns Promise resolving to plan count and array of full plan rows
   * @throws Error if database not initialized
   */
  async queryFullPlans(filters?: PlanFilters & { priority?: string; idStartsWith?: string; contentContains?: string }): Promise<{ count: number; plans: PlanRow[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    let query = 'SELECT * FROM plans WHERE 1=1';
    const params: SqliteValue[] = [];
    
    if (filters) {
      if (filters.idStartsWith) {
        query += ' AND id LIKE ?';
        params.push(`${filters.idStartsWith}%`);
      }
      
      if (filters.contentContains) {
        query += ' AND (content LIKE ? OR title LIKE ?)';
        params.push(`%${filters.contentContains}%`, `%${filters.contentContains}%`);
      }
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      if (filters.author) {
        query += ' AND author = ?';
        params.push(filters.author);
      }
      
      if (filters.topic) {
        query += ' AND (title LIKE ? OR topics LIKE ?)';
        params.push(`%${filters.topic}%`, `%${filters.topic}%`);
      }
      
      if (filters.priority) {
        query += ' AND priority = ?';
        params.push(filters.priority);
      }
      
      if (filters.updatedAfter) {
        query += ' AND updated_at > ?';
        params.push(filters.updatedAfter);
      }
      
      if (filters.updatedBefore) {
        query += ' AND updated_at < ?';
        params.push(filters.updatedBefore);
      }
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as PlanRow[];
    
    return {
      count: rows.length,
      plans: rows
    };
  }

  /**
   * Query full session records (including content) with optional filters
   * Used by MCP tools that need access to full session content
   * @param filters - Optional filters for date, date range, topic, plan, status
   * @returns Promise resolving to session count and array of full session rows
   * @throws Error if database not initialized
   */
  async queryFullSessions(filters?: SessionFilters & { id?: string; status?: string; contentContains?: string }): Promise<{ count: number; sessions: SessionRow[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params: SqliteValue[] = [];
    
    if (filters) {
      if (filters.id) {
        query += ' AND id = ?';
        params.push(filters.id);
      }

      if (filters.contentContains) {
        query += ' AND (content LIKE ? OR topic LIKE ?)';
        params.push(`%${filters.contentContains}%`, `%${filters.contentContains}%`);
      }
      
      if (filters.date) {
        query += ' AND date = ?';
        params.push(filters.date);
      }
      
      if (filters.dateAfter) {
        query += ' AND date >= ?';
        params.push(filters.dateAfter);
      }
      
      if (filters.dateBefore) {
        query += ' AND date <= ?';
        params.push(filters.dateBefore);
      }
      
      if (filters.days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - filters.days);
        query += ' AND date >= ?';
        params.push(daysAgo.toISOString().split('T')[0]);
      }
      
      if (filters.topic) {
        query += ' AND (topic LIKE ? OR topics LIKE ?)';
        params.push(`%${filters.topic}%`, `%${filters.topic}%`);
      }
      
      if (filters.plan) {
        query += ' AND plan_id = ?';
        params.push(filters.plan);
      }
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
    }
    
    query += ' ORDER BY date DESC';
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as SessionRow[];
    
    return {
      count: rows.length,
      sessions: rows
    };
  }

  /**
   * Get a single session with related entities in one call.
   * Returns session + linked plan + reviews + events.
   */
  async getSessionWithRelations(sessionId: string): Promise<{
    session: SessionRow;
    plan: PlanRow | null;
    reviews: ReviewRecord[];
    events: KnowledgeEvent[];
  } | undefined> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }

    const sessionResult = await this.queryFullSessions({ id: sessionId });
    if (sessionResult.sessions.length === 0) {
      return undefined;
    }

    const session = sessionResult.sessions[0];

    let plan: PlanRow | null = null;
    if (session.plan_id) {
      plan = this.db
        .prepare('SELECT * FROM plans WHERE id = ? LIMIT 1')
        .get(session.plan_id) as PlanRow | null;
    }

    const reviewsResult = await this.queryReviews({ targetId: session.id });
    const events = await this.queryEvents({ sessionId: session.id, limit: 200 });

    return {
      session,
      plan,
      reviews: reviewsResult.reviews,
      events,
    };
  }

  /**
   * Query sessions metadata WITHOUT content (token-efficient)
   * Returns only metadata fields, excludes heavy content field
   * @param filters - Optional filters for date, date range, topic, plan, status
   * @returns Promise resolving to session count and array of metadata-only rows
   * @throws Error if database not initialized
   */
  async querySessionsMetadata(filters?: SessionFilters & { status?: string }): Promise<QueryResult<SessionMetadataRecord> & { sessions: SessionMetadataRecord[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    // Select everything EXCEPT content column
    let query = 'SELECT id, project_id, date, topic, status, plan_id, duration, topics, phases, created_at, updated_at FROM sessions WHERE 1=1';
    const params: SqliteValue[] = [];
    
    if (filters) {
      if (filters.date) {
        query += ' AND date = ?';
        params.push(filters.date);
      }
      
      if (filters.dateAfter) {
        query += ' AND date >= ?';
        params.push(filters.dateAfter);
      }
      
      if (filters.dateBefore) {
        query += ' AND date <= ?';
        params.push(filters.dateBefore);
      }
      
      if (filters.days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - filters.days);
        query += ' AND date >= ?';
        params.push(daysAgo.toISOString().split('T')[0]);
      }
      
      if (filters.topic) {
        query += ' AND (topic LIKE ? OR topics LIKE ?)';
        params.push(`%${filters.topic}%`, `%${filters.topic}%`);
      }
      
      if (filters.plan) {
        query += ' AND plan_id = ?';
        params.push(filters.plan);
      }


      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
    }
    
    query += ' ORDER BY date DESC';
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as SessionRow[];
    
    // Map to camelCase for consistency with querySessions()
    const sessions: SessionMetadataRecord[] = rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      date: row.date,
      topic: row.topic,
      status: row.status,
      planId: row.plan_id,
      duration: row.duration,
      topics: row.topics ? JSON.parse(row.topics) : [],
      phases: row.phases ? JSON.parse(row.phases) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    return {
      count: sessions.length,
      items: sessions,
      sessions
    };
  }

  /**
   * Query plans metadata WITHOUT content (token-efficient)
   * Returns only metadata fields, excludes heavy content field
   * @param filters - Optional filters for status, author, topic, priority
   * @returns Promise resolving to plan count and array of metadata-only rows
   * @throws Error if database not initialized
   */
  async queryPlansMetadata(filters?: PlanFilters & { priority?: string; idStartsWith?: string }): Promise<QueryResult<PlanMetadataRecord> & { plans: PlanMetadataRecord[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    // Select everything EXCEPT content column
    let query = 'SELECT id, project_id, title, status, author, created_at, updated_at, topics, description, priority, type FROM plans WHERE 1=1';
    const params: SqliteValue[] = [];
    
    if (filters) {
      if (filters.idStartsWith) {
        query += ' AND id LIKE ?';
        params.push(`${filters.idStartsWith}%`);
      }
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      if (filters.author) {
        query += ' AND author = ?';
        params.push(filters.author);
      }
      
      if (filters.topic) {
        query += ' AND (title LIKE ? OR topics LIKE ?)';
        params.push(`%${filters.topic}%`, `%${filters.topic}%`);
      }
      
      if (filters.priority) {
        query += ' AND priority = ?';
        params.push(filters.priority);
      }
      
      if (filters.updatedAfter) {
        query += ' AND updated_at > ?';
        params.push(filters.updatedAfter);
      }
      
      if (filters.updatedBefore) {
        query += ' AND updated_at < ?';
        params.push(filters.updatedBefore);
      }
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as PlanRow[];
    
    // Map to camelCase for consistency with queryPlans()
    const plans: PlanMetadataRecord[] = rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      status: row.status,
      author: row.author,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      topics: row.topics ? JSON.parse(row.topics) : [],
      description: row.description,
      priority: row.priority,
      type: row.type
    }));
    
    return {
      count: plans.length,
      items: plans,
      plans
    };
  }

  /**
   * Get session statistics (ultra-lightweight preview)
   * Returns aggregate data for browsing without content
   * @param filters - Optional filters for date, date range, topic, status
   * @returns Promise resolving to session statistics
   * @throws Error if database not initialized
   */
  async getSessionStats(filters?: SessionFilters & { status?: string }): Promise<import('../types/index.js').SessionStats> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    // Build WHERE clause for filters
    let whereClause = '1=1';
    const params: SqliteValue[] = [];
    
    if (filters) {
      if (filters.dateAfter) {
        whereClause += ' AND date >= ?';
        params.push(filters.dateAfter);
      }
      
      if (filters.dateBefore) {
        whereClause += ' AND date <= ?';
        params.push(filters.dateBefore);
      }
      
      if (filters.topic) {
        whereClause += ' AND (topic LIKE ? OR topics LIKE ?)';
        params.push(`%${filters.topic}%`, `%${filters.topic}%`);
      }
      
      if (filters.status) {
        whereClause += ' AND status = ?';
        params.push(filters.status);
      }
    }
    
    // Get aggregate stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        MIN(date) as earliest,
        MAX(date) as latest
      FROM sessions 
      WHERE ${whereClause}
    `;
    
    const stats = this.db.prepare(statsQuery).get(...params) as { total: number; earliest: string | null; latest: string | null };
    
    // Get status counts
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM sessions
      WHERE ${whereClause}
      GROUP BY status
    `;
    
    const statusRows = this.db.prepare(statusQuery).all(...params) as Array<{ status: string; count: number }>;
    
    // Get unique topics (aggregate from JSON arrays)
    const topicsQuery = `
      SELECT DISTINCT topics
      FROM sessions
      WHERE ${whereClause} AND topics IS NOT NULL
    `;
    
    const topicsRows = this.db.prepare(topicsQuery).all(...params) as Array<{ topics: string }>;
    const uniqueTopics = new Set<string>();
    
    for (const row of topicsRows) {
      try {
        const topics = JSON.parse(row.topics);
        for (const topic of topics) {
          uniqueTopics.add(topic);
        }
      } catch {
        // Skip invalid JSON
      }
    }
    
    // Get session previews (lightweight)
    const previewQuery = `
      SELECT date, topic as title, status, topics
      FROM sessions
      WHERE ${whereClause}
      ORDER BY date DESC
      LIMIT ${QUERY_LIMITS.PREVIEW_SESSION_LIMIT}
    `;
    
    const previewRows = this.db.prepare(previewQuery).all(...params) as Array<{ 
      date: string; 
      title: string; 
      status: string; 
      topics: string | null;
    }>;
    
    const sessions = previewRows.map(row => ({
      date: row.date,
      title: row.title,
      topics_count: row.topics ? JSON.parse(row.topics).length : 0,
      status: row.status
    }));
    
    return {
      count: stats.total,
      earliest: stats.earliest || undefined,
      latest: stats.latest || undefined,
      uniqueTopics: Array.from(uniqueTopics).slice(0, QUERY_LIMITS.MAX_UNIQUE_TOPICS),
      statusCounts: statusRows,
      sessions
    };
  }

  /**
   * Get plan statistics (ultra-lightweight preview)
   * Returns aggregate data for browsing without content
   * @param filters - Optional filters for status, author, topic, priority
   * @returns Promise resolving to plan statistics
   * @throws Error if database not initialized
   */
  async getPlanStats(filters?: PlanFilters & { priority?: string }): Promise<import('../types/index.js').PlanStats> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    // Build WHERE clause for filters
    let whereClause = '1=1';
    const params: SqliteValue[] = [];
    
    if (filters) {
      if (filters.status) {
        whereClause += ' AND status = ?';
        params.push(filters.status);
      }
      
      if (filters.author) {
        whereClause += ' AND author = ?';
        params.push(filters.author);
      }
      
      if (filters.topic) {
        whereClause += ' AND (title LIKE ? OR topics LIKE ?)';
        params.push(`%${filters.topic}%`, `%${filters.topic}%`);
      }
      
      if (filters.priority) {
        whereClause += ' AND priority = ?';
        params.push(filters.priority);
      }
    }
    
    // Get aggregate stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        MIN(created_at) as earliest_created,
        MAX(updated_at) as latest_updated
      FROM plans 
      WHERE ${whereClause}
    `;
    
    const stats = this.db.prepare(statsQuery).get(...params) as { 
      total: number; 
      earliest_created: string | null; 
      latest_updated: string | null;
    };
    
    // Get status counts
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM plans
      WHERE ${whereClause}
      GROUP BY status
    `;
    
    const statusRows = this.db.prepare(statusQuery).all(...params) as Array<{ status: string; count: number }>;
    
    // Get unique topics
    const topicsQuery = `
      SELECT DISTINCT topics
      FROM plans
      WHERE ${whereClause} AND topics IS NOT NULL
    `;
    
    const topicsRows = this.db.prepare(topicsQuery).all(...params) as Array<{ topics: string }>;
    const uniqueTopics = new Set<string>();
    
    for (const row of topicsRows) {
      try {
        const topics = JSON.parse(row.topics);
        for (const topic of topics) {
          uniqueTopics.add(topic);
        }
      } catch {
        // Skip invalid JSON
      }
    }
    
    // Get plan previews (lightweight)
    const previewQuery = `
      SELECT id, title, status, created_at, topics
      FROM plans
      WHERE ${whereClause}
      ORDER BY updated_at DESC
      LIMIT ${QUERY_LIMITS.PREVIEW_PLAN_LIMIT}
    `;
    
    const previewRows = this.db.prepare(previewQuery).all(...params) as Array<{ 
      id: string; 
      title: string; 
      status: string;
      created_at: string;
      topics: string | null;
    }>;
    
    const plans = previewRows.map(row => ({
      id: row.id,
      title: row.title,
      status: row.status,
      topics_count: row.topics ? JSON.parse(row.topics).length : 0,
      created_at: row.created_at
    }));
    
    return {
      count: stats.total,
      earliestCreated: stats.earliest_created || undefined,
      latestUpdated: stats.latest_updated || undefined,
      uniqueTopics: Array.from(uniqueTopics).slice(0, QUERY_LIMITS.MAX_UNIQUE_TOPICS),
      statusCounts: statusRows,
      plans
    };
  }

  /**
   * Query learned patterns metadata WITHOUT content (token-efficient)
   * Returns only metadata fields for patterns (stored as plans with 'learned_' prefix)
   * @param filters - Optional filters for category, keywords
   * @returns Promise resolving to pattern count and array of metadata-only rows
   * @throws Error if database not initialized
   */
  async queryLearnedPatternsMetadata(filters?: { category?: string; keywords?: string[] }): Promise<QueryResult<PlanMetadataRecord> & { patterns: PlanMetadataRecord[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    // Select everything EXCEPT content column, filter to learned patterns only
    let query = "SELECT id, project_id, title, status, author, created_at, updated_at, topics, description, priority, type FROM plans WHERE id LIKE 'learned_%'";
    const params: SqliteValue[] = [];
    
    if (filters) {
      if (filters.category) {
        query += ' AND type = ?';
        params.push(filters.category);
      }
      
      if (filters.keywords && filters.keywords.length > 0) {
        query += ' AND (';
        const keywordConditions = filters.keywords.map(() => 'topics LIKE ?').join(' OR ');
        query += keywordConditions + ')';
        filters.keywords.forEach(keyword => params.push(`%${keyword}%`));
      }
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as PlanRow[];

    const patterns: PlanMetadataRecord[] = rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      status: row.status,
      author: row.author,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      topics: row.topics ? JSON.parse(row.topics) : [],
      description: row.description,
      priority: row.priority,
      type: row.type
    }));
    
    return {
      count: patterns.length,
      items: patterns,
      patterns
    };
  }

  /**
   * Get database statistics using optimized COUNT(*) queries
   * Much faster than loading all records into memory
   * @returns Promise resolving to record counts by type
   * @throws Error if database not initialized
   */
  async getStats(): Promise<{ sessions: number; plans: number; learned: number }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying stats. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    const sessionCount = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number };
    const planCount = this.db.prepare("SELECT COUNT(*) as count FROM plans WHERE id NOT LIKE 'learned_%'").get() as { count: number };
    const learnedCount = this.db.prepare("SELECT COUNT(*) as count FROM plans WHERE id LIKE 'learned_%'").get() as { count: number };
    
    return {
      sessions: sessionCount.count,
      plans: planCount.count,
      learned: learnedCount.count
    };
  }

  /**
   * Close the database connection
   * Safe to call multiple times
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Execute multiple write operations atomically
   * Rolls back all changes if any operation fails
    *
    * ⚠️ IMPORTANT: The operation callback MUST contain only synchronous
    * better-sqlite3 calls. Awaiting real async I/O inside this transaction
    * (file reads, HTTP calls, etc.) is not safe.
   */
  async inTransaction<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before running transaction. ' +
        'Example: await storage.init(process.cwd())'
      );
    }

    this.db.exec('BEGIN');
    try {
      const result = await operation();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Insert a plan into the database (for testing and migration)
   * Internal use only - will be used by migration tools
   */
  async insertPlan(plan: {
    id: string;
    project_id: string;
    title: string;
    status: string;
    author: string;
    created: string;
    updated: string;
    content: string;
    topics?: string[];
    description?: string;
    priority?: string;
    type?: string;
  }): Promise<void> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before inserting data. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    const stmt = this.db.prepare(`
      INSERT INTO plans (
        id, project_id, title, status, author, priority, type,
        description, content, topics, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      plan.id,
      plan.project_id,
      plan.title,
      plan.status,
      plan.author,
      plan.priority || null,
      plan.type || null,
      plan.description || null,
      plan.content,
      JSON.stringify(plan.topics || []),
      plan.created,
      plan.updated
    );
  }

  /**
   * Insert a session into the database (for testing and migration)
   * Internal use only - will be used by migration tools
   */
  async insertSession(session: {
    id: string;
    project_id: string;
    date: string;
    topic: string;
    status: string;
    created: string;
    updated: string;
    content: string;
    topics?: string[];
    plan?: string;  // Frontend uses 'plan', maps to 'plan_id' column
    duration?: string;
    phases?: string[];
  }): Promise<void> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before inserting data. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        id, project_id, date, topic, status, plan_id, duration,
        content, topics, phases, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      session.id,
      session.project_id,
      session.date,
      session.topic,
      session.status,
      session.plan || null,  // Map 'plan' → 'plan_id' column
      session.duration || null,
      session.content,
      JSON.stringify(session.topics || []),
      JSON.stringify(session.phases || []),
      session.created,
      session.updated
    );
  }

  /**
   * Insert a project into the database (for testing and migration)
   * Internal use only - will be used by migration tools
   */
  async insertProject(project: {
    id: string;
    name: string;
    path?: string;
    tech_stack?: unknown;
    created_at: string;
    updated_at: string;
  }): Promise<void> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before inserting data. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, path, tech_stack, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      project.id,
      project.name,
      project.path || null,
      project.tech_stack ? JSON.stringify(project.tech_stack) : null,
      project.created_at,
      project.updated_at
    );
  }

  /**
   * Insert a review into the database (for new review workflow support)
   */
  async insertReview(review: {
    id: string;
    project_id?: string;
    target_id: string;
    author: string;
    status: ReviewStatus;
    content: string;
    created_at: string;
    updated_at: string;
  }): Promise<void> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before inserting data. ' +
        'Example: await storage.init(process.cwd())'
      );
    }

    const stmt = this.db.prepare(`
      INSERT INTO reviews (id, project_id, target_id, author, status, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      review.id,
      review.project_id || null,
      review.target_id,
      review.author,
      review.status,
      review.content,
      review.created_at,
      review.updated_at
    );
  }

  /**
   * Query reviews with optional filters
   */
  async queryReviews(filters?: {
    projectId?: string;
    targetId?: string;
    status?: ReviewStatus;
    author?: string;
  }): Promise<QueryResult<ReviewRecord> & { reviews: ReviewRecord[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }

    let query = 'SELECT * FROM reviews WHERE 1=1';
    const params: SqliteValue[] = [];

    if (filters?.projectId) {
      query += ' AND project_id = ?';
      params.push(filters.projectId);
    }
    if (filters?.targetId) {
      query += ' AND target_id = ?';
      params.push(filters.targetId);
    }
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.author) {
      query += ' AND author = ?';
      params.push(filters.author);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as Array<{
      id: string;
      project_id: string | null;
      target_id: string;
      author: string;
      status: ReviewStatus;
      content: string;
      created_at: string;
      updated_at: string;
    }>;

    const reviews: ReviewRecord[] = rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      targetId: row.target_id,
      author: row.author,
      status: row.status,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return {
      count: reviews.length,
      items: reviews,
      reviews
    };
  }

  /**
   * Update review status
   */
  async updateReviewStatus(id: string, status: ReviewStatus, updatedAt: string): Promise<void> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before updating data. ' +
        'Example: await storage.init(process.cwd())'
      );
    }

    this.db
      .prepare('UPDATE reviews SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, updatedAt, id);
  }

  /**
   * Insert a relationship link
   */
  async insertLink(link: {
    source_id: string;
    target_id: string;
    type: string;
    metadata?: Record<string, unknown>;
    created_at: string;
  }): Promise<void> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before inserting data. ' +
        'Example: await storage.init(process.cwd())'
      );
    }

    this.db
      .prepare(`
        INSERT INTO links (source_id, target_id, type, metadata, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        link.source_id,
        link.target_id,
        link.type,
        link.metadata ? JSON.stringify(link.metadata) : null,
        link.created_at
      );
  }

  /**
   * Query links with optional filters
   */
  async queryLinks(filters?: {
    sourceId?: string;
    targetId?: string;
    type?: string;
  }): Promise<QueryResult<LinkRecord> & { links: LinkRecord[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }

    let query = 'SELECT * FROM links WHERE 1=1';
    const params: SqliteValue[] = [];

    if (filters?.sourceId) {
      query += ' AND source_id = ?';
      params.push(filters.sourceId);
    }
    if (filters?.targetId) {
      query += ' AND target_id = ?';
      params.push(filters.targetId);
    }
    if (filters?.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    query += ' ORDER BY created_at DESC';

    const rows = this.db.prepare(query).all(...params) as Array<{
      source_id: string;
      target_id: string;
      type: string;
      metadata: string | null;
      created_at: string;
    }>;

    const links: LinkRecord[] = rows.map((row) => ({
      sourceId: row.source_id,
      targetId: row.target_id,
      type: row.type,
      metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null,
      createdAt: row.created_at
    }));

    return {
      count: links.length,
      items: links,
      links
    };
  }

  /**
   * Upsert user state (context and focus)
   */
  async upsertUserState(state: {
    user_id: string;
    project_id?: string | null;
    active_plan_id?: string | null;
    last_session_id?: string | null;
    focus_context?: Record<string, unknown> | null;
    updated_at: string;
  }): Promise<void> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before upserting data. ' +
        'Example: await storage.init(process.cwd())'
      );
    }

    this.db
      .prepare(`
        INSERT INTO user_state (user_id, project_id, active_plan_id, last_session_id, focus_context, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          project_id = excluded.project_id,
          active_plan_id = excluded.active_plan_id,
          last_session_id = excluded.last_session_id,
          focus_context = excluded.focus_context,
          updated_at = excluded.updated_at
      `)
      .run(
        state.user_id,
        state.project_id || null,
        state.active_plan_id || null,
        state.last_session_id || null,
        state.focus_context ? JSON.stringify(state.focus_context) : null,
        state.updated_at
      );
  }

  /**
   * Get user state by user ID
   */
  async getUserState(userId: string): Promise<UserStateRecord | undefined> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }

    const row = this.db
      .prepare('SELECT * FROM user_state WHERE user_id = ?')
      .get(userId) as {
      user_id: string;
      project_id: string | null;
      active_plan_id: string | null;
      last_session_id: string | null;
      focus_context: string | null;
      updated_at: string;
    } | undefined;

    if (!row) {
      return undefined;
    }

    return {
      userId: row.user_id,
      projectId: row.project_id,
      activePlanId: row.active_plan_id,
      lastSessionId: row.last_session_id,
      focusContext: row.focus_context ? (JSON.parse(row.focus_context) as Record<string, unknown>) : null,
      updatedAt: row.updated_at
    };
  }

  /**
   * Get the most recently updated active plan ID for a project.
   * Used by create-session auto-linking when plan is not explicitly provided.
   */
  async getActivePlanId(projectId: string): Promise<string | null> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }

    const row = this.db
      .prepare(`
        SELECT us.active_plan_id
        FROM user_state us
        INNER JOIN plans p ON p.id = us.active_plan_id
        WHERE us.project_id = ?
          AND us.active_plan_id IS NOT NULL
          AND p.status = 'ACTIVE'
        ORDER BY us.updated_at DESC
        LIMIT 1
      `)
      .get(projectId) as { active_plan_id: string | null } | undefined;

    return row?.active_plan_id || null;
  }

  /**
   * Insert a knowledge event into storage
   * Phase 2: Event-Sourced Storage
   * @param event - Knowledge event to insert
   * @param embedding - Optional 384-dimensional embedding vector (Phase 2.4)
   */
  async insertEvent(event: KnowledgeEvent, embedding?: Float32Array): Promise<void> {
    if (!this.db) {
      throw AIFriendlyErrorBuilder.databaseError(
        'Database not initialized',
        'Call init(targetDir) before inserting events. Example: await storage.init(process.cwd())'
      );
    }

    // Validate required fields
    if (!event.eventId?.trim()) {
      throw AIFriendlyErrorBuilder.missingRequired(
        'eventId',
        'event.eventId = "evt_" + Date.now()'
      );
    }
    if (!event.projectId?.trim()) {
      throw AIFriendlyErrorBuilder.missingRequired(
        'projectId',
        'event.projectId = "my-project"'
      );
    }
    if (!event.timestamp) {
      throw AIFriendlyErrorBuilder.missingRequired(
        'timestamp',
        'event.timestamp = new Date().toISOString()'
      );
    }
    // Validate ISO 8601 format
    if (isNaN(Date.parse(event.timestamp))) {
      throw AIFriendlyErrorBuilder.validationFailed(
        'timestamp',
        `Invalid timestamp format: ${event.timestamp}`,
        'Use ISO 8601 format: new Date().toISOString() // "2026-02-15T14:00:00Z"'
      );
    }
    if (!event.eventType) {
      throw AIFriendlyErrorBuilder.missingRequired(
        'eventType',
        'event.eventType = EventType.SESSION_STARTED'
      );
    }
    if (!event.data) {
      throw AIFriendlyErrorBuilder.missingRequired(
        'data',
        'event.data = { goal: "Implement feature X" }'
      );
    }

    // Validate embedding if provided
    let embeddingBuffer: Buffer | null = null;
    if (embedding !== undefined) {
      if (!(embedding instanceof Float32Array)) {
        throw new Error(
          'Embedding must be Float32Array. Use: const embedding = await embeddingGenerator.embedEvent(event)'
        );
      }
      if (embedding.length !== 384) {
        throw new Error(
          `Embedding must have exactly 384 dimensions (got ${embedding.length}). Expected dimensions from all-MiniLM-L6-v2 model.`
        );
      }
      embeddingBuffer = Buffer.from(embedding.buffer);
    }

    const stmt = this.db.prepare(`
      INSERT INTO knowledge_events (
        event_id, project_id, session_id, plan_id, timestamp, event_type, data, embedding, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.eventId,
      event.projectId,
      event.sessionId || null,
      event.planId || null,
      event.timestamp,
      event.eventType,
      JSON.stringify(event.data),
      embeddingBuffer,
      new Date().toISOString()
    );
  }

  /**
   * Map database row to KnowledgeEvent object
   * Handles JSON parsing and embedding deserialization with error handling
   * @private
   */
  private mapRowToEvent(row: KnowledgeEventRow): KnowledgeEvent {
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(row.data);
    } catch (error) {
      throw new Error(
        `Failed to parse event data for event_id=${row.event_id}: ${(error as Error).message}. ` +
        `Database may be corrupted. Data: ${row.data.substring(0, 100)}...`
      );
    }

    if (!Object.values(EventType).includes(row.event_type as EventType)) {
      throw new Error(
        `Invalid event_type '${row.event_type}' for event_id=${row.event_id}. ` +
        `Expected one of: ${Object.values(EventType).join(', ')}`
      );
    }

    if (typeof parsedData !== 'object' || parsedData === null) {
      throw new Error(
        `Invalid event data shape for event_id=${row.event_id}. ` +
        'Expected JSON object payload matching EventData schema.'
      );
    }

    // Deserialize embedding from BLOB (if present)
    let embedding: Float32Array | null = null;
    if (row.embedding) {
      try {
        // Validate expected size (384 dimensions * 4 bytes = 1536 bytes)
        if (row.embedding.length === 384 * 4) {
          embedding = new Float32Array(
            row.embedding.buffer,
            row.embedding.byteOffset,
            384
          );
        } else {
          // Invalid size - data corruption, return null instead of throwing
          console.warn(
            `Invalid embedding size for event ${row.event_id}: ` +
            `expected 1536 bytes, got ${row.embedding.length} bytes`
          );
        }
      } catch (error) {
        // Log warning but don't fail the query
        console.warn(
          `Failed to deserialize embedding for event ${row.event_id}: ${(error as Error).message}`
        );
      }
    }

    return {
      eventId: row.event_id,
      projectId: row.project_id,
      sessionId: row.session_id || undefined,
      planId: row.plan_id || undefined,
      timestamp: row.timestamp,
      eventType: row.event_type as EventType,
      data: parsedData as EventData,
      embedding
    };
  }

  /**
   * Get a knowledge event by ID
   * @param eventId - Event ID to retrieve
   * @returns Event or undefined if not found
   */
  async getEventById(eventId: string): Promise<KnowledgeEvent | undefined> {
    if (!this.db) {
      throw AIFriendlyErrorBuilder.databaseError(
        'Database not initialized',
        'Call init(targetDir) before querying events'
      );
    }

    const stmt = this.db.prepare(`
      SELECT * FROM knowledge_events WHERE event_id = ?
    `);

    const row = stmt.get(eventId) as KnowledgeEventRow | undefined;
    if (!row) {
      return undefined;
    }

    return this.mapRowToEvent(row);
  }

  /**
   * Query knowledge events with filters
   * @param filters - Query filters (projectId, sessionId, planId, eventType, date range, limit)
   * @returns Array of matching events (sorted newest first)
   */
  async queryEvents(filters: EventFilters): Promise<KnowledgeEvent[]> {
    if (!this.db) {
      throw AIFriendlyErrorBuilder.databaseError(
        'Database not initialized',
        'Call init(targetDir) before querying events'
      );
    }

    const whereClauses: string[] = [];
    const params: SqliteValue[] = [];

    if (filters.projectId) {
      whereClauses.push('project_id = ?');
      params.push(filters.projectId);
    }

    if (filters.sessionId) {
      whereClauses.push('session_id = ?');
      params.push(filters.sessionId);
    }

    if (filters.planId) {
      whereClauses.push('plan_id = ?');
      params.push(filters.planId);
    }

    if (filters.eventType) {
      if (Array.isArray(filters.eventType)) {
        if (filters.eventType.length > 0) {
          const placeholders = filters.eventType.map(() => '?').join(', ');
          whereClauses.push(`event_type IN (${placeholders})`);
          params.push(...filters.eventType);
        }
      } else {
        whereClauses.push('event_type = ?');
        params.push(filters.eventType);
      }
    }

    if (filters.startDate) {
      whereClauses.push('timestamp >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereClauses.push('timestamp <= ?');
      params.push(filters.endDate);
    }

    const whereClause = whereClauses.length > 0 
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';
    
    const sql = `
      SELECT * FROM knowledge_events
      ${whereClause}
      ORDER BY timestamp DESC
      ${filters.limit ? 'LIMIT ?' : ''}
    `;
    
    if (filters.limit) params.push(filters.limit);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as KnowledgeEventRow[];

    return rows.map(row => this.mapRowToEvent(row));
  }

  /**
   * Full-text search on knowledge events
   * @param query - Search query
   * @returns Array of matching events with snippets
   */
  async searchEvents(query: string): Promise<KnowledgeEvent[]> {
    if (!this.db) {
      throw AIFriendlyErrorBuilder.databaseError(
        'Database not initialized',
        'Call init(targetDir) before searching events'
      );
    }

    const stmt = this.db.prepare(`
      SELECT e.*
      FROM events_fts f
      JOIN knowledge_events e ON f.event_id = e.event_id
      WHERE events_fts MATCH ?
      ORDER BY e.timestamp DESC
    `);

    const rows = stmt.all(query) as KnowledgeEventRow[];

    return rows.map(row => this.mapRowToEvent(row));
  }

  /**
   * Semantic search using cosine similarity (Phase 2.5)
   * Computes similarity between query and all events with embeddings
   * 
   * @param query - Natural language search query
   * @param options - Search options (limit, threshold, projectId)
   * @returns Array of events ranked by semantic similarity
   */
  async semanticSearch(
    query: string,
    options?: SemanticSearchOptions
  ): Promise<SemanticSearchResult[]> {
    if (!this.db) {
      throw AIFriendlyErrorBuilder.databaseError(
        'Database not initialized',
        'Call init(targetDir) before semantic search'
      );
    }

    // Validate input
    if (!query || query.trim().length === 0) {
      throw AIFriendlyErrorBuilder.validationFailed(
        'query',
        'Query cannot be empty',
        'Provide a non-empty search query'
      );
    }

    if (query.length > 10000) {
      throw AIFriendlyErrorBuilder.validationFailed(
        'query',
        'Query too long (max 10,000 characters)',
        'Shorten your search query'
      );
    }

    // Apply default options
    const limit = options?.limit ?? 10;
    const threshold = options?.threshold ?? 0.3;

    // Generate query embedding
    const generator = new EmbeddingGenerator();
    const queryEmbedding = await generator.generateEmbedding(query);

    // Load all events with embeddings (with optional project filter)
    const whereClauses: string[] = ['embedding IS NOT NULL'];
    const params: SqliteValue[] = [];

    if (options?.projectId) {
      whereClauses.push('project_id = ?');
      params.push(options.projectId);
    }

    const sql = `
      SELECT * FROM knowledge_events
      WHERE ${whereClauses.join(' AND ')}
    `;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as KnowledgeEventRow[];

    // Map rows to events and collect non-null embeddings
    type EventWithEmbedding = KnowledgeEvent & { embedding: Float32Array };
    const events = rows
      .map(row => this.mapRowToEvent(row))
      .filter((event): event is EventWithEmbedding => event.embedding !== undefined);

    if (events.length === 0) {
      return [];
    }

    // Batch compute similarities (optimized: pre-computes query magnitude once)
    const embeddings = events.map(event => event.embedding);
    const similarities = batchCosineSimilarity(queryEmbedding, embeddings);

    // Zip events with similarities and filter by threshold
    const results: SemanticSearchResult[] = [];
    for (let i = 0; i < events.length; i++) {
      if (similarities[i] >= threshold) {
        results.push({ event: events[i], similarity: similarities[i] });
      }
    }

    // Sort by similarity (descending) and apply limit
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  // ===== Phase 2.1: Hybrid Storage Methods =====

  /**
   * Get session by ID with content
   * @param sessionId - Session ID
   * @returns Promise resolving to session row or null
   */
  async getSessionById(sessionId: string): Promise<SessionRow | null> {
    if (!this.db) {
      throw AIFriendlyErrorBuilder.databaseError(
        'Database not initialized. Call init(targetDir) before querying.',
        'await storage.init(process.cwd())'
      );
    }

    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(sessionId) as SessionRow | undefined;

    return row || null;
  }

  /**
   * Query sessions by date
   * @param date - Session date (YYYY-MM-DD format)
   * @returns Promise resolving to array of session rows (ordered by created_at ASC)
   */
  async querySessionsByDate(date: string): Promise<SessionRow[]> {
    if (!this.db) {
      throw AIFriendlyErrorBuilder.databaseError(
        'Database not initialized. Call init(targetDir) before querying.',
        'await storage.init(process.cwd())'
      );
    }

    const stmt = this.db.prepare('SELECT * FROM sessions WHERE date = ? ORDER BY created_at ASC');
    return stmt.all(date) as SessionRow[];
  }

  /**
   * Query sessions with filters (for bulk operations)
   * @param filters - Query filters (date range, project ID)
   * @returns Promise resolving to array of session rows (ordered by date ASC, created_at ASC)
   */
  async querySessionsWithFilters(filters: {
    from?: string;
    to?: string;
    projectId?: string;
  }): Promise<SessionRow[]> {
    if (!this.db) {
      throw AIFriendlyErrorBuilder.databaseError(
        'Database not initialized. Call init(targetDir) before querying.',
        'await storage.init(process.cwd())'
      );
    }

    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params: SqliteValue[] = [];

    if (filters.from) {
      query += ' AND date >= ?';
      params.push(filters.from);
    }

    if (filters.to) {
      query += ' AND date <= ?';
      params.push(filters.to);
    }

    if (filters.projectId) {
      query += ' AND project_id = ?';
      params.push(filters.projectId);
    }

    query += ' ORDER BY date ASC, created_at ASC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as SessionRow[];
  }

  /**
   * Get plan by ID with content
   * @param planId - Plan ID
   * @returns Promise resolving to plan row or null
   */
  async getPlanById(planId: string): Promise<PlanRow | null> {
    if (!this.db) {
      throw AIFriendlyErrorBuilder.databaseError(
        'Database not initialized. Call init(targetDir) before querying.',
        'await storage.init(process.cwd())'
      );
    }

    const stmt = this.db.prepare('SELECT * FROM plans WHERE id = ?');
    const row = stmt.get(planId) as PlanRow | undefined;

    return row || null;
  }

  /**
   * Get session content with intelligent fallback (hybrid read)
   * 
   * @param sessionId - Session identifier
   * @returns Promise resolving to content object with format and markdown data
   * 
   * @remarks
   * **Read Strategy:**
   * 1. Try to read events from knowledge_events table
   * 2. If events exist, generate markdown from events (primary path)
   * 3. If no events, fallback to stored markdown in sessions.content (legacy path)
   * 
   * This enables gradual migration: new sessions use events, old sessions still work.
   * 
   * @throws Error if session not found
   * 
   * @example
   * const content = await storage.getSessionContent('sess-2026-02-15-001');
   * if (content.format === 'events') {
   *   console.log('Using event-sourced content (new format)');
   * } else {
   *   console.log('Using legacy markdown (needs migration)');
   * }
   */
  async getSessionContent(sessionId: string): Promise<{format: 'events' | 'markdown'; data: string }> {
    // Try to get events first (with graceful fallback on corruption)
    try {
      const events = await this.queryEvents({ sessionId });

      if (events.length > 0) {
        // Generate markdown from events
        const session = await this.getSessionById(sessionId);
        const generator = new MarkdownGenerator();
        return {
          format: 'events',
          data: generator.generateSessionMarkdown(events, session?.topic || 'Session')
        };
      }
    } catch (error) {
      // If events are corrupted, fall back to markdown
      console.warn(`Failed to read events for session ${sessionId}, falling back to markdown:`, (error as Error).message);
    }

    // Fallback to stored markdown
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw AIFriendlyErrorBuilder.missingRequired(
        `Session ${sessionId} not found`,
        'Check that the session ID is correct'
      );
    }

    return {
      format: 'markdown',
      data: session.content || ''
    };
  }

  /**
   * Create session with event-sourced storage (hybrid write)
   * 
   * @param params - Session parameters including events array
   * @param params.id - Unique session identifier
   * @param params.projectId - Project this session belongs to
   * @param params.date - Session date (YYYY-MM-DD)
   * @param params.title - Session title
   * @param params.topics - Array of topic strings
   * @param params.events - Array of KnowledgeEvent objects to store
   * @returns Promise resolving when complete
   * 
   * @remarks
   * **Write Strategy (3 steps):**
   * 1. Insert session record with empty content (satisfies foreign key constraint)
   * 2. Insert all events into knowledge_events table (event-sourced storage)
   * 3. Generate markdown from events and update sessions.content (backward compatibility)
   * 
   * This dual-write ensures:
   * - New code can read from events (structured queries)
   * - Old code can read from markdown (graceful degradation)
   * - No data loss during transition period
   * 
   * @throws Error if database not initialized or insert fails
   * 
   * @example
   * await storage.createSessionWithEvents({
   *   id: 'sess-2026-02-15-001',
   *   projectId: 'proj-001',
   *   date: '2026-02-15',
   *   title: 'Implement Feature X',
   *   topics: ['feature-x', 'tdd'],
   *   events: [sessionStartedEvent, taskCompletedEvent]
   * });
   */
  async createSessionWithEvents(params: {
    id: string;
    projectId: string;
    date: string;
    title: string;
    topics: string[];
    events: KnowledgeEvent[];
  }): Promise<void> {
    if (!this.db) {
      throw AIFriendlyErrorBuilder.databaseError(
        'Database not initialized. Call init(targetDir) before creating.',
        'await storage.init(process.cwd())'
      );
    }

    // Store session record FIRST (before events, to satisfy foreign key constraints)
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', '', ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      params.id,
      params.projectId,
      params.date,
      params.title,
      JSON.stringify(params.topics)
    );

    // Store all events AFTER session record exists
    for (const event of params.events) {
      await this.insertEvent(event);
    }

    // Generate markdown from events and update session
    const generator = new MarkdownGenerator();
    const content = generator.generateSessionMarkdown(params.events, params.title);

    const updateStmt = this.db.prepare('UPDATE sessions SET content = ? WHERE id = ?');
    updateStmt.run(content, params.id);
  }

  /**
   * Get table structure information (for testing and migrations)
   * @param tableName - Name of table to inspect
   * @returns Array of column information
   * @internal For testing purposes only
   */
  async getTableInfo(tableName: string): Promise<Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: unknown;
    pk: number;
  }>> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return this.db.pragma(`table_info(${tableName})`) as Array<{
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: unknown;
      pk: number;
    }>;
  }

  /**
   * Store a knowledge event (alias for insertEvent for test compatibility)
   * @param projectId - Project ID for the event
   * @param event - Knowledge event to store
   * @param embedding - Optional 384-dimensional embedding vector
   */
  async storeEvent(
    projectId: string,
    event: KnowledgeEvent,
    embedding?: Float32Array
  ): Promise<void> {
    // Ensure projectId matches
    if (event.projectId !== projectId) {
      throw new Error(
        `Event projectId (${event.projectId}) does not match provided projectId (${projectId})`
      );
    }
    return this.insertEvent(event, embedding);
  }

  /**
   * Get event by ID (alias for getEventById for test compatibility)
   * @param eventId - Event ID to retrieve
   * @returns Event or undefined if not found
   */
  async getEvent(eventId: string): Promise<KnowledgeEvent | undefined> {
    return this.getEventById(eventId);
  }
}

