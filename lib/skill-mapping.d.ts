/**
 * Type definitions for skill-mapping.js (not yet migrated to TypeScript)
 */

export interface SkillMetadata {
  name: string | null;
  description: string;
}

export interface Skill {
  name: string;
  triggers: string[];
  description: string;
}

export function parseSkillMetadata(content: string): SkillMetadata;
export function extractTriggerWords(content: string): string[];
export function generateSkillMapping(skills: Skill[]): string;
export function scanSkillsDirectory(dir: string): Promise<Skill[]>;
