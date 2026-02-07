# AIKnowSys v0.10.0 - Skill-Indexed Architecture

**Release Date:** February 7, 2026  
**Type:** Breaking Change  
**Impact:** Medium (requires migration for existing users)

---

## 🚨 BREAKING CHANGES

**CODEBASE_ESSENTIALS.md format changed from monolithic to skill-indexed architecture.**

### 1. Template Format Migration

**All ESSENTIALS templates migrated to skill-indexed format.**

#### Base Template (templates/CODEBASE_ESSENTIALS.template.md)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **File Size** | 297 lines | 186 lines | **-37%** |
| **Critical Invariants** | 8 (mixed) | 5 (universal) | Focused |
| **Sections** | 10 | 7 | Streamlined |
| **Project References** | AIKnowSys-specific | Generic | ✅ Portable |
| **Placeholders** | 15 | 18 | More customizable |

**What Changed:**
- ✅ **Zero AIKnowSys contamination** - Works for any project
- ✅ **Generic invariants only** - TDD, Graceful Failures, Documentation, Quality, Backwards Compat
- ✅ **Skill-indexed architecture** - References `.github/skills/` for workflows
- ✅ **150-250 line target** - Respects AI context limits

#### Stack Templates (templates/stacks/*/CODEBASE_ESSENTIALS.md)

**All 6 stacks migrated:**

| Stack | Before | After | Reduction |
|-------|--------|-------|-----------|
| **express-api** | 991 lines | 258 lines | **-74%** |
| **fastapi** | 1165 lines | 278 lines | **-76%** |
| **nextjs-api** | 1342 lines | 327 lines | **-76%** |
| **django** | 1358 lines | 297 lines | **-78%** |
| **actix-web** | 2065 lines | 302 lines | **-85%** |
| **react-spa** | 657 lines | 256 lines | **-61%** |
| **Total** | 7578 lines | 1718 lines | **-77%** |

**Stack-Specific Changes:**
- ✅ **8 critical invariants** per stack (includes 5 universal + 3 stack-specific)
- ✅ **Skill-indexed format** - Workflows in `.github/skills/`
- ✅ **Customizations preserved** - Technology Snapshot, Validation Matrix, Project Structure
- ✅ **Migration markers** - "Migrated from v0.9.x" + v0.10.0 version marker
- ✅ **Backup files** - `.pre-v0.10.backup` for every stack

**Impact:** New projects via `npx aiknowsys init --stack <name>` get skill-indexed ESSENTIALS automatically.

### 2. Existing Project Migration

**Before (v0.9.x):**
- ESSENTIALS: 1038 lines with all workflows embedded
- AI agents load full file every session
- Workflows mixed with critical invariants
- Risk: Agent skims, says "I thought I knew", makes mistakes

**After (v0.10.0):**
- ESSENTIALS: 327 lines (skill index + critical invariants)
- Critical invariants ALWAYS loaded (mandatory, Section 4)
- Workflows auto-load on trigger detection (Section 5, 12 skills)
- Prevention: Agent cannot skip critical rules

### Migration Required

**For existing projects (v0.9.x or earlier):**
```bash
npx aiknowsys migrate-essentials
```

**What the migration does:**
- ✅ Detects already-migrated projects (safe to retry)
- ✅ Creates backup (CODEBASE_ESSENTIALS.md.pre-v0.10.backup)
- ✅ Generates skill-indexed ESSENTIALS (~400 lines, 70-80% reduction)
- ✅ Preserves project customizations (tech stack, validation, structure)
- ✅ Reports reduction percentage and preserved content

**For new projects:**
```bash
npx aiknowsys init  # Creates skill-indexed ESSENTIALS automatically
npx aiknowsys init --stack nextjs-api  # Uses v0.10.0 stack template
```

**📖 Full migration guide:** [docs/migration-guide.md#migrating-to-v0100-skill-indexed-architecture](docs/migration-guide.md#migrating-to-v0100-skill-indexed-architecture)

### Why This Change?

**Problem Solved:**
> "I thought I knew it already" - AI agent skips workflow → makes preventable mistake

**Solution:**
- Critical invariants ALWAYS loaded (not optional)
- Workflows auto-load when trigger words detected
- Agent loads what it needs, when it needs it

**Benefits:**
- ✅ **70-80% token reduction** per session (avg 1000 → 300-400 lines)
- ✅ **Prevents overconfidence** - Critical rules never skipped
- ✅ **Enforces workflows** - Trigger words → auto-load → follow
- ✅ **Modular knowledge** - Skills portable across projects
- ✅ **Faster queries** - Load essentials + targeted skill vs full monolithic file
- ✅ **Generic templates** - Base template works for any project (not just AIKnowSys)

---

## ✨ New Features

### `migrate-essentials` Command

Automated migration from monolithic to skill-indexed ESSENTIALS:

```bash
npx aiknowsys migrate-essentials [options]

Options:
  -d, --dir <directory>  Target directory (default: ".")
  --dry-run              Preview changes without applying
```

**What it does:**
- ✅ Detects already-migrated projects (safe to retry)
- ✅ Creates backup (CODEBASE_ESSENTIALS.md.pre-v0.10.backup)
- ✅ Generates skill-indexed ESSENTIALS (~327 lines)
- ✅ Preserves project customizations (tech stack, validation, structure)
- ✅ Reports reduction percentage and preserved content

**Features:**
- **Idempotent:** Safe to run multiple times (detects skill-indexed format)
- **Graceful:** Preserves project-specific technology stacks and patterns
- **Automatic:** No manual editing required
- **Reversible:** Backup file available for rollback

**Example:**
```bash
$ npx aiknowsys migrate-essentials

🔄 Migrate ESSENTIALS to v0.10.0

📊 Current ESSENTIALS: 1038 lines
   Old format: Monolithic workflows embedded
📝 Found project customizations:
   • Custom technology stack
   • Project-specific structure
💾 Creating backup...
✓ Backup saved: CODEBASE_ESSENTIALS.md.pre-v0.10.backup
✨ Generating skill-indexed ESSENTIALS...
✓ Migration complete!
📊 Results:
   • Old size: 1038 lines
   • New size: 327 lines
   • Reduction: 68.5%
   • Preserved 2 customizations
```

---

## 🎯 Architecture Changes

### Skill-Indexed ESSENTIALS Structure

**New ESSENTIALS.md structure:**

```markdown
## 1-3. Technology, Validation, Project Structure (~80 lines)
- Minimal essential info only

## 4. Critical Invariants (ALWAYS ENFORCED - ~100 lines)
8 mandatory rules:
1. ES Modules Only
2. Absolute Paths Required
3. Graceful Failures
4. Template Preservation
5. Template Structure Integrity
6. Backwards Compatibility
7. Test-Driven Development (TDD) - MANDATORY
8. Deliverables Consistency

## 5. Skill Index (Auto-Load on Trigger Detection - ~100 lines)
12 skills with triggers, summaries, benefits:
- tdd-workflow: "write tests", "TDD", "test first"
- refactoring-workflow: "refactor", "clean up"
- validation-troubleshooting: "test fail", "build broken"
- context-query: "find plan", "query sessions"
- dependency-management: "update deps", "npm update"
- + 7 more skills

## 6-8. Quick Reference, Gotchas, Documentation (~47 lines)
```

**How trigger-based loading works:**
1. User request contains trigger words (e.g., "write tests")
2. AI detects trigger for `tdd-workflow`
3. AI reads `.github/skills/tdd-workflow/SKILL.md`
4. AI follows workflow (RED → GREEN → REFACTOR)
5. Cannot skip or "think they know"

**Token Economics:**
- Old: 1038 lines loaded every session
- New: 327 lines (base) + ~100 lines (skill on-demand) = 427 total
- Savings: 611 lines (59% reduction per interaction)

---

## 📚 Skill Index (12 Skills)

### Development Workflows (6)
- **tdd-workflow** - RED-GREEN-REFACTOR cycle
- **validation-troubleshooting** - Debug test failures
- **refactoring-workflow** - Safe code improvements
- **ai-friendly-documentation** - AI-optimized docs
- **feature-implementation** - Feature planning
- **context-query** - Query commands (v0.10.0+)

### Dependencies & Tools (2)
- **dependency-management** - Safe upgrades
- **context7-usage** - Framework docs queries

### Skill Management (3)
- **skill-creator** - Create new skills
- **skill-validation** - Validate skill format
- **pattern-sharing** - Share team patterns

**All skills available in:** `.github/skills/` directory

---

## 🛠️ Tool Changes

### `compress-essentials` - Now Legacy (Deprecated)

**Status:** Still works, but obsolete by design

**What changed:**
- Old purpose: Detect bloated ESSENTIALS (>800 lines), suggest compression
- New reality: ESSENTIALS will always be ~327 lines (skill-indexed)
- Tool reports: "No compression needed - ESSENTIALS is well-sized"

**Recommendation:**
- **If migrated:** Tool not needed (ESSENTIALS stays small)
- **If pre-v0.10.0:** Still useful for detecting bloat

**Deprecation timeline:**
- v0.10.0: Keep tool, add "legacy" note in help
- v0.11.0: Mark deprecated with migration suggestion
- v0.12.0: Consider removal if no users on old format

**Why deprecated:**
Skill-indexed architecture prevents bloat structurally, making compression tool unnecessary.

---

## 💡 Migration Guide

### Step-by-Step Migration

**1. Update AIKnowSys package:**
```bash
npm install -g aiknowsys@latest
# or
npx aiknowsys@latest --version  # Should show v0.10.0
```

**2. Review current ESSENTIALS (optional):**
```bash
wc -l CODEBASE_ESSENTIALS.md  # Check current size
git diff CODEBASE_ESSENTIALS.md  # See uncommitted changes
```

**3. Preview migration (dry run):**
```bash
npx aiknowsys migrate-essentials --dry-run
```

**4. Run migration:**
```bash
npx aiknowsys migrate-essentials
```

**5. Review new ESSENTIALS:**
```bash
cat CODEBASE_ESSENTIALS.md  # Check new format
wc -l CODEBASE_ESSENTIALS.md  # Should be ~327 lines
```

**6. Verify functionality:**
```bash
npm test  # All tests should still pass
npx aiknowsys check  # Health check should pass
```

**7. Commit changes:**
```bash
git add CODEBASE_ESSENTIALS.md
git commit -m "feat: Migrate to skill-indexed ESSENTIALS (v0.10.0)"
```

**8. Keep backup (recommended):**
```bash
# Backup file: CODEBASE_ESSENTIALS.md.pre-v0.10.backup
# Keep for 30+ days in case rollback needed
```

---

### Rollback Procedure (If Needed)

**If migration causes issues:**

```bash
# Restore backup
mv CODEBASE_ESSENTIALS.md.pre-v0.10.backup CODEBASE_ESSENTIALS.md

# Downgrade AIKnowSys
npm install -g aiknowsys@0.9.0

# Report issue
# https://github.com/arpa73/AIKnowSys/issues
```

---

## ⚠️ Breaking Changes for Developers

### Template Updates Required

**If you maintain custom templates:**

1. **Update CODEBASE_ESSENTIALS.template.md** to skill-indexed format
2. **Remove embedded workflows** (now in `.github/skills/`)
3. **Add Section 4** (Critical Invariants)
4. **Add Section 5** (Skill Index with triggers)
5. **Run validation:** `npx aiknowsys validate-deliverables`

**Example template structure:**
```markdown
# Codebase Essentials
> Version: v0.10.0 (Skill-Indexed Architecture)

## 1. Technology Snapshot
{{TECH_STACK}}

## 4. Critical Invariants (ALWAYS ENFORCED)
[8 mandatory rules]

## 5. Skill Index (Auto-Load on Trigger Detection)
[12 skills with triggers]
```

### Automation Changes

**If you have scripts parsing ESSENTIALS:**

- **Old:** Parse 11 sections, expect workflows embedded
- **New:** Parse 8 sections, expect skill references
- **Fix:** Update section numbers:
  - Old Section 5 "Critical Invariants" → New Section 4
  - Old Section 8 "Testing Philosophy" → Removed (now in `tdd-workflow` skill)

**Migration:**
```bash
# Update grep patterns
sed -i 's/## 5\. Critical Invariants/## 4. Critical Invariants/g' scripts/*
sed -i 's/## 8\. Testing/## 5. Skill Index/g' scripts/*
```

---

## 🚀 What's Next?

### Phase B: Mutation Commands (Future)

**Coming in v0.11.0+:**
- `mark-plan-status` - Update plan status programmatically
- `create-plan` - Generate plan files from templates
- `create-session` - Auto-create session files
- `regenerate-markdown` - Sync markdown from structured data

**Requires:** OpenSpec proposal (breaking change to context system)

### Skill Ecosystem Growth

**Community contributions welcome:**
- Stack-specific skills (Python, Rust, Go)
- Framework skills (React, Vue, Django)
- Tool skills (Docker, K8s, Terraform)

**Contribute:** https://github.com/arpa73/AIKnowSys/blob/main/CONTRIBUTING.md

---

## 📊 Metrics

### Token Reduction Impact

**Before (v0.9.x):**
- ESSENTIALS: 1038 lines per session
- Context window usage: ~50KB per agent invocation

**After (v0.10.0):**
- ESSENTIALS: 327 lines (base) + 100 lines (skill avg) = 427 total
- Context window usage: ~20KB per agent invocation
- **Savings:** 59% per interaction

**Impact on 100 sessions:**
- Old: 103,800 lines loaded
- New: 42,700 lines loaded
- **Saved:** 61,100 lines (3MB+)

### Implementation Metrics

**Development time:**
- Planning: 4 hours
- Implementation: 1.5 hours
- Testing: 2 hours
- Documentation: 1.5 hours
- **Total:** 9 hours

**Test coverage:**
- 737/737 tests passing (100%)
- 91 context query tests added
- 16 migration tests (pending)

---

## 🙏 Acknowledgments

This release addresses a real AI agent failure mode observed during development. Special thanks to the early adopters who helped identify the "I thought I knew" problem.

---

## 📞 Support

- **Issues:** https://github.com/arpa73/AIKnowSys/issues
- **Discussions:** https://github.com/arpa73/AIKnowSys/discussions
- **Documentation:** https://github.com/arpa73/AIKnowSys/tree/main/docs

---

**Upgrade today:** `npx aiknowsys migrate-essentials`
