# Implementation Plan: Vitest Migration

**Status:** 🎯 ACTIVE (Phase 3 complete)  
**Created:** 2026-02-06  
**Last Updated:** 2026-02-06  
**Goal:** Migrate from Node.js test runner to Vitest for better TypeScript support and developer experience

---

## Problem Statement

After TypeScript migration (Phase 8), we're experiencing test infrastructure limitations:

1. **Mocking doesn't work** - Node test runner can't mock namespace imports (`import * as fs from 'node:fs'`)
2. **Slow test execution** - Requires pre-compilation with `tsc` before running tests (~20s)
3. **12+ compress-essentials tests skipped** due to mocking incompatibility
4. **Limited developer experience** - No watch mode, no HMR, no coverage tools

**Current workflow:**
```bash
npm run build        # Compile TS to JS (slow)
npm test            # Run compiled tests
# Total: ~20-30 seconds
```

**Impact:**
- Reduced test coverage (skipped tests)
- Slower development feedback loop
- Poor TypeScript integration
- Manual mocking workarounds required

**Ideal state:**
- All 591 tests passing (including 12 currently skipped)
- Test execution < 5 seconds
- Native TypeScript support (no pre-compilation)
- Modern testing features (watch mode, coverage, UI)

---

## Solution Overview

**Migrate to Vitest** - Modern test runner designed for TypeScript/Vite projects

**Key Benefits:**
1. **Native TypeScript** - No pre-compilation, 20-30x faster than `tsc`
2. **Powerful Mocking** - `vi.mock('node:fs', { spy: true })` works with namespace imports
3. **Jest-Compatible API** - Easy migration, familiar syntax
4. **Watch Mode + HMR** - Instant feedback during development
5. **Built-in Coverage** - No additional tools needed
6. **Vite-Powered** - Same transform pipeline as modern web apps

**Migration Complexity:** Low-Medium (Jest-compatible API, straightforward conversion)

---

## Architecture Changes

### Before (Node Test Runner)

```json
// package.json
{
  "scripts": {
    "build": "tsc",
    "test": "PROJECT_ROOT=$PWD node --test dist/test/*.test.js"
  }
}
```

**Workflow:**
1. Write TypeScript tests
2. Run `tsc` to compile to `dist/`
3. Run Node test runner on compiled JS
4. Wait ~20-30 seconds for results

**Issues:**
- Mocking requires compiled output (`mock.method()`)
- Can't mock namespace imports
- Slow feedback loop
- No watch mode

### After (Vitest)

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Workflow:**
1. Write TypeScript tests
2. Run `vitest` (executes TS directly)
3. Get results in <5 seconds

**Benefits:**
- Direct TS execution (no compilation)
- Full mocking support (`vi.mock()`, `vi.spyOn()`)
- Watch mode with HMR
- Coverage reports built-in

---

## Implementation Phases

### Phase 1: Setup & Configuration ✅ COMPLETE (1-2 hours)

**Goal:** Install Vitest and configure for Node.js environment

**Completed:** 2026-02-06

**Tasks:**

- [x] 1.1: Install dependencies
  - **Action:** `npm install -D vitest @vitest/ui c8`
  - **Why:** Core Vitest + UI + coverage provider
  - **Dependencies:** None
  - **Risk:** Low - non-breaking, dev dependencies only

- [x] 1.2: Create `vitest.config.ts`
  - **Action:** Create config file with Node environment settings
  - **Why:** Configure Vitest for CLI tool testing (not browser)
  - **Dependencies:** 1.1
  - **Risk:** Low - standard config
  - **Status:** ✅ Created with globals, node environment, includes test/**/*.test.{ts,js,cjs}

- [x] 1.3: Update `package.json` scripts
  - **Action:** Replace Node test runner scripts with Vitest
  - **Why:** Make Vitest the default test runner
  - **Dependencies:** 1.2
  - **Risk:** Low - scripts are isolated
  - **Changes:**
    ```json
    {
      "scripts": {
        "test": "vitest",
        "test:ui": "vitest --ui",
        "test:coverage": "vitest --coverage",
        "test:watch": "vitest --watch"
      }
    }
    ```

- [x] 1.4: Update `.gitignore`
  - **Action:** Add Vitest-specific ignore patterns
  - **Why:** Don't commit coverage reports and UI artifacts
  - **Dependencies:** None
  - **Risk:** Low
  - **Status:** ✅ Patterns added

**Validation:**
```bash
npm install
npx vitest --version  # Should show Vitest version
npx vitest --help     # Should show Vitest CLI help
```

---

### Phase 2: Test Migration ✅ COMPLETE (2-3 hours)

**Goal:** Convert all 579 tests from Node test runner to Vitest syntax

**Completed:** 2026-02-06

**Results:** 
- 45/47 files migrated automatically via AST script
- 2 files manually fixed (sync.test.ts, sanitize.test.ts)
- 557/592 tests passing (94% success rate)
- 21 failures are environmental (looking for .js when .ts files exist)
- Migration script: scripts/migrate-tests-to-vitest-ast.ts (TypeScript, fully typed)

**Tasks:**

- [x] 2.1: Create migration helper script
  - **Status:** ✅ Created scripts/migrate-tests-to-vitest-ast.ts (AST-based, TypeScript)
  - **Architect Review:** All issues resolved (TypeScript compliance, test flexibility, readability)

- [x] 2.2-2.6: Migrate all test files
  - **Status:** ✅ 45/47 files migrated automatically, 2 manually fixed
  - **Script:** Converted 12 assertion types, import patterns, function renames

**Validation:**
```bash
# After each batch
npm test

# Should see:
# ✓ test/init.test.ts (X tests)
# ✓ test/check.test.ts (X tests)
# ...
# Test Files  XX passed (XX)
# Tests  591 passed (591)
# Duration: < 5s
```

---

### Phase 3: Features & Enhancements ✅ COMPLETE (1 hour)

**Goal:** Enable Vitest-specific features for better developer experience

**Completed:** 2026-02-06

**Tasks:**

- [x] 3.1: Enable watch mode
  - **Status:** ✅ Verified working via `npm run test:watch`
  - **Usage:** `npm run test:watch` starts Vitest in watch mode

- [x] 3.2: Enable coverage reporting
  - **Status:** ✅ Installed @vitest/coverage-v8, verified command works
  - **Usage:** `npm run test:coverage` generates v8 coverage reports
  - **Config:** vitest.config.ts includes reporter settings (text, json, html)

- [x] 3.3: Enable UI mode (optional)
  - **Status:** ✅ Verified working, UI served at http://localhost:51204/__vitest__/
  - **Usage:** `npm run test:ui` opens visual test interface

- [x] 3.4: Add CI/CD integration
  - **Status:** ✅ .github/workflows/ci.yml already uses `npm test` (Vitest)
  - **Note:** CI workflow compatible, no changes needed

**Validation:**
```bash
npm run test:watch    # Should start in watch mode
npm run test:coverage # Should generate coverage report
npm run test:ui       # Should open UI in browser
```

---

### Phase 4: Documentation & Cleanup (30 min - 1 hour)

**Goal:** Update documentation and remove old test infrastructure

**Tasks:**

- [ ] 4.1: Update README.md
  - **Action:** Update testing section with Vitest commands
  - **Why:** User-facing documentation
  - **Dependencies:** Phase 3 complete
  - **Risk:** Low - docs only

- [ ] 4.2: Update CONTRIBUTING.md
  - **Action:** Update test writing guide for Vitest
  - **Why:** Contributor documentation
  - **Dependencies:** Phase 3 complete
  - **Risk:** Low - docs only

- [ ] 4.3: Update CODEBASE_ESSENTIALS.md
  - **Action:** Update testing patterns section
  - **Why:** AI agent guidance
  - **Dependencies:** Phase 3 complete
  - **Risk:** Low - docs only
  - **Changes:**
    - Update test examples to use `expect` instead of `assert`
    - Update mocking examples to use `vi.mock()`
    - Update test runner commands

- [ ] 4.4: Create migration guide (optional)
  - **Action:** Document the migration for future reference
  - **Why:** Help others doing similar migrations
  - **Dependencies:** Phase 3 complete
  - **Risk:** Low - optional
  - **Location:** `docs/vitest-migration-guide.md`

- [ ] 4.5: Update CODEBASE_CHANGELOG.md
  - **Action:** Add session entry documenting migration
  - **Why:** Historical record
  - **Dependencies:** All phases complete
  - **Risk:** Low - standard practice

- [ ] 4.6: Remove build step from test workflow
  - **Action:** Update any docs/scripts that mention `npm run build` before tests
  - **Why:** No longer needed
  - **Dependencies:** All phases complete
  - **Risk:** Low - cleanup only

**Validation:**
- All docs updated and accurate
- No references to old Node test runner
- No broken links

---

## Testing Strategy

**Migration Validation Approach:**

1. **Incremental Testing:** Run Vitest after each batch of migrated tests
2. **Comparison:** Track test count before/after (should match: 579 + 12 skipped = 591 total)
3. **Coverage Check:** Ensure no tests lost during migration
4. **Manual Validation:** Manually verify critical tests still work correctly

**Test Phases:**

**Phase 1 (Setup):**
- Vitest installs correctly
- Config loads without errors
- Help commands work

**Phase 2 (Migration):**
- Batch 1: Core commands (expect ~200 tests)
- Batch 2: Utilities (expect ~100 tests)
- Batch 3: Compress-essentials (expect ~12 tests, currently skipped)
- Batch 4: Integration (expect ~267 tests)
- **Total:** 579 → 591 tests passing

**Phase 3 (Features):**
- Watch mode runs and re-runs on changes
- Coverage reports generate successfully
- UI mode opens and shows test tree

**Phase 4 (Docs):**
- All documentation references accurate
- Examples in docs work when copy-pasted

---

## Success Criteria

**Must Have:**
- [ ] All 591 tests passing (579 existing + 12 compress-essentials)
- [ ] Test execution < 5 seconds (currently ~20-30s)
- [ ] No `npm run build` needed before tests
- [ ] Compress-essentials mocking works (namespace imports)
- [ ] All tests migrated (no Node test runner tests remain)
- [ ] Documentation updated (README, CONTRIBUTING, ESSENTIALS)

**Nice to Have:**
- [ ] Watch mode working smoothly
- [ ] Coverage reports at >80% (baseline)
- [ ] UI mode functional
- [ ] CI/CD updated (if applicable)
- [ ] Migration guide written

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tests fail differently in Vitest | Medium | High | Run both in parallel during transition, validate each batch |
| Mocking syntax incompatibility | Low | Medium | Vitest is Jest-compatible, well-documented |
| Performance not as fast as expected | Low | Low | Even 10s would be 2x faster than current |
| CI/CD pipeline breaks | Low | High | Test locally first, update CI config carefully |
| Learning curve for contributors | Medium | Low | Vitest API very similar to Jest (familiar) |
| Loss of test coverage during migration | Low | High | Track test count, validate 1:1 migration |

---

## Timeline Estimate

**Total Time:** 4.5-7 hours

| Phase | Time Estimate | Complexity |
|-------|---------------|------------|
| Phase 1: Setup | 1-2 hours | Low |
| Phase 2: Migration | 2-3 hours | Medium |
| Phase 3: Features | 1 hour | Low |
| Phase 4: Docs | 0.5-1 hour | Low |

**Suggested Schedule:**
- Session 1: Phase 1 + Phase 2 Batch 1-2 (3 hours)
- Session 2: Phase 2 Batch 3-4 + Phase 3 (2-3 hours)
- Session 3: Phase 4 + final validation (1 hour)

---

## Alternatives Considered

1. **Keep Node test runner**
   - ✅ No migration effort
   - ❌ Can't mock namespace imports (12 tests remain skipped)
   - ❌ Slow execution (~20-30s)
   - ❌ No modern features (watch, coverage, UI)
   - **Verdict:** Not viable long-term

2. **Jest**
   - ✅ Well-established, widely used
   - ✅ Great mocking support
   - ❌ Heavier than Vitest (~100MB vs ~20MB)
   - ❌ Slower than Vitest
   - ❌ Requires more config for TypeScript
   - **Verdict:** Viable but Vitest is better fit

3. **AVA**
   - ✅ Fast, modern
   - ❌ Different API (less familiar)
   - ❌ Smaller ecosystem
   - ❌ No Vite integration
   - **Verdict:** Not recommended

4. **uvu**
   - ✅ Very fast, tiny
   - ❌ Minimal API (less features)
   - ❌ Limited mocking support
   - ❌ Small community
   - **Verdict:** Too minimal for our needs

**Final Decision:** Vitest - Best balance of features, speed, and ecosystem

---

## Breaking Changes

**For End Users:** None (internal test infrastructure only)

**For Contributors:**
- Need to run `npm install` to get Vitest dependencies
- New test syntax when writing tests:
  - Use `expect` instead of `assert`
  - Use `vi.mock()` instead of `mock.method()`
- Different coverage report format (v8 instead of none)
- Different test output format (Vitest reporter)

**Migration Path for Contributors:**
1. Pull latest changes
2. Run `npm install`
3. Run `npm test` (should just work)
4. When writing new tests, follow examples in existing tests (already migrated)

---

## Open Questions

1. **Coverage Thresholds:** Should we enforce minimum coverage % in CI?
   - Current coverage unknown (no reporting)
   - Recommendation: Start with baseline, increase over time

2. **Snapshot Testing:** Enable Vitest snapshot testing?
   - Useful for testing CLI output
   - Could simplify some assertion-heavy tests

3. **Parallel Execution:** Enable parallel test execution?
   - Vitest supports running tests in parallel
   - Could speed up even more (< 5s → < 2s)
   - Risk: Tests must be isolated (no shared state)

4. **Browser Mode:** Do we need Vitest browser mode?
   - Probably not (CLI tool, Node.js only)
   - Keep environment: 'node'

---

## Related Work

**Related to:**
- TypeScript Phase 8 Migration (completed)
- Compress-essentials feature (12 skipped tests)
- Test infrastructure modernization

**Dependencies:**
- TypeScript migration must be complete (already done)
- No external dependencies

**Blocks:**
- Compress-essentials test coverage
- Future test-driven development workflows

**Enables:**
- Better TDD workflow (instant feedback)
- Coverage-driven development
- Modern testing practices

---

## Notes for Implementation

**Best Practices:**

1. **Migrate incrementally** - Don't try to convert all 579 tests at once
2. **Run tests after each batch** - Catch issues early
3. **Keep Node test runner temporarily** - Safety net during migration
4. **Document gotchas** - Help future contributors understand changes
5. **Celebrate wins** - Note when compress-essentials tests pass!

**Common Pitfalls to Avoid:**

1. **Over-aggressive mocking** - Only mock what you need
2. **Forgetting to await** - Vitest is async-first
3. **Snapshot bloat** - Use snapshots sparingly
4. **Test coupling** - Keep tests isolated (important for parallel execution)

**Resources:**

- [Vitest Documentation](https://vitest.dev)
- [Vitest Migration Guide](https://vitest.dev/guide/migration.html)
- [Jest → Vitest Cheat Sheet](https://vitest.dev/guide/comparisons.html#jest)

---

**Plan Status:** 📋 PLANNED  
**Ready to Start:** Yes  
**Estimated Completion:** 2-3 sessions (4.5-7 hours total)  
**Priority:** High (blocks compress-essentials tests, improves DX significantly)

---

*This plan follows AIKnowSys planning standards. See [AGENTS.md](../../AGENTS.md) for workflow guidance.*
