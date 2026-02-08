import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Tool implementations
import { getCriticalInvariants, getValidationMatrix } from './tools/context.js';
import { getActivePlans, getRecentSessions } from './tools/query.js';
import { findSkillForTask } from './tools/skills.js';
import { createSession, updateSession, createPlan, updatePlan } from './tools/mutations.js';
import { validateDeliverables, checkTddCompliance, validateSkill } from './tools/validation.js';
import { searchContext, findPattern, getSkillByName } from './tools/enhanced-query.js';

export class AIKnowSysServer {
  private server: Server;

  constructor() {
    this.server = new Server(
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
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_critical_invariants',
            description:
              'Returns the 8 critical invariants that must ALWAYS be enforced. These are non-optional rules that prevent bugs and maintain code quality. Use this instead of reading CODEBASE_ESSENTIALS.md manually.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'get_validation_matrix',
            description:
              'Returns all validation commands with their purpose and expected output. Use this to know which commands to run after making changes (tests, linting, deliverables, etc.).',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'get_active_plans',
            description:
              'Returns all currently active implementation plans. Much faster than reading CURRENT_PLAN.md or using grep_search. Returns structured data with plan IDs, titles, authors, and file paths.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'get_recent_sessions',
            description:
              'Returns recent session files with metadata (topics, dates, status). Faster than list_dir + reading each file. Works with indexed session data.',
            inputSchema: {
              type: 'object',
              properties: {
                days: {
                  type: 'number',
                  description: 'Number of days to look back (default: 7)',
                },
              },
            },
          },
          {
            name: 'find_skill_for_task',
            description:
              'AI describes a task in natural language, gets the most relevant skill workflow. Returns full skill content if found. Use this instead of trying to match trigger words or reading skills manually.',
            inputSchema: {
              type: 'object',
              properties: {
                task: {
                  type: 'string',
                  description:
                    'Description of what you want to do (e.g., "refactor code", "write tests first", "update dependencies")',
                },
              },
              required: ['task'],
            },
          },
          // Mutation Tools
          {
            name: 'create_session',
            description:
              'Create a new session file with YAML frontmatter. Use when starting work on a new task or feature.',
            inputSchema: {
              type: 'object',
              properties: {
                goal: {
                  type: 'string',
                  description: 'Session goal (min 3 chars)',
                },
                topics: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Session topics (optional)',
                },
                status: {
                  type: 'string',
                  enum: ['active', 'paused', 'complete'],
                  description: 'Session status (default: active)',
                },
              },
              required: ['goal'],
            },
          },
          {
            name: 'update_session',
            description:
              'Update today\'s session with new content. Use for appending progress, prepending urgent notes, or inserting sections.',
            inputSchema: {
              type: 'object',
              properties: {
                date: {
                  type: 'string',
                  description: 'Date in YYYY-MM-DD format (optional, defaults to today)',
                },
                section: {
                  type: 'string',
                  description: 'Section title (e.g., "## Progress")',
                },
                content: {
                  type: 'string',
                  description: 'Section content (markdown)',
                },
                operation: {
                  type: 'string',
                  enum: ['append', 'prepend', 'insert-after', 'insert-before'],
                  description: 'How to add content (default: append)',
                },
              },
              required: ['section', 'content'],
            },
          },
          {
            name: 'create_plan',
            description:
              'Create a new implementation plan. Use when starting a significant feature or refactoring.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Plan ID (lowercase with underscores, e.g., "feature_x")',
                },
                goal: {
                  type: 'string',
                  description: 'Plan goal (min 3 chars)',
                },
                type: {
                  type: 'string',
                  enum: ['feature', 'refactor', 'bugfix', 'research'],
                  description: 'Plan type (default: feature)',
                },
                priority: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'Priority level (default: medium)',
                },
              },
              required: ['id', 'goal'],
            },
          },
          {
            name: 'update_plan',
            description:
              'Update an existing plan\'s status or content. Use for appending progress, changing status, or adding notes.',
            inputSchema: {
              type: 'object',
              oneOf: [
                {
                  properties: {
                    planId: { type: 'string' },
                    operation: { type: 'string', enum: ['set-status'] },
                    status: { 
                      type: 'string', 
                      enum: ['ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED'] 
                    },
                  },
                  required: ['planId', 'operation', 'status'],
                },
                {
                  properties: {
                    planId: { type: 'string' },
                    operation: { type: 'string', enum: ['append', 'prepend'] },
                    content: { type: 'string' },
                  },
                  required: ['planId', 'operation', 'content'],
                },
              ],
            },
          },
          // Validation Tools
          {
            name: 'validate_deliverables',
            description:
              'Validate all template files match non-template equivalents. Use before committing changes to skills or templates.',
            inputSchema: {
              type: 'object',
              properties: {
                fix: {
                  type: 'boolean',
                  description: 'Auto-fix simple issues (default: false)',
                },
              },
            },
          },
          {
            name: 'check_tdd_compliance',
            description:
              'Check if changed files have corresponding test files. Use before committing code changes.',
            inputSchema: {
              type: 'object',
              properties: {
                changedFiles: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of changed file paths',
                },
              },
              required: ['changedFiles'],
            },
          },
          {
            name: 'validate_skill',
            description:
              'Validate skill file format and content. Use when creating or modifying skills.',
            inputSchema: {
              type: 'object',
              properties: {
                skillPath: {
                  type: 'string',
                  description: 'Path to skill file (e.g., .github/skills/tdd-workflow/SKILL.md)',
                },
              },
              required: ['skillPath'],
            },
          },
          // Enhanced Query Tools
          {
            name: 'search_context',
            description:
              'Full-text search across plans, sessions, and learned patterns. Faster than grep_search for finding historical work.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query string',
                },
                type: {
                  type: 'string',
                  enum: ['all', 'sessions', 'plans', 'learned'],
                  description: 'Type of context to search (default: all)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'find_pattern',
            description:
              'Find learned patterns by keywords and category. Use for discovering project-specific solutions.',
            inputSchema: {
              type: 'object',
              properties: {
                keywords: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Keywords to search for',
                },
                category: {
                  type: 'string',
                  description: 'Pattern category (e.g., "workarounds", "error_resolution")',
                },
              },
              required: ['keywords'],
            },
          },
          {
            name: 'get_skill_by_name',
            description:
              'Get a specific skill by exact name. Returns full skill content with metadata.',
            inputSchema: {
              type: 'object',
              properties: {
                skillName: {
                  type: 'string',
                  description: 'Exact skill name (e.g., "feature-implementation")',
                },
              },
              required: ['skillName'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_critical_invariants':
            return await getCriticalInvariants();

          case 'get_validation_matrix':
            return await getValidationMatrix();

          case 'get_active_plans':
            return await getActivePlans();

          case 'get_recent_sessions': {
            const schema = z.object({ 
              days: z.number().min(1).max(365).optional().default(7) 
            });
            const params = schema.parse(args || {});
            return await getRecentSessions(params.days);
          }

          case 'find_skill_for_task': {
            const schema = z.object({ task: z.string().min(3) });
            const params = schema.parse(args);
            return await findSkillForTask(params.task);
          }

          // Mutation tools
          case 'create_session':
            return await createSession(args);

          case 'update_session':
            return await updateSession(args);

          case 'create_plan':
            return await createPlan(args);

          case 'update_plan':
            return await updatePlan(args);

          // Validation tools
          case 'validate_deliverables':
            return await validateDeliverables(args);

          case 'check_tdd_compliance':
            return await checkTddCompliance(args);

          case 'validate_skill':
            return await validateSkill(args);

          // Enhanced query tools
          case 'search_context':
            return await searchContext(args);

          case 'find_pattern':
            return await findPattern(args);

          case 'get_skill_by_name':
            return await getSkillByName(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
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
