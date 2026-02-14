# Deliverables Audit: v0.10.0 Compatibility Check

**Date:** 2026-02-07  
**Purpose:** Verify all deliverables work with skill-indexed ESSENTIALS and query system  
**Scope:** Stack templates, skills, custom agents, documentation

---

## Executive Summary

**Status:** ⚠️ TWO CRITICAL ISSUES FOUND - Both are blockers for v0.10.0 release

**Critical Finding #1: Base Template Contamination**
- `templates/CODEBASE_ESSENTIALS.template.md` has AIKnowSys-specific content mixed with generic placeholders
- Users running `aiknowsys init` get pre-filled content from wrong project
- **BLOCKER** - Template must be fully generic OR explicitly scoped

**Critical Finding #2: Stack Templates Need Migration**
- 6 stack templates still use OLD MONOLITHIC ESSENTIALS format (2000+ lines)
- New v0.10.0 format is skill-indexed (327 lines)
- Migration required to avoid user confusion

**Impact:**
- **HIGH** - Users running `aiknowsys init` get:
  1. Base ESSENTIALS contaminated with AIKnowSys-specific content
  2. Stack ESSENTIALS in outdated monolithic format (not skill-indexed)
- **BLOCKER** - v0.10.0 cannot ship with incompatible/contaminated templates
- **MIGRATION NEEDED** - Fix base template + migrate stack templates

---

## Deliverables Inventory

### 1. Stack Templates (`templates/stacks/`)

**Status:** ❌ NEEDS MIGRATION

**Files:**
1. `express-api/CODEBASE_ESSENTIALS.md` (992 lines)
2. `fastapi/CODEBASE_ESSENTIALS.md` (~1000 lines)
3. `nextjs-api/CODEBASE_ESSENTIALS.md` (2066 lines)
4. `nextjs/CODEBASE_ESSENTIALS.md` (~1800 lines)
5. `vue-express/CODEBASE_ESSENTIALS.md` (~1500 lines)
6. `vue-vite/CODEBASE_ESSENTIALS.md` (~1200 lines)

**Format:** OLD MONOLITHIC
```
## 1. Technology Snapshot
## 2. Validation Matrix
## 3. Project Structure
## 4. Core Patterns (500-1000 lines of detailed workflows)
## 5. Critical Invariants (but in old format, not v0.10.0 format)
## 6. Common Patterns (detailed implementations)
## 7. Testing Patterns
## 8. Common Gotchas
## 9. Architecture Decisions
## 10. Change Management
## 11. Development Workflow
## 12. Performance Optimization
```

**Expected:** NEW SKILL-INDEXED FORMAT (v0.10.0)
```
## 1. Technology Snapshot
## 2. Validation Matrix
## 3. Project Structure
## 4. Critical Invariants (MANDATORY - 8 rules)
## 5. Skill Index (Auto-load workflows on trigger detection)
```

**Issue:**
- Stack templates have ALL workflows inline (violates skill-indexed architecture)
- No reference to `query-essentials` command
- No "Critical Invariants" in v0.10.0 format
- Users get 2000-line ESSENTIALS instead of 327-line indexed version

**Migration Path:**
1. Extract stack-specific customizations (tech stack, validation, patterns)
2. Run `migrate-essentials` on each stack template
3. Preserve stack-specific content (Server Actions, Prisma patterns, etc.)
4. Add stack-specific skills to `.github/skills/` if needed

---

### 2. Base Template (`templates/CODEBASE_ESSENTIALS.template.md`)

**Status:** ⚠️ CONTAMINATED WITH AIKNOWSYS-SPECIFIC CONTENT

**File:** `templates/CODEBASE_ESSENTIALS.template.md` (297 lines)

**Problem:** Template mixes generic placeholders with AIKnowSys-specific content

**Contamination Examples:**

**Section 2: Validation Matrix**
```markdown
| `npm test` | Run unit tests | All 737+ tests pass (Vitest output) |  ❌ AIKnowSys-specific
| `npm run test:coverage` | Code coverage | >80% coverage on lib/ |  ❌ AIKnowSys-specific
| `{{TEST_COMMAND}}` | Run unit tests | All {{TEST_COUNT}}+ tests pass |  ✅ Generic placeholder
```
**Issue:** Mixed specific commands with placeholders

**Section 3: Project Structure**
```markdown
aiknowsys/  ❌ Should be {{PROJECT_NAME}}/
├── bin/cli.js  ❌ AIKnowSys-specific
{{PROJECT_STRUCTURE}}  ✅ Generic placeholder
```
**Issue:** Hardcoded AIKnowSys directory structure

**Section 4: Critical Invariants**
```markdown
### 4. Template Preservation  ❌ AIKnowSys-specific (template system)
### 6. Backwards Compatibility  ❌ AIKnowSys-specific (bash scripts)
### 8. Deliverables Consistency  ❌ AIKnowSys-specific (template validation)
- Run `npx aiknowsys validate-deliverables`  ❌ AIKnowSys command
```
**Issue:** Many invariants only apply to AIKnowSys itself

**Section 6: Quick Reference**
```markdown
node bin/cli.js --help  ❌ AIKnowSys-specific
import { createLogger } from '../logger.js';  ❌ AIKnowSys logger pattern
```

**Section 7: Common Gotchas**
```markdown
**ESM `__dirname` not available:**  ❌ AIKnowSys uses ESM
**Chalk 5.x is ESM-only:**  ❌ AIKnowSys dependency
```

**Section 8: Extending AIKnowSys**
```markdown
## 8. Extending AIKnowSys  ❌ ENTIRE SECTION is AIKnowSys-specific!
**Adding commands:** Create `lib/commands/my-command.ts`
```

**Section 9: Context Query Commands**
```markdown
npx aiknowsys query-plans  ❌ AIKnowSys command
npx aiknowsys query-sessions  ❌ AIKnowSys command
```

**Impact:**
- Users running `aiknowsys init` get ESSENTIALS with AIKnowSys-specific content
- Template is "pre-filled" with wrong project's information
- Violates "templates are deliverables" principle

**Root Cause:**
Template appears to be copied from actual CODEBASE_ESSENTIALS.md with partial placeholder conversion. Should be fully generic OR explicitly scoped to "AIKnowSys-based projects".

---

### 3. Skills (`templates/skills/`)

**Status:** ✅ NO MIGRATION NEEDED (framework-agnostic)

**Files:** 11 skill files
- `ai-friendly-documentation/SKILL.md`
- `context7-usage/SKILL.md`
- `dependency-management/SKILL.md`
- `feature-implementation/SKILL.md`
- `pattern-sharing/SKILL.md`
- `refactoring-workflow/SKILL.md`
- `skill-creator/SKILL.md`
- `skill-validation/SKILL.md`
- `tdd-workflow/SKILL.md`
- `validation-troubleshooting/SKILL.md`
- `skill-creator/template.md`

**Format:** Universal workflows (framework-agnostic)
- Don't reference specific ESSENTIALS sections
- Focus on workflow patterns (TDD, refactoring, validation)
- Use generic examples (Python, JavaScript, TypeScript, Rust, Go)

**Verification:** ✅ Skills work with any ESSENTIALS format

---

### 4. Custom Agents (`.github/agents/`)

**Status:** ✅ NO MIGRATION NEEDED

**Files:**
- `planner.agent.md` (380 lines)
- `developer.agent.md`
- `architect.agent.md`

**ESSENTIALS References:**
- `Read CODEBASE_ESSENTIALS.md` (generic, no section assumptions)
- `Follow patterns from CODEBASE_ESSENTIALS.md` (generic)
- `Review against CODEBASE_ESSENTIALS.md` (generic)
- `Check OpenSpec section in CODEBASE_ESSENTIALS.md` (works with both formats)

**Verification:** ✅ Agents don't assume specific section structure

---

## Impact Analysis

### If We Ship v0.10.0 Without Fixing Stack Templates

**User Experience:**
```bash
# User initializes new Next.js API project
aiknowsys init nextjs-api

# Gets OLD MONOLITHIC ESSENTIALS (2066 lines)
# While main AIKnowSys uses NEW SKILL-INDEXED (327 lines)
# Confusion ensues!
```

**Problems:**
1. **Inconsistency:** Main repo uses skill-indexed, stacks use monolithic
2. **AI Confusion:** AI sees different formats in different projects
3. **Documentation Gap:** Stack ESSENTIALS don't mention query system
4. **Migration Burden:** Users have to manually run `migrate-essentials` later

### If We Fix Stack Templates First

**User Experience:**
```bash
# User initializes new Next.js API project
aiknowsys init nextjs-api

# Gets NEW SKILL-INDEXED ESSENTIALS (327 lines)
# Same format as main AIKnowSys repo
# Consistent experience!
```

**Benefits:**
1. ✅ Consistent architecture across all projects
2. ✅ Users get v0.10.0 benefits immediately
3. ✅ AI agents work the same way everywhere
4. ✅ Query system available from day one

---

## Migration Strategy

### Phase 1: Analyze Stack-Specific Content

**Goal:** Identify what's unique to each stack vs what should be in skills

**Stack-Specific (Keep in ESSENTIALS Section 4):**
- Database patterns (Prisma for Next.js, SQLAlchemy for FastAPI)
- Framework-specific patterns (Server Actions, API Routes)
- Stack-specific gotchas (Next.js 15 params, FastAPI async)
- Tech stack validation commands

**Universal Workflows (Move to .github/skills/):**
- Authentication patterns (JWT, bcrypt, sessions)
- Error handling patterns
- Pagination patterns
- File upload patterns
- Testing patterns

### Phase 2: Create Stack-Specific Skills (Optional)

**Consider creating:**
- `.github/skills/nextjs-api-patterns/SKILL.md`
- `.github/skills/fastapi-patterns/SKILL.md`
- `.github/skills/prisma-patterns/SKILL.md`

**Benefits:**
- Keeps ESSENTIALS lean (327 lines target)
- Workflows auto-load when needed
- Reusable across similar projects

### Phase 3: Run migrate-essentials on Each Stack

**For each stack template:**

```bash
# 1. Extract customizations manually
# - Tech stack (Section 1)
# - Validation commands (Section 2)
# - Project structure (Section 3)
# - Stack-specific patterns (for Section 4)

# 2. Run migration (dry-run first)
npx aiknowsys migrate-essentials \
  --target templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md \
  --dry-run

# 3. Review output
# - Critical Invariants should be standard 8 rules
# - Skill Index should reference stack-specific skills
# - Customizations should be preserved

# 4. Execute migration
npx aiknowsys migrate-essentials \
  --target templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md

# 5. Test with validate-deliverables
npx aiknowsys validate-deliverables
```

### Phase 4: Update Stack Documentation

**Each stack should document:**
- Which skills are stack-specific
- How to query stack patterns: `npx aiknowsys query-essentials "Next.js API patterns"`
- Migration guide for existing projects

---

## Recommendations

### Priority 1: Migrate Stack Templates (BLOCKER for v0.10.0)

**Action:** Run `migrate-essentials` on all 6 stack templates
**Priority 2: Migrate Stack Templates (BLOCKER for v0.10.0)

**Action:** Run `migrate-essentials` on all 6 stack templates
**Timeline:** 2-4 hours
**Risk:** Low (migrate-essentials is production-ready, tested)

**Steps:**
1. ✅ migrate-essentials command exists and tested (13/13 tests passing)
2. ⏸️ Create plan for stack-specific content extraction
3. ⏸️ Run migration on each stack template
4. ⏸️ Validate with `validate-deliverables`
5. ⏸️ Test with `aiknowsys init` flow
6. ⏸️ Update RELEASE_NOTES_v0.10.0.md with breaking change notice

### Priority 3: Create Stack-Specific Skills (Optional Enhancement)

**Action:** Extract common patterns into reusable skills
**Timeline:** 4-6 hours
**Risk:** Low (enhancement, not blocker)

**Examples:**
- `nextjs-server-actions` - Server Actions patterns
- `prisma-patterns` - Prisma best practices
- `fastapi-async` - Async patterns in FastAPI

### Priority 4: Update Migration Guide (Documentation)

**Action:** Add section to `docs/migration-guide.md` for stack templates
**Timeline:** 1 hour
**Risk:** None (documentation only)

---

## Testing Plan

### Validation Checklist

**For each migrated stack template:**

- [ ] Run `migrate-essentials` successfully
- [ ] Backup created automatically
- [ ] Customizations preserved (tech stack, validation, structure)
- [ ] Critical Invariants match v0.10.0 format (8 rules)
- [ ] Skill Index section exists
- [ ] File size reduced (~327 lines target)
- [ ] `validate-deliverables` passes
- [ ] `aiknowsys init <stack>` works
- [ ] Generated ESSENTIALS is skill-indexed
- [ ] No broken template variables (`{{VARIABLE}}`)

### Integration Testing

**Test complete workflow:**

```bash
# 1. Create test project
mkdir /tmp/test-v010-stack
cd /tmp/test-v010-stack

# 2. Initialize with migrated stack
aiknowsys init nextjs-api

# 3. Verify ESSENTIALS format
grep "## 4. Critical Invariants" CODEBASE_ESSENTIALS.md
grep "## 5. Skill Index" CODEBASE_ESSENTIALS.md

# 4. Test query system
npx aiknowsys query-essentials "Next.js patterns"

# 5. Test AI workflow
# (AI should load ESSENTIALS, detect trigger, query skill)
```

---

## Decision Points

### Should We Ship v0.10.0 Without Stack Migration?

**NO - This is a breaking change that affects user experience.**

**Reasoning:**
- Inconsistency between main repo (skill-indexed) and stacks (monolithic)
- Users won't get v0.10.0 benefits in new projects
- AI confusion (two different formats)
- Migration burden on users

**Recommendation:** Complete stack template migration BEFORE v0.10.0 release.

### Should Stack-Specific Patterns Go in Skills or ESSENTIALS?

**ESSENTIALS Section 4 (Keep inline):**
- Critical stack-specific invariants (e.g., "Always use Prisma singleton")
- Framework-specific gotchas (e.g., "Next.js 15 params are Promises")
- Stack-specific validation (e.g., "Run prisma migrate before deploy")

**Skills (Extract to .github/skills/):**
- Detailed implementation patterns (e.g., "How to implement authentication")
- Common workflows (e.g., "Pagination patterns")
- Testing strategies (e.g., "API route testing")

**Guideline:** If it's >50 lines and reusable, it's a skill. If it's <50 lines and stack-critical, it's in ESSENTIALS.

---

## Next Steps

1. **@Planner** creates detailed migration plan for stack templates
2. **@Developer** executes migration using `migrate-essentials`
3. **@SeniorArchitect** reviews migrated templates for compliance
4. **All** run integration tests before v0.10.0 release

---

## Appendix: Example Stack Migration

### Before (nextjs-api/CODEBASE_ESSENTIALS.md - 2066 lines)

```markdown
## 4. Core Patterns

### API Route Handler Structure
[500 lines of detailed implementation]

### Dynamic Route Parameters
[200 lines of detailed patterns]

### Server Actions for Mutations
[300 lines of detailed workflows]

... (continues for 2000+ lines)
```

### After (nextjs-api/CODEBASE_ESSENTIALS.md - ~400 lines)

```markdown
## 4. Critical Invariants

### 1. ES Modules Only
[30 lines - standard rule]

### 2. Next.js 15 Params Are Promises
[50 lines - stack-specific gotcha]

### 3. Prisma Client Singleton Required
[40 lines - stack-specific pattern]

... (8 total rules, ~250 lines)

## 5. Skill Index

**Next.js API Patterns** - [Trigger: "API route", "server action"]
- API route handler structure
- Dynamic route parameters
- Server Actions for mutations
- Load with: `npx aiknowsys query-essentials "Next.js API patterns"`

**Prisma Patterns** - [Trigger: "database query", "prisma", "ORM"]
- Database transaction patterns
- N+1 query prevention
- Connection pooling
- Load with: `npx aiknowsys query-essentials "Prisma patterns"`

... (10-15 skills total)
```

**Result:**
- Reduced from 2066 → ~400 lines (80% reduction)
- Critical rules always loaded
- Detailed workflows loaded on-demand
- Same content, better architecture

---

*End of audit report. Ready for migration planning.*
