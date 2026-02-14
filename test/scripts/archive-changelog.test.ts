import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  detectEntryType, 
  extractYear, 
  parseChangelog, 
  filterSections,
  generateStats 
} from '../../scripts/archive-changelog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TEST_DIR = path.join(PROJECT_ROOT, 'test-fixtures', 'archive-test');

/**
 * Helper: Create test changelog file
 */
async function createTestChangelog(content: string): Promise<string> {
  const filepath = path.join(TEST_DIR, 'test-changelog.md');
  await fs.mkdir(TEST_DIR, { recursive: true });
  await fs.writeFile(filepath, content, 'utf-8');
  return filepath;
}

/**
 * Helper: Clean test directory
 */
async function cleanTestDir(): Promise<void> {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (err) {
    // Ignore if doesn't exist
  }
}

// Sample changelog entries for testing
const SAMPLE_HEADER = `# Codebase Changelog

**Purpose:** Milestone-focused timeline

---

`;

const MILESTONE_V0_10 = `## v0.10.0 Release (Jan 15, 2026)

**Goal:** Major release

**Changes:**
- Feature X
- Feature Y

**Validation:**
- ✅ Tests passing

`;

const MILESTONE_EXPLICIT = `## Milestone: Storage Adapter Layer (Dec 10, 2025)

**Goal:** Abstract storage

**Changes:**
- New adapter interface

`;

const SESSION_2026 = `## Session: TypeScript Migration (Feb 5, 2026)

**Goal:** Migrate to TypeScript

**Changes:**
- Migrated 50 files

`;

const SESSION_2025_FEB = `## Session: Complete TypeScript Phase 8 (Feb 5, 2025)

**Goal:** Finish TypeScript migration

**Changes:**
- Final 4 files

`;

describe('archive-changelog script', () => {
  beforeEach(async () => {
    await cleanTestDir();
  });

  afterEach(async () => {
    await cleanTestDir();
  });

  describe('detectEntryType', () => {
    it('detects version milestones (v0.10.0, v1.2.3)', () => {
      expect(detectEntryType('## v0.10.0 Release (Jan 15, 2026)')).toBe('milestone');
      expect(detectEntryType('## v1.2.3 Hotfix')).toBe('milestone');
      expect(detectEntryType('## v0.1.0-beta.1 Pre-release')).toBe('milestone');
    });

    it('detects explicit milestones (## Milestone:)', () => {
      expect(detectEntryType('## Milestone: Storage Adapter Layer')).toBe('milestone');
      expect(detectEntryType('## Release: Production Launch')).toBe('milestone');
      expect(detectEntryType('## Major Change: Architecture Overhaul')).toBe('milestone');
    });

    it('detects session headers (## Session:)', () => {
      expect(detectEntryType('## Session: TypeScript Migration (Feb 5, 2026)')).toBe('session');
      expect(detectEntryType('## Session: Fix Bug in Parser')).toBe('session');
    });

    it('returns "unknown" for regular headers', () => {
      expect(detectEntryType('## Introduction')).toBe('unknown');
      expect(detectEntryType('## Overview')).toBe('unknown');
      expect(detectEntryType('# Main Title')).toBe('unknown');
    });

    it('handles edge cases', () => {
      expect(detectEntryType('## v')).toBe('unknown'); // Incomplete version
      expect(detectEntryType('## Session')).toBe('unknown'); // Missing colon
      expect(detectEntryType('##Session: Test')).toBe('unknown'); // Missing space
      expect(detectEntryType('### Session: Test')).toBe('unknown'); // Wrong level
    });
  });

  describe('extractYear', () => {
    it('extracts year from "Jan 26, 2025" format', () => {
      expect(extractYear('## Session: Test (Jan 26, 2025)')).toBe(2025);
      expect(extractYear('## Session: Test (Dec 31, 2024)')).toBe(2024);
    });

    it('handles all month abbreviations', () => {
      expect(extractYear('(Jan 1, 2025)')).toBe(2025);
      expect(extractYear('(Feb 2, 2025)')).toBe(2025);
      expect(extractYear('(Mar 3, 2025)')).toBe(2025);
      expect(extractYear('(Apr 4, 2025)')).toBe(2025);
      expect(extractYear('(May 5, 2025)')).toBe(2025);
      expect(extractYear('(Jun 6, 2025)')).toBe(2025);
      expect(extractYear('(Jul 7, 2025)')).toBe(2025);
      expect(extractYear('(Aug 8, 2025)')).toBe(2025);
      expect(extractYear('(Sep 9, 2025)')).toBe(2025);
      expect(extractYear('(Oct 10, 2025)')).toBe(2025);
      expect(extractYear('(Nov 11, 2025)')).toBe(2025);
      expect(extractYear('(Dec 12, 2025)')).toBe(2025);
    });

    it('returns null for unmatched formats', () => {
      expect(extractYear('## Session: No Date')).toBeNull();
      expect(extractYear('(February 5, 2026)')).toBeNull(); // Full month name
      expect(extractYear('(2026-02-05)')).toBeNull(); // ISO format
      expect(extractYear('(5 Feb 2026)')).toBeNull(); // Day first
    });

    it('handles "Feb 7, 2026" vs full month names', () => {
      expect(extractYear('(Feb 7, 2026)')).toBe(2026);
      expect(extractYear('(February 7, 2026)')).toBeNull();
    });
  });

  describe('parseChangelog', () => {
    it('parses changelog with mixed sessions and milestones', async () => {
      const content = SAMPLE_HEADER + 
        MILESTONE_V0_10 + 
        SESSION_2026 + 
        MILESTONE_EXPLICIT + 
        SESSION_2025_FEB;
      const filepath = await createTestChangelog(content);
      
      const { sections } = await parseChangelog(filepath);
      
      expect(sections).toHaveLength(4);
      expect(sections.filter((s: any) => s.type === 'session')).toHaveLength(2);
      expect(sections.filter((s: any) => s.type === 'milestone')).toHaveLength(2);
    });

    it('preserves header lines before first section', async () => {
      const content = SAMPLE_HEADER + SESSION_2026;
      const filepath = await createTestChangelog(content);
      
      const { headerLines } = await parseChangelog(filepath);
      
      const headerText = headerLines.join('\n');
      expect(headerText).toContain('# Codebase Changelog');
      expect(headerText).toContain('**Purpose:**');
    });

    it('handles empty changelog (header only)', async () => {
      const content = SAMPLE_HEADER;
      const filepath = await createTestChangelog(content);
      
      const { sections } = await parseChangelog(filepath);
      
      expect(sections).toHaveLength(0);
    });

    it('handles file with no sections', async () => {
      const content = '# Title\n\nSome content but no sections\n';
      const filepath = await createTestChangelog(content);
      
      const { sections } = await parseChangelog(filepath);
      
      expect(sections).toHaveLength(0);
    });

    it('handles consecutive section headers', async () => {
      const content = SAMPLE_HEADER + 
        '## Session: First (Feb 5, 2026)\n\n' +
        '## Session: Second (Feb 6, 2026)\n\n';
      const filepath = await createTestChangelog(content);
      
      const { sections } = await parseChangelog(filepath);
      
      expect(sections).toHaveLength(2);
      expect(sections[0].header).toContain('First');
      expect(sections[1].header).toContain('Second');
    });
  });

  describe('filterSections', () => {
    it('keeps all milestones regardless of year', () => {
      const sections = [
        { type: 'milestone' as const, year: 2024, header: '## Milestone: Old', content: [] },
        { type: 'milestone' as const, year: 2026, header: '## Milestone: New', content: [] },
        { type: 'session' as const, year: 2025, header: '## Session: Test', content: [] },
      ];
      
      const { toKeep, toArchive } = filterSections(sections, 2025);
      
      const keepMilestones = toKeep.filter((s: any) => s.type === 'milestone');
      const archiveMilestones = toArchive.filter((s: any) => s.type === 'milestone');
      
      expect(keepMilestones).toHaveLength(2); // Both milestones kept
      expect(archiveMilestones).toHaveLength(0); // No milestones archived
    });

    it('archives sessions from cutoffYear and earlier', () => {
      const sections = [
        { type: 'session' as const, year: 2026, header: '## Session: New', content: [] },
        { type: 'session' as const, year: 2025, header: '## Session: 2025', content: [] },
        { type: 'session' as const, year: 2024, header: '## Session: Old', content: [] },
      ];
      
      const { toArchive } = filterSections(sections, 2025);
      
      const archiveSessions = toArchive.filter((s: any) => s.type === 'session');
      
      expect(archiveSessions).toHaveLength(2); // 2025 and 2024 archived
      expect(archiveSessions[0].year).toBe(2025);
      expect(archiveSessions[1].year).toBe(2024);
    });

    it('keeps sessions from after cutoffYear', () => {
      const sections = [
        { type: 'session' as const, year: 2026, header: '## Session: New', content: [] },
        { type: 'session' as const, year: 2025, header: '## Session: 2025', content: [] },
      ];
      
      const { toKeep } = filterSections(sections, 2024);
      
      const keepSessions = toKeep.filter((s: any) => s.type === 'session');
      
      expect(keepSessions).toHaveLength(2); // Both kept (after 2024)
    });

    it('handles null years gracefully', () => {
      const sections = [
        { type: 'session' as const, year: null, header: '## Session: No Date', content: [] },
        { type: 'session' as const, year: 2026, header: '## Session: Dated', content: [] },
      ];
      
      const { toKeep } = filterSections(sections, 2025);
      
      // Should not crash, null year entries kept by default
      expect(toKeep.length).toBeGreaterThan(0);
    });
  });

  describe('generateStats', () => {
    it('counts sessions and milestones correctly', () => {
      const sections = [
        { type: 'session' as const, year: 2026, header: '## Session', content: ['line1', 'line2'] },
        { type: 'session' as const, year: 2025, header: '## Session', content: ['line1'] },
        { type: 'milestone' as const, year: 2026, header: '## Milestone', content: ['line1', 'line2', 'line3'] },
      ];
      
      const stats = generateStats(sections);
      
      expect(stats.sessionCount).toBe(2);
      expect(stats.milestoneCount).toBe(1);
      expect(stats.totalLines).toBe(6); // 2 + 1 + 3
    });

    it('generates year counts', () => {
      const sections = [
        { type: 'session' as const, year: 2026, header: '## Session', content: [] },
        { type: 'session' as const, year: 2026, header: '## Session', content: [] },
        { type: 'session' as const, year: 2025, header: '## Session', content: [] },
      ];
      
      const stats = generateStats(sections);
      
      expect(stats.yearCounts[2026]).toBe(2);
      expect(stats.yearCounts[2025]).toBe(1);
    });

    it('handles empty sections array', () => {
      const stats = generateStats([]);
      
      expect(stats.sessionCount).toBe(0);
      expect(stats.milestoneCount).toBe(0);
      expect(stats.totalLines).toBe(0);
      expect(Object.keys(stats.yearCounts)).toHaveLength(0);
    });
  });
});
