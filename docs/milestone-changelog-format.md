# Milestone Changelog Format Guide

> **Version:** v0.11.0  
> **Purpose:** Guide for updating CODEBASE_CHANGELOG.md with milestone entries only

---

## Overview

As of **v0.11.0**, CODEBASE_CHANGELOG.md serves as a **milestone-focused timeline** of major events in the project. Daily development work is tracked in session files (`.aiknowsys/sessions/`) and indexed for CLI queries.

**Goal:** Keep changelog **lean** (~500 lines), **scannable** (major events only), and **authoritative** (for releases, breaking changes, architecture decisions).

---

## When to Add Milestone Entries

### ✅ DO Add Entries For:

**1. Version Releases**
- Public releases (v0.11.0, v1.0.0, etc.)
- Release candidates (v0.11.0-rc.1)
- Major pre-releases (v0.11.0-beta.1)

**2. Major Architectural Changes**
- New subsystems (plugin architecture, storage layer)
- Fundamental pattern shifts (ES modules migration)
- Technology replacements (Jest → Vitest)

**3. Breaking Changes**
- API incompatibilities requiring user action
- CLI command changes breaking existing workflows
- Configuration format changes

**4. Critical Security Fixes**
- CVE patches
- Vulnerability remediations affecting user installations
- Security-related architecture hardening

**5. Major Performance Improvements**
- 10x+ speed improvements
- Memory leak fixes affecting production use
- Scalability breakthroughs

---

## When NOT to Add Entries (Use Session Files)

### ❌ DON'T Add Entries For:

**1. Daily Feature Work**
- New CLI commands (unless part of major release)
- Bug fixes (unless revealing fundamental design flaw)
- Refactoring (unless changing core patterns)
- Documentation updates (unless workflow-changing)

**2. Incremental Progress**
- "Phase X of Y complete" updates
- Work-in-progress commits
- Implementation steps

**3. Routine Maintenance**
- Dependency updates (unless major version bumps)
- Test improvements
- Code cleanup
- Linting fixes

**Instead:** Document in `.aiknowsys/sessions/YYYY-MM-DD-session.md` (indexed, queryable via CLI).

---

## Entry Format Template

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

---

## Example Milestone Entries

### Example 1: Version Release

```markdown
## Milestone: v0.11.0 Release - Milestone-Focused Changelog (Feb 7, 2026)

**Goal:** Evolve changelog from session archive to milestone timeline.

**Changes:**
- CODEBASE_CHANGELOG.md now milestone-only (5,850 → ~500 lines)
- Session files indexed in `.aiknowsys/context-index.json` (queryable via CLI)
- Old sessions archived to `docs/archived/changelog-2025-and-earlier.md`
- New mutation commands: `create-session`, `update-session`, `create-plan`

**Migration:**
- Use `query-sessions --after YYYY-MM-DD` to find historical work
- See `docs/archived/README.md` for archive search guide
- Stop adding daily sessions to CODEBASE_CHANGELOG.md

**Validation:**
- ✅ Tests: 74/74 passing
- ✅ Archive: 3 old sessions moved successfully
- ✅ CLI: All query commands functional

**Impact:**
- Developers can scan changelog in <5 minutes (previously 30+ minutes)
- Historical context still accessible via CLI (faster than file reading)
- Reduces noise, highlights strategic decisions
```

### Example 2: Architectural Change

```markdown
## Milestone: Storage Adapter Layer (Jan 15, 2026)

**Goal:** Abstract storage backend to enable future VectorDB integration.

**Changes:**
- Introduced `StorageAdapter` interface (`lib/context/storage-adapter.ts`)
- JSON implementation as default (`lib/context/json-storage.ts`)
- All commands now use adapter layer (query-plans, query-sessions, etc.)
- Prepared for plugin-based storage backends

**Migration:**
- No user action required (backwards compatible)
- Existing `.aiknowsys/context-index.json` works unchanged

**Validation:**
- ✅ Tests: 737+ passing (full suite)
- ✅ Performance: <10ms for typical queries (no regression)

**Impact:**
- Future: Teams can swap JSON for SQLite, PostgreSQL, or VectorDB
- Enterprise: Enables centralized knowledge storage
- Plugin ecosystem: Storage backends as npm packages
```

### Example 3: Breaking Change

```markdown
## Milestone: ES Modules Migration (Dec 10, 2025)

**Goal:** Modernize codebase with native ES modules (import/export).

**Changes:**
- Converted all `require()` → `import` (300+ files)
- package.json now `"type": "module"`
- Updated all internal tooling (tests, scripts)
- Removed CommonJS compatibility layer

**Migration:**
- **BREAKING:** Plugins must use ES modules (see migration guide)
- Update `require()` → `await import()` in user code
- See: `docs/migration-guide.md#es-modules`

**Validation:**
- ✅ Tests: 650+ passing (no regressions)
- ✅ Compatibility: Node.js 20+ required

**Impact:**
- Modern async/await throughout codebase
- Smaller bundle sizes (no transpilation needed)
- Better tree-shaking for users importing library
- Aligns with Node.js LTS standards
```

---

## How to Find Historical Information

### For Recent Work (Current Year)

Use **CLI queries** (fast, indexed):

```bash
# Find sessions by date
npx aiknowsys query-sessions --after 2026-02-01

# Search for topics
npx aiknowsys search-context "TypeScript migration"

# Find specific author's work
npx aiknowsys query-sessions --json | jq '.[] | select(.author=="arno")'
```

### For Archived Work (2025 and Earlier)

Use **grep** on archived files:

```bash
# Search archived changelog
grep -i "context query" docs/archived/changelog-2025-and-earlier.md

# Find sessions from specific month
grep "Jan.*2025" docs/archived/changelog-2025-and-earlier.md
```

### For Milestones

Read **CODEBASE_CHANGELOG.md** directly (short, scannable).

---

## Writing Tips

### Keep It Scannable
- ✅ Use bullet points
- ✅ Include line numbers for code references: `[utils.ts](lib/utils.ts#L45)`
- ✅ Link to related docs: `See: docs/migration-guide.md`
- ❌ Avoid narrative prose
- ❌ Don't include implementation details

### Focus on Impact
- **Good:** "Reduces startup time from 2s → 200ms (10x faster)"
- **Bad:** "Optimized loop in initializeContext()"

### Link to Details
- **Good:** "[PLAN_performance.md](.aiknowsys/PLAN_performance.md) - Full benchmark results"
- **Bad:** Copy-pasting entire benchmark tables

### Be User-Centric
- Answer: "What changed? Why does it matter to me? What do I need to do?"
- Skip: Internal refactoring details, file renames, code organization

---

## FAQ

### Q: What if I'm unsure if something is a milestone?

**A:** Ask yourself:
- Would this appear in release notes?
- Does this require user migration?
- Would this change our architectural diagrams?

If **NO** to all → use session file.  
If **YES** to any → consider milestone entry.

### Q: Can I edit old milestone entries?

**A:** Only for:
- ✅ Fixing typos
- ✅ Clarifying unclear language
- ✅ Adding missing links

Never:
- ❌ Rewriting history
- ❌ Removing entries
- ❌ Changing facts

### Q: What about work-in-progress announcements?

**A:** Use `.aiknowsys/CURRENT_PLAN.md` (for team awareness) and session files (for tracking). Add milestone entry AFTER completion, not during development.

### Q: How detailed should migration steps be?

**A:**
- **In CHANGELOG:** Brief, actionable steps (3-5 bullets)
- **In DOCS:** Detailed guide with code examples (link from changelog)

### Q: What if a milestone spans multiple sessions?

**A:** Add ONE milestone entry at completion. Session files track the journey; milestone entry documents the outcome.

---

## Changelog Maintenance

**Monthly Review:**
- Scan for session entries accidentally added
- Archive entries >1 year old (run `node scripts/archive-changelog.js`)
- Verify milestone entries still have working links

**Annual Archival:**
```bash
# Archive entries from 2025 and earlier
node scripts/archive-changelog.js --year 2025

# Review archive before committing
less docs/archived/changelog-2025-and-earlier.md
```

---

## See Also

- [AGENTS.md](../AGENTS.md#5️⃣-document) - When to update changelog
- [Context Query Skill](../.github/skills/context-query/SKILL.md) - How to search history
- [docs/archived/README.md](archived/README.md) - Archive search guide
- [AI-Friendly Documentation](../.github/skills/ai-friendly-documentation/SKILL.md) - Writing guidelines

---

*Part of aiknowsys v0.11.0 - Milestone-focused changelog evolution*
