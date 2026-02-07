# Codebase Changelog

**Purpose:** Milestone-focused timeline of major project events (releases, breaking changes, architectural shifts).

**Usage:** Scan for important milestones. For daily work history, use `.aiknowsys/sessions/` (queryable via CLI).

⚠️ **AI REMINDER:** Add entries ONLY for milestones (releases, arch changes), NOT daily work!  
📝 **Changelog** = Milestones (lean, ~500 lines) | **Sessions** = Daily work (indexed, queryable)

**See:** [docs/milestone-changelog-format.md](docs/milestone-changelog-format.md) for entry guidelines.

---

## Milestone: Initial Knowledge System Setup ({{DATE}})

**Goal:** Install AIKnowSys for {{PROJECT_NAME}}

**Changes:**
- Created CODEBASE_ESSENTIALS.md with project patterns
- Installed custom agents (Developer + Architect)
- Added universal skills (refactoring, dependencies, TDD, etc.)
- Initialized milestone-focused changelog
- Configured context query system (session indexing)

**Migration:**
- Complete TODO sections in CODEBASE_ESSENTIALS.md
- Start using @Developer workflow for feature implementation
- Document daily work in `.aiknowsys/sessions/YYYY-MM-DD-session.md`

**Validation:**
- ✅ All template files created
- ✅ Agent workflow configured
- ✅ CLI commands functional

**Impact:**
- AI agents can now follow consistent patterns
- Session work automatically indexed for queries
- Team has structured workflow for development

---

## Milestone Entry Template

**Copy this template for new MILESTONES only:**

```markdown
## Milestone: [Brief Title] (Month Day, Year)

**Goal:** [One sentence describing the milestone's purpose]

**Changes:**
- [Major change 1 with rationale]
- [Major change 2 with impact]
- [Breaking change with migration guide if applicable]

**Migration:** (if breaking changes)
- [Step 1 for users to migrate]
- [Step 2 for users to migrate]

**Validation:**
- ✅ Tests: [X tests passing]
- ✅ Deliverables: [All validation checks passed]
- ✅ Performance: [Key metric improvement if applicable]

**Impact:**
- [Who benefits and how]
- [What problems this solves]
```

**For daily work:** Use `.aiknowsys/sessions/YYYY-MM-DD-session.md` (see AGENTS.md)

**Key Learning**: [Optional: pattern or gotcha for future reference]

**Notes**: [Optional: additional context, decisions made, alternatives considered]

---
```

## Changelog Guidelines

**When to add an entry:**
- ✅ After completing a feature
- ✅ After fixing a bug that reveals design issue
- ✅ After refactoring
- ✅ After updating patterns in CODEBASE_ESSENTIALS
- ❌ NOT for trivial typo fixes
- ❌ NOT for work-in-progress

**What to include:**
- Brief goal statement
- Files changed with line numbers
- Validation results (which tests ran, did they pass)
- Key learnings (patterns discovered, gotchas encountered)

**Formatting:**
- Use markdown links with line numbers: `[file.ts](file.ts#L123)`
- List validation results with checkmarks: `✅` or warnings: `⚠️`
- Keep entries concise but informative
- Add entries at the TOP (most recent first)

**Archiving:**
When this file exceeds 1500 lines, archive old entries:
```bash
# Use documentation-management skill
# Or manually:
mkdir -p docs/changelog
mv CODEBASE_CHANGELOG.md docs/changelog/CHANGELOG_YYYY-MM.md
cp templates/CODEBASE_CHANGELOG.template.md CODEBASE_CHANGELOG.md
```

---

## Example Session Entries

### Session: Add User Authentication (Jan 18, 2026)

**Goal**: Implement JWT authentication with refresh tokens

**Changes**:
- [src/auth/jwt.ts](src/auth/jwt.ts#L1-L45): Created JWT utilities
- [src/middleware/auth.ts](src/middleware/auth.ts#L12-L34): Added auth middleware
- [tests/auth.test.ts](tests/auth.test.ts): Added 12 authentication tests

**Validation**:
- ✅ Backend tests: 124 passed
- ✅ TypeScript: No errors
- ✅ Integration tests: Auth flow verified

**Key Learning**: HttpOnly cookies prevent XSS attacks on tokens. Document this pattern in CODEBASE_ESSENTIALS.md

---

### Session: Refactor API Client (Jan 19, 2026)

**Goal**: Eliminate duplicate error handling across API calls

**Changes**:
- [src/api/client.ts](src/api/client.ts#L23-L56): Extracted error handler
- [src/api/endpoints/](src/api/endpoints/): Removed 15 duplicate try/catch blocks
- [tests/api.test.ts](tests/api.test.ts#L78-L92): Added error handling tests

**Validation**:
- ✅ All tests: 456 passed
- ✅ Type check: No errors
- ✅ Manual testing: Error messages display correctly

**Key Learning**: Centralized error handling ensures consistent UX. Pattern added to CODEBASE_ESSENTIALS.md

---

### Session: Fix Image Upload Bug (Jan 20, 2026)

**Goal**: Resolve image URL generation inconsistency

**Changes**:
- [src/models/media.ts](src/models/media.ts#L34): Unified URL generation
- [src/serializers/media.ts](src/serializers/media.ts#L12): Removed duplicate logic

**Validation**:
- ✅ Backend tests: All passed
- ✅ Manual verification: URLs correct in dev and production

**Key Learning**: "Quick fix" would have created third URL pattern. Following process revealed existing inconsistency and led to proper solution.

**Notes**: This demonstrates why "never rush" rule matters. Took extra 10 minutes to check patterns, saved hours of debugging later.

---

*This template is part of the Knowledge System Template. See [README](README.md) for full documentation.*
