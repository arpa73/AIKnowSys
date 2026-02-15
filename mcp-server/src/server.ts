import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Tool implementations
import { getCriticalInvariants, getValidationMatrix } from './tools/context.js';
import { 
  getActivePlans, 
  getRecentSessions, 
  queryPlansWithFilters, 
  querySessionsWithFilters,
  getPlansByStatus,
  getAllPlans,
  getSessionByDate,
  rebuildContextIndex,
  syncPlans
} from './tools/query.js';
import { findSkillForTask } from './tools/skills.js';
import { createSession, createPlan } from './tools/mutations.js';
import { 
  setPlanStatus, 
  appendToPlan, 
  prependToPlan,
  appendToSession,
  prependToSession,
  insertAfterSection,
  insertBeforeSection,
  updateSessionMetadata,
  updatePlanMetadata,
  archiveSessions,
  archivePlans
} from './tools/split-mutations.js';
import { validateDeliverables, checkTddCompliance, validateSkill } from './tools/validation.js';
import { searchContext, findPattern, getSkillByName } from './tools/enhanced-query.js';
import {
  querySessionsSqlite,
  queryPlansSqlite,
  queryLearnedPatternsSqlite,
  searchContextSqlite,
  getDbStatsSqlite,
} from './tools/sqlite-query.js';

export class AIKnowSysServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer(
      {
        name: 'aiknowsys-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // Phase 1: Context Query Tools
    this.server.registerTool(
      'get_critical_invariants',
      {
        description:
          'Returns the 8 critical invariants that must ALWAYS be enforced. These are non-optional rules that prevent bugs and maintain code quality. Use this instead of reading CODEBASE_ESSENTIALS.md manually.',
        inputSchema: z.object({}),
      },
      async () => getCriticalInvariants()
    );

    this.server.registerTool(
      'get_validation_matrix',
      {
        description:
          'Returns all validation commands with their purpose and expected output. Use this to know which commands to run after making changes (tests, linting, deliverables, etc.).',
        inputSchema: z.object({}),
      },
      async () => getValidationMatrix()
    );

    this.server.registerTool(
      'get_active_plans',
      {
        description:
          'Returns all currently active implementation plans. Much faster than reading CURRENT_PLAN.md or using grep_search. Returns structured data with plan IDs, titles, authors, and file paths.',
        inputSchema: z.object({}),
      },
      async () => getActivePlans()
    );

    this.server.registerTool(
      'get_recent_sessions',
      {
        description:
          'Returns recent session files with metadata (topics, dates, status). Faster than list_dir + reading each file. Works with indexed session data.',
        inputSchema: z.object({
          days: z.number().min(1).max(365).optional().default(7),
        }),
      },
      async ({ days }) => getRecentSessions(days)
    );

    this.server.registerTool(
      'find_skill_for_task',
      {
        description:
          'AI describes a task in natural language, gets the most relevant skill workflow. Returns full skill content if found. Use this instead of trying to match trigger words or reading skills manually.',
        inputSchema: z.object({
          task: z.string().min(3),
        }),
      },
      async (args) => findSkillForTask(args)
    );

    // Phase 1.2: Advanced Query Tools (NEW - 2026-02-10)
    this.server.registerTool(
      'query_plans',
      {
        description:
          'Query plans with flexible filters: status (ACTIVE, PAUSED, PLANNED, COMPLETE, CANCELLED), author, topic, date range. Returns structured plan metadata.',
        inputSchema: z.object({
          status: z.enum(['ACTIVE', 'PAUSED', 'PLANNED', 'COMPLETE', 'CANCELLED']).optional(),
          author: z.string().optional(),
          topic: z.string().optional(),
          updatedAfter: z.string().optional(),
          updatedBefore: z.string().optional(),
        }),
      },
      async (args) => queryPlansWithFilters(args)
    );

    this.server.registerTool(
      'query_sessions',
      {
        description:
          'Query sessions with flexible filters: exact date, date range (dateAfter/dateBefore), topic, plan reference, or last N days. Returns structured session metadata.',
        inputSchema: z.object({
          date: z.string().optional(),
          dateAfter: z.string().optional(),
          dateBefore: z.string().optional(),
          topic: z.string().optional(),
          plan: z.string().optional(),
          days: z.number().optional(),
        }),
      },
      async (args) => querySessionsWithFilters(args)
    );

    this.server.registerTool(
      'get_plans_by_status',
      {
        description:
          'Get all plans with a specific status. Simpler than query_plans for status-only queries. Status values: ACTIVE, PAUSED, PLANNED, COMPLETE, CANCELLED.',
        inputSchema: z.object({
          status: z.enum(['ACTIVE', 'PAUSED', 'PLANNED', 'COMPLETE', 'CANCELLED']),
        }),
      },
      async ({ status }) => getPlansByStatus(status)
    );

    this.server.registerTool(
      'get_all_plans',
      {
        description:
          'Get complete inventory of all plans with metadata (id, title, author, status, dates). No filters applied.',
        inputSchema: z.object({}),
      },
      async () => getAllPlans()
    );

    this.server.registerTool(
      'get_session_by_date',
      {
        description:
          'Get session file for a specific date (YYYY-MM-DD). Returns session metadata and content reference.',
        inputSchema: z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD'),
        }),
      },
      async ({ date }) => getSessionByDate(date)
    );

    this.server.registerTool(
      'rebuild_index',
      {
        description:
          'Rebuild context index (.aiknowsys/context-index.json) from markdown files. Use after manual file edits or when index is corrupted.',
        inputSchema: z.object({}),
      },
      async () => rebuildContextIndex()
    );

    this.server.registerTool(
      'sync_plans',
      {
        description:
          'Sync individual developer plan pointers (active-*.md) into team index (CURRENT_PLAN.md). Critical for multi-developer workflow.',
        inputSchema: z.object({}),
      },
      async () => syncPlans()
    );

    // Phase 1 Week 2: SQLite Query Tools (10-100x faster than file-based queries)
    this.server.registerTool(
      'query_sessions_sqlite',
      {
        description: `Query sessions with 4 levels of detail for token efficiency:

MODES (default: metadata):
  preview    - Ultra-light summary (~150 tokens) → counts, dates, topics
  metadata   - Full metadata, no content (~500 tokens) → browsing
  section    - Specific section only (~1.2K tokens) → targeted extraction  
  full       - Everything (~22K tokens) → complete sessions

Examples:
  { topic: "mcp", mode: "preview" }          # Just counts and dates (150 tokens)
  { topic: "mcp" }                            # Metadata only (default, 500 tokens)
  { dateAfter: "2026-02-01", mode: "metadata" } # Explicit metadata mode
  { id: "session-1", mode: "section", section: "## Progress" } # Extract specific section
  { id: "session-1", mode: "full" }          # Complete session (22K tokens)

Natural language also supported:
  { when: "last week", about: "MCP testing", mode: "preview" }`,
        inputSchema: z.object({
          // MODE (Feature 2: Progressive Detail)
          mode: z.enum(['preview', 'metadata', 'section', 'full']).optional().default('metadata'),
          section: z.string().optional(),
          // Natural language
          when: z.string().optional(),
          about: z.string().optional(),
          // Relative dates
          last: z.number().optional(),
          unit: z.enum(['days', 'weeks', 'months']).optional(),
          // Structured (backwards compatible)
          dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
          dateAfter: z.string().optional(),
          dateBefore: z.string().optional(),
          topic: z.string().optional(),
          status: z.string().optional(),
          includeContent: z.boolean().optional().default(false), // DEPRECATED: Use mode instead
        }),
      },
      async (args) => querySessionsSqlite(args)
    );

    this.server.registerTool(
      'query_plans_sqlite',
      {
        description: `Query plans with 4 levels of detail for token efficiency:

MODES (default: metadata):
  preview    - Ultra-light summary (~150 tokens) → counts, status, topics
  metadata   - Full metadata, no content (~500 tokens) → browsing
  section    - Specific section only (~1.2K tokens) → targeted extraction  
  full       - Everything (~22K tokens) → complete plans

Examples:
  { status: "ACTIVE", mode: "preview" }      # Just counts and stats (150 tokens)
  { status: "ACTIVE" }                        # Metadata only (default, 500 tokens)
  { author: "arno-paffen", mode: "metadata" } # Explicit metadata mode
  { id: "PLAN_feature_auth", mode: "section", section: "## Implementation" }
  { id: "PLAN_feature_auth", mode: "full" }  # Complete plan (22K tokens)

Natural language also supported:
  { when: "last month", about: "optimization", status: "ACTIVE", mode: "preview" }`,
        inputSchema: z.object({
          // MODE (Feature 2: Progressive Detail)
          mode: z.enum(['preview', 'metadata', 'section', 'full']).optional().default('metadata'),
          section: z.string().optional(),
          // Natural language
          when: z.string().optional(),
          about: z.string().optional(),
          // Relative dates
          last: z.number().optional(),
          unit: z.enum(['days', 'weeks', 'months']).optional(),
          // Structured (backwards compatible)
          dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
          status: z.enum(['ACTIVE', 'PAUSED', 'PLANNED', 'COMPLETE', 'CANCELLED']).optional(),
          author: z.string().optional(),
          topic: z.string().optional(),
          priority: z.enum(['high', 'medium', 'low']).optional(),
          includeContent: z.boolean().optional().default(false), // DEPRECATED: Use mode instead
    );

    this.server.registerTool(
      'query_learned_patterns_sqlite',
      {
        description: `Query learned patterns with flexible natural language or structured parameters.

Examples:
  Natural language: { when: "last week", about: "error resolution" }
  Relative dates: { last: 14, unit: "days", category: "workarounds" }
  Structured: { category: "error_resolution", keywords: ["yaml", "parsing"] }

Returns metadata-only by default (95% savings). Set includeContent:true for full content.`,
        inputSchema: z.object({
          // Natural language
          when: z.string().optional(),
          about: z.string().optional(),
          // Relative dates
          last: z.number().optional(),
          unit: z.enum(['days', 'weeks', 'months']).optional(),
          // Structured (backwards compatible)
          dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
          category: z.string().optional(),
          keywords: z.array(z.string()).optional(),
          includeContent: z.boolean().optional().default(false),
        }),
      },
      async (args) => queryLearnedPatternsSqlite(args)
    );

    this.server.registerTool(
      'search_context_sqlite',
      {
        description: 'Full-text search across all content. Returns ranked snippets.',
        inputSchema: z.object({
          dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
          query: z.string().min(1),
          limit: z.number().int().positive().optional(),
        }),
      },
      async (args) => searchContextSqlite(args)
    );

    this.server.registerTool(
      'get_db_stats_sqlite',
      {
        description: 'Get SQLite stats: counts, size.',
        inputSchema: z.object({
          dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
        }),
      },
      async (args) => getDbStatsSqlite(args)
    );

    // Phase 2A: Mutation Tools
    this.server.registerTool(
      'create_session',
      {
        description:
          'Create a new session file with YAML frontmatter. Use when starting work on a new task or feature.',
        inputSchema: z.object({
          title: z.string().min(3),
          topics: z.array(z.string()).optional().default([]),
          status: z.enum(['active', 'paused', 'complete']).optional().default('active'),
        }),
      },
      async (args) => createSession(args)
    );

    // Session Mutation Tools (Split from update_session for clarity)
    this.server.registerTool(
      'append_to_session',
      {
        description:
          "Append content to a session section. Use for adding progress updates or notes.",
        inputSchema: z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
          section: z.string().min(1),
          content: z.string().min(1),
        }),
      },
      async (args) => appendToSession(args)
    );

    this.server.registerTool(
      'prepend_to_session',
      {
        description:
          "Prepend content to a session section. Use for adding critical updates or blockers at the top.",
        inputSchema: z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
          section: z.string().min(1),
          content: z.string().min(1),
        }),
      },
      async (args) => prependToSession(args)
    );

    this.server.registerTool(
      'insert_after_section',
      {
        description:
          "Insert a new section after a pattern in the session file. Use for surgical placement of content.",
        inputSchema: z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
          pattern: z.string().min(1),
          section: z.string().optional(),
          content: z.string().min(1),
        }),
      },
      async (args) => insertAfterSection(args)
    );

    this.server.registerTool(
      'insert_before_section',
      {
        description:
          "Insert a new section before a pattern in the session file. Use for ordered content placement.",
        inputSchema: z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
          pattern: z.string().min(1),
          section: z.string().optional(),
          content: z.string().min(1),
        }),
      },
      async (args) => insertBeforeSection(args)
    );

    this.server.registerTool(
      'create_plan',
      {
        description:
          'Create a new implementation plan. Use when starting a significant feature or refactoring.',
        inputSchema: z.object({
          id: z.string().min(1).regex(/^[a-z0-9_]+$/),
          title: z.string().min(3),
          type: z.enum(['feature', 'refactor', 'bugfix', 'research']).optional().default('feature'),
          priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
        }),
      },
      async (args) => createPlan(args)
    );

    // Plan Mutation Tools (Split from update_plan for clarity)
    this.server.registerTool(
      'set_plan_status',
      {
        description:
          "Set a plan's status. Use for marking plans as ACTIVE, PAUSED, COMPLETE, or CANCELLED.",
        inputSchema: z.object({
          planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
          status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED']),
        }),
      },
      async (args) => setPlanStatus(args)
    );

    this.server.registerTool(
      'append_to_plan',
      {
        description:
          "Append progress notes to a plan. Use for documenting progress, decisions, or updates.",
        inputSchema: z.object({
          planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
          content: z.string().min(1),
        }),
      },
      async (args) => appendToPlan(args)
    );

    this.server.registerTool(
      'prepend_to_plan',
      {
        description:
          "Prepend critical updates to a plan. Use for adding blockers, urgent changes, or breaking news at the top.",
        inputSchema: z.object({
          planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
          content: z.string().min(1),
        }),
      },
      async (args) => prependToPlan(args)
    );

    // Metadata Mutation Tools
    this.server.registerTool(
      'update_session_metadata',
      {
        description:
          "Update session YAML frontmatter metadata. Use for adding topics, file references, or changing status. At least one operation required.",
        inputSchema: z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
          addTopic: z.string().optional(),
          addFile: z.string().optional(),
          setStatus: z.enum(['in-progress', 'complete', 'abandoned']).optional()
        }).refine(
          (data) => data.addTopic || data.addFile || data.setStatus,
          { message: 'At least one metadata operation required (addTopic, addFile, or setStatus)' }
        ),
      },
      async (args) => updateSessionMetadata(args)
    );

    this.server.registerTool(
      'update_plan_metadata',
      {
        description:
          "Update plan YAML frontmatter metadata. Use for updating author or adding topics. At least one field required.",
        inputSchema: z.object({
          planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
          author: z.string().optional(),
          topics: z.array(z.string()).optional()
        }).refine(
          (data) => data.author || data.topics,
          { message: 'At least one metadata field required (author or topics)' }
        ),
      },
      async (args) => updatePlanMetadata(args)
    );

    // Archive Tools
    this.server.registerTool(
      'archive_sessions',
      {
        description:
          "Archive old session files to archive folder. Moves sessions older than specified days (default: 30). Use dry-run to preview.",
        inputSchema: z.object({
          days: z.number().min(1).optional().default(30),
          dryRun: z.boolean().optional().default(false)
        }),
      },
      async (args) => archiveSessions(args)
    );

    this.server.registerTool(
      'archive_plans',
      {
        description:
          "Archive plans by status to archive folder. Moves plans with specified status (COMPLETE, CANCELLED, PAUSED) older than threshold days. Use dry-run to preview.",
        inputSchema: z.object({
          status: z.enum(['COMPLETE', 'CANCELLED', 'PAUSED']).optional().default('COMPLETE'),
          days: z.number().min(0).optional().default(7),
          dryRun: z.boolean().optional().default(false)
        }),
      },
      async (args) => archivePlans(args)
    );

    // Phase 2B: Validation Tools
    this.server.registerTool(
      'validate_deliverables',
      {
        description:
          'Validate all template files match non-template equivalents. Use before committing changes to skills or templates.',
        inputSchema: z.object({
          fix: z.boolean().optional().default(false),
        }),
      },
      async (args) => validateDeliverables(args)
    );

    this.server.registerTool(
      'check_tdd_compliance',
      {
        description:
          'Check if changed files have corresponding test files. Use before committing code changes.',
        inputSchema: z.object({
          changedFiles: z.array(z.string()),
        }),
      },
      async (args) => checkTddCompliance(args)
    );

    this.server.registerTool(
      'validate_skill',
      {
        description:
          'Validate skill file format and content. Use when creating or modifying skills.',
        inputSchema: z.object({
          skillPath: z.string(),
        }),
      },
      async (args) => validateSkill(args)
    );

    // Phase 2B: Enhanced Query Tools
    this.server.registerTool(
      'search_context',
      {
        description:
          'Full-text search across plans, sessions, and learned patterns. Faster than grep_search for finding historical work.',
        inputSchema: z.object({
          query: z.string(),
          type: z.enum(['all', 'sessions', 'plans', 'learned']).optional(),
        }),
      },
      async (args) => searchContext(args)
    );

    this.server.registerTool(
      'find_pattern',
      {
        description:
          'Find learned patterns by keywords and category. Use for discovering project-specific solutions.',
        inputSchema: z.object({
          keywords: z.array(z.string()),
          category: z.string().optional(),
        }),
      },
      async (args) => findPattern(args)
    );

    this.server.registerTool(
      'get_skill_by_name',
      {
        description:
          'Get a specific skill by exact name. Returns full skill content with metadata.',
        inputSchema: z.object({
          skillName: z.string(),
        }),
      },
      async (args) => getSkillByName(args)
    );
  }

  private setupErrorHandling() {
    // Access underlying server for error handling
    (this.server as any).server.onerror = (error: Error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AIKnowSys MCP server running on stdio');
  }
}
