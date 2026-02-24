import { execFile } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { searchContextCore } from '../../../lib/core/search-context.js';
import { queryLearnedPatternsSqlite } from '../../../lib/core/sqlite-query.js';
import { handleZodError, MCPErrorResponse } from './utils/error-helpers.js';
import { getProjectRoot } from './utils/project-root.js';
import {
  SKILL_MAPPINGS,
  isSqliteOnlyMode,
} from './skills.js';
import { getSkillContentFromSqlite } from './utils/skills-storage.js';

const execFileAsync = promisify(execFile);

// Zod schemas for validation
const searchContextSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  type: z.enum(['all', 'sessions', 'plans', 'learned']).default('all')
});

const findPatternSchema = z.object({
  keywords: z.array(z.string()).min(1, 'At least one keyword required'),
  category: z.string().default('all')
});

const getSkillByNameSchema = z.object({
  skillName: z.string().min(1, 'Skill name is required')
});

/**
 * Search across plans, sessions, and learned patterns
 * 
 * Phase 2 Performance: Direct core function call (10-100x faster than CLI subprocess)
 */
export async function searchContext(params: unknown) {
  try {
    const validated = searchContextSchema.parse(params);
    
    // Direct core function call (10-100x faster than npx subprocess)
    const result = await searchContextCore(validated.query, {
      scope: validated.type,
    });
    
    return {
      content: [{ 
        type: 'text' as const, 
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'searching context', {
        query: {
          suggestion: 'Query must be a non-empty string to search for',
          examples: ['{"query": "MCP server", "type": "all"}', '{"query": "Phase 2A", "type": "sessions"}']
        },
        type: {
          suggestion: 'Type must be one of: all, sessions, plans, learned',
          examples: ['{"query": "refactoring", "type": "learned"}', '{"query": "tools", "type": "plans"}']
        }
      });
    }
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error searching context: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

/**
 * Find learned patterns by keywords and category
 */
export async function findPattern(params: unknown) {
  try {
    const validated = findPatternSchema.parse(params);

    const result = await queryLearnedPatternsSqlite({
      category: validated.category === 'all' ? undefined : validated.category,
      keywords: validated.keywords,
      includeContent: false,
    });
    
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'finding pattern', {
        keywords: {
          suggestion: 'Keywords must be an array of strings with at least one keyword',
          examples: ['{"keywords": ["mcp", "sdk"], "category": "all"}', '{"keywords": ["hook"], "category": "workarounds"}']
        },
        category: {
          suggestion: 'Category is optional (defaults to "all")',
          examples: ['{"keywords": ["error"], "category": "error_resolution"}', '{"keywords": ["test"]}}']
        }
      });
    }
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error finding pattern: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

/**
 * Get specific skill by exact name
 */
export async function getSkillByName(params: unknown) {
  try {
    const validated = getSkillByNameSchema.parse(params);

    const mapping = SKILL_MAPPINGS.find((skill) => skill.name === validated.skillName);

    if (isSqliteOnlyMode()) {
      if (!mapping) {
        return {
          content: [{ 
            type: 'text' as const, 
            text: `Error getting skill: Skill '${validated.skillName}' not found in SQLITE-only mode` 
          }],
          isError: true
        };
      }

      const sqliteSkillContent = await getSkillContentFromSqlite(mapping.name);
      if (!sqliteSkillContent) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error getting skill: Skill '${validated.skillName}' not found in SQLite. Run 'aiknowsys sync-skills' first.`
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: sqliteSkillContent,
        }]
      };
    }
    
    // Resolve from project root (works in src/ and dist/ execution)
    const projectRoot = getProjectRoot();
    const skillPath = path.resolve(
      projectRoot,
      '.github/skills',
      validated.skillName,
      'SKILL.md'
    );
    
    const content = await fs.readFile(skillPath, 'utf-8');
    
    return {
      content: [{ type: 'text' as const, text: content }]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'getting skill', {
        skillName: {
          suggestion: 'Skill name must be a non-empty string (exact folder name in .github/skills/)',
          examples: ['{"skillName": "feature-implementation"}', '{"skillName": "refactoring-workflow"}']
        }
      });
    }
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error getting skill: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}
