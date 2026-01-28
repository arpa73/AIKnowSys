/**
 * Skill Mapping Auto-Generation
 * 
 * Scans .github/skills/ directory and generates SKILL_MAPPING table
 * for AGENTS.md from skill metadata and trigger words.
 */
import fs from 'fs';
import path from 'path';

/**
 * Regex patterns for extracting trigger words from skill descriptions
 * Extracted as constants for easier testing and maintenance
 */
const TRIGGER_PATTERNS = {
  // Quoted phrases: "refactor", "clean up", "fix bugs"
  QUOTED: /"([^"]+)"/g,
  
  // Gerund patterns after "when" or "use when": "when refactoring", "use when implementing"
  GERUND_AFTER_WHEN: /(?:use when|when)\s+(\w+ing)\b/i,
  
  // Action phrases: "removing duplication", "fixing bugs", "implementing features"
  ACTION_PHRASES: /\b(removing|fixing|writing|implementing|refactoring|simplifying|updating)\s+([^,;.]+?)(?:\s*[,.]|\s+or\s+|$)/gi,
  
  // Object extraction: "implementing X", "fixing Y", "writing Z"
  OBJECT_PHRASES: /(?:implementing|fixing|writing)\s+([^,;.]+?)(?:\s*[,.]|\s+or\s+|$)/gi,
  
  // Standalone action words as fallback
  STANDALONE_ACTIONS: /\b(refactor|update|fix|implement|create|write|test|deploy|optimize|clean|simplify)\w*/gi
};

/**
 * Parse skill metadata from SKILL.md content
 * Supports both YAML frontmatter and markdown sections
 * 
 * @param {string} content - File content from SKILL.md
 * @returns {Object} - { name, description, whenToUse }
 */
export function parseSkillMetadata(content) {
  const metadata = {
    name: null,
    description: '',
    whenToUse: ''
  };
  
  // Try to parse YAML frontmatter
  const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (yamlMatch) {
    const yamlContent = yamlMatch[1];
    const nameMatch = yamlContent.match(/^name:\s*(.+)$/m);
    const descMatch = yamlContent.match(/^description:\s*(.+)$/m);
    
    if (nameMatch) metadata.name = nameMatch[1].trim();
    if (descMatch) metadata.description = descMatch[1].trim();
  }
  
  // Extract "Purpose" section if no YAML
  if (!metadata.description) {
    const purposeMatch = content.match(/\*\*Purpose:\*\*\s*(.+?)(?:\n|$)/);
    if (purposeMatch) {
      metadata.description = purposeMatch[1].trim();
    }
  }
  
  // Extract "When to use" section
  const whenMatch = content.match(/\*\*When to use:\*\*\s*(.+?)(?:\n|$)/);
  if (whenMatch) {
    metadata.whenToUse = whenMatch[1].trim();
  }
  
  // Also check for "When to Use This Skill" heading
  const whenSectionMatch = content.match(/##\s*When to Use This Skill\s*\n\n(.+?)(?:\n\n|$)/s);
  if (whenSectionMatch && !metadata.whenToUse) {
    metadata.whenToUse = whenSectionMatch[1].trim();
  }
  
  return metadata;
}

/**
 * Extract trigger words from description and "When to use" text
 * Simplified approach: extract meaningful phrases that users would search for
 * 
 * @param {string} text - Description or "When to use" content
 * @returns {string[]} - Array of trigger words/phrases (max 4)
 */
export function extractTriggerWords(text) {
  const triggers = [];
  
  // 1. Extract quoted phrases first (highest priority)
  const quotedMatches = text.matchAll(TRIGGER_PATTERNS.QUOTED);
  for (const match of quotedMatches) {
    triggers.push(`"${match[1]}"`);
  }
  
  // 2. Look for gerund verb patterns and extract base form for first occurrence
  const firstGerund = text.match(TRIGGER_PATTERNS.GERUND_AFTER_WHEN);
  if (firstGerund) {
    const baseForm = firstGerund[1].replace(/ing$/, '').replace(/([^aeiou])([aeiou])\2$/, '$1$2');
    triggers.push(baseForm);
  }
  
  // 3. Extract common action phrase patterns
  // Patterns: "removing duplication", "fixing bugs", "implementing new features"
  const actionPhrases = text.matchAll(TRIGGER_PATTERNS.ACTION_PHRASES);
  for (const match of actionPhrases) {
    const fullPhrase = `${match[1]} ${match[2]}`.trim();
    if (fullPhrase.length < 40) {
      triggers.push(fullPhrase);
    }
  }
  
  // 4. Extract object noun phrases (new features, bugs, tests first, etc.)
  const objects = text.matchAll(TRIGGER_PATTERNS.OBJECT_PHRASES);
  for (const match of objects) {
    const obj = match[1].trim();
    if (obj.length > 0 && obj.length < 30 && !triggers.some(t => t.includes(obj))) {
      triggers.push(obj);
    }
  }
  
  // 5. If we still don't have enough, extract standalone action words
  if (triggers.length < 2) {
    const actionWords = text.match(TRIGGER_PATTERNS.STANDALONE_ACTIONS);
    if (actionWords) {
      triggers.push(...actionWords.slice(0, 3).map(w => w.toLowerCase()));
    }
  }
  
  // Return unique triggers, limited to first 4 (for table readability)
  return [...new Set(triggers)].slice(0, 4);
}

/**
 * Scan skills directory and extract metadata from all skills
 * 
 * @param {string} skillsDir - Absolute path to .github/skills/ directory
 * @param {Object} options - Optional configuration
 * @param {Function} options.onSkip - Callback for skipped directories: (name, reason) => void
 * @returns {Promise<Object[]>} - Array of { name, triggers, description }
 */
export async function scanSkillsDirectory(skillsDir, options = {}) {
  const { onSkip } = options;
  const skills = [];
  
  if (!fs.existsSync(skillsDir)) {
    return skills;
  }
  
  const entries = await fs.promises.readdir(skillsDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      if (onSkip) onSkip(entry.name, 'not a directory');
      continue;
    }
    
    const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      if (onSkip) onSkip(entry.name, 'missing SKILL.md');
      continue;
    }
    
    const content = await fs.promises.readFile(skillPath, 'utf-8');
    const metadata = parseSkillMetadata(content);
    
    // Extract trigger words from description and whenToUse
    const triggerText = `${metadata.description} ${metadata.whenToUse}`;
    const triggers = extractTriggerWords(triggerText);
    
    skills.push({
      name: metadata.name || entry.name,
      triggers: triggers.slice(0, 4), // Limit to 4 triggers for table
      description: metadata.description || 'Custom skill'
    });
  }
  
  return skills;
}

/**
 * Generate markdown table for SKILL_MAPPING
 * 
 * @param {Object[]} skills - Array of skill objects
 * @returns {string} - Markdown table rows
 */
export function generateSkillMapping(skills) {
  if (skills.length === 0) {
    return '| N/A | N/A | No skills installed yet |';
  }
  
  const rows = skills.map(skill => {
    const triggersStr = skill.triggers.join(', ') || 'N/A';
    const shortDesc = skill.description.length > 50 
      ? skill.description.substring(0, 47) + '...'
      : skill.description;
    
    return `| ${triggersStr} | ${skill.name} | ${shortDesc} |`;
  });
  
  return rows.join('\n');
}

/**
 * Main function: Generate SKILL_MAPPING replacement value
 * 
 * @param {string} targetDir - Project root directory
 * @param {Object} options - Optional configuration
 * @param {Function} options.onSkip - Callback for skipped directories: (name, reason) => void
 * @returns {Promise<string>} - Complete markdown table for SKILL_MAPPING
 */
export async function buildSkillMapping(targetDir, options = {}) {
  const skillsDir = path.join(targetDir, '.github', 'skills');
  const skills = await scanSkillsDirectory(skillsDir, options);
  return generateSkillMapping(skills);
}
