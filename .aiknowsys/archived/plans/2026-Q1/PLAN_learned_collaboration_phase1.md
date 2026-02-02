# Implementation Plan: Learned Patterns Collaboration - Phase 1

**Status:** 🎯 ACTIVE  
**Created:** 2026-02-01  
**Goal:** Personal/shared pattern split - prevent merge conflicts on learned patterns  
**Estimated Time:** 2-3 hours

---

## Overview

**This Phase:** Personal pattern infrastructure (core conflict resolution)  
**Phase 2:** Per-developer plan tracking  
**Phase 3:** Automation & pre-commit hooks

---

## What We're Building

**Problem:** Multiple developers create same filename in `.aiknowsys/learned/` → merge conflicts

**Solution:** 
- Personal discoveries → `.aiknowsys/personal/<username>/` (gitignored)
- Team-validated → `.aiknowsys/learned/` (committed)
- Explicit sharing command with review

**Mental Model:** "Discover locally, share deliberately"

---

## Architecture Changes

### New Directories

**`.aiknowsys/personal/<username>/`** (gitignored)
- Per-developer personal patterns
- Automatically created on first use
- Username from git config (normalized)

### New Commands

**1. `npx aiknowsys share-pattern <name>`**
- Move pattern from personal/ → learned/
- Check for duplicates (fuzzy matching)
- Offer merge/rename if duplicate found
- Optionally git commit

**2. `npx aiknowsys list-patterns`**
- Show personal patterns (not shared)
- Show team patterns (already shared)
- Suggest patterns worth sharing (usage-based)

### Modified Commands

**`npx aiknowsys learn`**
- Add `--personal` flag (default) - saves to personal/<username>/
- Add `--shared` flag (legacy) - saves to learned/
- Get username from git config or prompt

### New Files

- `lib/commands/share-pattern.js` - Share command
- `lib/commands/list-patterns.js` - List command
- `templates/.aiknowsys/personal/README.template.md` - Explains personal vs shared
- `scripts/migrate-learned-patterns.js` - Migration helper (standalone)

### Modified Files

- `lib/commands/learn.js` - Add --personal/--shared flags
- `lib/commands/init/templates.js` - Create personal/ directory
- `templates/.gitignore.template` - Add personal/ to gitignore
- `templates/CODEBASE_ESSENTIALS.template.md` - Document new structure
- `templates/AGENTS.template.md` - Update Continuous Learning section
- `bin/cli.js` - Register share-pattern and list-patterns commands

---

## Implementation Steps (TDD)

### Step 1: Directory Structure ✅
**Goal:** Create personal/ directory infrastructure

**1.1 Update gitignore template** (File: `templates/.gitignore.template`)
- Add `.aiknowsys/personal/` to gitignore
- Ensure `.aiknowsys/learned/` is NOT gitignored (already tracked)
- TDD: N/A (template file)

**1.2 Create personal directory during init** (File: `lib/commands/init/templates.js`)
- In `setupSessionPersistence()`, create `.aiknowsys/personal/<username>/`
- Get username from git config: `git config user.name`
- Normalize: lowercase, replace spaces with hyphens
- TDD: Update `test/init.test.js` (RED → GREEN)
  ```javascript
  it('should create personal patterns directory with normalized username', async () => {
    const result = await runInit({ mockGitUsername: 'Arno van der Vegt' });
    assert.ok(existsSync('.aiknowsys/personal/arno-van-der-vegt'));
  });
  ```

**1.3 Create personal README template** (File: `templates/.aiknowsys/personal/README.template.md`)
- Explain personal vs learned distinction
- Workflow: discover → personal → review → share → learned
- Warning: personal/ is gitignored (no cloud backup)
- TDD: N/A (documentation)

---

### Step 2: Learn Command Updates ✅
**Goal:** Save new patterns to personal/ by default

**2.1 Write tests FIRST** (File: `test/learn.test.js`)
- RED: Test for --personal flag (saves to personal/<username>/)
- RED: Test for --shared flag (saves to learned/, legacy)
- RED: Test default behavior (should use --personal)
- RED: Test username detection from git config
- RED: Test username normalization (spaces → hyphens)

**2.2 Update learn command** (File: `lib/commands/learn.js`)
- Add `--personal` option (default: true)
- Add `--shared` option (forces learned/)
- Get username: `execSync('git config user.name')` or prompt
- Normalize username: `username.toLowerCase().replace(/\s+/g, '-')`
- Save to: `personal ? .aiknowsys/personal/${username}/ : .aiknowsys/learned/`
- GREEN: All tests pass

**2.3 Update skill detection** (File: `lib/skill-mapping.js` or agent code)
- Check both `.aiknowsys/personal/<username>/` and `.aiknowsys/learned/`
- Personal patterns should work for AI (just not shared)
- TDD: Update skill detection tests

---

### Step 3: Share Pattern Command ✅
**Goal:** Enable reviewed sharing of patterns

**3.1 Write tests FIRST** (File: `test/share-pattern.test.js`)
- RED: Share moves file from personal/ to learned/
- RED: Duplicate detection (exact title match)
- RED: Similar pattern detection (keyword overlap)
- RED: Merge option combines content
- RED: Rename option avoids conflicts
- RED: Git commit is optional (--commit flag)
- RED: Error if pattern doesn't exist in personal/

**3.2 Create share-pattern command** (File: `lib/commands/share-pattern.js`)
- Load pattern from `.aiknowsys/personal/<username>/<name>.md`
- Check for duplicates in `.aiknowsys/learned/`:
  ```javascript
  function findDuplicates(newPattern, learnedDir) {
    const newTitle = extractTitle(newPattern).toLowerCase();
    const newKeywords = extractKeywords(newPattern);
    
    for (const file of fs.readdirSync(learnedDir)) {
      const existingTitle = extractTitle(file).toLowerCase();
      
      // Exact match
      if (newTitle === existingTitle) {
        return { duplicate: true, file };
      }
      
      // Similar (>50% keyword overlap)
      const overlap = keywordOverlap(newKeywords, extractKeywords(file));
      if (overlap > 0.5) {
        return { similar: true, file, overlap };
      }
    }
    return { duplicate: false };
  }
  ```
- If duplicate: Offer [Merge] [Rename] [Cancel]
- If unique: Confirm "Share '<title>' with team? (y/N)"
- Move file to learned/
- Optional: `git add learned/<name>.md && git commit -m "Add learned pattern: <title>"`
- Display: "✅ Pattern shared! Teammates will see it after pulling."
- GREEN: All tests pass

**3.3 Register command** (File: `bin/cli.js`)
- Add `.command('share-pattern').argument('<name>')...`

---

### Step 4: List Patterns Command ✅
**Goal:** Discoverability and sharing reminders

**4.1 Write tests FIRST** (File: `test/list-patterns.test.js`)
- RED: List shows personal patterns
- RED: List shows team patterns
- RED: Suggested patterns (based on usage count)
- RED: Empty state messages

**4.2 Create list-patterns command** (File: `lib/commands/list-patterns.js`)
- Scan `.aiknowsys/personal/<username>/` for personal patterns
- Scan `.aiknowsys/learned/` for team patterns
- Display categorized list:
  ```
  📚 Learned Patterns
  
  Personal (3 patterns - not shared):
    • api-retry-pattern.md (used 5 times this week)
    • vue-composable-best-practices.md
    • clickhouse-optimization.md
  
  Team (7 patterns - shared):
    • database-pooling.md (by arno, 2026-01-15)
    • error-handling-strategy.md (by colleague, 2026-01-20)
    • api-pagination-pattern.md (by arno, 2026-01-25)
    ...
  
  💡 Suggested to share:
    • api-retry-pattern.md (referenced 5 times - seems valuable!)
  
  Share with: npx aiknowsys share-pattern <name>
  ```
- GREEN: All tests pass

**4.3 Register command** (File: `bin/cli.js`)
- Add `.command('list-patterns')...`

---

### Step 5: Documentation ✅
**Goal:** Users understand the system

**5.1 Update ESSENTIALS template** (File: `templates/CODEBASE_ESSENTIALS.template.md`)
- Update Project Structure section:
  ```markdown
  .aiknowsys/
    learned/            # Team-validated patterns (committed)
    personal/           # Personal discoveries (gitignored)
      <username>/       # Your personal patterns
  ```
- Add "Learned Patterns Collaboration" section:
  ```markdown
  ### Learned Patterns (Multi-Developer)
  
  **Workflow:**
  1. AI discovers pattern → Saves to `.aiknowsys/personal/<username>/`
  2. Review: `npx aiknowsys list-patterns`
  3. Share: `npx aiknowsys share-pattern <name>`
  4. Team benefits (after git pull)
  
  **Why personal/ is gitignored:**
  - Prevents merge conflicts
  - Allows experimentation
  - Sharing is deliberate (review gate)
  
  ⚠️ **Personal patterns are NOT backed up to git.**  
  Share valuable patterns regularly.
  ```

**5.2 Update AGENTS.md** (File: `templates/AGENTS.template.md`)
- Update "Continuous Learning" section:
  ```markdown
  **After complex sessions or when discovering patterns:**
  
  ### Pattern Extraction Protocol
  
  **When you notice:**
  - Recurring error with consistent solution
  - User corrects same mistake multiple times
  - Project-specific convention emerges
  
  **Do this:**
  1. Create learned skill in `.aiknowsys/personal/<username>/`
  2. Use skill format with clear trigger words
  3. **For team sharing:** User runs `npx aiknowsys share-pattern <name>`
  
  **Note:** Patterns save to personal/ by default (prevents merge conflicts).
  Team sees patterns only after explicit sharing.
  ```

**5.3 Create migration guide** (File: `docs/learned-collaboration-migration.md`)
- Explain the change
- Migration steps for existing projects
- Standalone migration script usage

---

### Step 6: Migration Script ✅
**Goal:** Easy upgrade for existing projects

**6.1 Create standalone migration script** (File: `scripts/migrate-learned-patterns.js`)
```javascript
#!/usr/bin/env node
import { execSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔄 Migrating to personal/shared pattern split...\n');

// 1. Get username
let username;
try {
  username = execSync('git config user.name', { encoding: 'utf-8' }).trim();
  username = username.toLowerCase().replace(/\s+/g, '-');
  console.log(`✅ Detected username: ${username}`);
} catch {
  console.error('❌ Could not detect git username. Run: git config user.name');
  process.exit(1);
}

// 2. Create personal directory
const personalDir = join(process.cwd(), '.aiknowsys', 'personal', username);
mkdirSync(personalDir, { recursive: true });
console.log(`✅ Created: ${personalDir}`);

// 3. Update .gitignore
const gitignorePath = join(process.cwd(), '.gitignore');
if (existsSync(gitignorePath)) {
  let gitignore = readFileSync(gitignorePath, 'utf-8');
  if (!gitignore.includes('.aiknowsys/personal/')) {
    gitignore += '\n# Personal learned patterns (not shared)\n.aiknowsys/personal/\n';
    writeFileSync(gitignorePath, gitignore);
    console.log('✅ Updated .gitignore');
  }
}

// 4. Copy README
const readmeSrc = join(process.cwd(), 'templates', '.aiknowsys', 'personal', 'README.template.md');
const readmeDest = join(personalDir, 'README.md');
if (existsSync(readmeSrc)) {
  const content = readFileSync(readmeSrc, 'utf-8');
  writeFileSync(readmeDest, content.replace(/{{USERNAME}}/g, username));
  console.log('✅ Created personal/README.md');
}

console.log('\n🎉 Migration complete!');
console.log('\nNext steps:');
console.log('1. New patterns will save to personal/ by default');
console.log('2. Share patterns: npx aiknowsys share-pattern <name>');
console.log('3. List patterns: npx aiknowsys list-patterns');
console.log('\n⚠️  Existing .aiknowsys/learned/ patterns remain shared (no change needed)');
```

**6.2 Make executable**
```bash
chmod +x scripts/migrate-learned-patterns.js
```

**6.3 Document usage** (In migration guide)
```bash
# Run migration script
node scripts/migrate-learned-patterns.js

# Or if aiknowsys is installed globally
npx aiknowsys migrate-patterns  # (add to CLI later)
```

---

## Testing Strategy

**Unit Tests:**
- `test/init.test.js` - Personal directory creation
- `test/learn.test.js` - --personal/--shared flags, username detection
- `test/share-pattern.test.js` - Move, duplicate detection, merge, rename
- `test/list-patterns.test.js` - Display personal/team patterns, suggestions

**Integration Tests:**
- Full workflow: learn → personal → list → share → learned
- Multiple developers scenario (simulate different usernames)
- Git operations (add, commit) work correctly

**Manual Validation:**
```bash
# 1. Init new project
npx aiknowsys init

# 2. Create personal pattern
npx aiknowsys learn
# (should save to personal/<username>/)

# 3. List patterns
npx aiknowsys list-patterns
# (should show in "Personal" section)

# 4. Share pattern
npx aiknowsys share-pattern <name>
# (should move to learned/)

# 5. Verify gitignore
git status
# (personal/ should not appear)
```

---

## Success Criteria

- [ ] `.aiknowsys/personal/<username>/` created during init (gitignored)
- [ ] `npx aiknowsys learn` saves to personal/ by default
- [ ] `npx aiknowsys learn --shared` saves to learned/ (legacy)
- [ ] `npx aiknowsys share-pattern <name>` moves personal → learned
- [ ] Duplicate detection prevents conflicts (offers merge/rename)
- [ ] `npx aiknowsys list-patterns` shows both personal and team
- [ ] Migration script works for existing projects
- [ ] All tests passing (520+ existing + ~25 new = 545+ total)
- [ ] Documentation updated (ESSENTIALS, AGENTS, migration guide)
- [ ] No merge conflicts on learned patterns ✅

---

## Risks & Mitigations

**Risk 1: Username contains special characters**
- **Mitigation:** Normalize to lowercase, replace non-alphanumeric with hyphens
- **Example:** "Arno (van der Vegt)" → "arno-van-der-vegt"

**Risk 2: Personal patterns lost (gitignored)**
- **Mitigation:** 
  - Warning in README
  - `list-patterns` shows unshared count
  - Pre-commit hook reminder (Phase 3)

**Risk 3: Duplicate detection false positives**
- **Mitigation:** 
  - Manual review during share
  - Simple keyword matching (good enough)
  - Users can rename if needed

**Risk 4: Breaking existing workflows**
- **Mitigation:**
  - `--shared` flag for legacy behavior
  - Migration script for existing projects
  - Learned/ patterns still work (backward compatible)

---

## Notes for Developer

**Username Normalization:**
```javascript
function normalizeUsername(username) {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '');     // Trim leading/trailing hyphens
}

// Examples:
// "Arno van der Vegt" → "arno-van-der-vegt"
// "John.Doe@Company" → "john-doe-company"
// "María García" → "maria-garcia"
```

**Fuzzy Duplicate Detection:**
```javascript
function isDuplicate(newPattern, existingPatterns) {
  const newTitle = extractTitle(newPattern).toLowerCase();
  const newKeywords = extractKeywords(newPattern);
  
  for (const existing of existingPatterns) {
    const existingTitle = extractTitle(existing).toLowerCase();
    
    // Exact title match
    if (newTitle === existingTitle) {
      return { duplicate: true, file: existing };
    }
    
    // Similar keywords (>50% overlap)
    const overlap = keywordOverlap(newKeywords, extractKeywords(existing));
    if (overlap > 0.5) {
      return { similar: true, file: existing, overlap };
    }
  }
  
  return { duplicate: false };
}

function extractKeywords(pattern) {
  const content = readFileSync(pattern, 'utf-8');
  const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
  return [...new Set(words)].slice(0, 20);  // Top 20 unique words
}

function keywordOverlap(keywords1, keywords2) {
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  const intersection = [...set1].filter(k => set2.has(k));
  return intersection.length / Math.min(set1.size, set2.size);
}
```

---

**Estimated Time:** 2-3 hours  
**Lines Added:** ~400-500 (code + tests + docs)  
**Complexity:** Medium (file operations, duplicate detection, migration)

---

**Phase 2 Preview:** Per-developer plan tracking (plans/active-<username>.md)  
**Phase 3 Preview:** Pre-commit hook automation (learned-reminder.cjs)
