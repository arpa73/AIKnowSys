/**
 * Skill Creator - Auto-generate learned skill files from patterns
 * Creates properly formatted skill markdown files
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Convert string to URL-safe slug
 * @param {string} text - Text to slugify
 * @returns {string} Slugified text
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate skill template from pattern data
 * @param {Object} data - Pattern data
 * @returns {string} Formatted skill markdown
 */
export function generateSkillTemplate(data) {
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
 * @param {Object} pattern - Pattern object with error, frequency, keywords, resolution
 * @param {string} targetDir - Project root directory
 * @returns {Promise<{path: string, existed: boolean}>} Path and whether file existed
 */
export async function createLearnedSkill(pattern, targetDir) {
  const learnedDir = path.join(targetDir, '.aiknowsys', 'learned');
  
  // Ensure directory exists
  await fs.mkdir(learnedDir, { recursive: true });
  
  // Generate filename from error
  const filename = slugify(pattern.error) + '.md';
  const skillPath = path.join(learnedDir, filename);
  
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
    description: `Pattern discovered from ${pattern.frequency} occurrences`,
    triggerWords: pattern.keywords || [],
    resolution: pattern.resolution || pattern.error,
    examples: pattern.examples || [],
    relatedSkills: pattern.relatedSkills || [],
  });
  
  // Write skill file
  await fs.writeFile(skillPath, skillContent, 'utf-8');
  
  return { path: skillPath, existed: false };
}
