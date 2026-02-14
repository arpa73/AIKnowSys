/**
 * Skill Mapping Auto-Generation
 * 
 * Scans .github/skills/ directory and generates SKILL_MAPPING table
 * for AGENTS.md from skill metadata and trigger words.
 */
import fs from 'fs';
import path from 'path';

export interface SkillMetadata {
  name: string | null;
  description: string;
  whenToUse: string;
}

export interface Skill {
  name: string;
  triggers: string[];
  description: string;
}

export interface ScanOptions {
  onSkip?: (name: string, reason: string) => void;
}

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
} as const;

/**
 * Parse skill metadata from SKILL.md content
 * Supports both YAML frontmatter and markdown sections
 * 
 * @param content - File content from SKILL.md
 * @returns { name, description, whenToUse }
 */
export function parseSkillMetadata(content: string): SkillMetadata {
  const metadata: SkillMetadata = {
    name: null,
    description: '',
    whenToUse: ''
  };
  
  // Try to parse YAML frontmatter
  const yamlMatch: RegExpMatchArray | null = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (yamlMatch) {
    const yamlContent: string = yamlMatch[1];
    const nameMatch: RegExpMatchArray | null = yamlContent.match(/^name:\s*(.+)$/m);
    const descMatch: RegExpMatchArray | null = yamlContent.match(/^description:\s*(.+)$/m);
    
    if (nameMatch) metadata.name = nameMatch[1].trim();
    if (descMatch) metadata.description = descMatch[1].trim();
  }
  
  // Extract "Purpose" section if no YAML
  if (!metadata.description) {
    const purposeMatch: RegExpMatchArray | null = content.match(/\*\*Purpose:\*\*\s*(.+?)(?:\n|$)/);
    if (purposeMatch) {
      metadata.description = purposeMatch[1].trim();
    }
  }
  
  // Extract "When to use" section
  const whenMatch: RegExpMatchArray | null = content.match(/\*\*When to use:\*\*\s*(.+?)(?:\n|$)/);
  if (whenMatch) {
    metadata.whenToUse = whenMatch[1].trim();
  }
  
  // Also check for "When to Use This Skill" heading
  const whenSectionMatch: RegExpMatchArray | null = content.match(/##\s*When to Use This Skill\s*\n\n(.+?)(?:\n\n|$)/s);
  if (whenSectionMatch && !metadata.whenToUse) {
    metadata.whenToUse = whenSectionMatch[1].trim();
  }
  
  return metadata;
}

/**
 * Extract trigger words from description and "When to use" text
 * Simplified approach: extract meaningful phrases that users would search for
 * 
 * @param text - Description or "When to use" content
 * @returns Array of trigger words/phrases (max 4)
 */
export function extractTriggerWords(text: string): string[] {
  const triggers: string[] = [];
  
  // 1. Extract quoted phrases first (highest priority)
  const quotedMatches: IterableIterator<RegExpMatchArray> = text.matchAll(TRIGGER_PATTERNS.QUOTED);
  for (const match of quotedMatches) {
    triggers.push(`"${match[1]}"`);
  }
  
  // 2. Look for gerund verb patterns and extract base form for first occurrence
  const firstGerund: RegExpMatchArray | null = text.match(TRIGGER_PATTERNS.GERUND_AFTER_WHEN);
  if (firstGerund) {
    const baseForm: string = firstGerund[1].replace(/ing$/, '').replace(/([^aeiou])([aeiou])\2$/, '$1$2');
    triggers.push(baseForm);
  }
  
  // 3. Extract common action phrase patterns
  // Patterns: "removing duplication", "fixing bugs", "implementing new features"
  const actionPhrases: IterableIterator<RegExpMatchArray> = text.matchAll(TRIGGER_PATTERNS.ACTION_PHRASES);
  for (const match of actionPhrases) {
    const fullPhrase: string = `${match[1]} ${match[2]}`.trim();
    if (fullPhrase.length < 40) {
      triggers.push(fullPhrase);
    }
  }
  
  // 4. Extract object noun phrases (new features, bugs, tests first, etc.)
  const objects: IterableIterator<RegExpMatchArray> = text.matchAll(TRIGGER_PATTERNS.OBJECT_PHRASES);
  for (const match of objects) {
    const obj: string = match[1].trim();
    if (obj.length > 0 && obj.length < 30 && !triggers.some(t => t.includes(obj))) {
      triggers.push(obj);
    }
  }
  
  // 5. If we still don't have enough, extract standalone action words
  if (triggers.length < 2) {
    const actionWords: RegExpMatchArray | null = text.match(TRIGGER_PATTERNS.STANDALONE_ACTIONS);
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
 * @param skillsDir - Absolute path to .github/skills/ directory
 * @param options - Optional configuration
 * @returns Array of { name, triggers, description }
 */
export async function scanSkillsDirectory(skillsDir: string, options: ScanOptions = {}): Promise<Skill[]> {
  const { onSkip } = options;
  const skills: Skill[] = [];
  
  if (!fs.existsSync(skillsDir)) {
    return skills;
  }
  
  const entries: fs.Dirent[] = await fs.promises.readdir(skillsDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      if (onSkip) onSkip(entry.name, 'not a directory');
      continue;
    }
    
    const skillPath: string = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      if (onSkip) onSkip(entry.name, 'missing SKILL.md');
      continue;
    }
    
    const content: string = await fs.promises.readFile(skillPath, 'utf-8');
    const metadata: SkillMetadata = parseSkillMetadata(content);
    
    // Extract trigger words from description and whenToUse
    const triggerText: string = `${metadata.description} ${metadata.whenToUse}`;
    const triggers: string[] = extractTriggerWords(triggerText);
    
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
 * @param skills - Array of skill objects
 * @returns Markdown table rows
 */
export function generateSkillMapping(skills: Skill[]): string {
  if (skills.length === 0) {
    return '| N/A | N/A | No skills installed yet |';
  }
  
  const rows: string[] = skills.map(skill => {
    const triggersStr: string = skill.triggers.join(', ') || 'N/A';
    const shortDesc: string = skill.description.length > 50 
      ? skill.description.substring(0, 47) + '...'
      : skill.description;
    
    return `| ${triggersStr} | ${skill.name} | ${shortDesc} |`;
  });
  
  return rows.join('\n');
}

/**
 * Main function: Generate SKILL_MAPPING replacement value
 * 
 * @param targetDir - Project root directory
 * @param options - Optional configuration
 * @returns Complete markdown table for SKILL_MAPPING
 */
export async function buildSkillMapping(targetDir: string, options: ScanOptions = {}): Promise<string> {
  const skillsDir: string = path.join(targetDir, '.github', 'skills');
  const skills: Skill[] = await scanSkillsDirectory(skillsDir, options);
  return generateSkillMapping(skills);
}
