# Implementation Plan: VSCode Hooks Phase 3 (Workspace Maintenance & Archiving)

**Status:** ✅ COMPLETE  
**Created:** 2026-01-31  
**Completed:** 2026-01-31  
**Goal:** Automated workspace cleanup with session and plan archiving

---

## Overview

Keep the workspace clean and organized by automatically archiving old sessions and completed plans, while preserving full history for reference.

**What we're building:**
1. **Workspace health check hook** (sessionStart) - Detects cleanup opportunities
2. **archive-sessions command** - Moves old sessions to dated archive folders
3. **archive-plans command** - Moves completed plans to archive, updates CURRENT_PLAN.md
4. **Clean command** - One-shot cleanup (sessions + plans + temp files)

**Why it matters:**
- Reduces clutter in `.aiknowsys/` directory
- Makes active work more discoverable
- Preserves history in organized archives
- Improves search/navigation performance
- Prevents "too many files" cognitive overload

---

## Requirements

### Functional Requirements
- ✅ Detect sessions older than configurable threshold (default 30 days)
- ✅ Detect completed plans older than threshold (default 7 days)
- ✅ Archive to dated folders (YYYY/MM/ structure)
- ✅ Update CURRENT_PLAN.md to reflect archived plan locations
- ✅ Non-destructive (move, don't delete)
- ✅ Dry-run mode (preview before archiving)
- ✅ Configurable thresholds via config.json
- ✅ Hook provides reminder, CLI does work (user control)

### Non-Functional Requirements
- Zero external dependencies (Node.js built-ins only)
- Fast execution (<2 seconds for hook, <5s for CLI)
- Comprehensive test coverage (20+ tests)
- Clear success/failure messages
- Reversible operations (can restore from archive)

---

## Architecture Changes

### New Files
- `lib/commands/archive-sessions.js` - Archive old session files
- `lib/commands/archive-plans.js` - Archive completed plans
- `lib/commands/clean.js` - All-in-one cleanup command
- `templates/hooks/workspace-health.cjs` - sessionStart hook for cleanup reminders
- `test/archive.test.js` - Test suite for archiving commands (20+ tests)

### Modified Files
- `bin/cli.js` - Register archive-sessions, archive-plans, clean commands
- `templates/hooks/config.json` - Add archiving thresholds configuration
- `templates/hooks/hooks.json` - Add workspace-health to sessionStart
- `lib/commands/init/constants.js` - Add workspace-health template path
- `lib/commands/init/templates.js` - Copy workspace-health.cjs during init
- `SETUP_GUIDE.md` - Document archiving commands and workflow

---

## Implementation Steps

### Phase 3.1: Session Archiving

#### Step 1: Write archive-sessions tests (TDD RED)
**File:** `test/archive.test.js`

**Action:** Create test suite for session archiving:
```javascript
describe('archive-sessions command', () => {
  it('should detect sessions older than threshold', async () => {
    // Test: Find sessions >30 days old
  });
  
  it('should move old sessions to archive/YYYY/MM/', async () => {
    // Test: Verify archived sessions in correct dated folders
  });
  
  it('should preserve recent sessions', async () => {
    // Test: Sessions <30 days stay in sessions/
  });
  
  it('should create archive directories if missing', async () => {
    // Test: Auto-create archive/2025/12/ structure
  });
  
  it('should handle --dry-run mode', async () => {
    // Test: Show what would be archived without moving files
  });
  
  it('should respect --threshold flag', async () => {
    // Test: Custom threshold (e.g., 60 days)
  });
  
  it('should skip if no old sessions found', async () => {
    // Test: Graceful handling of clean workspace
  });
  
  it('should handle malformed session files', async () => {
    // Test: Skip files that don't match pattern
  });
});
```

**Why:** Define expected behavior before implementation  
**Dependencies:** None  
**Risk:** Low - new test file  
**TDD:** RED phase

---

#### Step 2: Implement archive-sessions command (TDD GREEN)
**File:** `lib/commands/archive-sessions.js`

**Action:** Create archiving command:
```javascript
import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../logger.js';

/**
 * Archive old session files to dated folders
 * @param {Object} options - Command options
 * @param {string} options.dir - Target directory (default: process.cwd())
 * @param {number} options.threshold - Days old to archive (default: 30)
 * @param {boolean} options.dryRun - Preview mode (default: false)
 * @param {boolean} options._silent - Suppress output for testing
 */
export async function archiveSessions(options = {}) {
  const targetDir = path.resolve(options.dir || process.cwd());
  const threshold = options.threshold || 30;
  const dryRun = options.dryRun || false;
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.header('Archive Sessions', '📦');
  
  const sessionsDir = path.join(targetDir, '.aiknowsys', 'sessions');
  const archiveDir = path.join(targetDir, '.aiknowsys', 'archive', 'sessions');
  
  // Check if sessions directory exists
  try {
    await fs.access(sessionsDir);
  } catch (err) {
    log.info('No sessions directory found');
    return { archived: 0, kept: 0 };
  }
  
  // Find all session files
  const files = await fs.readdir(sessionsDir);
  const sessionFiles = files.filter(f => 
    /^\d{4}-\d{2}-\d{2}-session\.md$/.test(f)
  );
  
  if (sessionFiles.length === 0) {
    log.info('No session files found');
    return { archived: 0, kept: 0 };
  }
  
  // Calculate threshold date
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - threshold);
  
  const toArchive = [];
  const toKeep = [];
  
  for (const file of sessionFiles) {
    const filePath = path.join(sessionsDir, file);
    const stats = await fs.stat(filePath);
    
    if (stats.mtime < thresholdDate) {
      toArchive.push({ file, mtime: stats.mtime });
    } else {
      toKeep.push(file);
    }
  }
  
  if (toArchive.length === 0) {
    log.success(`No sessions older than ${threshold} days`);
    return { archived: 0, kept: toKeep.length };
  }
  
  // Display summary
  log.info(`Found ${toArchive.length} sessions to archive (>${threshold} days old)`);
  log.info(`Keeping ${toKeep.length} recent sessions`);
  
  if (dryRun) {
    log.cyan('\n📋 Dry run - would archive:');
    for (const { file, mtime } of toArchive) {
      const age = Math.floor((Date.now() - mtime.getTime()) / (1000 * 60 * 60 * 24));
      log.dim(`  ${file} (${age} days old)`);
    }
    return { archived: 0, kept: toKeep.length, dryRun: toArchive.length };
  }
  
  // Archive files
  let archived = 0;
  for (const { file, mtime } of toArchive) {
    const year = mtime.getFullYear();
    const month = String(mtime.getMonth() + 1).padStart(2, '0');
    
    const archiveYearMonth = path.join(archiveDir, String(year), month);
    await fs.mkdir(archiveYearMonth, { recursive: true });
    
    const srcPath = path.join(sessionsDir, file);
    const dstPath = path.join(archiveYearMonth, file);
    
    await fs.rename(srcPath, dstPath);
    archived++;
    
    log.dim(`  ✓ ${file} → archive/${year}/${month}/`);
  }
  
  log.success(`\n✅ Archived ${archived} sessions`);
  log.cyan(`📁 Archive location: .aiknowsys/archive/sessions/`);
  
  return { archived, kept: toKeep.length };
}
```

**Why:** Provides session cleanup automation  
**Dependencies:** Step 1 (tests written)  
**Risk:** Medium - file operations  
**TDD:** GREEN phase

---

#### Step 3: Register archive-sessions in CLI
**File:** `bin/cli.js`

**Action:** Add command registration:
```javascript
import { archiveSessions } from '../lib/commands/archive-sessions.js';

program
  .command('archive-sessions')
  .description('Archive old session files to dated folders')
  .option('-d, --dir <path>', 'Target directory', process.cwd())
  .option('--threshold <days>', 'Archive sessions older than N days', '30')
  .option('--dry-run', 'Preview what would be archived without moving files')
  .action(async (options) => {
    try {
      await archiveSessions({
        dir: options.dir,
        threshold: parseInt(options.threshold, 10),
        dryRun: options.dryRun
      });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });
```

**Why:** Makes command available to users  
**Dependencies:** Step 2  
**Risk:** Low - additive change  
**TDD:** Covered by existing CLI tests

---

### Phase 3.2: Plan Archiving

#### Step 4: Write archive-plans tests (TDD RED)
**File:** `test/archive.test.js`

**Action:** Add plan archiving tests:
```javascript
describe('archive-plans command', () => {
  it('should detect completed plans older than threshold', async () => {
    // Test: Find COMPLETE plans >7 days old
  });
  
  it('should move completed plans to archive/plans/', async () => {
    // Test: Verify archived plans in correct location
  });
  
  it('should preserve active and paused plans', async () => {
    // Test: Only COMPLETE plans archived
  });
  
  it('should update CURRENT_PLAN.md with archive links', async () => {
    // Test: Table updated with archive/ prefix
  });
  
  it('should handle --dry-run mode', async () => {
    // Test: Preview without moving
  });
  
  it('should respect --threshold flag', async () => {
    // Test: Custom threshold
  });
  
  it('should skip if no completed plans found', async () => {
    // Test: Graceful handling
  });
});
```

**Why:** Define plan archiving behavior  
**Dependencies:** Step 3  
**Risk:** Low - similar to session tests  
**TDD:** RED phase

---

#### Step 5: Implement archive-plans command (TDD GREEN)
**File:** `lib/commands/archive-plans.js`

**Action:** Create plan archiving command:
```javascript
import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../logger.js';

/**
 * Archive completed plans to archive folder
 * @param {Object} options - Command options
 */
export async function archivePlans(options = {}) {
  const targetDir = path.resolve(options.dir || process.cwd());
  const threshold = options.threshold || 7; // Days since completion
  const dryRun = options.dryRun || false;
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.header('Archive Plans', '📦');
  
  const aiknowsysDir = path.join(targetDir, '.aiknowsys');
  const currentPlanPath = path.join(aiknowsysDir, 'CURRENT_PLAN.md');
  const archiveDir = path.join(aiknowsysDir, 'archive', 'plans');
  
  // Read CURRENT_PLAN.md to find completed plans
  let currentPlanContent;
  try {
    currentPlanContent = await fs.readFile(currentPlanPath, 'utf-8');
  } catch (err) {
    log.error('CURRENT_PLAN.md not found');
    return { archived: 0, kept: 0 };
  }
  
  // Parse plan table
  const planTableRegex = /\| \[([^\]]+)\]\(([^)]+)\) \| (✅ COMPLETE|🎯 ACTIVE|🔄 PAUSED|📋 PLANNED|❌ CANCELLED)/g;
  const plans = [];
  let match;
  
  while ((match = planTableRegex.exec(currentPlanContent)) !== null) {
    plans.push({
      name: match[1],
      file: match[2],
      status: match[3]
    });
  }
  
  // Find completed plans to archive
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - threshold);
  
  const toArchive = [];
  const toKeep = [];
  
  for (const plan of plans) {
    if (!plan.status.includes('COMPLETE')) {
      toKeep.push(plan);
      continue;
    }
    
    const planPath = path.join(aiknowsysDir, plan.file);
    
    try {
      const stats = await fs.stat(planPath);
      
      // Check last modified time
      if (stats.mtime < thresholdDate) {
        toArchive.push({ ...plan, mtime: stats.mtime, path: planPath });
      } else {
        toKeep.push(plan);
      }
    } catch (err) {
      // Plan file doesn't exist, skip
      log.warn(`Plan file not found: ${plan.file}`);
    }
  }
  
  if (toArchive.length === 0) {
    log.success(`No completed plans older than ${threshold} days`);
    return { archived: 0, kept: plans.length };
  }
  
  // Display summary
  log.info(`Found ${toArchive.length} completed plans to archive`);
  
  if (dryRun) {
    log.cyan('\n📋 Dry run - would archive:');
    for (const plan of toArchive) {
      const age = Math.floor((Date.now() - plan.mtime.getTime()) / (1000 * 60 * 60 * 24));
      log.dim(`  ${plan.name} (completed ${age} days ago)`);
    }
    return { archived: 0, kept: toKeep.length, dryRun: toArchive.length };
  }
  
  // Create archive directory
  await fs.mkdir(archiveDir, { recursive: true });
  
  // Archive plans
  let archived = 0;
  const updates = [];
  
  for (const plan of toArchive) {
    const fileName = path.basename(plan.file);
    const dstPath = path.join(archiveDir, fileName);
    
    await fs.rename(plan.path, dstPath);
    archived++;
    
    // Track update for CURRENT_PLAN.md
    updates.push({
      oldLink: `[${plan.name}](${plan.file})`,
      newLink: `[${plan.name}](archive/plans/${fileName})`
    });
    
    log.dim(`  ✓ ${plan.name} → archive/plans/`);
  }
  
  // Update CURRENT_PLAN.md
  let updatedContent = currentPlanContent;
  for (const update of updates) {
    updatedContent = updatedContent.replace(update.oldLink, update.newLink);
  }
  
  await fs.writeFile(currentPlanPath, updatedContent, 'utf-8');
  
  log.success(`\n✅ Archived ${archived} completed plans`);
  log.success('✅ Updated CURRENT_PLAN.md with archive links');
  log.cyan(`📁 Archive location: .aiknowsys/archive/plans/`);
  
  return { archived, kept: toKeep.length };
}
```

**Why:** Automates plan cleanup and organization  
**Dependencies:** Step 4  
**Risk:** Medium - modifies CURRENT_PLAN.md  
**TDD:** GREEN phase

---

#### Step 6: Register archive-plans in CLI
**File:** `bin/cli.js`

**Action:** Add command registration (similar to Step 3)

---

### Phase 3.3: Workspace Health Hook

#### Step 7: Create workspace health hook (TDD)
**File:** `templates/hooks/workspace-health.cjs`

**Action:** Create sessionStart hook that detects cleanup opportunities:
```javascript
#!/usr/bin/env node
/**
 * Workspace Health Check Hook (sessionStart event)
 * 
 * Checks for cleanup opportunities (old sessions, completed plans).
 * Provides reminders to run archive commands.
 * 
 * Non-blocking: Always exits with code 0
 * Timeout: Must complete within 2 seconds
 */

const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const config = loadConfig();
    const sessionThreshold = config.archiving?.sessionThresholdDays || 30;
    const planThreshold = config.archiving?.planThresholdDays || 7;
    
    const stats = {
      oldSessions: 0,
      completedPlans: 0
    };
    
    // Check for old sessions
    const sessionsDir = path.join('.aiknowsys', 'sessions');
    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir);
      const sessionFiles = files.filter(f => /^\d{4}-\d{2}-\d{2}-session\.md$/.test(f));
      
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - sessionThreshold);
      
      for (const file of sessionFiles) {
        const filePath = path.join(sessionsDir, file);
        const stat = fs.statSync(filePath);
        if (stat.mtime < thresholdDate) {
          stats.oldSessions++;
        }
      }
    }
    
    // Check for completed plans
    const currentPlanPath = path.join('.aiknowsys', 'CURRENT_PLAN.md');
    if (fs.existsSync(currentPlanPath)) {
      const content = fs.readFileSync(currentPlanPath, 'utf-8');
      const completedPlans = (content.match(/✅ COMPLETE/g) || []).length;
      stats.completedPlans = completedPlans;
    }
    
    // Provide recommendations
    if (stats.oldSessions >= 5 || stats.completedPlans >= 3) {
      console.error('[Hook] 📦 Workspace Health Check');
      
      if (stats.oldSessions >= 5) {
        console.error(`[Hook]   ${stats.oldSessions} sessions older than ${sessionThreshold} days`);
        console.error('[Hook]   Recommend: node bin/cli.js archive-sessions --dry-run');
      }
      
      if (stats.completedPlans >= 3) {
        console.error(`[Hook]   ${stats.completedPlans} completed plans found`);
        console.error('[Hook]   Recommend: node bin/cli.js archive-plans --dry-run');
      }
      
      console.error('[Hook]   Or run: node bin/cli.js clean --dry-run (cleanup all)');
    }
    
    process.exit(0);
  } catch (err) {
    process.exit(0);
  }
}

function loadConfig() {
  const configPath = path.join('.github', 'hooks', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (err) {
      // Fall back to defaults
    }
  }
  return {};
}

main();
```

**Why:** Proactive workspace health monitoring  
**Dependencies:** Steps 2, 5  
**Risk:** Low - non-blocking reminder only  
**TDD:** Covered by integration tests

---

#### Step 8: Create clean command (convenience)
**File:** `lib/commands/clean.js`

**Action:** All-in-one cleanup command:
```javascript
import { archiveSessions } from './archive-sessions.js';
import { archivePlans } from './archive-plans.js';
import { createLogger } from '../logger.js';

/**
 * Clean workspace (archive sessions + plans)
 */
export async function clean(options = {}) {
  const log = createLogger(options._silent || false);
  
  log.header('Clean Workspace', '🧹');
  
  // Archive sessions
  const sessionResult = await archiveSessions({
    ...options,
    _silent: true
  });
  
  // Archive plans
  const planResult = await archivePlans({
    ...options,
    _silent: true
  });
  
  // Summary
  log.success(`\n✅ Cleanup complete`);
  log.info(`   Sessions archived: ${sessionResult.archived}`);
  log.info(`   Plans archived: ${planResult.archived}`);
  
  return { sessions: sessionResult, plans: planResult };
}
```

**Why:** Convenience command for full cleanup  
**Dependencies:** Steps 2, 5  
**Risk:** Low - composition of existing commands  
**TDD:** Covered by integration tests

---

### Phase 3.4: Configuration & Documentation

#### Step 9: Update config.json template
**File:** `templates/hooks/config.json`

**Action:** Add archiving configuration:
```json
{
  "archiving": {
    "sessionThresholdDays": 30,
    "planThresholdDays": 7,
    "enabled": true
  }
}
```

---

#### Step 10: Update SETUP_GUIDE.md
**File:** `SETUP_GUIDE.md`

**Action:** Document archiving commands and workflow

---

#### Step 11: Run comprehensive validation
**Commands:**
```bash
npm test                                      # 360+ tests expected
node bin/cli.js archive-sessions --dry-run   # Preview
node bin/cli.js archive-plans --dry-run      # Preview  
node bin/cli.js clean --dry-run              # Preview all
```

---

#### Step 12: Update CODEBASE_CHANGELOG.md
**File:** `CODEBASE_CHANGELOG.md`

**Action:** Add Phase 3 session entry

---

## Success Criteria

- [ ] archive-sessions command moves old sessions to archive/YYYY/MM/
- [ ] archive-plans command moves completed plans to archive/plans/
- [ ] CURRENT_PLAN.md updated with archive links after archiving
- [ ] clean command runs both archiving operations
- [ ] workspace-health hook detects cleanup opportunities
- [ ] --dry-run mode works for all commands
- [ ] 360+ tests passing (20+ new Phase 3 tests)
- [ ] Configuration in config.json (thresholds customizable)
- [ ] Documentation complete with examples

---

## Risks & Mitigations

**Risk:** Accidental data loss if archiving fails mid-operation
- **Mitigation:** Atomic operations (rename, not copy+delete), dry-run mode

**Risk:** CURRENT_PLAN.md corruption during update
- **Mitigation:** Backup before modification, validate after update

**Risk:** Users don't know about archive commands
- **Mitigation:** Hook provides reminders, documentation with examples

**Risk:** Archive folders grow unbounded
- **Mitigation:** Document manual cleanup (archive is still gitignored)

---

## Notes for Developer

**Phase 3 Philosophy:**
- Hooks detect and remind (non-blocking)
- CLI commands do the work (user control)
- Preview before action (--dry-run everywhere)
- Non-destructive (move to archive, don't delete)

**Archive Structure:**
```
.aiknowsys/
├── sessions/              # Recent sessions
├── archive/
│   ├── sessions/
│   │   └── 2025/
│   │       ├── 12/
│   │       └── 11/
│   └── plans/
│       ├── PLAN_old1.md
│       └── PLAN_old2.md
└── CURRENT_PLAN.md        # Updated with archive/ links
```

**Testing Priority:**
1. File operations (move, not delete)
2. CURRENT_PLAN.md updates (integrity)
3. Dry-run mode (no side effects)
4. Threshold customization
5. Graceful error handling
