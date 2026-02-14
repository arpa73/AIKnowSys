/**
 * SQLite-based storage adapter implementation
 * Stores knowledge in ~/.aiknowsys/knowledge.db (user-level)
 * or per-project .aiknowsys/knowledge.db
 */
import { StorageAdapter } from './storage-adapter.js';
import type { PlanMetadata, SessionMetadata, SearchResult, PlanFilters, SessionFilters, SearchScope } from './types.js';
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
/**
 * SQLite storage adapter for cross-repository knowledge management
 */
export declare class SqliteStorage extends StorageAdapter {
    private db;
    /**
     * Initialize the SQLite database
     * Creates .aiknowsys/knowledge.db if it doesn't exist
     * Loads schema and enables foreign key constraints
     * @param targetDir - Directory to create database in (will be resolved to absolute path) OR absolute database path if it ends with .db
     * @throws Error if schema loading fails
     */
    init(targetDir: string): Promise<void>;
    private initSchema;
    /**
     * Query plans with optional filters
     * @param filters - Optional filters for status, author, topic, date range
     * @returns Promise resolving to plan count and metadata array
     * @throws Error if database not initialized
     */
    queryPlans(filters?: PlanFilters): Promise<{
        count: number;
        plans: PlanMetadata[];
    }>;
    /**
     * Query sessions with optional filters
     * @param filters - Optional filters for date, date range, last N days, topic, plan reference
     * @returns Promise resolving to session count and metadata array
     * @throws Error if database not initialized
     */
    querySessions(filters?: SessionFilters): Promise<{
        count: number;
        sessions: SessionMetadata[];
    }>;
    /**
     * Full-text search across plans and sessions using SQLite FTS5
     * @param query - Search query (will be wrapped in quotes for phrase search)
     * @param scope - Search scope: 'all', 'plans', 'sessions', 'learned', 'essentials'
     * @returns Promise resolving to query string, result count, and search results
     * @throws Error if database not initialized
     */
    search(query: string, scope: SearchScope): Promise<{
        query: string;
        count: number;
        results: SearchResult[];
    }>;
    /**
     * Rebuild FTS indices (SQLite FTS5 auto-maintains indices via triggers)
     * This method returns current counts without rebuilding
     * @returns Promise resolving to counts of indexed items
     * @throws Error if database not initialized
     */
    rebuildIndex(): Promise<{
        plansIndexed: number;
        sessionsIndexed: number;
        learnedIndexed: number;
    }>;
    /**
     * Query full plan records (including content) with optional filters
     * Used by MCP tools that need access to full plan content
     * @param filters - Optional filters for status, author, topic, priority
     *  @returns Promise resolving to plan count and array of full plan rows
     * @throws Error if database not initialized
     */
    queryFullPlans(filters?: PlanFilters & {
        priority?: string;
        idStartsWith?: string;
        contentContains?: string;
    }): Promise<{
        count: number;
        plans: PlanRow[];
    }>;
    /**
     * Query full session records (including content) with optional filters
     * Used by MCP tools that need access to full session content
     * @param filters - Optional filters for date, date range, topic, plan, status
     * @returns Promise resolving to session count and array of full session rows
     * @throws Error if database not initialized
     */
    queryFullSessions(filters?: SessionFilters & {
        status?: string;
        contentContains?: string;
    }): Promise<{
        count: number;
        sessions: SessionRow[];
    }>;
    /**
     * Query sessions metadata WITHOUT content (token-efficient)
     * Returns only metadata fields, excludes heavy content field
     * @param filters - Optional filters for date, date range, topic, plan, status
     * @returns Promise resolving to session count and array of metadata-only rows
     * @throws Error if database not initialized
     */
    querySessionsMetadata(filters?: SessionFilters & {
        status?: string;
    }): Promise<{
        count: number;
        sessions: any[];
    }>;
    /**
     * Query plans metadata WITHOUT content (token-efficient)
     * Returns only metadata fields, excludes heavy content field
     * @param filters - Optional filters for status, author, topic, priority
     * @returns Promise resolving to plan count and array of metadata-only rows
     * @throws Error if database not initialized
     */
    queryPlansMetadata(filters?: PlanFilters & {
        priority?: string;
        idStartsWith?: string;
    }): Promise<{
        count: number;
        plans: any[];
    }>;
    /**
     * Query learned patterns metadata WITHOUT content (token-efficient)
     * Returns only metadata fields for patterns (stored as plans with 'learned_' prefix)
     * @param filters - Optional filters for category, keywords
     * @returns Promise resolving to pattern count and array of metadata-only rows
     * @throws Error if database not initialized
     */
    queryLearnedPatternsMetadata(filters?: {
        category?: string;
        keywords?: string[];
    }): Promise<{
        count: number;
        patterns: any[];
    }>;
    /**
     * Get database statistics using optimized COUNT(*) queries
     * Much faster than loading all records into memory
     * @returns Promise resolving to record counts by type
     * @throws Error if database not initialized
     */
    getStats(): Promise<{
        sessions: number;
        plans: number;
        learned: number;
    }>;
    /**
     * Close the database connection
     * Safe to call multiple times
     */
    close(): Promise<void>;
    /**
     * Insert a plan into the database (for testing and migration)
     * Internal use only - will be used by migration tools
     */
    insertPlan(plan: {
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
    }): Promise<void>;
    /**
     * Insert a session into the database (for testing and migration)
     * Internal use only - will be used by migration tools
     */
    insertSession(session: {
        id: string;
        project_id: string;
        date: string;
        topic: string;
        status: string;
        created: string;
        updated: string;
        content: string;
        topics?: string[];
        plan?: string;
        duration?: string;
        phases?: string[];
    }): Promise<void>;
    /**
     * Insert a project into the database (for testing and migration)
     * Internal use only - will be used by migration tools
     */
    insertProject(project: {
        id: string;
        name: string;
        path?: string;
        tech_stack?: any;
        created_at: string;
        updated_at: string;
    }): Promise<void>;
}
//# sourceMappingURL=sqlite-storage.d.ts.map