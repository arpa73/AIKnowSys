import { execFile } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
 */
export async function searchContext(params: unknown) {
  try {
    const validated = searchContextSchema.parse(params);
    
    const args = ['aiknowsys', 'search-context', validated.query];
    
    if (validated.type !== 'all') {
      args.push('--scope', validated.type);
    }

    const { stdout } = await execFileAsync('npx', args);
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
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
    
    // Use list-patterns command with filtering
    const args = ['aiknowsys', 'list-patterns', '--keywords', validated.keywords.join(',')];
    
    if (validated.category !== 'all') {
      args.push('--category', validated.category);
    }

    const { stdout } = await execFileAsync('npx', args);
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
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
    
    // Read skill file directly
    // Use process.cwd() to get workspace root (where MCP server is invoked from)
    const skillPath = path.resolve(
      process.cwd(),
      '.github/skills',
      validated.skillName,
      'SKILL.md'
    );
    
    const content = await fs.readFile(skillPath, 'utf-8');
    
    return {
      content: [{ type: 'text' as const, text: content }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error getting skill: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}
