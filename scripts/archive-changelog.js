#!/usr/bin/env node

/**
 * Archive old changelog entries to declutter main file
 * Part of Milestone Changelog Evolution (v0.11.0)
 * 
 * See: docs/milestone-changelog-format.md for changelog workflow
 * 
 * Usage:
 *   node scripts/archive-changelog.js                 # Execute archive
 *   node scripts/archive-changelog.js --dry-run       # Preview what will be archived
 *   node scripts/archive-changelog.js --year 2024     # Custom year cutoff (default: 2025)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Configuration
const CHANGELOG_PATH = path.join(PROJECT_ROOT, 'CODEBASE_CHANGELOG.md');
const ARCHIVE_DIR = path.join(PROJECT_ROOT, 'docs', 'archived');
const BACKUP_PATH = path.join(PROJECT_ROOT, 'CODEBASE_CHANGELOG.md.pre-v0.11.backup');

// Parse CLI arguments
const args = process.argv.slice(2);

// Handle --help flag
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📦 Archive Changelog - Move old entries to docs/archived/

Usage:
  node scripts/archive-changelog.js [options]

Options:
  --dry-run          Preview what will be archived (no changes)
  --year <YYYY>      Custom year cutoff (default: 2025)
                     Sessions from this year and earlier will be archived
  --help, -h         Show this help message

Examples:
  node scripts/archive-changelog.js
  node scripts/archive-changelog.js --dry-run
  node scripts/archive-changelog.js --year 2024

See: docs/milestone-changelog-format.md for changelog workflow
`);
  process.exit(0);
}

const isDryRun = args.includes('--dry-run');
const yearIndex = args.indexOf('--year');
const cutoffYear = yearIndex >= 0 ? parseInt(args[yearIndex + 1], 10) : 2025;

/**
 * Detect if a line is a milestone or session header
 * @param {string} line - The line to check
 * @returns {'milestone' | 'session' | 'unknown'}
 */
export function detectEntryType(line) {
  // Milestone indicators (anything that looks like a version or major change)
  const milestonePatterns = [
    /^## v\d+\.\d+\.\d+/,              // Version: v0.10.0, v1.2.3
    /^## Milestone:/,                 // Explicit: ## Milestone: X
    /^## Release:/,                   // Explicit: ## Release: X
    /^## Major Change:/,              // Explicit: ## Major Change: X
  ];

  if (milestonePatterns.some(pattern => pattern.test(line))) {
    return 'milestone';
  }

  // Session indicators
  if (/^## Session:/.test(line)) {
    return 'session';
  }

  return 'unknown';
}

/**
 * Extract year from session header
 * Example: "## Session: TypeScript Migration (Jan 26, 2025)" -> 2025
 * @param {string} line - The header line
 * @returns {number | null}
 */
export function extractYear(line) {
  const match = line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+,\s+(\d{4})\)/);
  return match ? parseInt(match[2], 10) : null;
}

/**
 * Parse changelog file into sections
 * @param {string} filepath - Path to changelog file
 * @returns {Promise<{headerLines: string[], sections: Array}>}
 */
export async function parseChangelog(filepath) {
  const content = await fs.readFile(filepath, 'utf-8');
  const lines = content.split('\n');
  
  const sections = [];
  let currentSection = null;
  const headerLines = []; // Lines before first section

  for (const line of lines) {
    const entryType = detectEntryType(line);

    if (entryType === 'milestone' || entryType === 'session') {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        type: entryType,
        header: line,
        year: extractYear(line),
        content: [line]
      };
    } else if (currentSection) {
      // Add to current section
      currentSection.content.push(line);
    } else {
      // Before any sections (header)
      headerLines.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return { headerLines, sections };
}

/**
 * Filter sections into keep vs archive
 * @param {Array} sections - Parsed sections
 * @param {number} cutoffYear - Year cutoff
 * @returns {{toKeep: Array, toArchive: Array}}
 */
export function filterSections(sections, cutoffYear) {
  const toKeep = [];
  const toArchive = [];

  for (const section of sections) {
    // Always keep milestones (regardless of year)
    if (section.type === 'milestone') {
      toKeep.push(section);
      continue;
    }

    // Sessions: archive if year <= cutoffYear
    if (section.type === 'session') {
      if (section.year && section.year <= cutoffYear) {
        toArchive.push(section);
      } else {
        toKeep.push(section);
      }
    }
  }

  return { toKeep, toArchive };
}

/**
 * Generate archival summary stats
 * @param {Array} sections - Sections to analyze
 * @returns {{sessionCount: number, milestoneCount: number, totalLines: number, yearCounts: Object}}
 */
export function generateStats(sections) {
  const sessionCount = sections.filter(s => s.type === 'session').length;
  const milestoneCount = sections.filter(s => s.type === 'milestone').length;
  const totalLines = sections.reduce((sum, s) => sum + s.content.length, 0);
  const yearCounts = {};

  sections.forEach(s => {
    if (s.year) {
      yearCounts[s.year] = (yearCounts[s.year] || 0) + 1;
    }
  });

  return { sessionCount, milestoneCount, totalLines, yearCounts };
}

/**
 * Main execution
 */
async function main() {
  console.log('📦 Changelog Archive Tool\n');
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (preview only)' : '✅ EXECUTE (will modify files)'}`);
  console.log(`Cutoff year: ${cutoffYear} (sessions from ${cutoffYear} and earlier will be archived)\n`);

  // Check if changelog exists
  try {
    await fs.access(CHANGELOG_PATH);
  } catch (err) {
    console.error(`❌ Error: CODEBASE_CHANGELOG.md not found at ${CHANGELOG_PATH}`);
    console.error('   Make sure you are running this from the project root.');
    process.exit(1);
  }

  // Parse changelog
  console.log('📖 Reading CODEBASE_CHANGELOG.md...');
  const { headerLines, sections } = await parseChangelog(CHANGELOG_PATH);
  console.log(`   Found ${sections.length} sections (${sections.filter(s => s.type === 'session').length} sessions, ${sections.filter(s => s.type === 'milestone').length} milestones)\n`);

  // Filter sections
  const { toKeep, toArchive } = filterSections(sections, cutoffYear);

  // Generate stats
  const keepStats = generateStats(toKeep);
  const archiveStats = generateStats(toArchive);

  console.log('📊 Statistics:\n');
  console.log('KEEP (recent + all milestones):');
  console.log(`   Sessions: ${keepStats.sessionCount}`);
  console.log(`   Milestones: ${keepStats.milestoneCount}`);
  console.log(`   Lines: ${keepStats.totalLines}`);
  console.log(`   Years: ${Object.keys(keepStats.yearCounts).sort().join(', ') || 'none'}\n`);

  console.log('ARCHIVE (old sessions):');
  console.log(`   Sessions: ${archiveStats.sessionCount}`);
  console.log(`   Milestones: ${archiveStats.milestoneCount}`);
  console.log(`   Lines: ${archiveStats.totalLines}`);
  console.log(`   Years: ${Object.keys(archiveStats.yearCounts).sort().join(', ') || 'none'}\n`);

  if (toArchive.length === 0) {
    console.log(`✨ No entries to archive (nothing from ${cutoffYear} or earlier found)`);
    return;
  }

  // Show sample of what will be archived
  console.log('📝 Sample of entries to be archived (first 5):');
  toArchive.slice(0, 5).forEach(section => {
    console.log(`   - ${section.header.substring(0, 80)}...`);
  });
  if (toArchive.length > 5) {
    console.log(`   ... and ${toArchive.length - 5} more`);
  }
  console.log();

  if (isDryRun) {
    console.log('🔍 DRY RUN complete. No files were modified.');
    console.log('   Run without --dry-run to execute the archive.');
    return;
  }

  // Execute archive
  console.log('🚀 Executing archive...\n');

  // Check if backup already exists
  try {
    await fs.access(BACKUP_PATH);
    console.warn(`⚠️  Warning: Backup file already exists: ${path.basename(BACKUP_PATH)}`);
    console.warn('   This will be overwritten. Press Ctrl+C to cancel, or wait 3 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (err) {
    // Backup doesn't exist, continue
  }

  // 1. Create backup
  console.log('💾 Creating backup: CODEBASE_CHANGELOG.md.pre-v0.11.backup');
  await fs.copyFile(CHANGELOG_PATH, BACKUP_PATH);

  // 2. Create archive directory
  console.log('📁 Creating archive directory: docs/archived/');
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });

  // 3. Write archive file
  const archivePath = path.join(ARCHIVE_DIR, `changelog-${cutoffYear}-and-earlier.md`);
  console.log(`📄 Writing archive: ${path.relative(PROJECT_ROOT, archivePath)}`);
  
  const archiveContent = [
    `# Changelog Archive: ${cutoffYear} and Earlier`,
    '',
    `> Historical session entries from ${cutoffYear} and earlier`,
    `> Archived on ${new Date().toISOString().split('T')[0]}`,
    '',
    '**Original file:** CODEBASE_CHANGELOG.md (5,850 lines)  ',
    `**Archive size:** ${archiveStats.totalLines} lines  `,
    `**Sessions archived:** ${archiveStats.sessionCount}  `,
    `**Remaining in main:** ${keepStats.sessionCount + keepStats.milestoneCount} entries`,
    '',
    '---',
    '',
    ...toArchive.flatMap(s => s.content),
  ].join('\n');

  await fs.writeFile(archivePath, archiveContent, 'utf-8');

  // 4. Write new changelog (keep only recent + milestones)
  console.log('📝 Updating CODEBASE_CHANGELOG.md (keeping recent + milestones)');
  
  const newChangelogContent = [
    ...headerLines,
    ...toKeep.flatMap(s => s.content),
  ].join('\n');

  await fs.writeFile(CHANGELOG_PATH, newChangelogContent, 'utf-8');

  console.log('\n✅ Archive complete!\n');
  console.log('Summary:');
  console.log('   Backup: CODEBASE_CHANGELOG.md.pre-v0.11.backup');
  console.log(`   Archive: ${path.relative(PROJECT_ROOT, archivePath)} (${archiveStats.totalLines} lines)`);
  console.log(`   Updated: CODEBASE_CHANGELOG.md (${keepStats.totalLines + headerLines.length} lines, reduced from 5,850)`);
  console.log();
  console.log('Next steps:');
  console.log('   1. Review docs/archived/changelog-${cutoffYear}-and-earlier.md');
  console.log('   2. Review updated CODEBASE_CHANGELOG.md');
  console.log('   3. If satisfied, commit both files');
  console.log('   4. If not satisfied, restore from backup: mv CODEBASE_CHANGELOG.md.pre-v0.11.backup CODEBASE_CHANGELOG.md');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
