# Implementation Plan: Learned Patterns Collaboration - Phase 2

**Status:** 📋 PLANNED  
**Created:** 2026-02-01  
**Goal:** Per-developer plan tracking and architect reviews - prevent merge conflicts  
**Estimated Time:** 1.5-2 hours  
**Depends On:** Phase 1 complete

---

## Overview

**Phase 1:** Personal/shared pattern split ✅  
**This Phase:** Per-developer plans and reviews  
**Phase 3:** Automation & pre-commit hooks

---

## What We're Building

**Problem 1:** Multiple developers update `CURRENT_PLAN.md` → merge conflicts  
**Problem 2:** Architect reviews overwrite each other in `PENDING_REVIEW.md`

**Solution:**
- Per-developer plan files: `.aiknowsys/plans/active-<username>.md` (committed)
- Per-developer reviews: `.aiknowsys/reviews/PENDING_<username>.md` (gitignored)
- CURRENT_PLAN.md becomes team index (aggregates all active plans)

---

## Architecture Changes

### New Directories

**1. `.aiknowsys/plans/`** (committed)
- Per-developer active plan pointers
- Files: `active-<username>.md`
- Shows what each developer is currently working on
- Visible to team (no conflicts - separate files)

**2. `.aiknowsys/reviews/`** (gitignored)
- Per-developer pending reviews
- Files: `PENDING_<username>.md`
- Auto-deleted after addressing
- No overwrites, no conflicts

### Modified Files

**`.aiknowsys/CURRENT_PLAN.md`**
- Changes from "active pointer" to "team index"
- Aggregates all developers' active plans
- Shows: who's working on what
- Can be manually edited or auto-generated

### New Template Files

- `templates/.aiknowsys/plans/README.template.md` - Explains plan tracking
- `templates/.aiknowsys/reviews/README.template.md` - Explains review workflow

### Modified Agent Files (if custom agents installed)

- `.github/agents/Developer.md`:
  - Read from `.aiknowsys/reviews/PENDING_<username>.md` (not PENDING_REVIEW.md)
  - Update `.aiknowsys/plans/active-<username>.md` (not CURRENT_PLAN.md directly)
- `.github/agents/SeniorArchitect.md`:
  - Write to `.aiknowsys/reviews/PENDING_<username>.md` (per-developer)

---

## Implementation Steps (TDD)

### Step 1: Plan Tracking Infrastructure ✅
**Goal:** Create per-developer plan pointers

**1.1 Update gitignore template** (File: `templates/.gitignore.template`)
- Add `.aiknowsys/reviews/` to gitignore (ephemeral reviews)
- Ensure `.aiknowsys/plans/` is NOT gitignored (team visibility)
- TDD: N/A (template file)

**1.2 Create plans directory during init** (File: `lib/commands/init/templates.js`)
- In `setupSessionPersistence()`, create `.aiknowsys/plans/`
- Create initial `active-<username>.md` for current user
- TDD: Update `test/init.test.js`

**1.3 Create reviews directory during init** (File: `lib/commands/init/templates.js`)
- Create `.aiknowsys/reviews/` directory
- Copy README template
- TDD: Update `test/init.test.js`

**1.4 Create plan pointer template** (File: `templates/.aiknowsys/plans/active-username.template.md`)
```markdown
# Active Plan: {{USERNAME}}

**Currently Working On:** None  
**Last Updated:** {{DATE}}

---

## Status

No active plan. Use Planner agent to create one.

**Available Plans:**
- See CURRENT_PLAN.md for team's plan index
- See PLAN_*.md files for details

---

*This file tracks what {{USERNAME}} is currently working on.*  
*Visible to team - committed to git.*
```

**1.5 Create plans README** (File: `templates/.aiknowsys/plans/README.template.md`)
```markdown
# Plans Directory

**Purpose:** Track what each developer is currently working on.

**How It Works:**
- Each developer has `active-<username>.md` (committed, visible to team)
- Shows current plan, status, progress
- No merge conflicts (separate files per developer)

**Workflow:**
1. Planner creates plan in `PLAN_*.md`
2. Developer updates `plans/active-<username>.md` to point to it
3. Teammates see who's working on what (avoid duplication)
4. On completion, developer marks plan complete

**Team Index:**
See `CURRENT_PLAN.md` for aggregated view of all active plans.

---

*Part of aiknowsys multi-developer collaboration system.*
```

**1.6 Create reviews README** (File: `templates/.aiknowsys/reviews/README.template.md`)
```markdown
# Reviews Directory

**Purpose:** Per-developer architect reviews (ephemeral, gitignored).

**How It Works:**
- Architect writes review to `PENDING_<username>.md`
- Developer reads review, addresses issues
- Developer deletes review file after completion
- No overwrites, no conflicts

**Why Gitignored:**
- Reviews are ephemeral (exist only during action)
- Keeps git history clean (no review clutter)
- Team can't accidentally see each other's pending reviews

**Historical Reviews:**
See `sessions/YYYY-MM-DD-session.md` for completed review summaries.

---

*Part of aiknowsys multi-developer collaboration system.*
```

---

### Step 2: Update Agent Instructions ✅
**Goal:** Agents use per-developer files

**2.1 Update Developer agent** (File: `templates/AGENTS.template.md` - Developer section)
- Change: Read from `.aiknowsys/reviews/PENDING_<username>.md`
- Change: Update `.aiknowsys/plans/active-<username>.md`
- Keep: Session file workflow unchanged
- TDD: N/A (documentation)

**2.2 Update SeniorArchitect agent** (File: `.github/agents/SeniorArchitect.md` if exists)
- Change: Write to `.aiknowsys/reviews/PENDING_<username>.md` (not PENDING_REVIEW.md)
- Get username from git config
- TDD: N/A (agent instructions)

**2.3 Update Planner agent** (File: `.github/agents/Planner.md` if exists)
- When creating plan: Update `.aiknowsys/plans/active-<username>.md`
- Document new file locations
- TDD: N/A (agent instructions)

---

### Step 3: CURRENT_PLAN.md Refactor ✅
**Goal:** Make it a team index instead of single pointer

**3.1 Create command: sync-plans** (File: `lib/commands/sync-plans.js`)
- Scan `.aiknowsys/plans/active-*.md` files
- Aggregate into CURRENT_PLAN.md table
- Optional: Auto-run on git pull (future hook)
- TDD: Write tests in `test/sync-plans.test.js`

**3.2 Update CURRENT_PLAN template** (File: `templates/CURRENT_PLAN.template.md`)
```markdown
# Team Plan Index

**Last Updated:** Auto-generated from plans/

---

## Active Plans

| Developer | Plan | Status | Last Updated |
|-----------|------|--------|--------------|
| {{AUTO_GENERATED_FROM_PLANS_DIRECTORY}} |

---

## Individual Developer Plans

{{#each developers}}
### {{username}}
**Active Plan:** [{{planName}}]({{planFile}})  
**Status:** {{status}}  
**Last Updated:** {{date}}

{{/each}}

---

## How This Works

**For developers:**
- Your plan: `.aiknowsys/plans/active-<your-username>.md`
- Team sees your progress (no merge conflicts)

**For Planner:**
- Create plan in `PLAN_*.md`
- Update your `active-<username>.md` to point to it

**Sync:**
Run `npx aiknowsys sync-plans` to regenerate this index from individual plan files.

---

*This file is auto-generated. Manual edits will be overwritten.*  
*Edit your individual plan file: `plans/active-<username>.md`*
```

**3.3 Register sync-plans command** (File: `bin/cli.js`)
- Add `.command('sync-plans')`
- Optional: Run automatically after init/pull

---

### Step 4: Migration for Existing Projects ✅
**Goal:** Graceful upgrade from single to multi-developer system

**4.1 Update migration script** (File: `scripts/migrate-learned-patterns.js`)
```javascript
// Add to existing migration script:

// 5. Create plans directory
const plansDir = join(process.cwd(), '.aiknowsys', 'plans');
mkdirSync(plansDir, { recursive: true });
console.log(`✅ Created: ${plansDir}`);

// 6. Migrate CURRENT_PLAN.md to active-<username>.md
const currentPlanPath = join(process.cwd(), '.aiknowsys', 'CURRENT_PLAN.md');
if (existsSync(currentPlanPath)) {
  const currentPlan = readFileSync(currentPlanPath, 'utf-8');
  const activePlanPath = join(plansDir, `active-${username}.md`);
  
  // Extract "Currently Working On" line
  const match = currentPlan.match(/\*\*Currently Working On:\*\* (.+)/);
  if (match) {
    const content = `# Active Plan: ${username}\n\n**Currently Working On:** ${match[1]}\n**Last Updated:** ${new Date().toISOString().split('T')[0]}\n\n---\n\n*Migrated from CURRENT_PLAN.md*`;
    writeFileSync(activePlanPath, content);
    console.log(`✅ Migrated CURRENT_PLAN.md → plans/active-${username}.md`);
  }
}

// 7. Create reviews directory
const reviewsDir = join(process.cwd(), '.aiknowsys', 'reviews');
mkdirSync(reviewsDir, { recursive: true });
console.log(`✅ Created: ${reviewsDir}`);

// 8. Migrate PENDING_REVIEW.md to PENDING_<username>.md
const pendingReviewPath = join(process.cwd(), '.aiknowsys', 'PENDING_REVIEW.md');
if (existsSync(pendingReviewPath)) {
  const review = readFileSync(pendingReviewPath, 'utf-8');
  const userReviewPath = join(reviewsDir, `PENDING_${username}.md`);
  writeFileSync(userReviewPath, review);
  console.log(`✅ Migrated PENDING_REVIEW.md → reviews/PENDING_${username}.md`);
  console.log('⚠️  Old PENDING_REVIEW.md can be deleted manually');
}

// 9. Regenerate CURRENT_PLAN.md as index
console.log('\n📋 Run: npx aiknowsys sync-plans (to regenerate team index)');
```

---

### Step 5: Documentation ✅
**Goal:** Explain multi-developer system

**5.1 Update ESSENTIALS template** (File: `templates/CODEBASE_ESSENTIALS.template.md`)
```markdown
## Multi-Developer Collaboration

### Plan Tracking
- **Your plan:** `.aiknowsys/plans/active-<username>.md` (committed)
- **Team index:** `CURRENT_PLAN.md` (auto-generated)
- **Workflow:** Planner creates plan → update your active file → team sees progress

### Architect Reviews
- **Your review:** `.aiknowsys/reviews/PENDING_<username>.md` (gitignored)
- **Workflow:** Architect reviews → writes to your file → you address → delete file
- **Why gitignored:** Reviews are ephemeral, no team visibility needed

### Learned Patterns (Phase 1)
- **Personal:** `.aiknowsys/personal/<username>/` (gitignored)
- **Team:** `.aiknowsys/learned/` (committed)
- **Share:** `npx aiknowsys share-pattern <name>`
```

**5.2 Update AGENTS.md** (File: `templates/AGENTS.template.md`)
```markdown
## Plan Management (Multi-Developer)

**Your plan file:** `.aiknowsys/plans/active-<username>.md`
**Team index:** `CURRENT_PLAN.md` (auto-generated)

**Workflow:**
1. Planner creates plan in `PLAN_*.md`
2. Update your `active-<username>.md` to point to it
3. Teammates see your progress (no merge conflicts)
4. On completion, mark plan complete

**Architect Review (Multi-Developer):**
- Architect writes to `.aiknowsys/reviews/PENDING_<username>.md`
- Developer reads and addresses
- Developer deletes file after completion
- No overwrites, no conflicts
```

---

## Testing Strategy

**Unit Tests:**
- `test/sync-plans.test.js` - Aggregate plans into CURRENT_PLAN.md
- `test/init.test.js` - Create plans/ and reviews/ directories

**Integration Tests:**
- Multiple developers with separate active plans (no conflicts)
- Architect review workflow (per-developer files)
- Migration script for existing projects

**Manual Validation:**
```bash
# 1. Run migration
node scripts/migrate-learned-patterns.js

# 2. Verify plan tracking
ls .aiknowsys/plans/
# (should see active-<username>.md)

# 3. Verify reviews directory
ls .aiknowsys/reviews/
# (should exist, with README)

# 4. Sync team index
npx aiknowsys sync-plans

# 5. Check CURRENT_PLAN.md
cat .aiknowsys/CURRENT_PLAN.md
# (should show team index with all developers)
```

---

## Success Criteria

- [ ] `.aiknowsys/plans/` directory created (committed)
- [ ] `.aiknowsys/reviews/` directory created (gitignored)
- [ ] `plans/active-<username>.md` per developer
- [ ] `reviews/PENDING_<username>.md` for per-developer reviews
- [ ] `npx aiknowsys sync-plans` regenerates CURRENT_PLAN.md index
- [ ] Migration script handles existing CURRENT_PLAN.md and PENDING_REVIEW.md
- [ ] Agent instructions updated (Developer, Architect, Planner)
- [ ] Documentation updated (ESSENTIALS, AGENTS)
- [ ] All tests passing
- [ ] No merge conflicts on plans or reviews ✅

---

## Risks & Mitigations

**Risk 1: Solo developers get extra complexity**
- **Likelihood:** High
- **Impact:** Low (extra files, but harmless)
- **Mitigation:** 
  - Auto-detect team size (1 dev = simple mode)
  - Or: Keep both systems working (backward compatible)

**Risk 2: CURRENT_PLAN.md out of sync**
- **Likelihood:** Medium (manual updates)
- **Impact:** Low (just an index)
- **Mitigation:**
  - Auto-run `sync-plans` on git pull (Phase 3 hook)
  - Document that it's auto-generated

**Risk 3: Developers don't adopt new workflow**
- **Likelihood:** Medium (habit)
- **Impact:** Low (old system still works)
- **Mitigation:**
  - Migration script does it automatically
  - Clear documentation
  - Agents enforce new file locations

---

## Notes for Developer

**Auto-Detection of Team Size:**
```javascript
function isMultiDeveloper() {
  const plansDir = join('.aiknowsys', 'plans');
  if (!existsSync(plansDir)) return false;
  
  const planFiles = fs.readdirSync(plansDir).filter(f => f.startsWith('active-'));
  return planFiles.length > 1;
}

// If solo developer, can keep old workflow
// If multi-developer, use new system
```

**Sync Plans Algorithm:**
```javascript
async function syncPlans() {
  const plansDir = join('.aiknowsys', 'plans');
  const planFiles = fs.readdirSync(plansDir).filter(f => f.startsWith('active-'));
  
  const developers = [];
  for (const file of planFiles) {
    const username = file.replace('active-', '').replace('.md', '');
    const content = readFileSync(join(plansDir, file), 'utf-8');
    
    // Extract current plan
    const match = content.match(/\*\*Currently Working On:\*\* (.+)/);
    const planName = match ? match[1] : 'None';
    
    developers.push({ username, planName, file });
  }
  
  // Generate CURRENT_PLAN.md
  const currentPlan = generateTeamIndex(developers);
  writeFileSync(join('.aiknowsys', 'CURRENT_PLAN.md'), currentPlan);
}
```

---

**Estimated Time:** 1.5-2 hours  
**Lines Added:** ~300-400 (code + tests + docs)  
**Complexity:** Medium (file aggregation, migration)

---

**Phase 1 Prerequisite:** Personal/shared pattern split ✅  
**Phase 3 Preview:** Pre-commit hook automation (learned-reminder.cjs, plan-reminder.cjs)
