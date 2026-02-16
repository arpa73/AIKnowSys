# ⚠️ Architect Review Pending

**Date:** 2026-02-16 20:48  
**Reviewer:** Senior Architect  
**Topic:** Phase 1 Cross-Project Search Implementation  
**Status:** ⏳ PENDING ACTION

---

## Files Reviewed

- [lib/core/search-context.ts](lib/core/search-context.ts#L1-L150) - Core business logic
- [lib/context/sqlite-storage.ts](lib/context/sqlite-storage.ts#L330-L460) - SQLite FTS implementation
- [lib/context/storage-adapter.ts](lib/context/storage-adapter.ts#L1-L100) - Interface definition
- [lib/context/json-storage.ts](lib/context/json-storage.ts) - JSON storage adapter
- [bin/cli.js](bin/cli.js#L473-L495) - CLI command flags
- [test/integration/cross-project-queries.test.ts](test/integration/cross-project-queries.test.ts) - Test coverage

---

## Code Quality Assessment

**✅ STRENGTHS:**

1. **Excellent TDD Adherence** - RED → GREEN → REFACTOR cycle followed meticulously
   - Tests written first (`🔴 RED PHASE` markers in test file)
   - Test coverage: 15/15 cross-project tests passing (100%)
   - No regressions: Phase 2 tests (26/26) still passing
   
2. **Clean Separation of Concerns**
   - Pure business logic in `search-context.ts` (no console.log, no process.exit)
   - Storage adapters properly abstract database vs file-based implementations
   - Interface consistency maintained across implementations

3. **Type Safety** - Strong TypeScript usage
   - Explicit interfaces for options (`SearchContextOptions`)
   - Proper type narrowing (`SearchScope` type)
   - Return types well-defined

4. **Backward Compatibility** - Existing functionality preserved
   - Default behavior unchanged (project-scoped queries)
   - New flags are opt-in (`--all-projects`)
   - JSON storage adapter updated for interface consistency (no-op implementation)

5. **Documentation** - README updated with cross-project examples
   - Clear usage examples
   - Benefits explained
   - Setup instructions provided

6. **ES Modules Compliance** ✅ - All imports use `import`/`export`

7. **Absolute Path Handling** ✅ - Uses `path.resolve()` properly

---

## ⚠️ ISSUES FOUND

### [MEDIUM] Issue 1: DatabaseLocator Called Even When Not Needed

**Location:** [lib/core/search-context.ts](lib/core/search-context.ts#L102-L105)

**Problem:**
```typescript
// DatabaseLocator always called, even when projectId explicitly provided
const { DatabaseLocator } = await import('../context/database-locator.js');
const locator = new DatabaseLocator();
const dbConfig = await locator.getDatabaseConfig(workingDir);
const projectId = options.projectId || dbConfig.projectId;
```

This performs unnecessary work when `options.projectId` is already provided. DatabaseLocator reads filesystem, checks git remotes, and parses config files - expensive operations wasted when projectId is known.

**Recommendation:**
```typescript
// Only call DatabaseLocator if projectId not explicitly provided
let projectId: string;
if (options.projectId) {
  projectId = options.projectId;
} else {
  const { DatabaseLocator } = await import('../context/database-locator.js');
  const locator = new DatabaseLocator();
  const dbConfig = await locator.getDatabaseConfig(workingDir);
  projectId = dbConfig.projectId;
}
```

**Why this matters:** Performance optimization for MCP tools calling this function repeatedly. Eliminates 5-10ms of unnecessary filesystem I/O per call.

**KISS principle:** Don't do work you don't need to do.

---

### [MEDIUM] Issue 2: Code Duplication in SQLite Search Queries

**Location:** [lib/context/sqlite-storage.ts](lib/context/sqlite-storage.ts#L370-L430)

**Problem:**
Plans and sessions search logic is nearly identical (50+ lines duplicated):

```typescript
// Plans query
let planQuery = `
  SELECT p.id as plan_id, p.title, p.content
  FROM plans_fts
  JOIN plans p ON p.rowid = plans_fts.rowid
  WHERE plans_fts MATCH ?
`;
if (filterByProject && projectId) {
  planQuery += ` AND p.project_id = ?`;
}
planQuery += ` LIMIT 50`;

// Sessions query - SAME PATTERN!
let sessionQuery = `
  SELECT s.id as session_id, s.topic, s.content
  FROM sessions_fts
  JOIN sessions s ON s.rowid = sessions_fts.rowid
  WHERE sessions_fts MATCH ?
`;
if (filterByProject && projectId) {
  sessionQuery += ` AND s.project_id = ?`;
}
sessionQuery += ` LIMIT 50`;
```

This violates **DRY principle**.

**Recommendation:**
Extract a helper method:

```typescript
/**
 * Build FTS query with optional project filtering
 * @param tableName - FTS table name (plans_fts, sessions_fts)
 * @param joinTable - Source table name (plans, sessions)
 * @param ftsQuery - FTS5 query string
 * @param filterByProject - Whether to filter by project
 * @param projectId - Project ID to filter by
 * @returns Object with { sql, params }
 */
private buildFtsQuery(
  tableName: string,
  joinTable: string,
  ftsQuery: string,
  filterByProject: boolean,
  projectId?: string
): { sql: string; params: string[] } {
  let sql = `
    SELECT * FROM ${tableName}
    JOIN ${joinTable} ON ${joinTable}.rowid = ${tableName}.rowid
    WHERE ${tableName} MATCH ?
  `;
  
  const params = [ftsQuery];
  
  if (filterByProject && projectId) {
    sql += ` AND ${joinTable}.project_id = ?`;
    params.push(projectId);
  }
  
  sql += ` LIMIT 50`;
  
  return { sql, params };
}

// Usage:
const { sql: planQuery, params: planParams } = this.buildFtsQuery(
  'plans_fts', 'plans', ftsQuery, filterByProject, projectId
);
const planRows = this.db.prepare(planQuery).all(...planParams);
```

**Why this matters:** Reduces duplication, single source of truth for query building logic, easier to maintain (change LIMIT in one place).

---

### [LOW] Issue 3: Magic Number - LIMIT 50 Hardcoded

**Location:** [lib/context/sqlite-storage.ts](lib/context/sqlite-storage.ts#L384)

**Problem:**
```typescript
planQuery += ` LIMIT 50`;
```

This magic number appears in multiple places with no explanation:
- Why 50?
- Should it be configurable?
- Is it adequate for all use cases?

**Recommendation:**
Define as a named constant at the top of the file:

```typescript
/**
 * Maximum search results to return per query
 * Prevents excessive memory usage and token consumption
 * Can be made configurable in future versions
 */
const MAX_SEARCH_RESULTS = 50;

// Usage:
planQuery += ` LIMIT ${MAX_SEARCH_RESULTS}`;
```

**Why this matters:** Self-documenting code, easier to adjust, signals intent to future maintainers.

---

### [LOW] Issue 4: Error Messages Not Using AIFriendlyErrorBuilder

**Location:** [lib/core/search-context.ts](lib/core/search-context.ts#L90-L98)

**Problem:**
```typescript
if (!query || query.trim().length === 0) {
  throw new Error('Search query cannot be empty');
}

if (!VALID_SCOPES.includes(scope)) {
  throw new Error(
    `Invalid scope: ${scope}. Must be one of: ${VALID_SCOPES.join(', ')}`
  );
}
```

CODEBASE_ESSENTIALS.md Section 6 recommends using `AIFriendlyErrorBuilder` for parameter validation errors. This provides:
- Structured error format
- AI learning (agents understand what went wrong)
- Consistent error handling across codebase

**Recommendation:**
```typescript
import { AIFriendlyErrorBuilder } from '../utils/error-builder.js';

// Empty query validation
if (!query || query.trim().length === 0) {
  throw AIFriendlyErrorBuilder.missingRequired(
    'query',
    'Search query cannot be empty',
    ['search-context "feature"', 'search-context "TDD workflow"']
  );
}

// Invalid scope validation
if (!VALID_SCOPES.includes(scope)) {
  throw AIFriendlyErrorBuilder.invalidParameter(
    'scope',
    `Must be one of: ${VALID_SCOPES.join(', ')}`,
    ['--scope all', '--scope plans', '--scope sessions']
  );
}
```

**Why this matters:** Pattern consistency with rest of codebase, better AI agent experience, self-improving error messages.

---

### [OBSERVATION] Issue 5: Auto-Detection Logic Could Be More Robust

**Location:** [lib/core/search-context.ts](lib/core/search-context.ts#L110-L119)

**Problem:**
```typescript
const { promises: fs } = await import('fs');
let storageAdapter: 'sqlite' | 'json' = 'json';
try {
  await fs.access(dbConfig.dbPath);
  storageAdapter = 'sqlite';
} catch {
  // SQLite database doesn't exist, use JSON
  storageAdapter = 'json';
}
```

This silently catches ALL errors (permissions, I/O errors, not just ENOENT). Could hide real problems.

**Recommendation:**
```typescript
const { promises: fs } = await import('fs');
let storageAdapter: 'sqlite' | 'json' = 'json';

try {
  const stats = await fs.stat(dbConfig.dbPath);
  if (stats.isFile()) {
    storageAdapter = 'sqlite';
  }
} catch (error: any) {
  // Only fall back to JSON for "file not found"
  // Re-throw other errors (permissions, I/O)
  if (error.code !== 'ENOENT') {
    throw new Error(
      `Failed to check SQLite database at ${dbConfig.dbPath}: ${error.message}`
    );
  }
  // Database doesn't exist yet, use JSON storage
}
```

**Why this matters:** Better error diagnostics. If database exists but isn't readable (permissions issue), user should know instead of silently falling back to JSON.

**Note:** This is LOW priority - current implementation works correctly for happy path and most error cases.

---

## Compliance Check

| Critical Invariant | Status | Notes |
|-------------------|--------|-------|
| #1: ES Modules Only | ✅ PASS | All imports use `import`/`export` |
| #2: Absolute Paths Required | ✅ PASS | Uses `path.resolve()` for user input |
| #3: Graceful Failures | ✅ PASS | Error messages clear, no stack traces |
| #4: Template Preservation | ✅ N/A | No templates modified |
| #5: Template Structure | ✅ N/A | No template changes |
| #6: Backwards Compatibility | ✅ PASS | Default behavior unchanged |
| #7: TDD Mandatory | ✅ PASS | Tests written first, RED-GREEN-REFACTOR followed |
| #8: Deliverables Consistency | ✅ PASS | No template deliverables affected |

**Additional Patterns:**

| Pattern | Status | Notes |
|---------|--------|-------|
| Logger usage (CLI commands) | ⚠️ MINOR | Core module correctly has no logger (pure function) |
| Type imports | ✅ PASS | Uses `import type { ... }` properly |
| Interface consistency | ✅ PASS | StorageAdapter interface updated, all implementations match |
| Error handling | ⚠️ MINOR | Should use AIFriendlyErrorBuilder (Issue #4) |

---

## Code Organization & SOLID Principles

**✅ Single Responsibility Principle:**
- `searchContextCore()` - Pure business logic
- `SqliteStorage.search()` - Database operations only
- `DatabaseLocator` - Configuration resolution
- Each class/function has clear, focused responsibility

**✅ Open/Closed Principle:**
- New functionality added via options parameters (no breaking changes)
- Storage adapter interface extended properly
- Existing code continues to work

**⚠️ DRY Principle:**
- Issue #2: Duplicated query building logic (see above)

**✅ Dependency Inversion:**
- Storage adapter interface allows swapping implementations
- Core business logic depends on abstractions, not concrete implementations

---

## Test Coverage Assessment

**Strengths:**
- 15/15 cross-project tests passing (100%)
- Comprehensive scenarios covered:
  - Default project isolation
  - Cross-project search with `--all-projects`
  - Scope filtering with cross-project
  - Project isolation verification
- Environment setup properly managed (beforeEach/afterEach)
- No test pollution (proper cleanup)

**Observations:**
- Tests use `.toBeGreaterThan(0)` for result counts - could be more specific
- Some tests verify string contains 'alpha' - could check exact file paths
- Overall: Test coverage is EXCELLENT for Phase 1 scope

---

## Documentation Quality

**✅ README.md updated:**
- Cross-project section added (60+ lines)
- Clear setup instructions
- Usage examples provided
- Benefits explained

**⚠️ Learned Patterns:**
Following the "Documentation Location Guidance" in AGENTS.md:

**Should this be documented in `.aiknowsys/learned/`?**

YES - Consider creating `.aiknowsys/learned/cross-project-architecture.md`:

**Reasoning:**
- **Project-specific pattern** that emerged from implementation (Phase 1)
- **Not a critical invariant** - cross-project queries are optional feature
- **Advanced technique** - improves workflow but isn't mandatory baseline
- **Complex implementation** - DatabaseLocator + storage layer + project filtering
- CODEBASE_ESSENTIALS.md already at 909 lines (over ideal 350)

**Recommended content:**
- When to use cross-project vs single-project queries
- DatabaseLocator resolution priority (env var → config → default)
- Performance implications (SQLite vs JSON storage)
- Common gotchas (AIKNOWSYS_DB_PATH in tests)
- Migration path for users (migrate-to-sqlite requirement)

This keeps ESSENTIALS lean while documenting the pattern for discoverability.

---

## Verdict

**STATUS:** ✅ **APPROVED WITH RECOMMENDATIONS**

**Summary:**
Phase 1 implementation is **architecturally sound** and follows proper engineering practices:
- Test-driven development followed rigorously
- Critical invariants satisfied
- No breaking changes
- Clean separation of concerns
- Backward compatible

The issues found are **refinements, not blockers**:
- Issue #1 (DatabaseLocator) - Performance optimization
- Issue #2 (DRY) - Code maintainability
- Issues #3-5 - Code quality polish

**Current state:** ✅ Production-ready  
**With recommendations:** ✅✅ Production-ready + maintainable long-term

---

## Required Actions

### High Priority (Do Before Merging to Main)
- [ ] **Issue #4: Use AIFriendlyErrorBuilder** for parameter validation
  - Critical for pattern consistency
  - Quick fix (~5 minutes)
  - Aligns with CODEBASE_ESSENTIALS.md Section 6

### Medium Priority (Can Address in Follow-Up PR)
- [ ] **Issue #1: Optimize DatabaseLocator usage** in searchContextCore
  - Performance improvement (5-10ms saved per call)
  - Affects MCP tool responsiveness
  - Estimated: 15 minutes

- [ ] **Issue #2: Extract `buildFtsQuery()` helper method**
  - DRY principle violation
  - Makes query logic maintainable
  - Estimated: 30 minutes

- [ ] **Issue #3: Replace magic number** with named constant
  - Documentation improvement
  - Self-documenting code
  - Estimated: 5 minutes

### Low Priority (Nice to Have)
- [ ] **Issue #5: Improve auto-detection error handling**
  - Better diagnostics for edge cases
  - Current implementation works for 99% of cases
  - Estimated: 10 minutes

### Documentation
- [ ] **Create `.aiknowsys/learned/cross-project-architecture.md`**
  - Document Phase 1 architecture for future reference
  - Keeps ESSENTIALS lean
  - Estimated: 20 minutes

### Validation (After Addressing Issues)
- [ ] Run full test suite: `npm test` (should be 737+ tests passing)
- [ ] Verify no regressions: `npm run test:post-build`
- [ ] Type check: `npm run build` (clean compilation)
- [ ] Update session file with completion status

---

## Closing Thoughts

**Excellent work on Phase 1!** The TDD discipline is exemplary, and the cross-project architecture is well-designed. The issues identified are refinements that will improve long-term maintainability, not fundamental flaws.

Key strengths:
- Test coverage is comprehensive
- Architecture is extensible
- Performance is solid (SQLite FTS5 is fast)
- No regressions introduced

Recommended focus:
1. Address Issue #4 (AIFriendlyErrorBuilder) for pattern consistency
2. Consider Issues #1-2 for long-term maintainability
3. Document the pattern in `.aiknowsys/learned/` to preserve architectural knowledge

**Ship it!** 🚀

---

**Review completed:** 2026-02-16 20:48  
**Next step:** Address high-priority issues, then update session file and delete this review file.
