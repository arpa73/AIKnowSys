/**
 * Type definitions for archive-changelog.js
 */

export type EntryType = 'session' | 'milestone' | 'unknown';

export interface Section {
  type: EntryType;
  year: number | null;
  header: string;
  content: string[];
}

export interface ParseResult {
  /** Lines before first section (metadata, title, description) */
  headerLines: string[];
  /** All parsed sections (sessions and milestones) */
  sections: Section[];
}

export interface FilterResult {
  toKeep: Section[];
  toArchive: Section[];
}

export interface Stats {
  sessionCount: number;
  milestoneCount: number;
  totalLines: number;
  yearCounts: Record<number, number>;
}

export function detectEntryType(line: string): EntryType;
export function extractYear(line: string): number | null;
export function parseChangelog(filepath: string): Promise<ParseResult>;
export function filterSections(sections: Section[], cutoffYear: number): FilterResult;
export function generateStats(sections: Section[]): Stats;
