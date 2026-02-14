# Implementation Plan: Fix Template Issues for v0.10.0

**Status:** 🎯 READY FOR IMPLEMENTATION  
**Created:** 2026-02-07  
**Timeline:** 3-6 hours  
**Goal:** Fix base template contamination + migrate stack templates to skill-indexed format

---

## Overview

Two critical issues block v0.10.0 release:

1. **Base template contamination** - `templates/CODEBASE_ESSENTIALS.template.md` has AIKnowSys-specific content
2. **Stack templates outdated** - 6 stack templates use old monolithic format (2000+ lines)

**Solution:**
- Make base template fully generic (works for ANY project type)
- Migrate all stack templates to skill-indexed format (~400 lines each)
- Validate with `validate-deliverables` and test `aiknowsys init` flow

---

## Prerequisites

- [x] Audit completed ([.aiknowsys/reviews/deliverables-audit-v0.10.0.md](.aiknowsys/reviews/deliverables-audit-v0.10.0.md))
- [x] migrate-essentials command exists and tested (13/13 tests passing)
- [x] Current CODEBASE_ESSENTIALS.md is skill-indexed (327 lines)
- [x] All 750 tests passing

---

## Phase 1: Fix Base Template (Make Fully Generic)

**Goal:** Remove all AIKnowSys-specific content, keep only universal patterns and `{{PLACEHOLDERS}}`

**Timeline:** 1-2 hours  
**Files affected:** 1 file ([templates/CODEBASE_ESSENTIALS.template.md](../templates/CODEBASE_ESSENTIALS.template.md))

---

### Step 1.1: Clean Section 1 (Technology Snapshot)

**Current:** Mix of placeholders and hardcoded values  
**Target:** All placeholders

**Action:**
```markdown
## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | {{RUNTIME}} |
| Language | {{LANGUAGE}} |
| Framework | {{FRAMEWORK}} |
| Database | {{DATABASE}} |
| ORM | {{ORM}} |
| Test Framework | {{TEST_FRAMEWORK}} |
| Package Manager | {{PACKAGE_MANAGER}} |

**Additional Libraries:**
{{ADDITIONAL_LIBRARIES}}
```

**Why:** Template must work for Python, Rust, Go, JavaScript, any tech stack  
**Dependencies:** None  
**Risk:** Low - straightforward replacement  
**Validation:** All values are `{{PLACEHOLDERS}}`, no hardcoded tech

---

### Step 1.2: Clean Section 2 (Validation Matrix)

**Current:** Mix of hardcoded AIKnowSys commands and placeholders  
**Target:** All placeholders

**Action:**
```markdown
## 2. Validation Matrix

| Command | Purpose | Expected |
|---------|---------|----------|
| `{{TEST_COMMAND}}` | Run tests | All {{TEST_COUNT}}+ tests pass |
| `{{LINT_COMMAND}}` | Lint code | No errors or warnings |
| `{{BUILD_COMMAND}}` | Build/compile | Clean build |
| `{{TYPE_CHECK_COMMAND}}` | Type check | No type errors |
| `{{FORMAT_COMMAND}}` | Format check | No formatting issues |

**Before claiming work complete:**
- [ ] All commands above pass
- [ ] No errors in output
- [ ] Changes tested locally
```

**Remove these lines:**
```markdown
| `npm test` | Run unit tests | All 737+ tests pass (Vitest output) |  ❌ Remove
| `npm run test:coverage` | Code coverage | >80% coverage on lib/ |  ❌ Remove
| `node bin/cli.js --help` | CLI works | Shows help without error |  ❌ Remove
```

**Why:** Users fill in their own tech-specific commands  
**Dependencies:** None  
**Risk:** Low - template already has placeholders  
**Validation:** Only `{{PLACEHOLDERS}}` remain, no hardcoded commands

---

### Step 1.3: Clean Section 3 (Project Structure)

**Current:** Hardcoded `aiknowsys/` directory structure  
**Target:** Only `{{PROJECT_NAME}}/` and `{{PROJECT_STRUCTURE}}`

**Action:**
```markdown
## 3. Project Structure

```
{{PROJECT_NAME}}/
{{PROJECT_STRUCTURE}}
```

**Common Patterns:**
{{COMMON_PATTERNS}}
```

**Remove these lines:**
```markdown
aiknowsys/  ❌ Remove
├── bin/cli.js  ❌ Remove
All hardcoded directory structure  ❌ Remove
```

**Why:** Every project has different structure  
**Dependencies:** None  
**Risk:** Low - clean replacement  
**Validation:** Only placeholders, no hardcoded paths

---

### Step 1.4: Refactor Section 4 (Critical Invariants)

**Current:** 8 invariants, many AIKnowSys-specific  
**Target:** 5 universal invariants applicable to any project

**Action:** Keep only universally applicable invariants

**KEEP (Universal):**

**Invariant #1: Test-Driven Development (TDD) - MANDATORY**
```markdown
### 1. Test-Driven Development (TDD) - MANDATORY
- **For new features:** Write tests BEFORE implementation (RED → GREEN → REFACTOR)
- **For bugfixes:** Write test that reproduces bug FIRST, then fix
- Follow RED-GREEN-REFACTOR cycle
- **Exception:** Configuration-only changes
```

**Invariant #2: Graceful Failures**
```markdown
### 2. Graceful Failures
- Handle missing files/directories gracefully
- Show helpful error messages, not stack traces
- Provide actionable guidance in errors
```

**Invariant #3: Documentation as Code**
```markdown
### 3. Documentation as Code
- Update docs when code changes
- Keep README.md current
- Document architectural decisions
- Changelog tracks changes
```

**Invariant #4: Code Quality Standards**
```markdown
### 4. Code Quality Standards
- Follow language/framework conventions
- Pass all linters and formatters
- Maintain test coverage >80%
- Review before merging
```

**Invariant #5: Backwards Compatibility**
```markdown
### 5. Backwards Compatibility
- Semantic versioning for breaking changes
- Deprecation warnings before removal
- Migration guides for major versions
```

**REMOVE (AIKnowSys-specific):**
- ❌ "ES Modules Only" (not universal - Python, Rust, Go don't use ESM)
- ❌ "Absolute Paths Required" (implementation detail)
- ❌ "Template Preservation" (AIKnowSys-specific)
- ❌ "Template Structure Integrity" (AIKnowSys-specific)
- ❌ "Deliverables Consistency" (AIKnowSys-specific)

**Why:** Template must work for ANY language/framework  
**Dependencies:** None  
**Risk:** Low - keeping proven patterns  
**Validation:** All 5 invariants apply to Python, Rust, Go, JavaScript projects

---

### Step 1.5: Refactor Section 5 (Skill Index)

**Current:** Lists AIKnowSys-specific skills with file paths  
**Target:** Generic skill index structure

**Action:**
```markdown
## 5. Skill Index (Auto-Load on Trigger Detection)

**How this works:**
1. AI agent detects trigger words in user request
2. AI loads relevant skill/workflow from [`.github/skills/`](.github/skills/)
3. AI follows workflow step-by-step (prevents "I thought I knew" failures)

**Why this prevents mistakes:**
- Critical invariants ALWAYS loaded (above section)
- Detailed workflows loaded ON-DEMAND
- 70-80% token reduction vs monolithic documentation

**Universal Skills (Framework-Agnostic):**

These skills work for ANY project type (Python, JavaScript, Rust, Go, etc.):

#### Development Workflows
- **tdd-workflow** - Test-driven development (RED-GREEN-REFACTOR cycle)
- **refactoring-workflow** - Safe code improvements with tests
- **validation-troubleshooting** - Debug test/build failures

#### Code Quality
- **ai-friendly-documentation** - AI-optimized docs for RAG systems
- **dependency-management** - Safe package upgrades

#### Architecture & Planning
- **feature-implementation** - Structured feature planning

**Project-Specific Skills:**

{{PROJECT_SKILLS}}

**Add your own skills:** Create `.github/skills/<skill-name>/SKILL.md` following [skill-creator](https://github.com/arpa73/AIKnowSys/blob/main/.github/skills/skill-creator/SKILL.md) pattern.
```

**Remove:**
- All AIKnowSys-specific skill file paths
- All `npx aiknowsys query-essentials` command examples
- Maintainer skills section
- context-query skill (AIKnowSys-specific)

**Why:** Template doesn't assume AIKnowSys CLI exists  
**Dependencies:** None  
**Risk:** Low - keeping concept, removing specifics  
**Validation:** No hardcoded file paths, works for any project

---

### Step 1.6: Remove Sections 6-10 (All AIKnowSys-Specific)

**Action:** Delete entire sections

**REMOVE:**
- ❌ **Section 6: Quick Reference** (AIKnowSys logger, CLI patterns)
- ❌ **Section 7: Common Gotchas** (ESM, Chalk, AIKnowSys-specific)
- ❌ **Section 8: Extending AIKnowSys** (entire section specific to AIKnowSys)
- ❌ **Section 9: Context Query Commands** (AIKnowSys CLI commands)
- ❌ **Section 10: When to Document Where** (AIKnowSys .aiknowsys/ structure)

**Replace with:**
```markdown
## 6. Quick Reference

### Validation Checklist
\```bash
{{TEST_COMMAND}}      # All tests pass
{{LINT_COMMAND}}      # No errors
{{BUILD_COMMAND}}     # Clean build
{{FORMAT_COMMAND}}    # Code formatted
\```

### Common Patterns

{{COMMON_PATTERNS_SECTION}}

---

## 7. When to Document Where

**Add to CODEBASE_ESSENTIALS.md when:**
- Core architecture decisions (technology choices)
- Critical invariants (cannot be violated)
- Project structure changes

**Add to .github/skills/ when:**
- Repeatable workflows (testing, deployment, refactoring)
- Multi-step processes requiring guidance
- Patterns that prevent common mistakes

**Add to project changelog when:**
- Features added or removed
- Breaking changes
- Bug fixes
- Performance improvements

---

**Target:** ESSENTIALS <400 lines  
**Full workflows:** Load from [.github/skills/](.github/skills/) on-demand
```

**Why:** Template must work without AIKnowSys CLI  
**Dependencies:** None  
**Risk:** Low - removing specific content  
**Validation:** No AIKnowSys references remain

---

### Step 1.7: Update File Header

**Current:** References v0.10.0 and AIKnowSys  
**Target:** Generic version-agnostic header

**Action:**
```markdown
# {{PROJECT_NAME}} - Codebase Essentials

> **Last Updated:** {{CURRENT_DATE}}  
> **Purpose:** {{PROJECT_PURPOSE}}  
> **Stack:** {{PRIMARY_STACK}}

---

## Knowledge System: Document Roles

This project uses AI-assisted development with structured knowledge files:

\```
CODEBASE_ESSENTIALS.md  ←  What the codebase IS (architecture, patterns, rules)
AGENTS.md               ←  How AI should WORK (workflow, validation, skills)
CODEBASE_CHANGELOG.md   ←  What HAPPENED (session history, decisions, learnings)
\```

**Skill-Indexed Architecture:**
- **Critical invariants** are ALWAYS loaded (mandatory rules)
- **Detailed workflows** load on-demand from [.github/skills/](.github/skills/)
- **Result:** 70-80% token reduction vs monolithic docs

---
```

**Remove:**
```markdown
> **Version:** v0.10.0 (Skill-Indexed Architecture)  ❌ Remove

⚠️ **MAJOR CHANGE:** ESSENTIALS is now a skill index...  ❌ Remove
**Full workflows** are in [`.github/skills/`](.github/skills/) (auto-loaded on trigger detection).  ❌ Remove
```

**Why:** Template shouldn't reference AIKnowSys version  
**Dependencies:** None  
**Risk:** Low - header update  
**Validation:** No version references, fully generic

---

### Phase 1 Success Criteria

After completing Phase 1:

- [ ] File size: 150-250 lines (down from 297)
- [ ] All content uses `{{PLACEHOLDERS}}` or generic patterns
- [ ] Zero AIKnowSys-specific references
- [ ] Works for Python, JavaScript, TypeScript, Rust, Go projects
- [ ] 5 universal critical invariants (TDD, Graceful Failures, Documentation, Quality, Backwards Compat)
- [ ] Skill index explains concept without specific file paths
- [ ] No mentions of: `aiknowsys`, `bin/cli.js`, `lib/`, `737 tests`, `Vitest`, `chalk`, `npx aiknowsys`
- [ ] Template validates with `validate-deliverables`

**Validation command:**
```bash
npx aiknowsys validate-deliverables --verbose
```

---

## Phase 2: Migrate Stack Templates to Skill-Indexed Format

**Goal:** Convert all 6 stack templates from monolithic (2000+ lines) to skill-indexed (~400 lines)

**Timeline:** 2-4 hours  
**Files affected:** 6 files

**Stack templates to migrate:**
1. `templates/stacks/express-api/CODEBASE_ESSENTIALS.md` (992 lines)
2. `templates/stacks/fastapi/CODEBASE_ESSENTIALS.md` (~1000 lines)
3. `templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md` (2066 lines)
4. `templates/stacks/nextjs/CODEBASE_ESSENTIALS.md` (~1800 lines)
5. `templates/stacks/vue-express/CODEBASE_ESSENTIALS.md` (~1500 lines)
6. `templates/stacks/vue-vite/CODEBASE_ESSENTIALS.md` (~1200 lines)

---

### Step 2.1: Extract Stack-Specific Content (Planning)

**Goal:** Identify what's unique to each stack vs what should be skills

**For each stack, categorize content:**

**KEEP in ESSENTIALS (Stack-Specific Critical Invariants):**
- Database connection patterns (Prisma singleton, SQLAlchemy async)
- Framework-specific gotchas (Next.js 15 params are Promises, FastAPI async caveat)
- Stack-specific validation (Prisma migrate before deploy)
- Tech-specific error handling (Next.js API errors, FastAPI exception handlers)

**EXTRACT to .github/skills/ (Universal Patterns):**
- Authentication patterns (JWT, bcrypt, sessions) → Universal across stacks
- Pagination patterns → Universal
- File upload patterns → Universal
- Error handling concepts → Universal
- Testing strategies → Universal

**Action for this step:**
- Read each stack template
- Create list of stack-critical vs universal content
- Plan which content stays vs moves to skills

**Example for Next.js API:**

**KEEP (Next.js-specific):**
```markdown
### Critical Invariant: Prisma Client Singleton Required
- ALWAYS use singleton pattern for Prisma client
- Prevents connection exhaustion in serverless
- Code: `lib/db.ts` exports single instance

### Critical Invariant: Next.js 15 Params Are Promises
- Route params in Next.js 15 are Promises
- ALWAYS await: `const { id } = await params;`
- Error if synchronous: `const id = params.id;` ❌

### Critical Invariant: Server Actions Return ActionResult
- All Server Actions must return `ActionResult<T>` type
- Enables client-side error handling
- Pattern: `{ success: true, data: T } | { success: false, error: string }`
```

**EXTRACT (Universal - goes to skills):**
- API route handler structure → Generic REST patterns
- Authentication with JWT → Universal auth skill
- Rate limiting → Universal middleware skill
- CORS configuration → Universal security skill

**Dependencies:** None (planning step)  
**Risk:** Low - just categorization  
**Output:** List of what stays vs what moves for each stack

---

### Step 2.2: Run migrate-essentials on Each Stack

**Goal:** Use tested migrate-essentials command to convert format

**For each stack template:**

**Step 2.2.1: Dry-run first**
```bash
npx aiknowsys migrate-essentials \
  --target templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md \
  --dry-run
```

**Expected output:**
```
🔍 Analyzing: templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md

Format detected: MONOLITHIC (2066 lines)
Customizations found:
  ✓ Tech stack: Next.js 15, Prisma, PostgreSQL
  ✓ Validation: npm test, prisma migrate
  ✓ Structure: app/, lib/, prisma/
  ✓ Patterns: Next.js API Routes, Server Actions

Preview of new format:
  - Section 1: Technology Snapshot (preserved)
  - Section 2: Validation Matrix (preserved)
  - Section 3: Project Structure (preserved)
  - Section 4: Critical Invariants (8 rules, ~250 lines)
  - Section 5: Skill Index (12 skills, ~100 lines)

Estimated size: 2066 → 420 lines (80% reduction)

🔸 Dry-run mode - no files modified
✓ Run without --dry-run to apply changes
```

**Step 2.2.2: Review output**
- Verify customizations preserved
- Check critical invariants make sense for stack
- Ensure skill index references stack-appropriate skills

**Step 2.2.3: Execute migration**
```bash
npx aiknowsys migrate-essentials \
  --target templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md
```

**Expected output:**
```
✅ Backup created: templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md.backup
✅ Migration complete: 2066 → 420 lines (80% reduction)
✅ Customizations preserved:
   - Tech stack: Next.js 15, Prisma, PostgreSQL
   - Validation commands: npm test, prisma migrate
   - Project structure: app/, lib/, prisma/

📊 Statistics:
   Before: 2066 lines
   After:  420 lines
   Reduction: 80%

✓ File updated: templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md
```

**Step 2.2.4: Manual review and adjustment**

After migration, manually review and adjust:

**Add stack-specific critical invariants** (from Step 2.1 planning):
```markdown
## 4. Critical Invariants

[Standard 8 invariants from migration]

### 9. Prisma Client Singleton Required (Next.js-Specific)
[Stack-specific rule]

### 10. Next.js 15 Params Are Promises (Next.js-Specific)
[Stack-specific rule]
```

**Update skill index** with stack-specific skills:
```markdown
## 5. Skill Index

[Universal skills]

**Next.js-Specific Skills:**
- **nextjs-api-patterns** - API Routes, Server Actions, middleware
- **prisma-patterns** - Database queries, transactions, migrations

Load with: `npx aiknowsys query-essentials "Next.js patterns"`
```

**Dependencies:** Phase 1 complete (so base template is clean)  
**Risk:** Low (migrate-essentials is tested, creates backups)  
**Validation:** Run validate-deliverables after each migration

**Repeat for all 6 stacks:**
1. express-api
2. fastapi
3. nextjs-api
4. nextjs
5. vue-express
6. vue-vite

---

### Step 2.3: Create Stack-Specific Skills (Optional)

**Goal:** Extract repeated patterns into reusable skills

**Candidates for extraction:**

**Skill: nextjs-api-patterns**
- File: `templates/skills/nextjs-api-patterns/SKILL.md`
- Content: API Routes, Server Actions, middleware, params handling
- Triggers: "API route", "server action", "Next.js API"
- 200-300 lines

**Skill: prisma-patterns**
- File: `templates/skills/prisma-patterns/SKILL.md`
- Content: Connection pooling, transactions, N+1 prevention
- Triggers: "database query", "prisma", "ORM"
- 200-300 lines

**Skill: fastapi-patterns**
- File: `templates/skills/fastapi-patterns/SKILL.md`
- Content: Async routes, dependency injection, Pydantic models
- Triggers: "FastAPI", "async route", "dependency injection"
- 200-300 lines

**Process:**
1. Identify common patterns across stack templates
2. Extract to skill file
3. Update stack ESSENTIALS to reference skill
4. Remove detailed implementation from ESSENTIALS

**Dependencies:** Step 2.2 complete  
**Risk:** Low (optional enhancement)  
**Note:** Can be done later (not blocker for v0.10.0)

---

### Phase 2 Success Criteria

After completing Phase 2:

- [ ] All 6 stack templates migrated
- [ ] File sizes: ~400 lines each (down from 1000-2000)
- [ ] Backups created for all templates
- [ ] Stack-specific customizations preserved (tech, validation, structure)
- [ ] Critical Invariants section includes 8 standard + 2-3 stack-specific
- [ ] Skill Index references stack-appropriate skills
- [ ] `validate-deliverables` passes for all stacks
- [ ] No broken `{{VARIABLE}}` references

**Validation commands:**
```bash
# Validate all deliverables
npx aiknowsys validate-deliverables --verbose

# Check file sizes
wc -l templates/stacks/*/CODEBASE_ESSENTIALS.md

# Check for broken variables
grep -r "{{[^}]*}}" templates/stacks/*/CODEBASE_ESSENTIALS.md
```

---

## Phase 3: Integration Testing

**Goal:** Verify `aiknowsys init` flow works with new templates

**Timeline:** 30 minutes  
**Files affected:** None (testing only)

---

### Step 3.1: Test Base Template Initialization

**Action:**
```bash
# Test in temporary directory
cd /tmp
mkdir test-aiknowsys-init
cd test-aiknowsys-init

# Initialize with base template (no stack)
aiknowsys init --name "test-project" --no-stack

# Verify CODEBASE_ESSENTIALS.md generated
cat CODEBASE_ESSENTIALS.md

# Check for issues
grep -i "aiknowsys" CODEBASE_ESSENTIALS.md  # Should find ZERO matches
grep -i "{{" CODEBASE_ESSENTIALS.md  # Should show unfilled placeholders
```

**Expected results:**
- ✅ CODEBASE_ESSENTIALS.md created
- ✅ No "aiknowsys" references
- ✅ Placeholders like `{{PROJECT_NAME}}` are filled (or clearly marked as needing filling)
- ✅ File is ~200-300 lines
- ✅ Sections 1-7 present (not 1-10)

**If issues found:** Fix base template, re-run test

---

### Step 3.2: Test Stack Template Initialization

**For each stack:**

```bash
# Clean test directory
rm -rf /tmp/test-stack-*

# Test Next.js API stack
cd /tmp
aiknowsys init --stack nextjs-api --name "test-nextjs-api"

# Verify ESSENTIALS
cd test-nextjs-api
cat CODEBASE_ESSENTIALS.md | head -50

# Check format
grep "## 4. Critical Invariants" CODEBASE_ESSENTIALS.md
grep "## 5. Skill Index" CODEBASE_ESSENTIALS.md

# Check size
wc -l CODEBASE_ESSENTIALS.md  # Should be ~400 lines, not 2000+

# Check for broken placeholders
grep "{{" CODEBASE_ESSENTIALS.md  # Should only show intentional ones
```

**Expected results for each stack:**
- ✅ CODEBASE_ESSENTIALS.md created
- ✅ File is ~400 lines (not 2000+)
- ✅ Has Section 4 (Critical Invariants) in v0.10.0 format
- ✅ Has Section 5 (Skill Index)
- ✅ Stack-specific content preserved (Prisma, FastAPI, etc.)
- ✅ No broken `{{VARIABLE}}` references

**Test all 6 stacks:**
1. express-api
2. fastapi
3. nextjs-api
4. nextjs
5. vue-express
6. vue-vite

---

### Step 3.3: Test AI Workflow

**Action:** Simulate AI agent using new ESSENTIALS

**Scenario 1: AI loads ESSENTIALS for new project**
```bash
# Create test project
cd /tmp
aiknowsys init --stack nextjs-api --name "ai-test-project"
cd ai-test-project

# Simulate AI reading ESSENTIALS
cat CODEBASE_ESSENTIALS.md

# AI should see:
# - Section 4: Critical Invariants (must follow rules)
# - Section 5: Skill Index (list of available skills)
# - Clear structure without overwhelming detail
```

**Scenario 2: AI queries for workflow**
```bash
# AI detects "refactor" trigger word
# AI looks for refactoring-workflow skill
ls .github/skills/refactoring-workflow/SKILL.md

# If exists, AI loads skill
cat .github/skills/refactoring-workflow/SKILL.md
```

**Expected results:**
- ✅ ESSENTIALS is concise (~400 lines)
- ✅ AI can understand critical invariants
- ✅ AI knows skills are in .github/skills/
- ✅ No confusion from outdated format

---

### Phase 3 Success Criteria

- [ ] Base template init works (no stack)
- [ ] All 6 stack inits work
- [ ] Generated ESSENTIALS files are skill-indexed format
- [ ] File sizes: base ~250 lines, stacks ~400 lines
- [ ] No "aiknowsys" references in base template output
- [ ] No broken `{{VARIABLES}}` in any output
- [ ] AI workflow simulation successful

---

## Phase 4: Documentation Updates

**Goal:** Update migration guides and release notes

**Timeline:** 30 minutes  
**Files affected:** 3 files

---

### Step 4.1: Update RELEASE_NOTES_v0.10.0.md

**Action:** Add breaking change notice for templates

**Add section:**
```markdown
### ⚠️ Breaking Changes

#### Template Updates (ALL Projects Should Migrate)

**Base Template:**
- **CHANGED:** `templates/CODEBASE_ESSENTIALS.template.md` is now fully generic
- **REMOVED:** All AIKnowSys-specific content (CLI commands, file paths, patterns)
- **IMPACT:** Projects using old template may have outdated ESSENTIALS
- **ACTION:** Re-run `aiknowsys init` or manually update ESSENTIALS using new format

**Stack Templates:**
- **CHANGED:** All 6 stack templates migrated to skill-indexed format
- **BEFORE:** 1000-2000 lines (monolithic)
- **AFTER:** ~400 lines (skill-indexed)
- **IMPACT:** New projects get skill-indexed ESSENTIALS automatically
- **ACTION:** Existing projects should run `npx aiknowsys migrate-essentials`

**Migration Command Available:**
\```bash
# Migrate existing project to skill-indexed format
npx aiknowsys migrate-essentials

# Dry-run first to preview changes
npx aiknowsys migrate-essentials --dry-run
\```

**Benefits:**
- ✅ 70-80% token reduction (faster AI processing)
- ✅ Critical invariants ALWAYS loaded
- ✅ Detailed workflows loaded on-demand
- ✅ Prevents "I thought I knew" AI failures
```

**Dependencies:** Phase 1-3 complete  
**Risk:** Low (documentation only)

---

### Step 4.2: Update docs/migration-guide.md

**Action:** Add section for v0.10.0 template migration

**Add section:**
```markdown
## Migrating to v0.10.0 (Skill-Indexed ESSENTIALS)

### For Existing Projects

If your project uses CODEBASE_ESSENTIALS.md from v0.9.0 or earlier:

**Step 1: Check current format**
\```bash
# Monolithic format has sections like:
# - "## 4. Core Patterns" (500-1000 lines of details)
# - "## 5. Critical Invariants" (not at top)
# - File is >1000 lines

# Skill-indexed format has:
# - "## 4. Critical Invariants" (8 rules, ~250 lines)
# - "## 5. Skill Index" (~100 lines)
# - File is ~400 lines
\```

**Step 2: Run migration command**
\```bash
# Dry-run first (safe, no changes)
npx aiknowsys migrate-essentials --dry-run

# Review output, then execute
npx aiknowsys migrate-essentials
\```

**Step 3: Verify migration**
\```bash
# Check file size
wc -l CODEBASE_ESSENTIALS.md  # Should be ~400 lines

# Validate format
npx aiknowsys validate-deliverables

# Test AI workflow
# AI should load ESSENTIALS + auto-load skills on trigger detection
\```

### For New Projects

Just use `aiknowsys init` - templates are already migrated:

\```bash
aiknowsys init --stack nextjs-api --name my-project
# CODEBASE_ESSENTIALS.md will be skill-indexed format automatically
\```

### What Changed

**Before (v0.9.0):**
- ESSENTIALS: 1000-2000 lines (all workflows inline)
- AI loads everything (slow, high token usage)
- Easy to miss critical rules buried in details

**After (v0.10.0):**
- ESSENTIALS: ~400 lines (critical rules + skill index)
- AI loads only what's needed (fast, low token usage)
- Critical invariants ALWAYS visible at top

**Backwards Compatibility:**
- AI can still read old format
- No functionality lost
- Migration is recommended, not required
```

**Dependencies:** Phase 1-3 complete  
**Risk:** Low (documentation only)

---

### Step 4.3: Update README.md Quick Start

**Action:** Ensure README reflects new template format

**Check README.md for:**
- Template examples show skill-indexed format
- File size estimates updated (~400 lines, not 1000+)
- No outdated screenshots of old format

**If changes needed:** Update README.md to match new format

**Dependencies:** Phase 1-3 complete  
**Risk:** Low (documentation only)

---

### Phase 4 Success Criteria

- [ ] RELEASE_NOTES_v0.10.0.md has breaking changes section
- [ ] Migration guide updated with v0.10.0 section
- [ ] README.md accurate (if applicable)
- [ ] All documentation references new format

---

## Phase 5: Final Validation

**Goal:** Comprehensive testing before release

**Timeline:** 30 minutes  
**Files affected:** None (validation only)

---

### Step 5.1: Run Full Test Suite

```bash
# All unit tests
npm test

# Expected: 750+ tests passing (same as before)
# No regressions from template changes
```

**Expected:** ✅ All tests pass (no template changes affect code)

---

### Step 5.2: Run Deliverables Validation

```bash
# Validate ALL deliverables
npx aiknowsys validate-deliverables --verbose

# Expected checks:
# ✅ Base template has no AIKnowSys references
# ✅ All stack templates are skill-indexed format
# ✅ No broken {{VARIABLES}}
# ✅ Skills are properly formatted
# ✅ Template structure integrity maintained
```

**Expected:** ✅ All 5 validation checks pass

---

### Step 5.3: Test CLI Commands

```bash
# Test init flow
aiknowsys init --help

# Test migrate-essentials
aiknowsys migrate-essentials --help

# Test query commands (if applicable)
aiknowsys query-plans --help
```

**Expected:** ✅ All commands work without errors

---

### Step 5.4: Manual Review Checklist

**Base Template:**
- [ ] No "aiknowsys" references
- [ ] No hardcoded commands (npm test, bin/cli.js, etc.)
- [ ] Only `{{PLACEHOLDERS}}` and generic patterns
- [ ] File size 150-250 lines
- [ ] 5 universal critical invariants
- [ ] Skill index explains concept generically

**Stack Templates (all 6):**
- [ ] File sizes ~400 lines (down from 1000-2000)
- [ ] Section 4: Critical Invariants (8 standard + stack-specific)
- [ ] Section 5: Skill Index (universal + stack-specific)
- [ ] Backups exist (.md.backup files)
- [ ] Stack-specific content preserved (Prisma, FastAPI, etc.)

**Documentation:**
- [ ] RELEASE_NOTES_v0.10.0.md has breaking changes
- [ ] Migration guide has v0.10.0 section
- [ ] README accurate

**Integration:**
- [ ] `aiknowsys init` works for all stacks
- [ ] Generated ESSENTIALS are skill-indexed
- [ ] No broken variables in output

---

### Phase 5 Success Criteria

- [ ] All 750+ tests passing
- [ ] validate-deliverables passes (all 5 checks)
- [ ] All CLI commands functional
- [ ] Manual review checklist complete
- [ ] No regressions found

**If all pass:** ✅ Ready for v0.10.0 release!

---

## Rollback Plan (If Issues Found)

**If critical issues found during any phase:**

### Rollback Base Template
```bash
# Restore from git
git checkout HEAD -- templates/CODEBASE_ESSENTIALS.template.md
```

### Rollback Stack Templates
```bash
# Backups created by migrate-essentials
cp templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md.backup \
   templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md

# Or restore from git (if committed before migration)
git checkout HEAD -- templates/stacks/*/CODEBASE_ESSENTIALS.md
```

### Rollback Documentation
```bash
git checkout HEAD -- RELEASE_NOTES_v0.10.0.md docs/migration-guide.md
```

**Note:** migrate-essentials creates backups automatically, so rollback is safe

---

## Risk Assessment

### Low Risks
- ✅ migrate-essentials is tested (13/13 tests passing)
- ✅ Creates backups automatically
- ✅ Dry-run mode available
- ✅ Changes are in templates/ (doesn't affect core code)
- ✅ All tests remain passing

### Medium Risks
- ⚠️ Manual review needed for stack-specific content
- ⚠️ Must ensure no broken `{{VARIABLES}}` after migration
- ⚠️ Documentation must be accurate

### Mitigation
- Use dry-run mode first
- Validate after each migration
- Test `aiknowsys init` flow thoroughly
- Keep backups until confirmed working

---

## Timeline Estimate

| Phase | Task | Time | Total |
|-------|------|------|-------|
| **Phase 1** | Fix base template | 1-2h | 1-2h |
| **Phase 2** | Migrate 6 stacks | 2-4h | 3-6h |
| **Phase 3** | Integration testing | 30m | 3.5-6.5h |
| **Phase 4** | Update docs | 30m | 4-7h |
| **Phase 5** | Final validation | 30m | 4.5-7.5h |

**Conservative estimate:** 7.5 hours  
**Optimistic estimate:** 4.5 hours  
**Realistic estimate:** 5-6 hours

---

## Success Metrics

After completion:

**Quantitative:**
- Base template: 150-250 lines (down from 297)
- Stack templates: ~400 lines each (down from 1000-2000)
- Total reduction: ~8000 lines → ~2500 lines (69% reduction)
- Zero AIKnowSys references in base template
- Zero broken `{{VARIABLES}}` in templates
- All 750+ tests passing
- validate-deliverables: 5/5 checks pass

**Qualitative:**
- Templates work for ANY project type (Python, Rust, Go, JavaScript)
- AI workflow is consistent (skill-indexed format everywhere)
- User experience improved (skill-indexed from day one)
- Documentation accurate and helpful

---

## Next Steps

**After this plan is approved:**

1. **@Developer** executes Phases 1-5 following this plan
2. **@SeniorArchitect** reviews changes after Phase 1 and Phase 2
3. **@Planner** verifies integration testing (Phase 3)
4. **All** validate before v0.10.0 release (Phase 5)

**Plan ready for handoff to @Developer** 🚀

---

*This plan fixes both critical issues (base template contamination + stack migration) to unblock v0.10.0 release.*
