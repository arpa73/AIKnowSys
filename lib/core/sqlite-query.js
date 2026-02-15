/**
 * SQLite Query Core Functions
 *
 * Pure functions for querying SQLite database. Used by MCP tools.
 * Following Phase 2 pattern: Core function = pure logic, no logger dependency.
 *
 * Design note: These functions use SqliteStorage's queryFull* methods
 * to access complete records with content (not just metadata).
 *
 * Phase 3: Smart database path detection (auto-find knowledge.db)
 */
import { SqliteStorage } from '../context/sqlite-storage.js';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { findKnowledgeDb } from '../utils/find-knowledge-db.js';
/**
 * Query sessions from SQLite database
 *
 * Supports 4 levels of detail:
 * - preview: Ultra-light summary (~150 tokens) - counts, dates, topics
 * - metadata: Full metadata, no content (~500 tokens) [DEFAULT]
 * - section: Specific section from content (~1.2K tokens)
 * - full: Everything (~22K tokens)
 *
 * @param options - Query filters and mode selection
 *                  dbPath is optional - will auto-detect if not provided
 * @returns Session records matching filters in requested detail level
 */
export async function querySessionsSqlite(options) {
    const dbPath = resolve(options.dbPath || findKnowledgeDb());
    const storage = new SqliteStorage();
    await storage.init(dbPath);
    try {
        // Determine mode (support legacy includeContent flag)
        let mode = options.mode || 'metadata';
        if (options.includeContent === true) {
            mode = 'full'; // Legacy: includeContent=true → full mode
        }
        if (mode === 'preview') {
            // Ultra-lightweight: just stats and previews
            const stats = await storage.getSessionStats({
                dateAfter: options.dateAfter,
                dateBefore: options.dateBefore,
                topic: options.topic,
                status: options.status,
            });
            return {
                count: stats.count,
                date_range: stats.earliest && stats.latest ? `${stats.earliest} to ${stats.latest}` : undefined,
                topics: stats.uniqueTopics,
                status_counts: stats.statusCounts,
                sessions: stats.sessions,
            }; // Type assertion - preview mode returns different shape
        }
        if (mode === 'full') {
            // Full content mode
            const result = await storage.queryFullSessions({
                dateAfter: options.dateAfter,
                dateBefore: options.dateBefore,
                topic: options.topic,
                status: options.status,
            });
            const sessions = result.sessions.map((row) => ({
                date: row.date,
                title: row.topic,
                goal: row.topic,
                status: row.status,
                topics: row.topics ? JSON.parse(row.topics) : [],
                content: row.content,
                created_at: row.created_at,
                updated_at: row.updated_at,
            }));
            return {
                count: sessions.length,
                sessions,
            };
        }
        // section and metadata modes both use metadata query
        const result = await storage.querySessionsMetadata({
            dateAfter: options.dateAfter,
            dateBefore: options.dateBefore,
            topic: options.topic,
            status: options.status,
        });
        if (mode === 'section' && options.section) {
            // Section extraction mode - get full content, extract section
            const fullResult = await storage.queryFullSessions({
                dateAfter: options.dateAfter,
                dateBefore: options.dateBefore,
                topic: options.topic,
                status: options.status,
            });
            const sessions = fullResult.sessions.map((row) => {
                // Extract requested section from content
                const sectionRegex = new RegExp(`^${options.section}\\s*$`, 'gm');
                const sectionMatch = row.content.match(sectionRegex);
                let sectionContent = '';
                if (sectionMatch) {
                    const sectionStart = row.content.indexOf(sectionMatch[0]);
                    const nextSectionMatch = row.content.substring(sectionStart + sectionMatch[0].length).match(/^##\s/gm);
                    const sectionEnd = nextSectionMatch
                        ? sectionStart + sectionMatch[0].length + row.content.substring(sectionStart + sectionMatch[0].length).indexOf(nextSectionMatch[0])
                        : row.content.length;
                    sectionContent = row.content.substring(sectionStart, sectionEnd).trim();
                }
                return {
                    date: row.date,
                    title: row.topic,
                    goal: row.topic,
                    status: row.status,
                    topics: row.topics ? JSON.parse(row.topics) : [],
                    section: options.section,
                    section_content: sectionContent,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                };
            });
            return {
                count: sessions.length,
                sessions,
            };
        }
        // Default: metadata-only mode (95% token savings vs full)
        const sessions = result.sessions.map((row) => ({
            date: row.date,
            title: row.topic,
            topic: row.topic, // Include for consistency
            goal: row.topic,
            status: row.status,
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
    finally {
        storage.close();
    }
}
/**
 * Query plans from SQLite database
 *
 * Supports 4 levels of detail:
 * - preview: Ultra-light summary (~150 tokens) - counts, dates, topics
 * - metadata: Full metadata, no content (~500 tokens) [DEFAULT]
 * - section: Specific section from content (~1.2K tokens)
 * - full: Everything (~22K tokens)
 *
 * @param options - Query filters and mode selection
 *                  dbPath is optional - will auto-detect if not provided
 * @returns Plan records matching filters in requested detail level
 */
export async function queryPlansSqlite(options) {
    const dbPath = resolve(options.dbPath || findKnowledgeDb());
    const storage = new SqliteStorage();
    await storage.init(dbPath);
    try {
        // Determine mode (support legacy includeContent flag)
        let mode = options.mode || 'metadata';
        if (options.includeContent === true) {
            mode = 'full'; // Legacy: includeContent=true → full mode
        }
        if (mode === 'preview') {
            // Ultra-lightweight: just stats and previews
            const stats = await storage.getPlanStats({
                status: options.status,
                author: options.author,
                topic: options.topic,
                priority: options.priority,
            });
            return {
                count: stats.count,
                date_range: stats.earliestCreated && stats.latestUpdated
                    ? `${stats.earliestCreated} to ${stats.latestUpdated}`
                    : undefined,
                topics: stats.uniqueTopics,
                status_counts: stats.statusCounts,
                plans: stats.plans,
            }; // Type assertion - preview mode returns different shape
        }
        if (mode === 'full') {
            // Full content mode
            const result = await storage.queryFullPlans({
                status: options.status,
                author: options.author,
                topic: options.topic,
                priority: options.priority,
            });
            // Filter out learned patterns (they have separate query function)
            const plans = result.plans
                .filter((row) => !row.id.startsWith('learned_'))
                .map((row) => ({
                id: row.id,
                title: row.title,
                status: row.status,
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
        }
        // section and metadata modes both start with metadata query
        const result = await storage.queryPlansMetadata({
            status: options.status,
            author: options.author,
            topic: options.topic,
            priority: options.priority,
        });
        if (mode === 'section' && options.section) {
            // Section extraction mode - get full content, extract section
            const fullResult = await storage.queryFullPlans({
                status: options.status,
                author: options.author,
                topic: options.topic,
                priority: options.priority,
            });
            const plans = fullResult.plans
                .filter((row) => !row.id.startsWith('learned_'))
                .map((row) => {
                // Extract requested section from content
                const sectionRegex = new RegExp(`^${options.section}\\s*$`, 'gm');
                const sectionMatch = row.content.match(sectionRegex);
                let sectionContent = '';
                if (sectionMatch) {
                    const sectionStart = row.content.indexOf(sectionMatch[0]);
                    const nextSectionMatch = row.content.substring(sectionStart + sectionMatch[0].length).match(/^##\s/gm);
                    const sectionEnd = nextSectionMatch
                        ? sectionStart + sectionMatch[0].length + row.content.substring(sectionStart + sectionMatch[0].length).indexOf(nextSectionMatch[0])
                        : row.content.length;
                    sectionContent = row.content.substring(sectionStart, sectionEnd).trim();
                }
                return {
                    id: row.id,
                    title: row.title,
                    status: row.status,
                    author: row.author,
                    priority: row.priority || 'medium',
                    type: row.type || 'feature',
                    section: options.section,
                    section_content: sectionContent,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                };
            });
            return {
                count: plans.length,
                plans,
            };
        }
        // Default: metadata-only mode (95% token savings vs full)
        const plans = result.plans
            .filter((row) => !row.id.startsWith('learned_'))
            .map((row) => ({
            id: row.id,
            title: row.title,
            status: row.status,
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
    finally {
        storage.close();
    }
}
/**
 * Query learned patterns from SQLite database
 *
 * Note: Learned patterns are stored as plans with id starting with 'learned_'
 *
 * @param options - Query filters (category, keywords, includeContent)
 *                  dbPath is optional - will auto-detect if not provided
 * @returns Pattern records matching filters (metadata-only by default for token efficiency)
 */
export async function queryLearnedPatternsSqlite(options) {
    const dbPath = resolve(options.dbPath || findKnowledgeDb());
    const storage = new SqliteStorage();
    await storage.init(dbPath);
    try {
        const includeContent = options.includeContent ?? false; // Default to metadata-only
        if (includeContent) {
            // Full content mode
            const result = await storage.queryFullPlans({
                idStartsWith: 'learned_'
            });
            let patterns = result.plans.map((row) => ({
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
                patterns = patterns.filter((p) => options.keywords.some((keyword) => p.keywords.includes(keyword)));
            }
            return {
                count: patterns.length,
                patterns,
            };
        }
        else {
            // Metadata-only mode (default) - 95% token savings
            const result = await storage.queryLearnedPatternsMetadata({
                category: options.category,
                keywords: options.keywords,
            });
            const patterns = result.patterns.map((row) => ({
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
    }
    finally {
        storage.close();
    }
}
/**
 * Full-text search across all content in SQLite database
 *
 * @param options - Search query and optional result limit
 *                  dbPath is optional - will auto-detect if not provided
 * @returns Search results with snippets and relevance scores
 */
export async function searchContextSqlite(options) {
    const dbPath = resolve(options.dbPath || findKnowledgeDb());
    const storage = new SqliteStorage();
    await storage.init(dbPath);
    try {
        const results = [];
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
                const snippet = session.content.substring(Math.max(0, startIdx - 50), Math.min(session.content.length, startIdx + 100));
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
                const snippet = plan.content.substring(Math.max(0, startIdx - 50), Math.min(plan.content.length, startIdx + 100));
                // Distinguish learned patterns from regular plans
                const type = plan.id.startsWith('learned_') ? 'learned' : 'plan';
                results.push({
                    type: type,
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
    }
    finally {
        storage.close();
    }
}
/**
 * Get database statistics
 *
 * @param options - Database path (optional - will auto-detect if not provided)
 * @returns Record counts and database metadata
 */
export async function getDbStats(options) {
    const dbPath = resolve(options.dbPath || findKnowledgeDb());
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
    }
    finally {
        storage.close();
    }
}
