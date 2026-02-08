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
