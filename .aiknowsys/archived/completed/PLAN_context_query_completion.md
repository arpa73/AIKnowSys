# Implementation Plan: Context Query System Completion (Auto-Index + Mutations)

**Status:** 🔄 IN PROGRESS (Phase A.6 ✅ COMPLETE, Phase B Mini pending)  
**Created:** 2026-02-07  
**Phase A.6 Completed:** 2026-02-07  
**Goal:** Make the context query system actually usable by adding auto-indexing and mutation commands

---

## 🎯 The Problem We're Solving

**Current State (Phase A Complete):**
- ✅ Query commands work perfectly (`query-plans`, `query-sessions`, `search-context`)
- ✅ 737/737 tests passing
- ✅ Clean architecture with storage adapter pattern
- ❌ **Index goes stale the moment you manually create/edit a file**
- ❌ **Requires manual `rebuild-index` after every file operation**
- ❌ **Unusable in practice despite perfect tests**

**The Fundamental Issue:**
We built beautiful read infrastructure without write infrastructure. It's like building a search engine that can't crawl new pages.

**What This Plan Fixes:**
1. **Auto-Indexing** - Index stays current automatically (no manual rebuilds)
2. **Mutation Commands** - AI/humans use commands that update file + index atomically
3. **Usable Workflows** - System becomes reliable for daily use

---

## Overview

Transform the context query system from "museum exhibit" to "production tool" by completing the write layer.

**Two-Phase Approach:**

### Phase A.6: Auto-Indexing (2-3 hours) - CRITICAL FIX
- **Problem:** Index goes stale when files change manually
- **Solution:** Auto-detect staleness and rebuild transparently
- **Benefit:** Current workflows continue working, no manual rebuilds

### Phase B Mini: Mutation Commands (3-4 hours) - FUTURE-PROOF
- **Problem:** AI creates files manually, can't enforce schema
- **Solution:** Commands that update file + index atomically
- **Benefit:** Command-first workflow, schema validation, zero index drift

**Why Split This Way:**
- Phase A.6 fixes immediate usability (2-3 hours to working system)
- Phase B Mini enables better workflows (optional improvement)
- Can evaluate A.6 effectiveness before committing to B Mini

---

## Requirements

### Functional Requirements

**Phase A.6: Auto-Indexing**
- FR-A6.1: Detect when index is stale (files newer than index)
- FR-A6.2: Auto-rebuild index before returning query results
- FR-A6.3: Log rebuild events (visibility into what's happening)
- FR-A6.4: Config option to disable auto-rebuild (manual control)
- FR-A6.5: Git hooks to rebuild on post-commit/post-merge

**Phase B Mini: Mutation Commands**
- FR-B.1: `create-session` command generates session.md + index entry
- FR-B.2: `create-plan` command generates PLAN_*.md + updates pointers
- FR-B.3: `update-session` command modifies YAML frontmatter + syncs index
- FR-B.4: All commands enforce schema (YAML frontmatter validation)
- FR-B.5: All commands return JSON for AI consumption

### Non-Functional Requirements

- **Performance:** Auto-rebuild adds <500ms overhead on stale index
- **Reliability:** Index never shows incomplete data (rebuild or error, no half-state)
- **Backward Compat:** Manual file creation still works (not forced to use commands)
- **Testability:** All auto-rebuild logic unit testable
- **User Experience:** Clear logging when auto-rebuild happens (no mysterious delays)

---

## Architecture Changes

### New Components

```
lib/
├── context/
│   ├── index.js                 # [EXISTING] Factory + exports
│   ├── storage-adapter.js       # [EXISTING] Base interface
│   ├── json-storage.js          # [MODIFY] Add staleness detection + auto-rebuild
│   └── auto-index.js            # [NEW] Auto-indexing logic (Phase A.6)
├── commands/
│   ├── query-plans.js           # [MODIFY] Enable auto-rebuild before query
│   ├── query-sessions.js        # [MODIFY] Enable auto-rebuild before query
│   ├── search-context.js        # [MODIFY] Enable auto-rebuild before query
│   ├── rebuild-index.js         # [EXISTING] Manual rebuild
│   ├── create-session.js        # [NEW] Phase B Mini
│   ├── create-plan.js           # [NEW] Phase B Mini
│   └── update-session.js        # [NEW] Phase B Mini
├── utils/
│   └── yaml-frontmatter.js      # [NEW] YAML parsing/generation (Phase B Mini)

.aiknowsys/
├── context-index.json           # [EXISTING] Team index
├── context-index.personal.json  # [EXISTING] Personal index
└── .aiknowsys.config.json       # [NEW] Config (auto-rebuild enabled/disabled)

.github/
└── hooks/
    ├── post-commit               # [NEW] Auto-rebuild on commit
    └── post-merge                # [NEW] Auto-rebuild on merge
```

### Modified Files

**Phase A.6:**
- `lib/context/json-storage.js` - Add `isStale()` and `autoRebuild()` methods
- `lib/commands/query-plans.js` - Call `autoRebuild()` before query
- `lib/commands/query-sessions.js` - Call `autoRebuild()` before query
- `lib/commands/search-context.js` - Call `autoRebuild()` before query
- `package.json` - Add git hooks support (optional)

**Phase B Mini:**
- `bin/cli.js` - Register new mutation commands
- `.github/skills/context-query/SKILL.md` - Document mutation commands
- `CODEBASE_ESSENTIALS.md` - Update Section 4b with mutation workflow

---

## Implementation Steps

---

### 🔧 Phase A.6: Auto-Indexing (2-3 hours) - CRITICAL FIX

**Goal:** Make current workflows work reliably without manual intervention

---

#### Step A6.1: Design Auto-Rebuild Strategy
**Time:** 30 minutes  
**Files:** `docs/auto-indexing-design.md` (planning doc)

**Action:** Document auto-rebuild approach with decision rationale

**Three Strategies Considered:**

1. **Lazy Rebuild (CHOSEN)**
   - Check index staleness on every query
   - Rebuild if index.mtime < newest_file.mtime
   - **Pros:** Simple, no dependencies, zero config
   - **Cons:** 100-500ms delay on first query after file changes
   
2. **File Watcher**
   - Watch `.aiknowsys/` directory with chokidar
   - Rebuild on file changes
   - **Pros:** Zero query latency
   - **Cons:** Adds dependency, complexity, background process
   
3. **Git Hooks Only**
   - Rebuild on post-commit/post-merge
   - **Pros:** No runtime overhead
   - **Cons:** Misses manual file edits between commits

**Decision:** **Lazy Rebuild + Optional Git Hooks**
- Lazy rebuild = baseline (always works, no config)
- Git hooks = optimization (faster queries, zero latency)
- User can enable git hooks if they want best performance

**Implementation Plan:**
```javascript
// lib/context/auto-index.js
class AutoIndexer {
  async ensureFreshIndex(storage, options = {}) {
    const { force = false, verbose = false } = options;
    
    // Skip check if force rebuild requested
    if (force) {
      return await storage.rebuildIndex();
    }
    
    // Check staleness
    const isStale = await this.isIndexStale(storage);
    
    if (isStale) {
      if (verbose) {
        logger.info('Index is stale, rebuilding...');
      }
      await storage.rebuildIndex();
      if (verbose) {
        logger.success('Index rebuilt successfully');
      }
    }
    
    return !isStale; // true if was fresh, false if rebuilt
  }
  
  async isIndexStale(storage) {
    const indexPath = storage.getIndexPath();
    const indexMtime = await fs.stat(indexPath).mtime;
    
    // Check all source directories
    const sourceDirs = [
      '.aiknowsys/plans/',
      '.aiknowsys/sessions/',
      '.aiknowsys/learned/',
      '.aiknowsys/personal/' // if exists
    ];
    
    for (const dir of sourceDirs) {
      const files = await glob(`${dir}**/*.md`);
      for (const file of files) {
        const fileMtime = await fs.stat(file).mtime;
        if (fileMtime > indexMtime) {
          return true; // Found newer file
        }
      }
    }
    
    return false; // All files older than index
  }
}
```

**Testing Strategy:**
```javascript
describe('AutoIndexer', () => {
  it('detects stale index when files are newer', async () => {
    // Create index
    await storage.rebuildIndex();
    
    // Wait 100ms
    await sleep(100);
    
    // Create new session file
    await fs.writeFile('.aiknowsys/sessions/2026-02-07-session.md', '...');
    
    // Should detect staleness
    const stale = await autoIndexer.isIndexStale(storage);
    expect(stale).toBe(true);
  });
  
  it('reports fresh index when no files changed', async () => {
    await storage.rebuildIndex();
    const stale = await autoIndexer.isIndexStale(storage);
    expect(stale).toBe(false);
  });
  
  it('rebuilds index when ensureFreshIndex called on stale index', async () => {
    // Make index stale
    await fs.writeFile('.aiknowsys/sessions/new-session.md', '...');
    
    // Ensure fresh
    const wasStale = await autoIndexer.ensureFreshIndex(storage);
    expect(wasStale).toBe(true);
    
    // Verify index now contains new session
    const index = await storage.loadIndex();
    expect(index.sessions.some(s => s.file.includes('new-session'))).toBe(true);
  });
});
```

**Why This Matters:**
- Simple implementation (no external dependencies)
- Works in all environments (no git hooks required)
- Catches all file changes (commits, manual edits, merges)

**Dependencies:** None

**Risk:** Low - Pure logic, well-testable

---

#### Step A6.2: Implement Auto-Rebuild in Storage Adapter
**Time:** 1 hour  
**Files:** `lib/context/auto-index.js` (create), `lib/context/json-storage.js` (modify)

**Action:** Create AutoIndexer class and integrate with JSONStorage

**Implementation:**

**1. Create AutoIndexer:**
```javascript
// lib/context/auto-index.js
import fs from 'fs/promises';
import { glob } from 'glob';
import logger from '../logger.js';

export class AutoIndexer {
  constructor(targetDir = process.cwd()) {
    this.targetDir = targetDir;
  }

  /**
   * Ensure index is fresh, rebuild if stale
   * @returns {boolean} true if rebuilt, false if was already fresh
   */
  async ensureFreshIndex(storage, options = {}) {
    const { force = false, verbose = true } = options;

    if (force) {
      if (verbose) logger.info('Force rebuilding index...');
      await storage.rebuildIndex();
      if (verbose) logger.success('Index rebuilt successfully');
      return true;
    }

    const stale = await this.isIndexStale(storage);

    if (stale) {
      if (verbose) {
        logger.warn('⚠️  Index is stale (files changed since last rebuild)');
        logger.info('🔄 Rebuilding index automatically...');
      }
      
      const startTime = Date.now();
      await storage.rebuildIndex();
      const duration = Date.now() - startTime;
      
      if (verbose) {
        logger.success(`✅ Index rebuilt in ${duration}ms`);
      }
      return true;
    }

    return false;
  }

  async isIndexStale(storage) {
    try {
      const indexPath = storage.getIndexPath();
      const indexStat = await fs.stat(indexPath);
      const indexMtime = indexStat.mtime;

      // Check all source directories
      const sourceDirs = [
        '.aiknowsys/plans/',
        '.aiknowsys/sessions/',
        '.aiknowsys/learned/',
        'personal/' // Personal patterns (if exists)
      ].map(dir => `${this.targetDir}/${dir}`);

      for (const dir of sourceDirs) {
        try {
          const files = await glob(`${dir}**/*.md`, { posix: true });
          
          for (const file of files) {
            const fileStat = await fs.stat(file);
            if (fileStat.mtime > indexMtime) {
              return true; // Found newer file
            }
          }
        } catch (err) {
          // Directory doesn't exist, skip
          if (err.code !== 'ENOENT') throw err;
        }
      }

      return false; // All files older than or equal to index
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Index doesn't exist, definitely stale
        return true;
      }
      throw err;
    }
  }
}
```

**2. Modify JSONStorage:**
```javascript
// lib/context/json-storage.js
import { AutoIndexer } from './auto-index.js';

export class JSONStorage extends StorageAdapter {
  constructor(targetDir = process.cwd()) {
    super(targetDir);
    this.autoIndexer = new AutoIndexer(targetDir);
  }

  // Add helper method
  getIndexPath() {
    return `${this.targetDir}/.aiknowsys/context-index.json`;
  }

  // Modify query methods to auto-rebuild
  async queryPlans(filters = {}) {
    await this.autoIndexer.ensureFreshIndex(this, { verbose: false }); // Silent rebuild
    // ... existing query logic
  }

  async querySessions(filters = {}) {
    await this.autoIndexer.ensureFreshIndex(this, { verbose: false });
    // ... existing query logic
  }

  async search(query, scope = 'all') {
    await this.autoIndexer.ensureFreshIndex(this, { verbose: false });
    // ... existing search logic
  }
}
```

**Why Silent Rebuild:**
- Commands handle their own logging
- Auto-rebuild is transparent to user
- Verbose mode available via config if needed

**Testing:**
```javascript
// test/context/auto-index.test.js
describe('AutoIndexer Integration', () => {
  let storage;
  let autoIndexer;

  beforeEach(async () => {
    storage = new JSONStorage('./test-fixtures');
    autoIndexer = storage.autoIndexer;
  });

  it('auto-rebuilds when querying with stale index', async () => {
    // Create initial index
    await storage.rebuildIndex();
    
    // Add new session file
    await fs.writeFile('.aiknowsys/sessions/2026-02-07-new.md', 
      '# Session: Test (Feb 7, 2026)\n\n## Goal\nTest auto-rebuild'
    );
    
    // Query should auto-rebuild
    const results = await storage.querySessions({ days: 1 });
    
    // Should find new session
    expect(results.sessions.some(s => s.file.includes('2026-02-07-new'))).toBe(true);
  });

  it('does not rebuild when index is fresh', async () => {
    await storage.rebuildIndex();
    
    const spy = vi.spyOn(storage, 'rebuildIndex');
    
    // Query with fresh index
    await storage.queryPlans();
    
    // Should not rebuild
    expect(spy).not.toHaveBeenCalled();
  });
});
```

**Dependencies:** Step A6.1 complete

**Risk:** Low - Isolated change, backward compatible

---

#### Step A6.3: Add Config Option for Auto-Rebuild
**Time:** 30 minutes  
**Files:** `lib/context/config.js` (create), `.aiknowsys/.aiknowsys.config.json` (template)

**Action:** Allow users to disable auto-rebuild if needed

**Config Schema:**
```json
{
  "context": {
    "autoRebuild": {
      "enabled": true,
      "verbose": false,
      "maxRebuildTime": 5000
    }
  }
}
```

**Implementation:**
```javascript
// lib/context/config.js
import fs from 'fs/promises';

export async function loadContextConfig(targetDir = process.cwd()) {
  const configPath = `${targetDir}/.aiknowsys/.aiknowsys.config.json`;
  
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    return config.context || getDefaultConfig();
  } catch (err) {
    if (err.code === 'ENOENT') {
      return getDefaultConfig();
    }
    throw err;
  }
}

function getDefaultConfig() {
  return {
    autoRebuild: {
      enabled: true,
      verbose: false,
      maxRebuildTime: 5000 // milliseconds
    }
  };
}
```

**Update AutoIndexer:**
```javascript
async ensureFreshIndex(storage, options = {}) {
  const config = await loadContextConfig(this.targetDir);
  
  // Allow options to override config
  const enabled = options.enabled ?? config.autoRebuild.enabled;
  const verbose = options.verbose ?? config.autoRebuild.verbose;
  
  if (!enabled) {
    return false; // Auto-rebuild disabled
  }
  
  // ... rest of implementation
}
```

**Why This Matters:**
- Power users can disable for manual control
- Verbose mode for debugging
- Timeout prevents infinite rebuilds on very large repos

**Dependencies:** Step A6.2 complete

**Risk:** Low - Config is optional

---

#### Step A6.4: Add Git Hooks (Optional Optimization)
**Time:** 30 minutes  
**Files:** `.github/hooks/post-commit`, `.github/hooks/post-merge`, `scripts/install-context-hooks.js`

**Action:** Auto-rebuild index after git operations (eliminates query latency)

**Git Hooks:**
```bash
#!/bin/bash
# .github/hooks/post-commit

# Only rebuild if context files changed in this commit
if git diff --name-only HEAD~1 HEAD | grep -q '^\.aiknowsys/\(plans\|sessions\|learned\)/'; then
  echo "📋 Context files changed, rebuilding index..."
  npx aiknowsys rebuild-index --quiet
  echo "✅ Index updated"
fi
```

```bash
#!/bin/bash
# .github/hooks/post-merge

# Rebuild index after merges (team data synced)
if git diff --name-only HEAD@{1} HEAD | grep -q '^\.aiknowsys/'; then
  echo "🔄 Context files merged, rebuilding index..."
  npx aiknowsys rebuild-index --quiet
  echo "✅ Index updated"
fi
```

**Installation Script:**
```javascript
// scripts/install-context-hooks.js
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function installHooks() {
  const hooks = ['post-commit', 'post-merge'];
  
  for (const hook of hooks) {
    const source = `.github/hooks/${hook}`;
    const dest = `.git/hooks/${hook}`;
    
    // Copy hook
    await fs.copyFile(source, dest);
    
    // Make executable
    await fs.chmod(dest, 0o755);
    
    console.log(`✅ Installed ${hook} hook`);
  }
}

installHooks().catch(console.error);
```

**Add to package.json:**
```json
{
  "scripts": {
    "postinstall": "node scripts/install-context-hooks.js || true"
  }
}
```

**Why Optional:**
- Lazy rebuild works without hooks (baseline)
- Hooks eliminate query latency (optimization)
- Auto-installs on `npm install` (convenience)
- Failing hook install doesn't break setup (|| true)

**Dependencies:** Step A6.2 complete

**Risk:** Low - Optional feature, graceful fallback

---

#### Step A6.5: Update Documentation
**Time:** 30 minutes  
**Files:** `CODEBASE_ESSENTIALS.md`, `.github/skills/context-query/SKILL.md`, `README.md`

**Action:** Document auto-rebuild behavior

**CODEBASE_ESSENTIALS.md Section 4b:**
```markdown
### Context Query System Workflow

**Auto-Indexing (Transparent):**
- Index auto-rebuilds when stale (files newer than index)
- Happens before query execution (transparent to user)
- Typically <500ms overhead on stale index
- Git hooks can eliminate overhead (optional)

**Manual File Creation (Supported):**
```bash
# Still works! Auto-rebuild handles it
vim .aiknowsys/sessions/2026-02-07-session.md

# Query immediately works (auto-rebuilds if needed)
npx aiknowsys query-sessions --days 1
# → ⚠️  Index is stale (files changed since last rebuild)
# → 🔄 Rebuilding index automatically...
# → ✅ Index rebuilt in 234ms
# → [Returns results including new session]
```

**Disable Auto-Rebuild (Power Users):**
```json
// .aiknowsys/.aiknowsys.config.json
{
  "context": {
    "autoRebuild": {
      "enabled": false  // Requires manual rebuild-index
    }
  }
}
```
```

**context-query skill update:**
```markdown
## Auto-Indexing (Transparent)

The context query system automatically detects when the index is stale and rebuilds it before returning results.

**What This Means:**
- You can still create/edit files manually
- Queries always return up-to-date results
- No manual `rebuild-index` needed (unless auto-rebuild disabled)

**When Rebuild Happens:**
- When any .md file in plans/sessions/learned/ is newer than index
- Before executing query-plans, query-sessions, or search-context
- Typically <500ms overhead (one-time cost per query session)

**Performance Optimization:**
- Install git hooks: `node scripts/install-context-hooks.js`
- Index rebuilds after commits/merges (zero query latency)
```

**Dependencies:** Steps A6.1-A6.4 complete

**Risk:** Low - Documentation only

---

### ✅ Phase A.6 Complete - Testing & Validation

**Before declaring Phase A.6 complete:**

1. **Run Full Test Suite:**
   ```bash
   npm test
   # Expect: 737 + ~15 new tests = ~752 passing
   ```

2. **Manual Workflow Validation:**
   ```bash
   # Test 1: Manual file creation
   echo "# Session: Test (Feb 7, 2026)" > .aiknowsys/sessions/2026-02-07-test.md
   npx aiknowsys query-sessions --days 1 --json
   # Should auto-rebuild and find new session
   
   # Test 2: Git hooks (if installed)
   git add .aiknowsys/sessions/2026-02-07-test.md
   git commit -m "Test session"
   # Should see: "📋 Context files changed, rebuilding index..."
   npx aiknowsys query-sessions --days 1 --json
   # Should return instantly (no rebuild needed)
   
   # Test 3: Disable auto-rebuild
   echo '{"context":{"autoRebuild":{"enabled":false}}}' > .aiknowsys/.aiknowsys.config.json
   echo "# New" > .aiknowsys/sessions/2026-02-07-test2.md
   npx aiknowsys query-sessions --days 1 --json
   # Should NOT find test2 (auto-rebuild disabled)
   npx aiknowsys rebuild-index
   npx aiknowsys query-sessions --days 1 --json
   # Should NOW find test2 (manual rebuild)
   ```

3. **Performance Check:**
   ```bash
   # Measure rebuild time
   time npx aiknowsys rebuild-index
   # Should be <1 second for <1000 files
   ```

4. **Update Changelog:**
   ```markdown
   ## Session: Context Query Completion - Phase A.6 (Feb 7, 2026)
   
   **Goal:** Fix index staleness issue with auto-rebuild
   
   **Changes:**
   - [lib/context/auto-index.js](lib/context/auto-index.js): AutoIndexer class
   - [lib/context/json-storage.js](lib/context/json-storage.js#L45): Integrated auto-rebuild
   - [.github/hooks/post-commit](.github/hooks/post-commit): Git hook for auto-rebuild
   - [.github/hooks/post-merge](.github/hooks/post-merge): Git hook for merges
   
   **Validation:**
   - ✅ 752/752 tests passing (15 new auto-index tests)
   - ✅ Manual file creation + query works (auto-rebuilds)
   - ✅ Git hooks rebuild index after commits (<1s)
   - ✅ Config option to disable verified
   
   **Key Learning:** Phase A.6 makes Phase A usable. Query system now reliable for daily workflows.
   ```

**Success Criteria:**
- [ ] All tests passing (including new auto-index tests)
- [ ] Manual file creation → query → works (auto-rebuild)
- [ ] Git hooks installed and functional
- [ ] Config option to disable works
- [ ] Documentation updated in ESSENTIALS + skill
- [ ] Changelog entry added

---

---

### 🚀 Phase B Mini: Mutation Commands (3-4 hours) - FUTURE-PROOF

**Goal:** Enable command-first workflow with schema validation and atomic updates

**Why This Phase:**
- Phase A.6 makes current workflows work
- Phase B enables better workflows (AI uses commands, not file editing)
- Commands enforce schema (YAML frontmatter validation)
- Atomic updates (file + index in one operation)

---

#### Step B.1: Design Session Schema & Templates
**Time:** 30 minutes  
**Files:** `lib/templates/session-template.js`

**Action:** Define session file schema with YAML frontmatter

**Session Schema:**
```yaml
---
date: "2026-02-07"          # ISO date (YYYY-MM-DD)
topics: [TDD, validation]   # Array of strings
plan: PLAN_context_query    # Optional: Link to active plan
author: arno-paffen         # Username (auto-detected)
files: []                   # Array of files touched (auto-populated via update-session)
status: in-progress         # in-progress | complete | abandoned
---

# Session: [Title] (Feb 7, 2026)

## Goal
[Brief description of session goal]

## Changes
[Log of changes made]

## Notes for Next Session
[What to continue/remember]
```

**Template Generator:**
```javascript
// lib/templates/session-template.js
import yaml from 'js-yaml';

export function generateSessionTemplate(metadata = {}) {
  const {
    date = new Date().toISOString().split('T')[0],
    topics = [],
    plan = null,
    author = detectUsername(),
    files = [],
    status = 'in-progress',
    title = 'Work Session'
  } = metadata;

  const frontmatter = {
    date,
    topics,
    ...(plan && { plan }),
    author,
    files,
    status
  };

  const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 });
  const dateFormatted = formatDate(new Date(date));

  return `---
${yamlStr}---

# Session: ${title} (${dateFormatted})

## Goal
[Describe what you're trying to accomplish this session]

## Changes
[Document changes as you make them]

## Notes for Next Session
[Important context to remember]
`;
}

function detectUsername() {
  // Try git config
  const gitUser = execSync('git config user.name', { encoding: 'utf-8' }).trim();
  if (gitUser) return gitUser.toLowerCase().replace(/\s+/g, '-');
  
  // Fallback to system username
  return process.env.USER || process.env.USERNAME || 'unknown';
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}
```

**Why YAML Frontmatter:**
- Standard format (Jekyll, Hugo, etc.)
- Easy parsing (js-yaml library)
- Schema validation built-in
- Human-readable and editable
- AI can extract/modify metadata easily

**Testing:**
```javascript
describe('Session Template', () => {
  it('generates valid YAML frontmatter', () => {
    const template = generateSessionTemplate({
      topics: ['TDD', 'validation'],
      plan: 'PLAN_xyz',
      title: 'Bug Fix Session'
    });
    
    expect(template).toMatch(/^---\n/);
    expect(template).toContain('topics: [TDD, validation]');
    expect(template).toContain('plan: PLAN_xyz');
    expect(template).toContain('# Session: Bug Fix Session');
  });

  it('auto-detects author from git config', () => {
    const template = generateSessionTemplate({});
    const parsed = yaml.load(template.split('---')[1]);
    expect(parsed.author).toBeTruthy();
  });
});
```

**Dependencies:** None (pure logic)

**Risk:** Low - Template generation only

---

#### Step B.2: Implement `create-session` Command
**Time:** 1 hour  
**Files:** `lib/commands/create-session.js`, `bin/cli.js`

**Action:** Create command that generates session file + updates index

**Implementation:**
```javascript
// lib/commands/create-session.js
import fs from 'fs/promises';
import { generateSessionTemplate } from '../templates/session-template.js';
import { JSONStorage } from '../context/json-storage.js';
import logger from '../logger.js';

export async function createSession(options = {}) {
  const {
    topics = [],
    plan = null,
    title = 'Work Session',
    json = false,
    targetDir = process.cwd()
  } = options;

  // Generate filename
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-session.md`;
  const filepath = `${targetDir}/.aiknowsys/sessions/${filename}`;

  // Check if session already exists
  const exists = await fs.access(filepath).then(() => true).catch(() => false);
  
  if (exists) {
    if (!json) {
      logger.info(`Session file already exists: ${filename}`);
      logger.info('Use update-session to modify metadata');
    }
    return {
      filePath: filepath,
      created: false,
      message: 'Session already exists'
    };
  }

  // Generate session content
  const content = generateSessionTemplate({
    topics,
    plan,
    title,
    date
  });

  // Write file
  await fs.mkdir(`${targetDir}/.aiknowsys/sessions`, { recursive: true });
  await fs.writeFile(filepath, content, 'utf-8');

  // Update index
  const storage = new JSONStorage(targetDir);
  await storage.rebuildIndex(); // Re-index to include new session

  // Log success
  if (json) {
    console.log(JSON.stringify({
      filePath: filepath,
      created: true,
      metadata: { date, topics, plan, title }
    }, null, 2));
  } else {
    logger.success(`✅ Created session: ${filename}`);
    logger.info(`📄 File: ${filepath}`);
    logger.info(`📝 Edit session content in the file`);
  }

  return {
    filePath: filepath,
    created: true,
    metadata: { date, topics, plan, title }
  };
}
```

**CLI Integration:**
```javascript
// bin/cli.js
import { Command } from 'commander';
import { createSession } from '../lib/commands/create-session.js';

program
  .command('create-session')
  .description('Create a new session file with YAML frontmatter')
  .option('--topics <topics>', 'Comma-separated topics (e.g., "TDD,validation")')
  .option('--plan <plan>', 'Link to active plan (e.g., PLAN_xyz)')
  .option('--title <title>', 'Session title', 'Work Session')
  .option('--json', 'Output JSON')
  .action(async (options) => {
    const topics = options.topics ? options.topics.split(',').map(t => t.trim()) : [];
    await createSession({ ...options, topics });
  });
```

**Usage Example:**
```bash
# Create session with topics
npx aiknowsys create-session --topics "TDD,validation" --plan PLAN_xyz

# Create with title
npx aiknowsys create-session --title "Bug Fix" --topics "debugging"

# JSON output (for AI agents)
npx aiknowsys create-session --topics "refactor" --json
```

**Testing:**
```javascript
describe('create-session', () => {
  it('creates session file with YAML frontmatter', async () => {
    const result = await createSession({
      topics: ['TDD', 'validation'],
      plan: 'PLAN_xyz',
      title: 'Test Session'
    });

    expect(result.created).toBe(true);
    expect(result.filePath).toMatch(/2026-02-07-session\.md$/);

    const content = await fs.readFile(result.filePath, 'utf-8');
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('topics: [TDD, validation]');
    expect(content).toContain('# Session: Test Session');
  });

  it('updates index after creating session', async () => {
    await createSession({ topics: ['test'] });

    const storage = new JSONStorage();
    const { sessions } = await storage.querySessions({ days: 1 });

    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0].topics).toContain('test');
  });

  it('returns existing session if already created today', async () => {
    await createSession({ topics: ['first'] });
    const result = await createSession({ topics: ['second'] });

    expect(result.created).toBe(false);
    expect(result.message).toContain('already exists');
  });
});
```

**Dependencies:** Step B.1 complete

**Risk:** Low - Well-scoped command

---

#### Step B.3: Implement `update-session` Command
**Time:** 1 hour  
**Files:** `lib/commands/update-session.js`, `lib/utils/yaml-frontmatter.js`

**Action:** Modify session YAML frontmatter without rewriting entire file

**YAML Frontmatter Utility:**
```javascript
// lib/utils/yaml-frontmatter.js
import yaml from 'js-yaml';

/**
 * Parse YAML frontmatter from markdown file
 * @returns { frontmatter: Object, content: string }
 */
export function parseFrontmatter(fileContent) {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!match) {
    throw new Error('No YAML frontmatter found');
  }

  const [, yamlStr, content] = match;
  const frontmatter = yaml.load(yamlStr);

  return { frontmatter, content };
}

/**
 * Update frontmatter and regenerate file
 */
export function updateFrontmatter(fileContent, updates) {
  const { frontmatter, content } = parseFrontmatter(fileContent);

  // Merge updates
  const newFrontmatter = { ...frontmatter, ...updates };

  // Regenerate
  const yamlStr = yaml.dump(newFrontmatter, { lineWidth: -1 });
  return `---\n${yamlStr}---\n${content}`;
}
```

**update-session Command:**
```javascript
// lib/commands/update-session.js
import fs from 'fs/promises';
import { parseFrontmatter, updateFrontmatter } from '../utils/yaml-frontmatter.js';
import { JSONStorage } from '../context/json-storage.js';
import logger from '../logger.js';

export async function updateSession(options = {}) {
  const {
    addTopic = null,
    addFile = null,
    setStatus = null,
    json = false,
    targetDir = process.cwd()
  } = options;

  // Find today's session
  const date = new Date().toISOString().split('T')[0];
  const filepath = `${targetDir}/.aiknowsys/sessions/${date}-session.md`;

  // Check if session exists
  const exists = await fs.access(filepath).then(() => true).catch(() => false);
  if (!exists) {
    throw new Error(`No session file found for today (${date}). Create one first with: create-session`);
  }

  // Read current content
  const content = await fs.readFile(filepath, 'utf-8');
  const { frontmatter } = parseFrontmatter(content);

  // Apply updates
  const updates = {};

  if (addTopic) {
    const topics = frontmatter.topics || [];
    if (!topics.includes(addTopic)) {
      updates.topics = [...topics, addTopic];
    }
  }

  if (addFile) {
    const files = frontmatter.files || [];
    if (!files.includes(addFile)) {
      updates.files = [...files, addFile];
    }
  }

  if (setStatus) {
    const validStatuses = ['in-progress', 'complete', 'abandoned'];
    if (!validStatuses.includes(setStatus)) {
      throw new Error(`Invalid status: ${setStatus}. Valid: ${validStatuses.join(', ')}`);
    }
    updates.status = setStatus;
  }

  // Update file
  const newContent = updateFrontmatter(content, updates);
  await fs.writeFile(filepath, newContent, 'utf-8');

  // Rebuild index
  const storage = new JSONStorage(targetDir);
  await storage.rebuildIndex();

  // Output
  if (json) {
    console.log(JSON.stringify({
      filePath: filepath,
      updated: true,
      changes: updates
    }, null, 2));
  } else {
    logger.success(`✅ Updated session metadata`);
    if (updates.topics) logger.info(`  Topics: ${updates.topics.join(', ')}`);
    if (updates.files) logger.info(`  Files: ${updates.files.join(', ')}`);
    if (updates.status) logger.info(`  Status: ${updates.status}`);
  }

  return { filePath: filepath, updated: true, changes: updates };
}
```

**CLI Integration:**
```javascript
program
  .command('update-session')
  .description('Update today\'s session metadata')
  .option('--add-topic <topic>', 'Add topic to session')
  .option('--add-file <file>', 'Add file to session')
  .option('--set-status <status>', 'Set session status (in-progress|complete|abandoned)')
  .option('--json', 'Output JSON')
  .action(updateSession);
```

**Usage:**
```bash
# Add topic
npx aiknowsys update-session --add-topic "TypeScript"

# Add file
npx aiknowsys update-session --add-file "lib/init.js"

# Mark complete
npx aiknowsys update-session --set-status complete

# Multiple updates (chained)
npx aiknowsys update-session \
  --add-topic "debugging" \
  --add-file "lib/context/auto-index.js" \
  --set-status complete
```

**Testing:**
```javascript
describe('update-session', () => {
  it('adds topic to existing session', async () => {
    await createSession({ topics: ['TDD'] });
    await updateSession({ addTopic: 'validation' });

    const content = await fs.readFile('.aiknowsys/sessions/2026-02-07-session.md', 'utf-8');
    const { frontmatter } = parseFrontmatter(content);

    expect(frontmatter.topics).toEqual(['TDD', 'validation']);
  });

  it('does not duplicate topics', async () => {
    await createSession({ topics: ['TDD'] });
    await updateSession({ addTopic: 'TDD' });

    const content = await fs.readFile('.aiknowsys/sessions/2026-02-07-session.md', 'utf-8');
    const { frontmatter } = parseFrontmatter(content);

    expect(frontmatter.topics).toEqual(['TDD']); // No duplicate
  });

  it('validates status enum', async () => {
    await createSession({});
    
    await expect(
      updateSession({ setStatus: 'invalid' })
    ).rejects.toThrow('Invalid status');
  });
});
```

**Dependencies:** Steps B.1, B.2 complete

**Risk:** Low - Atomic file operations

---

#### Step B.4: Implement `create-plan` Command
**Time:** 1-1.5 hours  
**Files:** `lib/commands/create-plan.js`, `lib/templates/plan-template.js`

**Action:** Generate plan file + update pointers

**Plan Template:**
```javascript
// lib/templates/plan-template.js
export function generatePlanTemplate(metadata = {}) {
  const {
    title,
    author,
    date = new Date().toISOString().split('T')[0],
    goal = '[One sentence goal]'
  } = metadata;

  const dateFormatted = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return `# Implementation Plan: ${title}

**Status:** 🎯 ACTIVE  
**Created:** ${date}  
**Author:** ${author}  
**Goal:** ${goal}

---

## Overview

[2-3 sentence summary of what we're building and why]

## Requirements

### Functional Requirements
- FR-1: [Requirement description]

### Non-Functional Requirements
- Performance: [Target metrics]
- Compatibility: [Platform requirements]

## Architecture Changes

### New Files
\`\`\`
[Tree structure of new files]
\`\`\`

### Modified Files
- [file/path.js](file/path.js) - [What changes and why]

## Implementation Steps

### Phase 1: [Phase Name] (X-Y hours)

#### Step 1: [Step Name]
**Time:** X hours  
**Files:** \`path/to/file.js\`

**Action:** [Specific action to take]

**Why:** [Reason for this step]

**Testing:**
\`\`\`javascript
describe('[component]', () => {
  it('[test case]', () => {
    // Test implementation
  });
});
\`\`\`

**Dependencies:** None

**Risk:** Low

---

## Testing Strategy

**Test Coverage:**
- Unit tests: [files to test]
- Integration tests: [flows to test]

## Success Criteria

- [ ] All tests passing
- [ ] Validation commands pass
- [ ] Documentation updated

---

*Part of AIKnowSys implementation workflow.*
`;
}
```

**create-plan Command:**
```javascript
// lib/commands/create-plan.js
import fs from 'fs/promises';
import { generatePlanTemplate } from '../templates/plan-template.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../logger.js';

const execAsync = promisify(exec);

export async function createPlan(options = {}) {
  const {
    title,
    author = await detectUsername(),
    goal = '[Define goal before implementing]',
    json = false,
    targetDir = process.cwd()
  } = options;

  if (!title) {
    throw new Error('Plan title is required. Use: create-plan "Title" --author username');
  }

  // Generate plan ID
  const planId = `PLAN_${title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
  const filename = `${planId}.md`;
  const filepath = `${targetDir}/.aiknowsys/${filename}`;

  // Check if plan exists
  const exists = await fs.access(filepath).then(() => true).catch(() => false);
  if (exists) {
    throw new Error(`Plan already exists: ${filename}`);
  }

  // Generate plan content
  const content = generatePlanTemplate({ title, author, goal });

  // Write plan file
  await fs.writeFile(filepath, content, 'utf-8');

  // Update active plan pointer
  const pointerPath = `${targetDir}/.aiknowsys/plans/active-${author}.md`;
  const pointerContent = `# Active Plan: ${author}

**Plan:** [${title}](../${filename})  
**Status:** 🎯 ACTIVE  
**Started:** ${new Date().toISOString().split('T')[0]}

---

## Progress

[Update as you work through the plan]

---

*Auto-generated by create-plan command*
`;

  await fs.mkdir(`${targetDir}/.aiknowsys/plans`, { recursive: true });
  await fs.writeFile(pointerPath, pointerContent, 'utf-8');

  // Run sync-plans to update CURRENT_PLAN.md
  try {
    await execAsync('npx aiknowsys sync-plans', { cwd: targetDir });
  } catch (err) {
    logger.warn('⚠️  Could not sync plans (run manually: npx aiknowsys sync-plans)');
  }

  // Output
  if (json) {
    console.log(JSON.stringify({
      planId,
      filePath: filepath,
      pointerPath,
      created: true
    }, null, 2));
  } else {
    logger.success(`✅ Created plan: ${planId}`);
    logger.info(`📄 Plan file: ${filepath}`);
    logger.info(`🔗 Pointer: ${pointerPath}`);
    logger.info(`📝 Edit plan to add implementation steps`);
  }

  return { planId, filePath: filepath, created: true };
}

async function detectUsername() {
  try {
    const { stdout } = await execAsync('git config user.name');
    return stdout.trim().toLowerCase().replace(/\s+/g, '-');
  } catch {
    return process.env.USER || process.env.USERNAME || 'unknown';
  }
}
```

**CLI Integration:**
```javascript
program
  .command('create-plan <title>')
  .description('Create a new implementation plan')
  .option('--author <author>', 'Plan author (auto-detected from git)')
  .option('--goal <goal>', 'One-sentence goal')
  .option('--json', 'Output JSON')
  .action(createPlan);
```

**Usage:**
```bash
# Create plan
npx aiknowsys create-plan "Feature X Implementation"

# With goal
npx aiknowsys create-plan "Auth System" --goal "Add JWT authentication"

# JSON output
npx aiknowsys create-plan "Bug Fix" --json
```

**Testing:**
```javascript
describe('create-plan', () => {
  it('creates plan file and pointer', async () => {
    const result = await createPlan({
      title: 'Test Feature',
      author: 'test-user',
      goal: 'Test goal'
    });

    expect(result.planId).toBe('PLAN_test_feature');
    expect(await fs.access(result.filePath)).resolves;

    const content = await fs.readFile(result.filePath, 'utf-8');
    expect(content).toContain('# Implementation Plan: Test Feature');
    expect(content).toContain('**Author:** test-user');
  });

  it('updates active plan pointer', async () => {
    await createPlan({ title: 'Test', author: 'test-user' });

    const pointerPath = '.aiknowsys/plans/active-test-user.md';
    const pointer = await fs.readFile(pointerPath, 'utf-8');

    expect(pointer).toContain('**Plan:** [Test](../PLAN_test.md)');
    expect(pointer).toContain('🎯 ACTIVE');
  });
});
```

**Dependencies:** Step B.1 complete (template pattern)

**Risk:** Low - Similar to create-session

---

#### Step B.5: Update Skills & Documentation
**Time:** 30 minutes  
**Files:** `.github/skills/context-query/SKILL.md`, `CODEBASE_ESSENTIALS.md`

**Action:** Document mutation commands for AI agents

**context-query skill addition:**
```markdown
## Mutation Commands (Command-First Workflow)

### Create New Session

**When to use:** Starting work on a new topic or feature

```bash
# Create session with topics
npx aiknowsys create-session --topics "TDD,validation" --plan PLAN_xyz --json
```

**Benefits:**
- Automatic YAML frontmatter (no manual placeholder filling)
- Index updated automatically
- Schema validation (can't create invalid session)

**JSON Output:**
```json
{
  "filePath": ".aiknowsys/sessions/2026-02-07-session.md",
  "created": true,
  "metadata": {
    "date": "2026-02-07",
    "topics": ["TDD", "validation"],
    "plan": "PLAN_xyz",
    "title": "Work Session"
  }
}
```

**AI Workflow:**
```bash
# 1. Create session
npx aiknowsys create-session --topics "bug-fix" --json

# 2. Edit content (use file path from JSON response)
# Edit the "## Changes" section to log work

# 3. Update metadata as you work
npx aiknowsys update-session --add-file "lib/init.js"
npx aiknowsys update-session --add-topic "TypeScript"

# 4. Mark complete when done
npx aiknowsys update-session --set-status complete
```

### Update Existing Session

**When to use:** Adding files, topics, or changing status

```bash
# Add topic
npx aiknowsys update-session --add-topic "debugging" --json

# Add file
npx aiknowsys update-session --add-file "lib/context/auto-index.js" --json

# Mark complete
npx aiknowsys update-session --set-status complete --json

# Chain multiple updates
npx aiknowsys update-session \
  --add-topic "performance" \
  --add-file "lib/optimizations.js" \
  --set-status in-progress \
  --json
```

### Create New Plan

**When to use:** Starting new feature or major work

```bash
# Create plan
npx aiknowsys create-plan "Authentication System" \
  --goal "Add JWT-based auth" \
  --json
```

**Returns plan ID and file path for editing**

## Decision Tree: Manual vs Command-First

```
Starting new session?
  ├─ Quick note → Manual: vim .aiknowsys/sessions/YYYY-MM-DD-session.md
  └─ Structured work → Command: create-session --topics "X,Y"

Updating session metadata?
  ├─ Adding content → Manual: Edit session.md directly
  └─ Adding topics/files → Command: update-session --add-topic "X"

Creating new plan?
  └─ Always use command → create-plan "Title" --goal "..."
```

**Best Practice:** Use commands for metadata, manual editing for content.
```

**CODEBASE_ESSENTIALS.md update:**
```markdown
### 4b. Context Query System (Added v0.10.0)

**Two Workflows Supported:**

**1. Command-First (Recommended for AI):**
```bash
# Create session
npx aiknowsys create-session --topics "feature-x" --plan PLAN_xyz

# Work in session (edit content)
vim .aiknowsys/sessions/2026-02-07-session.md

# Update metadata
npx aiknowsys update-session --add-file "lib/new.js" --set-status complete
```

**Benefits:** Schema validation, automatic indexing, structured data

**2. Manual Files (Supported for humans):**
```bash
# Create session manually
vim .aiknowsys/sessions/2026-02-07-session.md

# Query still works (auto-rebuild)
npx aiknowsys query-sessions --days 1
```

**Benefits:** Quick notes, familiar workflow, no commands needed

**Both workflows work**. Commands enforce schema, manual editing is flexible.
```

**Dependencies:** Steps B.2-B.4 complete

**Risk:** Low - Documentation only

---

### ✅ Phase B Mini Complete - Testing & Validation

**Before declaring Phase B Mini complete:**

1. **Run Full Test Suite:**
   ```bash
   npm test
   # Expect: 752 + ~20 new tests = ~772 passing
   ```

2. **Manual Workflow Validation:**
   ```bash
   # Test command-first workflow
   npx aiknowsys create-session --topics "test" --json
   npx aiknowsys update-session --add-topic "validation"
   npx aiknowsys query-sessions --days 1 --json
   # Should find session with both topics
   
   # Test create-plan
   npx aiknowsys create-plan "Test Plan" --goal "Test mutation commands"
   npx aiknowsys query-plans --status ACTIVE --json
   # Should find new plan
   
   # Verify YAML frontmatter
   cat .aiknowsys/sessions/2026-02-07-session.md
   # Should have valid YAML frontmatter
   ```

3. **Schema Validation:**
   ```bash
   # Test invalid status
   npx aiknowsys update-session --set-status invalid
   # Should error with helpful message
   ```

4. **Update Changelog:**
   ```markdown
   ## Session: Context Query Completion - Phase B Mini (Feb 7, 2026)
   
   **Goal:** Enable command-first workflow with mutation commands
   
   **Changes:**
   - [lib/commands/create-session.js](lib/commands/create-session.js): Generate session files
   - [lib/commands/update-session.js](lib/commands/update-session.js): Modify session metadata
   - [lib/commands/create-plan.js](lib/commands/create-plan.js): Generate plan files
   - [lib/templates/session-template.js](lib/templates/session-template.js): Session YAML template
   - [lib/utils/yaml-frontmatter.js](lib/utils/yaml-frontmatter.js): YAML parsing/updating
   
   **Validation:**
   - ✅ 772/772 tests passing (20 new mutation command tests)
   - ✅ create-session generates valid YAML frontmatter
   - ✅ update-session modifies metadata + updates index
   - ✅ create-plan generates plan + updates pointers
   - ✅ Schema validation working (rejects invalid status)
   
   **Key Learning:** Command-first workflow enables schema validation. Both manual and command workflows now supported.
   ```

**Success Criteria:**
- [ ] All tests passing (including mutation command tests)
- [ ] create-session generates valid sessions
- [ ] update-session modifies YAML frontmatter
- [ ] create-plan generates plans + pointers
- [ ] Schema validation working
- [ ] Documentation updated in ESSENTIALS + skill
- [ ] Changelog entry added

---

---

## Timeline Estimate

| Phase | Hours | Tasks | Milestone |
|-------|-------|-------|----------|
| **Phase A.6: Auto-Indexing** | **2-3** | Steps A6.1-A6.5 | **System becomes usable** |
| **Phase B Mini: Mutation Commands** | **3-4** | Steps B.1-B.5 | **Command-first workflow enabled** |
| **Total** | **5-7 hours** | **10 steps** | **2 decision points** |

### Decision Points

**After Phase A.6 (2-3 hours in):**
1. Does auto-rebuild solve the staleness problem?
2. Are queries now reliable for daily use?
3. **If YES:** Continue to Phase B Mini
4. **If NO:** Debug auto-rebuild, extend if needed

**After Phase B Mini (5-7 hours in):**
1. Do mutation commands improve workflow?
2. Is schema validation catching errors?
3. Are AI agents using commands vs manual files?
4. **If YES:** Ship v0.10.0 with full feature
5. **If NO:** Document lessons, consider alternatives

---

## Testing Strategy

### Test Coverage Targets

**Phase A.6: Auto-Indexing**
- Unit tests: AutoIndexer class (staleness detection, rebuild logic)
- Integration tests: Query commands with auto-rebuild
- Performance tests: Rebuild time for various dataset sizes
- Config tests: Enable/disable auto-rebuild

**Phase B Mini: Mutation Commands**
- Unit tests: Template generation, YAML parsing
- Integration tests: create-session + query-sessions
- Integration tests: create-plan + query-plans
- Validation tests: Schema enforcement (invalid status, etc.)
- Edge cases: Existing files, missing directories, concurrent operations

### TDD Workflow

**RED-GREEN-REFACTOR for each step:**

1. **RED:** Write failing test first
   ```javascript
   it('auto-rebuilds stale index before query', async () => {
     // Test will fail until auto-rebuild implemented
   });
   ```

2. **GREEN:** Implement minimal code to pass
   ```javascript
   // Add auto-rebuild logic
   ```

3. **REFACTOR:** Clean up while keeping tests green
   ```javascript
   // Extract methods, improve naming, etc.
   ```

### Validation Commands

**After each phase:**
```bash
# Full test suite
npm test

# Type checking
npm run typecheck

# Manual validation
npm run validate-deliverables

# CLI smoke tests
node bin/cli.js --help
node bin/cli.js query-sessions --help
node bin/cli.js create-session --help
```

---

## Risks & Mitigations

### Phase A.6 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Auto-rebuild too slow** | Medium | High | Cache index, only check mtimes, optimize file globbing |
| **Git hooks don't install** | Low | Low | Make hooks optional (lazy rebuild works without them) |
| **False staleness detection** | Low | Medium | Add timestamp tolerance (100ms buffer for filesystem precision) |
| **Recursive rebuild loop** | Very Low | High | Add rebuild lock, prevent concurrent rebuilds |

### Phase B Mini Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **YAML parsing errors** | Medium | Medium | Validate YAML before writing, provide helpful errors |
| **Concurrent file writes** | Low | Medium | Use file locking or atomic writes (fs.rename) |
| **Schema drift** | Low | High | Version frontmatter schema, support migrations |
| **Users prefer manual files** | Medium | Low | Support both workflows, don't force command-first |

---

## Success Criteria

### Phase A.6 Success Criteria

**Must Have:**
- [ ] Auto-rebuild detects stale index (files newer than index)
- [ ] Query commands auto-rebuild before returning results
- [ ] Rebuild completes in <1 second for <1000 files
- [ ] Config option to disable auto-rebuild works
- [ ] Git hooks install and trigger rebuilds
- [ ] All tests passing (752+ tests)
- [ ] Documentation updated (ESSENTIALS + skill)

**Should Have:**
- [ ] Rebuild logs are helpful (shows what triggered rebuild)
- [ ] Performance acceptable on large repos (1000+ files)
- [ ] Zero false positives (no unnecessary rebuilds)

**Nice to Have:**
- [ ] Rebuild progress indicator for large datasets
- [ ] Incremental rebuild (only changed files)

### Phase B Mini Success Criteria

**Must Have:**
- [ ] `create-session` generates valid YAML frontmatter
- [ ] `update-session` modifies metadata without corrupting file
- [ ] `create-plan` generates plan + updates pointers
- [ ] Schema validation catches invalid inputs (status enum, etc.)
- [ ] All commands update index automatically
- [ ] All tests passing (772+ tests)
- [ ] Documentation updated (ESSENTIALS + skill)

**Should Have:**
- [ ] Commands provide helpful errors (e.g., "Session already exists, use update-session")
- [ ] JSON output format matches query commands (consistency)
- [ ] Manual file creation still works (backward compatible)

**Nice to Have:**
- [ ] Batch updates (update-session --add-topics "A,B,C")
- [ ] Plan templates for common patterns
- [ ] Session templates with custom sections

---

## Rollback Procedure

**If Phase A.6 fails:**
1. Remove auto-rebuild logic from query commands
2. Revert to manual `rebuild-index` requirement
3. Document issue in IDEAS_BACKLOG.md
4. Keep Phase A as-is (queries work, just need manual rebuild)

**If Phase B Mini fails:**
1. Keep Phase A.6 (auto-rebuild is valuable standalone)
2. Document mutation commands as experimental
3. Continue supporting manual file creation
4. Revisit command design based on feedback

**Never break existing workflows.** Both phases are additive, not replacements.

---

## Future Extensions (Post-v0.10.0)

**Once Phase A.6 + B Mini proven:**

1. **Incremental Rebuilds**
   - Only re-index changed files (faster rebuilds)
   - Track file hashes to detect changes
   - Estimated: 2-3 hours

2. **Batch Mutations**
   - `update-session --add-topics "A,B,C"` (parse array)
   - `create-sessions` (plural - generate multiple)
   - Estimated: 1-2 hours

3. **Plan Templates**
   - `create-plan --template feature` (pre-filled sections)
   - `create-plan --template bug-fix`
   - Estimated: 2-3 hours

4. **File Watcher (Advanced)**
   - Watch `.aiknowsys/` directory with chokidar
   - Auto-rebuild on file changes (zero latency)
   - Estimated: 3-4 hours

5. **Index-First for ESSENTIALS** (Bigger Change)
   - Schema-driven ESSENTIALS.md generation
   - `query-essentials` returns chunks
   - Requires OpenSpec proposal (breaking change)
   - Estimated: 15-20 hours (separate plan)

---

## Notes for Developer

**Implementation Order Matters:**
1. Do Phase A.6 first (fixes immediate usability)
2. Validate auto-rebuild works before starting Phase B
3. Phase B builds on Phase A.6 (uses auto-rebuild)

**Watch Out For:**
- Filesystem timestamp precision (Windows vs Unix)
- Git operations on index files (should be gitignored)
- Concurrent rebuilds (add lock if needed)
- YAML parsing edge cases (multiline strings, special chars)

**Testing Focus:**
- Auto-rebuild staleness detection (most critical)
- YAML frontmatter parsing (edge cases)
- Schema validation (helpful errors)
- Backward compatibility (manual files still work)

**Performance Targets:**
- Auto-rebuild: <500ms for <1000 files
- Query commands: <100ms (excluding rebuild)
- Command execution: <200ms

**User Experience Goals:**
- Auto-rebuild transparent (users barely notice)
- Commands predictable (same patterns as existing CLI)
- Errors helpful (suggest fixes, not just "failed")
- Documentation clear (when to use which workflow)

---

## Changelog Integration

**After completion, add to CODEBASE_CHANGELOG.md:**

```markdown
## Session: Context Query System Completion (Feb 7, 2026)

**Goal:** Fix index staleness with auto-rebuild + add mutation commands

**Changes:**
- **Phase A.6: Auto-Indexing** (2-3 hours)
  - [lib/context/auto-index.js](lib/context/auto-index.js): AutoIndexer class
  - [lib/context/json-storage.js](lib/context/json-storage.js#L45): Integrated auto-rebuild
  - [.github/hooks/post-commit](.github/hooks/post-commit): Git hook for auto-rebuild
  - [.github/hooks/post-merge](.github/hooks/post-merge): Git hook for merges
  
- **Phase B Mini: Mutation Commands** (3-4 hours)
  - [lib/commands/create-session.js](lib/commands/create-session.js): Generate session files
  - [lib/commands/update-session.js](lib/commands/update-session.js): Modify session metadata
  - [lib/commands/create-plan.js](lib/commands/create-plan.js): Generate plan files
  - [lib/templates/session-template.js](lib/templates/session-template.js): YAML templates
  - [lib/utils/yaml-frontmatter.js](lib/utils/yaml-frontmatter.js): YAML parsing

**Validation:**
- ✅ 772/772 tests passing
- ✅ Auto-rebuild fixes staleness (<500ms overhead)
- ✅ Mutation commands enforce schema
- ✅ Both manual and command-first workflows work
- ✅ Git hooks optimize rebuild performance

**Key Learning:**
- Auto-rebuild makes Phase A actually usable
- Command-first enables schema validation
- Supporting both workflows = best flexibility
- Git hooks eliminate query latency (optional optimization)
```

---

*Part of AIKnowSys multi-agent workflow. Created by @Planner to complete context query system.*
