# Archived Changelog Entries

This directory contains historical changelog entries that have been archived from the main `CODEBASE_CHANGELOG.md` file.

## What's Here

**[changelog-2025-and-earlier.md](changelog-2025-and-earlier.md)** - Session entries from 2025 and earlier (pre-v0.11.0)

These entries document early TypeScript migration work and foundational development before the context query system was established.

## Why Archive?

As of **v0.11.0** (Feb 2026), the project evolved to a **milestone-focused changelog** approach:

### Old Approach (Pre-v0.11.0)
- ❌ Every session documented in CODEBASE_CHANGELOG.md
- ❌ File grew too large (thousands of lines, unmanageable)
- ❌ Hard to scan for important events
- ❌ Redundant with session files in `.aiknowsys/sessions/`

### New Approach (v0.11.0+)
- ✅ **Milestone-only entries** in CODEBASE_CHANGELOG.md (releases, arch changes)
- ✅ **Session files** indexed in `.aiknowsys/context-index.json` (queryable)
- ✅ **CLI queries** for finding historical work (`query-sessions`, `search-context`)
- ✅ Changelog stays lean (~500 lines), focused on major events

## How to Find Historical Context

### For Recent Work (2026+)
Use the **context query CLI** (fast, indexed):

```bash
# Find sessions by date range
npx aiknowsys query-sessions --after 2026-01-01 --before 2026-02-01

# Search for specific topics
npx aiknowsys search-context "TypeScript migration"

# Find today's work
npx aiknowsys query-sessions --after 2026-02-07
```

### For Archived Work (2025 and Earlier)
Use **grep** on archived files:

```bash
# Search archived changelog
grep -i "typescript" docs/archived/changelog-2025-and-earlier.md

# Find all sessions from a specific month
grep "Jan.*2025" docs/archived/changelog-2025-and-earlier.md
```

### For Milestones
Read the main **CODEBASE_CHANGELOG.md** file (milestones are never archived).

## Archive Maintenance

Archives are **permanent historical records**:
- ✅ Safe to read/search anytime
- ✅ Never modified after creation
- ❌ Don't add new entries (use session files instead)
- ❌ Don't move content back to main changelog

If you need to reference archived work:
1. Search the archive with grep
2. Copy relevant details to your current session file
3. Link to the archived file in documentation if needed

## See Also

- [Context Query System](../context7-integration.md) - How to search project history
- [Milestone Format Guide](../milestone-changelog-format.md) - When to add changelog entries
- [Session Workflow](../../AGENTS.md#5️⃣-document) - How to document work in session files
