import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Tool implementations
import { getCriticalInvariants, getValidationMatrix } from './tools/context.js';
import { getActivePlans, getRecentSessions } from './tools/query.js';
import { findSkillForTask } from './tools/skills.js';
import { createSession, updateSession, createPlan, updatePlan } from './tools/mutations.js';
import { validateDeliverables, checkTddCompliance, validateSkill } from './tools/validation.js';
import { searchContext, findPattern, getSkillByName } from './tools/enhanced-query.js';

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
      async ({ task }) => findSkillForTask(task)
    );

    // Phase 2A: Mutation Tools
    this.server.registerTool(
      'create_session',
      {
        description:
          'Create a new session file with YAML frontmatter. Use when starting work on a new task or feature.',
        inputSchema: z.object({
          goal: z.string().min(3),
          topics: z.array(z.string()).optional().default([]),
          status: z.enum(['active', 'paused', 'complete']).optional().default('active'),
        }),
      },
      async (args) => createSession(args)
    );

    this.server.registerTool(
      'update_session',
      {
        description:
          "Update today's session with new content. Use for appending progress, prepending urgent notes, or inserting sections.",
        inputSchema: z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
          section: z.string().min(1),
          content: z.string().min(1),
          operation: z.enum(['append', 'prepend', 'insert-after', 'insert-before']).optional().default('append'),
        }),
      },
      async (args) => updateSession(args)
    );

    this.server.registerTool(
      'create_plan',
      {
        description:
          'Create a new implementation plan. Use when starting a significant feature or refactoring.',
        inputSchema: z.object({
          id: z.string().min(1).regex(/^[a-z0-9_]+$/),
          goal: z.string().min(3),
          type: z.enum(['feature', 'refactor', 'bugfix', 'research']).optional().default('feature'),
          priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
        }),
      },
      async (args) => createPlan(args)
    );

    this.server.registerTool(
      'update_plan',
      {
        description:
          "Update an existing plan's status or content. Use for appending progress, changing status, or adding notes.",
        inputSchema: z.discriminatedUnion('operation', [
          z.object({
            planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
            operation: z.literal('set-status'),
            status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED']),
          }),
          z.object({
            planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
            operation: z.literal('append'),
            content: z.string().min(1),
          }),
          z.object({
            planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
            operation: z.literal('prepend'),
            content: z.string().min(1),
          }),
        ]),
      },
      async (args) => updatePlan(args)
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
