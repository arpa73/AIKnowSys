/**
 * Skill Creator - Auto-generate learned skill files from patterns
 * Creates properly formatted skill markdown files
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Example for skill template
 */
export interface SkillExample {
  before: string;
  after: string;
}

/**
 * Skill template data
 */
export interface SkillTemplateData {
  name: string;
  description: string;
  triggerWords?: string[];
  resolution: string;
  examples?: SkillExample[];
  relatedSkills?: string[];
}

/**
 * Pattern for skill creation
 */
export interface SkillPattern {
  error: string;
  frequency?: number;
  keywords?: string[];
  resolution?: string;
  examples?: string[] | SkillExample[];
  relatedSkills?: string[];
}

/**
 * Options for skill creation
 */
export interface SkillCreationOptions {
  shared?: boolean;
  username?: string | null;
}

/**
 * Skill creation result
 */
export interface SkillCreationResult {
  path: string;
  existed: boolean;
}

/**
 * Convert string to URL-safe slug
 * @param text - Text to slugify
 * @returns Slugified text
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate skill template from pattern data
 * @param data - Pattern data
 * @returns Formatted skill markdown
 */
export function generateSkillTemplate(data: SkillTemplateData): string {
  const { name, description, triggerWords, resolution, examples, relatedSkills } = data;
  
  let template = `# Learned Skill: ${name}

**Description:** ${description}

## Trigger Words

${(triggerWords || []).map(w => `- \`${w}\``).join('\n')}

## Resolution

${resolution}
`;

  if (examples && examples.length > 0) {
    template += '\n## Examples\n\n';
    for (const example of examples) {
      template += `**Before:**\n\`\`\`\n${example.before}\n\`\`\`\n\n`;
      template += `**After:**\n\`\`\`\n${example.after}\n\`\`\`\n\n`;
    }
  }

  if (relatedSkills && relatedSkills.length > 0) {
    template += '\n## Related Skills\n\n';
    template += relatedSkills.map(s => `- ${s}`).join('\n') + '\n';
  }

  template += '\n---\n\n*Auto-generated learned skill. Edit as needed.*\n';

  return template;
}

/**
 * Create learned skill file from pattern
 * @param pattern - Pattern object with error, frequency, keywords, resolution
 * @param targetDir - Project root directory
 * @param options - Options { shared: boolean, username: string }
 * @returns Path and whether file existed
 */
export async function createLearnedSkill(
  pattern: SkillPattern,
  targetDir: string,
  options: SkillCreationOptions = {}
): Promise<SkillCreationResult> {
  const { shared = true, username = null } = options;
  
  // Determine target directory based on flags
  let skillDir: string;
  if (shared || !username) {
    // Save to learned directory (team-shared or fallback)
    skillDir = path.join(targetDir, '.aiknowsys', 'learned');
  } else {
    // Save to personal directory
    skillDir = path.join(targetDir, '.aiknowsys', 'personal', username);
  }
  
  // Ensure directory exists
  await fs.mkdir(skillDir, { recursive: true });
  
  // Generate filename from error
  const filename = slugify(pattern.error) + '.md';
  const skillPath = path.join(skillDir, filename);
  
  // Check if skill already exists
  try {
    await fs.access(skillPath);
    // File exists, don't overwrite
    return { path: skillPath, existed: true };
  } catch {
    // File doesn't exist, create it
  }
  
  // Generate skill content
  const skillContent = generateSkillTemplate({
    name: pattern.error,
    description: `Pattern discovered from ${pattern.frequency || 1} occurrences`,
    triggerWords: pattern.keywords || [],
    resolution: pattern.resolution || pattern.error,
    examples: Array.isArray(pattern.examples) && pattern.examples.length > 0 
      ? (typeof pattern.examples[0] === 'string' 
          ? [] 
          : pattern.examples as SkillExample[])
      : [],
    relatedSkills: pattern.relatedSkills || [],
  });
  
  // Write skill file
  await fs.writeFile(skillPath, skillContent, 'utf-8');
  
  return { path: skillPath, existed: false };
}
