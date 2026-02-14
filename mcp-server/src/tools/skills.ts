/**
 * Skills Discovery Tool
 * 
 * Natural language task → relevant skill workflow.
 * Replaces manual trigger word matching and file reading.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { handleZodError } from './utils/error-helpers.js';

// Zod schema for parameter validation
const findSkillSchema = z.object({
  task: z.string().min(1, 'Task description is required')
});

/**
 * Skill mapping: keywords → skill directory name
 * 
 * This is the knowledge graph that matches task descriptions
 * to skill workflows. Update this when adding new skills.
 */
const SKILL_MAPPINGS = [
  {
    name: 'tdd-workflow',
    keywords: [
      'test',
      'tdd',
      'test-driven',
      'write tests',
      'red green refactor',
      'test first',
      'testing',
    ],
    description: 'Test-Driven Development workflow (RED → GREEN → REFACTOR)',
  },
  {
    name: 'refactoring-workflow',
    keywords: [
      'refactor',
      'clean up',
      'simplify',
      'improve code',
      'extract function',
      'reduce duplication',
    ],
    description: 'Test-driven refactoring workflow for improving code structure',
  },
  {
    name: 'dependency-management',
    keywords: [
      'update dependencies',
      'upgrade packages',
      'npm update',
      'security vulnerabilities',
      'update deps',
    ],
    description: 'Safe dependency upgrade procedures (npm, pip, cargo, go mod)',
  },
  {
    name: 'feature-implementation',
    keywords: [
      'new feature',
      'add feature',
      'implement',
      'add command',
      'create endpoint',
    ],
    description: 'Step-by-step feature planning and implementation',
  },
  {
    name: 'validation-troubleshooting',
    keywords: [
      'test fail',
      'validation error',
      'build broken',
      'tests failing',
      'debug',
    ],
    description: 'Debug validation failures (tests, linting, builds)',
  },
  {
    name: 'ai-friendly-documentation',
    keywords: [
      'update docs',
      'documentation',
      'changelog',
      'write docs',
      'ai-friendly',
    ],
    description: 'AI-optimized documentation and changelog archiving',
  },
  {
    name: '3rd-party-framework-docs',
    keywords: [
      'framework documentation',
      'library docs',
      'api reference',
      'query docs',
      'current api',
    ],
    description: 'Query up-to-date framework/library documentation (Context7 MCP)',
  },
  {
    name: 'skill-creator',
    keywords: ['create skill', 'new skill', 'skill template', 'make skill'],
    description: 'Create new Agent Skills following VS Code standard',
  },
  {
    name: 'context-query',
    keywords: [
      'query plans',
      'query sessions',
      'search context',
      'find sessions',
      'list plans',
    ],
    description: 'Query AIKnowSys knowledge system (READ operations)',
  },
  {
    name: 'context-mutation',
    keywords: [
      'create session',
      'update session',
      'create plan',
      'update plan',
      'document work',
    ],
    description: 'Create/modify AIKnowSys sessions and plans (WRITE operations)',
  },
  {
    name: 'pattern-sharing',
    keywords: [
      'share pattern',
      'publish pattern',
      'team pattern',
      'learned pattern',
    ],
    description: 'Share personal patterns with the team',
  },
  {
    name: 'plan-cleanup',
    keywords: [
      'archive plans',
      'clean plans',
      'cleanup workspace',
      'remove old plans',
      'archive completed',
    ],
    description: 'Archive completed plans and clean workspace using CLI commands',
  },
];

/**
 * Find the most relevant skill for a given task
 * 
 * @param params.task - Natural language description of what to do
 * @returns Full skill content if found, error otherwise
 * 
 * @example
 * findSkillForTask({ task: "I need to write tests before implementing" })
 * // Returns: tdd-workflow skill content
 * 
 * findSkillForTask({ task: "refactor this messy code" })
 * // Returns: refactoring-workflow skill content
 */
export async function findSkillForTask(params: unknown) {
  try {
    const validated = findSkillSchema.parse(params);
    const taskLower = validated.task.toLowerCase();
    
    // Find matching skill by keyword overlap
    let bestMatch: { name: string; score: number; description: string } | null = null;
    
    for (const skill of SKILL_MAPPINGS) {
      const matchCount = skill.keywords.filter((keyword) =>
        taskLower.includes(keyword)
      ).length;
      
      if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.score)) {
        bestMatch = {
          name: skill.name,
          score: matchCount,
          description: skill.description,
        };
      }
    }
    
    if (!bestMatch) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              found: false,
              message: 'No matching skill found for task. Try different keywords.',
              task: validated.task,
              availableSkills: SKILL_MAPPINGS.map((s) => ({
                name: s.name,
                description: s.description,
              })),
            }, null, 2),
          },
        ],
      };
    }
    
    // Read skill file (use absolute path from source file location)
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const skillPath = path.resolve(
      __dirname,
      '../../../.github/skills',
      bestMatch.name,
      'SKILL.md'
    );
    
    const content = await fs.readFile(skillPath, 'utf-8');
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            found: true,
            skillName: bestMatch.name,
            description: bestMatch.description,
            matchScore: bestMatch.score,
            task: validated.task,
            skillContent: content,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    // Handle Zod validation errors with conversational responses
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'finding skill', {
        task: {
          suggestion: 'Task must be a non-empty string describing what you want to do',
          examples: ['{ "task": "write tests first" }', '{ "task": "refactor messy code" }']
        }
      });
    }
    
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: true,
            message: `Failed to find skill: ${message}`,
          }),
        },
      ],
    };
  }
}
