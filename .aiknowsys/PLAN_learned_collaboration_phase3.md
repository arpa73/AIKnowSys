# Implementation Plan: Learned Patterns Collaboration - Phase 3

**Status:** 📋 PLANNED  
**Created:** 2026-02-01  
**Goal:** Automation and pre-commit hooks - better UX/DX  
**Estimated Time:** 1-1.5 hours  
**Depends On:** Phase 1 complete (Phase 2 optional)

---

## Overview

**Phase 1:** Personal/shared pattern split ✅  
**Phase 2:** Per-developer plans and reviews ✅  
**This Phase:** Automation - pre-commit hooks and reminders

---

## What We're Building

**Problem:** Developers forget to share valuable patterns, lose personal patterns, or work on duplicate plans

**Solution:**
- Pre-commit hook reminds to share personal patterns (if >3 unshared)
- Pre-commit hook detects backup-worthy patterns (high usage count)
- Optional: Pre-commit hook shows teammates' active plans (avoid duplication)
- Optional: Post-pull hook syncs CURRENT_PLAN.md (Phase 2 only)

---

## Architecture Changes

### New Git Hooks

**`.github/hooks/learned-reminder.cjs`** (pre-commit)
- Checks unshared personal patterns count
- Reminds to share if >3 unshared
- Detects high-value patterns (usage count)
- Non-blocking (warning only, allows commit)

**`.github/hooks/plan-reminder.cjs`** (pre-commit, Phase 2 only)
- Shows teammates' active plans before committing
- Warns if similar work detected
- Non-blocking (warning only, allows commit)

**`.github/hooks/sync-plans.cjs`** (post-merge, Phase 2 only)
- Auto-regenerates CURRENT_PLAN.md after pulling
- Keeps team index up-to-date

### Hook Installation

**Update `scripts/install-git-hooks.sh`:**
- Symlink new hooks to `.git/hooks/`
- Make executable
- Detect if Phase 2 is installed (conditional hooks)

---

## Implementation Steps (TDD)

### Step 1: Learned Patterns Reminder Hook ✅
**Goal:** Remind developers to share valuable patterns

**1.1 Write tests FIRST** (File: `test/hooks/learned-reminder.test.js`)
- RED: Hook detects unshared patterns count
- RED: Hook shows reminder if >3 unshared
- RED: Hook detects high-usage patterns (referenced 5+ times)
- RED: Hook is non-blocking (exit code 0)
- RED: Hook respects GIT_AUTHOR_NAME for username

**1.2 Create hook** (File: `.github/hooks/learned-reminder.cjs`)
```javascript
#!/usr/bin/env node
const { existsSync, readdirSync, readFileSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

// Get username
let username;
try {
  username = execSync('git config user.name', { encoding: 'utf-8' }).trim();
  username = username.toLowerCase().replace(/\s+/g, '-');
} catch {
  process.exit(0);  // Can't detect user, skip hook
}

// Check personal patterns directory
const personalDir = join(process.cwd(), '.aiknowsys', 'personal', username);
if (!existsSync(personalDir)) {
  process.exit(0);  // No personal directory, skip
}

// Count unshared patterns
const personalPatterns = readdirSync(personalDir).filter(f => f.endsWith('.md') && f !== 'README.md');
if (personalPatterns.length === 0) {
  process.exit(0);  // No patterns, skip
}

// Detect high-value patterns (usage count)
const highValuePatterns = [];
for (const file of personalPatterns) {
  const content = readFileSync(join(personalDir, file), 'utf-8');
  const usageMatch = content.match(/used (\d+) times?/i);
  if (usageMatch && parseInt(usageMatch[1]) >= 5) {
    highValuePatterns.push({ file, count: parseInt(usageMatch[1]) });
  }
}

// Show reminder
if (personalPatterns.length >= 3 || highValuePatterns.length > 0) {
  console.log('\n📚 Learned Patterns Reminder');
  console.log('─'.repeat(50));
  
  if (personalPatterns.length >= 3) {
    console.log(`\n💡 You have ${personalPatterns.length} unshared personal patterns:`);
    personalPatterns.slice(0, 5).forEach(f => {
      console.log(`   • ${f.replace('.md', '')}`);
    });
    if (personalPatterns.length > 5) {
      console.log(`   ... (${personalPatterns.length - 5} more)`);
    }
  }
  
  if (highValuePatterns.length > 0) {
    console.log('\n⭐ High-value patterns worth sharing:');
    highValuePatterns.forEach(({ file, count }) => {
      console.log(`   • ${file.replace('.md', '')} (used ${count} times)`);
    });
  }
  
  console.log('\nShare with team: npx aiknowsys share-pattern <name>');
  console.log('List patterns: npx aiknowsys list-patterns\n');
}

// Non-blocking - allow commit
process.exit(0);
```

**1.3 Make executable**
```bash
chmod +x .github/hooks/learned-reminder.cjs
```

**1.4 Update install script** (File: `scripts/install-git-hooks.sh`)
```bash
# Add to hooks installation
ln -sf ../../.github/hooks/learned-reminder.cjs .git/hooks/pre-commit.d/learned-reminder
chmod +x .git/hooks/pre-commit.d/learned-reminder
```

---

### Step 2: Plan Reminder Hook (Phase 2 Only) ✅
**Goal:** Show teammates' active plans before committing

**2.1 Write tests FIRST** (File: `test/hooks/plan-reminder.test.js`)
- RED: Hook reads plans/active-*.md files
- RED: Hook shows teammates' current work
- RED: Hook warns if similar work detected (keyword matching)
- RED: Hook is non-blocking (exit code 0)
- RED: Hook skips if plans/ directory doesn't exist

**2.2 Create hook** (File: `.github/hooks/plan-reminder.cjs`)
```javascript
#!/usr/bin/env node
const { existsSync, readdirSync, readFileSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

// Get username
let username;
try {
  username = execSync('git config user.name', { encoding: 'utf-8' }).trim();
  username = username.toLowerCase().replace(/\s+/g, '-');
} catch {
  process.exit(0);
}

// Check plans directory (Phase 2 feature)
const plansDir = join(process.cwd(), '.aiknowsys', 'plans');
if (!existsSync(plansDir)) {
  process.exit(0);  // Phase 2 not installed, skip
}

// Get teammates' active plans
const planFiles = readdirSync(plansDir).filter(f => f.startsWith('active-') && !f.includes(username));
if (planFiles.length === 0) {
  process.exit(0);  // Solo developer, skip
}

// Parse teammates' plans
const teammatePlans = [];
for (const file of planFiles) {
  const content = readFileSync(join(plansDir, file), 'utf-8');
  const nameMatch = file.match(/active-(.+)\.md/);
  const planMatch = content.match(/\*\*Currently Working On:\*\* (.+)/);
  
  if (nameMatch && planMatch) {
    teammatePlans.push({
      developer: nameMatch[1],
      plan: planMatch[1]
    });
  }
}

// Show teammates' work
if (teammatePlans.length > 0) {
  console.log('\n👥 Your Teammates Are Working On:');
  console.log('─'.repeat(50));
  teammatePlans.forEach(({ developer, plan }) => {
    console.log(`   ${developer}: ${plan}`);
  });
  console.log('\nCheck CURRENT_PLAN.md for details\n');
}

// Non-blocking - allow commit
process.exit(0);
```

**2.3 Make executable & install**
```bash
chmod +x .github/hooks/plan-reminder.cjs
# Add to install-git-hooks.sh
```

---

### Step 3: Auto-Sync Plans Hook (Phase 2 Only) ✅
**Goal:** Keep CURRENT_PLAN.md up-to-date after pulling

**3.1 Write tests FIRST** (File: `test/hooks/sync-plans.test.js`)
- RED: Hook runs after git pull/merge
- RED: Hook regenerates CURRENT_PLAN.md
- RED: Hook only runs if plans/ directory exists
- RED: Hook is non-blocking (errors don't fail merge)

**3.2 Create hook** (File: `.github/hooks/sync-plans.cjs`)
```javascript
#!/usr/bin/env node
const { existsSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

// Check if Phase 2 is installed
const plansDir = join(process.cwd(), '.aiknowsys', 'plans');
if (!existsSync(plansDir)) {
  process.exit(0);  // Phase 2 not installed, skip
}

// Check if sync-plans command exists
try {
  execSync('npx aiknowsys sync-plans --help', { stdio: 'ignore' });
} catch {
  // Command doesn't exist, skip
  process.exit(0);
}

// Regenerate CURRENT_PLAN.md
console.log('\n🔄 Syncing team plan index...');
try {
  execSync('npx aiknowsys sync-plans', { stdio: 'inherit' });
  console.log('✅ CURRENT_PLAN.md updated\n');
} catch (err) {
  console.error('⚠️  Failed to sync plans (non-critical)');
}

// Non-blocking - don't fail merge
process.exit(0);
```

**3.3 Make executable & install**
```bash
chmod +x .github/hooks/sync-plans.cjs
# Add to install-git-hooks.sh as post-merge hook
```

---

### Step 4: Update Hook Installation ✅
**Goal:** Auto-install hooks during project init

**4.1 Update install script** (File: `scripts/install-git-hooks.sh`)
```bash
#!/bin/bash
set -e

echo "Installing aiknowsys git hooks..."

# Create hook directories
mkdir -p .git/hooks/pre-commit.d
mkdir -p .git/hooks/post-merge.d

# Install learned-reminder (Phase 1 - always)
if [ -f .github/hooks/learned-reminder.cjs ]; then
  ln -sf ../../../.github/hooks/learned-reminder.cjs .git/hooks/pre-commit.d/learned-reminder
  chmod +x .github/hooks/learned-reminder.cjs
  echo "✅ Installed: learned-reminder (pre-commit)"
fi

# Install plan-reminder (Phase 2 - conditional)
if [ -f .github/hooks/plan-reminder.cjs ]; then
  ln -sf ../../../.github/hooks/plan-reminder.cjs .git/hooks/pre-commit.d/plan-reminder
  chmod +x .github/hooks/plan-reminder.cjs
  echo "✅ Installed: plan-reminder (pre-commit)"
fi

# Install sync-plans (Phase 2 - conditional)
if [ -f .github/hooks/sync-plans.cjs ]; then
  ln -sf ../../../.github/hooks/sync-plans.cjs .git/hooks/post-merge.d/sync-plans
  chmod +x .github/hooks/sync-plans.cjs
  echo "✅ Installed: sync-plans (post-merge)"
fi

# Create hook runners (aggregate individual hooks)
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run all pre-commit hooks
for hook in .git/hooks/pre-commit.d/*; do
  if [ -x "$hook" ]; then
    "$hook" || exit $?
  fi
done
EOF
chmod +x .git/hooks/pre-commit

cat > .git/hooks/post-merge << 'EOF'
#!/bin/bash
# Run all post-merge hooks
for hook in .git/hooks/post-merge.d/*; do
  if [ -x "$hook" ]; then
    "$hook"  # Non-blocking
  fi
done
EOF
chmod +x .git/hooks/post-merge

echo "🎉 Git hooks installed successfully!"
```

**4.2 Update init command** (File: `lib/commands/init/templates.js`)
```javascript
// After creating .aiknowsys/ directory:
if (existsSync('scripts/install-git-hooks.sh')) {
  console.log('\nInstalling git hooks...');
  try {
    execSync('bash scripts/install-git-hooks.sh', { stdio: 'inherit' });
  } catch (err) {
    console.warn('⚠️  Failed to install git hooks (non-critical)');
  }
}
```

---

### Step 5: Usage Count Tracking (Optional Enhancement) ✅
**Goal:** Detect high-value patterns automatically

**5.1 Update learn command** (File: `lib/commands/learn.js`)
```javascript
// When saving pattern:
function savePattern(patternName, content, options) {
  // ... existing code ...
  
  // Track usage metadata
  const metadata = {
    created: new Date().toISOString(),
    usageCount: 0,
    lastUsed: null
  };
  
  // Append metadata to pattern file
  const fullContent = `${content}\n\n---\n\n<!-- Metadata: ${JSON.stringify(metadata)} -->`;
  writeFileSync(patternPath, fullContent);
}
```

**5.2 Create usage tracking** (File: `lib/context/skill-loading.js`)
```javascript
// When loading pattern for AI:
function loadPattern(patternPath) {
  let content = readFileSync(patternPath, 'utf-8');
  
  // Extract metadata
  const metadataMatch = content.match(/<!-- Metadata: (.+) -->/);
  if (metadataMatch) {
    const metadata = JSON.parse(metadataMatch[1]);
    metadata.usageCount += 1;
    metadata.lastUsed = new Date().toISOString();
    
    // Update file
    content = content.replace(
      /<!-- Metadata: .+ -->/,
      `<!-- Metadata: ${JSON.stringify(metadata)} -->`
    );
    writeFileSync(patternPath, content);
  }
  
  return content;
}
```

**5.3 Update hook** (File: `.github/hooks/learned-reminder.cjs`)
```javascript
// Check usage count from metadata:
const metadataMatch = content.match(/<!-- Metadata: (.+) -->/);
if (metadataMatch) {
  const metadata = JSON.parse(metadataMatch[1]);
  if (metadata.usageCount >= 5) {
    highValuePatterns.push({ file, count: metadata.usageCount });
  }
}
```

---

### Step 6: Documentation ✅
**Goal:** Explain automation features

**6.1 Update ESSENTIALS template** (File: `templates/CODEBASE_ESSENTIALS.template.md`)
```markdown
## Automation (Git Hooks)

### Pre-Commit: Learned Pattern Reminder
- Reminds to share if >3 unshared personal patterns
- Highlights high-value patterns (used 5+ times)
- Non-blocking (warning only)

### Pre-Commit: Plan Reminder (Phase 2)
- Shows teammates' active plans before committing
- Helps avoid duplicate work
- Non-blocking (warning only)

### Post-Merge: Auto-Sync Plans (Phase 2)
- Regenerates CURRENT_PLAN.md after pulling
- Keeps team index up-to-date
- Non-blocking (errors don't fail merge)

**Installation:**
Hooks are auto-installed during `npx aiknowsys init`.
Manual install: `bash scripts/install-git-hooks.sh`

**Disable:**
Remove symlinks from `.git/hooks/` directory.
```

**6.2 Create hook documentation** (File: `docs/git-hooks-guide.md`)
- Explain each hook's purpose
- How to customize hooks
- How to disable hooks
- Troubleshooting

---

## Testing Strategy

**Unit Tests:**
- `test/hooks/learned-reminder.test.js` - Pattern count detection, reminder logic
- `test/hooks/plan-reminder.test.js` - Teammate plan aggregation
- `test/hooks/sync-plans.test.js` - Auto-sync after pull
- `test/install-git-hooks.test.js` - Hook installation script

**Integration Tests:**
- Full commit workflow with hooks
- Simulate git pull → post-merge hook runs
- Multiple developers scenario

**Manual Validation:**
```bash
# 1. Install hooks
bash scripts/install-git-hooks.sh

# 2. Create 3+ personal patterns
npx aiknowsys learn --personal
npx aiknowsys learn --personal
npx aiknowsys learn --personal

# 3. Try to commit
git add .
git commit -m "test"
# (should see learned-reminder output)

# 4. Check teammate plans (if Phase 2)
git commit -m "test"
# (should see plan-reminder output)

# 5. Test post-merge hook
git pull
# (should see sync-plans output if Phase 2)
```

---

## Success Criteria

- [ ] Pre-commit hook reminds to share patterns (if >3 unshared)
- [ ] Pre-commit hook shows teammates' plans (Phase 2 only)
- [ ] Post-merge hook syncs CURRENT_PLAN.md (Phase 2 only)
- [ ] Hooks are non-blocking (don't fail commits/merges)
- [ ] Hooks auto-install during `npx aiknowsys init`
- [ ] Manual install script works: `bash scripts/install-git-hooks.sh`
- [ ] Usage count tracking detects high-value patterns (optional)
- [ ] Documentation explains hooks and customization
- [ ] All tests passing
- [ ] Hooks improve UX/DX without being annoying ✅

---

## Risks & Mitigations

**Risk 1: Hooks annoy developers (too chatty)**
- **Likelihood:** Medium
- **Impact:** High (developers disable hooks)
- **Mitigation:**
  - Non-blocking only (warnings, not errors)
  - Trigger only when relevant (>3 patterns, teammates exist)
  - Easy to disable (remove symlink)

**Risk 2: Hooks slow down commits**
- **Likelihood:** Low (simple file reads)
- **Impact:** Medium (annoying delay)
- **Mitigation:**
  - Optimize file reading (cache results)
  - Skip if no personal/ or plans/ directory
  - Async hook execution (future)

**Risk 3: Hooks break on non-standard git setups**
- **Likelihood:** Medium (sparse checkouts, submodules, etc.)
- **Impact:** Low (hooks fail silently)
- **Mitigation:**
  - Defensive programming (check directory existence)
  - Exit 0 on errors (non-blocking)
  - Document limitations

**Risk 4: Usage count tracking adds noise to diffs**
- **Likelihood:** High (metadata updates)
- **Impact:** Low (just JSON comment)
- **Mitigation:**
  - Make usage tracking optional
  - Use .gitattributes to diff-ignore metadata
  - Or: Store usage counts separately (`.aiknowsys/.usage-counts.json`)

---

## Notes for Developer

**Hook Runner Pattern:**
```bash
# .git/hooks/pre-commit (aggregates individual hooks)
#!/bin/bash
for hook in .git/hooks/pre-commit.d/*; do
  if [ -x "$hook" ]; then
    "$hook" || exit $?  # Exit on failure (blocking hooks)
  fi
done
```

**Conditional Hook Installation:**
```bash
# Only install Phase 2 hooks if plans/ directory exists
if [ -d .aiknowsys/plans ]; then
  ln -sf ../../../.github/hooks/plan-reminder.cjs .git/hooks/pre-commit.d/plan-reminder
fi
```

**Usage Count Storage Options:**

**Option A: Inline Metadata (Current)**
```markdown
# Pattern Title

Content...

---

<!-- Metadata: {"usageCount": 5, "lastUsed": "2026-02-01"} -->
```

**Option B: Separate File (Alternative)**
```json
// .aiknowsys/.usage-counts.json
{
  "api-retry-pattern.md": { "usageCount": 5, "lastUsed": "2026-02-01" },
  "vue-composable-best-practices.md": { "usageCount": 2, "lastUsed": "2026-01-28" }
}
```

**Recommendation:** Option A (simpler, self-contained) unless diffs become noisy.

---

**Estimated Time:** 1-1.5 hours  
**Lines Added:** ~300-400 (hooks + tests + docs)  
**Complexity:** Low-Medium (git hooks, file scanning)

---

**Prerequisites:**
- Phase 1: Personal/shared pattern split ✅ (required)
- Phase 2: Plans and reviews ✅ (optional - plan-reminder and sync-plans hooks only)

**Optional:**
- Usage count tracking can be added later (enhancement)
- Hooks can be customized per-project

---

*Part of aiknowsys multi-developer collaboration system - automation layer for better UX/DX.*
