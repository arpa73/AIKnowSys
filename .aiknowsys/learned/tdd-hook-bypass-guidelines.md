---
category: development-workflow
tags: [tdd, git-hooks, refactoring, testing]
created: 2026-02-14
updated: 2026-02-14
status: active
---

# When is `--no-verify` Acceptable for Refactoring?

## Context

AIKnowSys enforces TDD via pre-commit hooks (Critical Invariant #7). However, pure refactoring sometimes triggers the hook unnecessarily when existing tests already provide regression protection.

## Problem

TDD pre-commit hook checks:
```bash
# Detects lib/ changes without test/ changes
# Assumes: No test changes = TDD violation
```

This creates false positives for:
- Import reorganization (changing HOW, not WHAT)
- Code formatting/style changes
- Moving code between files (no logic changes)
- Renaming variables/functions (with existing coverage)

## Solution: Safe `--no-verify` Usage

### ✅ ACCEPTABLE: Pure Refactoring

Use `--no-verify` when **ALL** of these are true:

1. **No new functionality** - Only reorganizing existing code
2. **Existing tests cover the code** - Regression protection already exists
3. **Manual testing performed** - Verified behavior unchanged
4. **Commit message explains** - Why hook bypass is justified

**Examples:**
```bash
# ✅ Import consolidation (Phase 4 example)
git commit --no-verify -m "Refactor: Consolidate imports via barrel export

Changed from 4 separate imports to 1 barrel export.
No functionality changed, existing 4/4 tests provide coverage.
Manually tested: mcp-test get-db-stats, mcp-test get-invariants"

# ✅ Code movement
git commit --no-verify -m "Refactor: Move utility functions to utils/

Moved 3 helper functions from commands/ to utils/.
No logic changes, 15/15 tests still passing.
Enables reuse across multiple commands."

# ✅ Variable renaming
git commit --no-verify -m "Refactor: Rename unclear variable names

Renamed 'x' → 'sessionData' for clarity.
Logic unchanged, 12/12 tests validate behavior."
```

### ❌ NEVER ACCEPTABLE

**Do NOT use `--no-verify` for:**
- New features (write tests FIRST)
- Bug fixes (write reproducing test FIRST)
- Logic changes (even small ones)
- "Quick fixes" (technical debt accumulates)
- Bypassing test failures (fix the tests!)

## Guidelines

### When Refactoring:

**1. Run tests BEFORE refactoring**
```bash
npm test  # Establish baseline: X tests passing
```

**2. Make refactoring changes**
- Keep changes small and focused
- One type of refactoring per commit

**3. Run tests AFTER refactoring**
```bash
npm test  # Verify: Same X tests still passing
```

**4. Manual testing (if applicable)**
```bash
# Test affected commands/functions
node bin/cli.js <command>
# Verify output unchanged
```

**5. Commit with justification**
```bash
git commit --no-verify -m "Refactor: <what changed>

<Why change was made>
<Why no new tests needed>
<What manual testing was done>"
```

## Real-World Example: Phase 4 Barrel Export

**Change:** Consolidated 4 MCP tool imports into 1 barrel export

**Before:**
```typescript
import { querySessionsSqlite } from '../../mcp-server/src/tools/sqlite-query.js';
import { getCriticalInvariants } from '../../mcp-server/src/tools/context.js';
import { getActivePlans } from '../../mcp-server/src/tools/query.js';
import { findSkillForTask } from '../../mcp-server/src/tools/skills.js';
```

**After:**
```typescript
import {
  querySessionsSqlite,
  getCriticalInvariants,
  getActivePlans,
  findSkillForTask
} from '../../mcp-server/src/api.js';
```

**Justification for `--no-verify`:**
1. ✅ Pure import reorganization (HOW code is loaded, not WHAT it does)
2. ✅ Existing 4/4 mcp-test tests validate behavior
3. ✅ Manually tested: `mcp-test get-db-stats`, `mcp-test get-invariants`
4. ✅ Commit message explained: "Refactoring only - no new functionality"

**Architect Review:** APPROVED - "This is analogous to configuration-only changes. Existing tests provide regression protection."

## When in Doubt

**If you're unsure, DO NOT use `--no-verify`**

Instead:
1. Create new test file (even if simple)
2. Add basic test that exercises refactored code
3. Commit normally (hook will pass)

**Better safe than sorry** - writing one extra test is cheaper than debugging a regression.

## Related

- **Critical Invariant #7:** TDD requirement ([CODEBASE_ESSENTIALS.md](../../CODEBASE_ESSENTIALS.md#4-critical-invariants-always-enforced---not-optional))
- **TDD Workflow:** [.github/skills/tdd-workflow/SKILL.md](../../.github/skills/tdd-workflow/SKILL.md)
- **Pre-commit Hooks:** [.git-hooks/README.md](../../.git-hooks/README.md)

## Summary

**`--no-verify` is safe for pure refactoring when:**
- Existing tests provide coverage
- Manual testing confirms no behavior change
- Commit message justifies the bypass
- Changes are small and focused

**Use sparingly and with careful consideration** - TDD enforcement exists for good reason.
