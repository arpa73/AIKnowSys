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
import type {
  PlanMetadata,
  SessionMetadata,
  SearchResult,
  PlanFilters,
  SessionFilters,
  SearchScope
} from './types.js';

/**
 * Database row interfaces for type-safe query results
 * Exported for use by core query functions that need full record access
 */
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

/**
 * SQLite storage adapter for cross-repository knowledge management
 */
export class SqliteStorage extends StorageAdapter {
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
    const params: any[] = [];
    
    if (filters) {
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
    const params: any[] = [];
    
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
        date: row.date,
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
   * Full-text search across plans and sessions using SQLite FTS5
   * @param query - Search query (will be wrapped in quotes for phrase search)
   * @param scope - Search scope: 'all', 'plans', 'sessions', 'learned', 'essentials'
   * @returns Promise resolving to query string, result count, and search results
   * @throws Error if database not initialized
   */
  async search(query: string, scope: SearchScope): Promise<{ query: string; count: number; results: SearchResult[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before searching. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    const results: SearchResult[] = [];
    
    // Prepare query for FTS5 - wrap in quotes for phrase search to avoid syntax errors
    const ftsQuery = `"${query.replace(/"/g, '""')}"`;
    
    // Search in plans if scope includes them
    if (scope === 'all' || scope === 'plans') {
      const planQuery = `
        SELECT 
          p.id as plan_id,
          p.title,
          p.content
        FROM plans_fts
        JOIN plans p ON p.rowid = plans_fts.rowid
        WHERE plans_fts MATCH ?
        LIMIT 50
      `;
      
      const stmt = this.db.prepare(planQuery);
      const rows = stmt.all(ftsQuery) as SearchRow[];
      
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
      const sessionQuery = `
        SELECT 
          s.id as session_id,
          s.topic,
          s.content
        FROM sessions_fts
        JOIN sessions s ON s.rowid = sessions_fts.rowid
        WHERE sessions_fts MATCH ?
        LIMIT 50
      `;
      
      const stmt = this.db.prepare(sessionQuery);
      const rows = stmt.all(ftsQuery) as SearchRow[];
      
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
    const params: any[] = [];
    
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
  async queryFullSessions(filters?: SessionFilters & { status?: string; contentContains?: string }): Promise<{ count: number; sessions: SessionRow[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params: any[] = [];
    
    if (filters) {
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
   * Query sessions metadata WITHOUT content (token-efficient)
   * Returns only metadata fields, excludes heavy content field
   * @param filters - Optional filters for date, date range, topic, plan, status
   * @returns Promise resolving to session count and array of metadata-only rows
   * @throws Error if database not initialized
   */
  async querySessionsMetadata(filters?: SessionFilters & { status?: string }): Promise<{ count: number; sessions: any[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    // Select everything EXCEPT content column
    let query = 'SELECT id, project_id, date, topic, status, plan_id, duration, topics, phases, created_at, updated_at FROM sessions WHERE 1=1';
    const params: any[] = [];
    
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
    const rows = stmt.all(...params);
    
    return {
      count: rows.length,
      sessions: rows
    };
  }

  /**
   * Query plans metadata WITHOUT content (token-efficient)
   * Returns only metadata fields, excludes heavy content field
   * @param filters - Optional filters for status, author, topic, priority
   * @returns Promise resolving to plan count and array of metadata-only rows
   * @throws Error if database not initialized
   */
  async queryPlansMetadata(filters?: PlanFilters & { priority?: string; idStartsWith?: string }): Promise<{ count: number; plans: any[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    // Select everything EXCEPT content column
    let query = 'SELECT id, project_id, title, status, author, created_at, updated_at, topics, description, priority, type FROM plans WHERE 1=1';
    const params: any[] = [];
    
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
    const rows = stmt.all(...params);
    
    return {
      count: rows.length,
      plans: rows
    };
  }

  /**
   * Query learned patterns metadata WITHOUT content (token-efficient)
   * Returns only metadata fields for patterns (stored as plans with 'learned_' prefix)
   * @param filters - Optional filters for category, keywords
   * @returns Promise resolving to pattern count and array of metadata-only rows
   * @throws Error if database not initialized
   */
  async queryLearnedPatternsMetadata(filters?: { category?: string; keywords?: string[] }): Promise<{ count: number; patterns: any[] }> {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Call init(targetDir) before querying. ' +
        'Example: await storage.init(process.cwd())'
      );
    }
    
    // Select everything EXCEPT content column, filter to learned patterns only
    let query = "SELECT id, project_id, title, status, author, created_at, updated_at, topics, description, priority, type FROM plans WHERE id LIKE 'learned_%'";
    const params: any[] = [];
    
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
    const rows = stmt.all(...params);
    
    return {
      count: rows.length,
      patterns: rows
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
    tech_stack?: any;
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
}
