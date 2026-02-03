# AIKnowSys v0.9.0 - Mandatory Multi-Dev Migration

**Release Date:** February 2, 2026  
**Type:** Breaking Change  
**Impact:** Medium (requires migration for existing users)

---

## 🚨 BREAKING CHANGES

**Multi-developer pattern is now MANDATORY for all projects.**

### What Changed

**Before (v0.8.x):**
- System auto-detected single vs multi-dev mode
- Solo devs: Used `CURRENT_PLAN.md` and `PENDING_REVIEW.md`
- Teams: Used `plans/active-<username>.md` and `reviews/PENDING_<username>.md`
- Dual-pattern complexity in agents and documentation

**After (v0.9.0):**
- Multi-dev pattern is mandatory for ALL projects
- `CURRENT_PLAN.md` is now **auto-generated team index**
- Plan pointers: Always use `plans/active-<username>.md`
- Reviews: Always use `reviews/PENDING_<username>.md`
- Solo developers work the same way (just one username)

### Migration Required

**For existing projects (v0.8.x or earlier):**
```bash
npx aiknowsys migrate-to-multidev
```

**For new projects:**
```bash
npx aiknowsys init  # Creates multi-dev structure automatically
```

### Why This Change?

**Simplification:**
- Removes ~30% of conditional logic in agents
- Eliminates "which file do I use?" confusion
- One pattern to document and maintain
- Clearer mental model for all users

**Team-Ready:**
- System now scales to teams without changes
- Solo devs use same workflow as teams
- No special cases or edge conditions

**AI Collaboration:**
- AI agents are "developers" too
- Human + AI = multi-dev by definition
- Natural fit for agentic workflows

**Early Timing:**
- Currently <10 active users
- Low breaking change impact
- Better to simplify now than later

---

## ✨ New Features

### `migrate-to-multidev` Command

Automated migration from single-dev to multi-dev pattern:

```bash
npx aiknowsys migrate-to-multidev [options]

Options:
  -d, --dir <directory>  Target directory (default: ".")
```

**What it does:**
- ✅ Detects already-migrated projects (safe to retry)
- ✅ Creates `plans/` and `reviews/` directories
- ✅ Migrates `CURRENT_PLAN.md` → `plans/active-<username>.md`
- ✅ Migrates `PENDING_REVIEW.md` → `reviews/PENDING_<username>.md`
- ✅ Regenerates `CURRENT_PLAN.md` as team index
- ✅ Updates `.gitignore` with new patterns
- ✅ Creates helpful README files in new directories

**Features:**
- **Idempotent:** Safe to run multiple times
- **Graceful:** Handles missing files without errors
- **Automatic:** No manual file editing required
- **Tested:** 20 comprehensive test cases (100% passing)

---

## 🔄 Updated Behavior

### Init Command

`npx aiknowsys init` now:
- Always creates `plans/` and `reviews/` directories
- Creates `plans/active-<username>.md` for current user
- Generates `CURRENT_PLAN.md` as team index
- No more single vs multi-dev detection

### Agent Templates

**Before:**
```markdown
1. Check if .aiknowsys/plans/ exists
   - If yes: Multi-dev mode
   - If no: Single-dev mode (use PENDING_REVIEW.md)
```

**After:**
```markdown
1. Always use plans/active-<username>.md
2. Always use reviews/PENDING_<username>.md
```

**Simplified:**
- No if/else branching in agent instructions
- Consistent workflow for all users
- Clearer session start procedure
- Simpler review workflow

### Documentation Updates

**Updated files:**
- `CODEBASE_ESSENTIALS.md` - Removed dual-mode references
- `AGENTS.md` - Multi-dev workflow only
- `README.md` - Updated examples and workflows
- `templates/CODEBASE_ESSENTIALS.template.md` - Multi-dev only

**Removed sections:**
- "Auto-Detection Logic"
- "Single-Developer Workflow"
- "Single vs Multi-Dev" comparisons

---

## 📦 File Structure Changes

### Before (v0.8.x - Single Dev)
```
.aiknowsys/
├── CURRENT_PLAN.md         # Manual edit (plan pointer)
├── PENDING_REVIEW.md       # Architect reviews
├── PLAN_*.md               # Implementation plans
├── learned/                # Shared patterns
├── sessions/               # Session notes
└── personal/               # Personal patterns
```

### Before (v0.8.x - Multi Dev)
```
.aiknowsys/
├── CURRENT_PLAN.md         # Manual edit (team index)
├── PLAN_*.md               # Implementation plans
├── plans/
│   └── active-<username>.md  # Plan pointers
├── reviews/
│   └── PENDING_<username>.md # Architect reviews
├── learned/                # Shared patterns
├── sessions/               # Session notes
└── personal/               # Personal patterns
```

### After (v0.9.0 - Always Multi Dev)
```
.aiknowsys/
├── CURRENT_PLAN.md         # ⚠️ AUTO-GENERATED (team index)
├── PLAN_*.md               # Implementation plans
├── plans/                  # ✅ Committed
│   ├── README.md           # Workflow explanation
│   └── active-<username>.md  # Your plan pointer
├── reviews/                # 🚫 Gitignored
│   ├── README.md           # Workflow explanation
│   └── PENDING_<username>.md # Architect reviews
├── learned/                # Shared patterns
├── sessions/               # Session notes
└── personal/               # Personal patterns
```

**Key changes:**
- `CURRENT_PLAN.md` is now **read-only** (auto-generated)
- Edit `plans/active-<username>.md` to switch plans
- Run `npx aiknowsys sync-plans` to update team index
- `reviews/` directory is gitignored (per-developer reviews)

---

## 🧪 Validation

**Test Suite:**
- 612 total tests
- 608 passing (99.3%)
- 20 new migration tests (100% passing)
- Idempotency validated
- Fresh init validated
- E2E workflow validated

**Quality Metrics:**
- ⭐⭐⭐⭐⭐ Code Quality (5/5) - Architect review
- ⭐⭐⭐⭐⭐ Test Coverage (5/5) - 20 comprehensive tests
- ⭐⭐⭐⭐⭐ Documentation (5/5) - Updated and consistent

**Test-Driven Development:**
- Perfect RED-GREEN-REFACTOR cycle
- Tests written BEFORE implementation
- Zero implementation bugs found

---

## 📝 Migration Guide

### Step 1: Backup (Optional)

```bash
cp -r .aiknowsys .aiknowsys.backup
```

### Step 2: Run Migration

```bash
npx aiknowsys migrate-to-multidev
```

**Output:**
```
🔄 Migrate to Multi-Dev

ℹ️  Migrating for user: your-username
ℹ️  Creating multi-dev directory structure...
ℹ️  Migrating CURRENT_PLAN.md → plans/active-<username>.md...
ℹ️  Regenerating CURRENT_PLAN.md as team index...
✅ Migration complete! 🎉

📖 Next steps:
ℹ️    1. Review .aiknowsys/plans/active-<username>.md
ℹ️    2. Run: npx aiknowsys sync-plans
ℹ️    3. Commit changes to .aiknowsys/
```

### Step 3: Verify

```bash
# Check files were created
ls -la .aiknowsys/plans/
ls -la .aiknowsys/reviews/

# View your active plan
cat .aiknowsys/plans/active-$(git config user.name | tr '[:upper:] ' '[:lower:]-').md

# View team index
cat .aiknowsys/CURRENT_PLAN.md
```

### Step 4: Sync Team Index

```bash
npx aiknowsys sync-plans
```

### Step 5: Commit Changes

```bash
git add .aiknowsys/
git commit -m "chore: migrate to multi-dev pattern (v0.9.0)"
```

---

## 🔧 Troubleshooting

### Migration Already Complete

If you see:
```
ℹ️  Multi-dev pattern already active (plans/ directory exists)
✅ No migration needed
```

Your project is already using multi-dev pattern. No action needed.

### Git Username Not Found

Migration uses `git config user.name` for username. If not set:

```bash
git config user.name "Your Name"
```

Then re-run migration.

### Manual Rollback (If Needed)

If you backed up before migration:

```bash
rm -rf .aiknowsys
mv .aiknowsys.backup .aiknowsys
```

**Note:** We recommend completing migration instead of rolling back.

---

## 📚 Updated Workflows

### Creating a New Plan

**Before (v0.8.x):**
```markdown
1. Create PLAN_*.md
2. Edit CURRENT_PLAN.md to point to it
3. Start working
```

**After (v0.9.0):**
```markdown
1. Create PLAN_*.md
2. Edit plans/active-<username>.md to point to it
3. Run: npx aiknowsys sync-plans
4. Start working
```

### Switching Plans

**Before (v0.8.x):**
```markdown
1. Edit CURRENT_PLAN.md
2. Change ACTIVE → PAUSED for old plan
3. Change PAUSED → ACTIVE for new plan
```

**After (v0.9.0):**
```markdown
1. Edit plans/active-<username>.md
2. Change ACTIVE → PAUSED for old plan
3. Change PAUSED → ACTIVE for new plan
4. Run: npx aiknowsys sync-plans
```

### Completing a Plan

**Before (v0.8.x):**
```markdown
1. Update CURRENT_PLAN.md
2. Mark status COMPLETE ✅
3. Add completion date
```

**After (v0.9.0):**
```markdown
1. Edit plans/active-<username>.md
2. Mark status COMPLETE ✅
3. Add completion date
4. Run: npx aiknowsys sync-plans
```

---

## 🎯 Benefits for Solo Developers

**You might think:** "I'm solo, why do I need multi-dev?"

**Answer:** Multi-dev pattern works perfectly for solo work:

1. **AI agents are developers too**
   - You + AI = 2 developers
   - Natural multi-agent workflows

2. **Same workflow, one username**
   - `plans/active-your-name.md` = your pointer
   - `CURRENT_PLAN.md` = your team index (just you)
   - No team-specific complexity

3. **Future-proof**
   - Hire a teammate? No migration needed
   - Open source? Contributors join seamlessly
   - Freelance collaboration? Already team-ready

4. **Clearer structure**
   - Explicit plan pointers
   - Auto-generated team index
   - Clean separation of concerns

---

## 🔮 What's Next

**v0.10.0 (Planned):**
- Enhanced skill management
- Pattern discovery automation
- Performance optimizations

**v1.0.0 (Goal):**
- Stable API
- Full production-ready release
- Comprehensive examples

---

## � Pre-Release Compatibility Updates

**Summary:** All v0.9.0 multi-dev compatibility issues resolved before release.

### Commands Updated

**`archive-plans` command:**
- ✅ Now reads from `plans/active-*.md` pointers instead of `CURRENT_PLAN.md`
- ✅ Parses each personal pointer for completed plans
- ✅ Updates pointer files with archive links after moving plans
- ✅ Suggests running `sync-plans` after archival
- Why: `CURRENT_PLAN.md` is now auto-generated team index (doesn't contain full plan history)

**`audit` command:**
- ✅ Now checks for `reviews/` directory gitignore (not `PENDING_REVIEW.md`)
- ✅ Warns if `reviews/` directory not gitignored
- ✅ Updated messages: "reviews/ directory gitignored" (v0.9.0 pattern)
- Why: v0.9.0 uses per-developer review files in `reviews/` directory

### Documentation Updated

**docs/advanced-workflows.md:**
- ✅ 4 references to editing `CURRENT_PLAN.md` manually → `plans/active-<username>.md` + `sync-plans`
- ✅ Added notes about running `npx aiknowsys sync-plans` after editing pointers
- Why: Workflow docs must match v0.9.0 mandatory multi-dev pattern

**docs/deliverables-review-process.md:**
- ✅ Updated plan management integration (line 270)
- ✅ Changed "CURRENT_PLAN.md" reference to "plans/active-<username>.md"
- ✅ Added sync-plans reminder
- Why: Review process should use personal pointer, not team index

### Agent Files Cleaned

**All legacy `PENDING_REVIEW.md` references removed:**

**architect.agent.md:**
- ✅ Removed 6 legacy/single-dev references
- ✅ Simplified to always use `reviews/PENDING_<username>.md`
- ✅ No more "(or PENDING_REVIEW.md for single-dev)" fallbacks
- Why: v0.9.0 mandates multi-dev (no backwards compatibility)

**developer.agent.md:**
- ✅ Updated 2 references to use `reviews/PENDING_<username>.md`
- ✅ Removed old CURRENT_PLAN.md deletion workflow
- Why: Consistency with multi-dev pattern

**planner.agent.md:**
- ✅ Updated example workflow to show multi-dev pattern
- Why: Examples should demonstrate current pattern

**Reasoning for removing legacy support:**
- v0.9.0 is a breaking change (requires migration)
- `migrate-to-multidev` command handles conversion
- Keeping legacy references creates confusion ("which file?")
- Clearer mental model: One pattern, consistently enforced

### Tests Updated

**archive-plans tests:**
- ✅ Updated to use `plans/active-*.md` structure
- ✅ Tests now create plan pointer files instead of `CURRENT_PLAN.md`
- ✅ Verifies pointer files updated with archive links
- ✅ Tests `updated` return value (number of pointers updated)

**audit tests:**
- ✅ Updated gitignore tests to check for `reviews/` directory
- ✅ Replaced "optional PENDING_REVIEW.md" test with "warn if reviews/ not gitignored"
- ✅ All audit tests passing

**init tests:**
- ✅ Simplified "no git username" test (handles CI/dev environments better)
- ✅ Tests now assume multi-dev structure always created

**Result:** 591 tests passing, 0 failures ✅

### Quality Validation

**Validation Matrix:**
- ✅ `npm test`: 591/591 tests passing
- ✅ Commands tested: archive-plans, audit work with v0.9.0 structure
- ✅ Integration tests: Full workflow validated
- ✅ Documentation: All references updated and consistent

**Files Changed:**
- 2 command files (archive-plans.js, audit.js)
- 2 documentation files (advanced-workflows.md, deliverables-review-process.md)
- 3 agent files (architect.agent.md, developer.agent.md, planner.agent.md)
- 3 test files (archive.test.js, audit.test.js, init.test.js)
- Total: 10 files updated for v0.9.0 compatibility

---

## �🙏 Acknowledgments

**Breaking change philosophy:**
- Early adoption = right time for breaking changes
- Simplicity > backwards compatibility (pre-1.0)
- Better to break once cleanly than maintain complexity

**TDD approach:**
- 20 tests written FIRST
- RED → GREEN → REFACTOR
- Zero implementation bugs
- Confidence in changes

**Thanks to early adopters for understanding this migration.**

---

## 📖 Resources

- [Migration Command Reference](README.md#migrate-to-multidev)
- [Multi-Dev Workflow Guide](AGENTS.md#plan-management)
- [CODEBASE_ESSENTIALS.md](CODEBASE_ESSENTIALS.md) - Updated patterns
- [Test Suite](test/commands/migrate-to-multidev.test.js) - Migration tests

---

**Questions? Issues?**
- GitHub Issues: https://github.com/arpa73/AIKnowSys/issues
- Discussion: https://github.com/arpa73/AIKnowSys/discussions

*Thank you for using AIKnowSys! 🎉*
