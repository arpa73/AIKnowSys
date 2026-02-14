# Refactoring Best Practices

**Category:** Learned Patterns  
**Discovery Date:** 2026-02-11  
**Context:** Phase 2 REFACTOR - CLI wiring to core functions

---

## Multi-File Refactoring: Avoiding Corruption

### The Problem

When refactoring multiple files with similar structural changes, using `multi_replace_string_in_file` with overlapping replacements can corrupt files.

**Scenario that failed:**
- 3 files with similar structure (query-plans.ts, query-sessions.ts, search-context.ts)
- Each needs 3 replacements: imports, interface, function body
- Multi-replace made overlapping changes that destroyed syntax

**Symptoms:**
```typescript
// Corrupted output from multi_replace_string_in_file
try {
  const result = await queryPlansCore(options= {  // ❌ Syntax error
    ACTIVE: '🎯',  // ❌ Old code fragment mixed with new
```

### The Solution: Clean Recreation

When large replacements overlap or touch similar code regions:

**Recovery workflow:**
```bash
# 1. Restore original files
git checkout lib/commands/query-plans.ts query-sessions.ts search-context.ts

# 2. Delete files completely 
rm lib/commands/query-plans.ts query-sessions.ts search-context.ts

# 3. Recreate with complete clean content
# Use create_file with full, correct file contents
```

### Why This Works

- **Multi-replace:** Fragile when replacements touch same regions, can mix old/new code
- **Complete recreation:** Atomic operation, no partial corrupted state
- **git checkout → rm:** Necessary sequence because checkout restores files (blocks create_file)

### When to Use Each Approach

**Use `replace_string_in_file` when:**
- ✅ Single small change per file
- ✅ Replacements are in completely different sections
- ✅ High confidence in unique match strings

**Use complete file recreation when:**
- ✅ Multiple changes to same file
- ✅ Large structural refactoring (>30 lines)
- ✅ Replacements might overlap or touch similar code
- ✅ High-risk changes where corruption could be subtle

### Pattern Template

```typescript
// For 3+ files with identical structural changes:

// DON'T: Multi-replace with overlapping regions
multi_replace_string_in_file([
  { file: 'a.ts', oldString: '...imports...', newString: '...' },
  { file: 'a.ts', oldString: '...interface...', newString: '...' },
  { file: 'a.ts', oldString: '...function...', newString: '...' },
  // ... repeat for b.ts, c.ts - HIGH CORRUPTION RISK
]);

// DO: Prepare complete clean content, recreate files
const cleanContentA = `/* complete file */`;
const cleanContentB = `/* complete file */`;
const cleanContentC = `/* complete file */`;

// If files exist (after git checkout):
await run_in_terminal('rm a.ts b.ts c.ts');

// Create clean versions
await create_file({ path: 'a.ts', content: cleanContentA });
await create_file({ path: 'b.ts', content: cleanContentB });
await create_file({ path: 'c.ts', content: cleanContentC });
```

### Real-World Success

**Phase 2 REFACTOR (2026-02-11):**
- First attempt: multi_replace corrupted query-plans.ts
- Recovery: git checkout → rm → create_file
- Result: ✅ 154/154 tests passing, clean commit 73dda40

**Metrics:**
- Files refactored: 3 (query-plans, query-sessions, search-context)
- Code reduction: -162 lines (-34%)
- Test coverage: 100% preserved
- Corruption incidents: 1 (recovered successfully)

### Related Patterns

- **TDD REFACTOR:** Tests written FIRST ensure corruption is caught immediately
- **Incremental commits:** Small refactors reduce corruption risk
- **Test-driven recovery:** Run tests after each refactor to validate

---

**Trigger Words:** refactoring, multi-file changes, corruption, multi_replace_string_in_file, file recreation, structural changes

**See Also:**
- [.github/skills/refactoring-workflow/SKILL.md](../../.github/skills/refactoring-workflow/SKILL.md)
- [.aiknowsys/sessions/2026-02-11-session.md](../sessions/2026-02-11-session.md) - Recovery experience documented
