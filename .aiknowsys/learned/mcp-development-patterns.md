# MCP Development Patterns

**Category:** workarounds  
**Discovery Date:** 2026-02-09  
**Context:** MCP tools need to spawn CLI commands from project root

---

## Problem

MCP tools in `mcp-server/src/tools/` need to execute aiknowsys CLI commands that operate on project files (`.aiknowsys/`, `CODEBASE_ESSENTIALS.md`, etc.). The challenge:

1. **TypeScript compilation nesting:** Source in `mcp-server/src/tools/` compiles to `dist/mcp-server/src/tools/` (nested structure due to rootDir config)
2. **Execution context varies:** Tests run from `mcp-server/`, production may run from project root
3. **Cannot use `process.cwd()`:** Unpredictable and violates Critical Invariant #2 (absolute paths)

---

## Solution Pattern

**Use dynamic project root detection by searching for `.aiknowsys/` directory:**

```typescript
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Get actual file location (import.meta.url pattern - Critical Invariant #2)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find project root by searching for .aiknowsys/ directory
// Works in any execution context (dev/prod/test)
function findProjectRoot(): string {
  let current = __dirname;
  
  // Try up to 10 levels (more than enough for any reasonable nesting)
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(current, '.aiknowsys'))) {
      return current;
    }
    const parent = resolve(current, '..');
    if (parent === current) {
      // Reached filesystem root
      break;
    }
    current = parent;
  }
  
  throw new Error('Could not locate project root (.aiknowsys/ not found)');
}

const PROJECT_ROOT = findProjectRoot();

// Now use PROJECT_ROOT for CLI execution
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

const { stdout } = await execFileAsync('npx', ['aiknowsys', 'command'], { 
  cwd: PROJECT_ROOT 
});
```

---

## Why This Works

1. **File-location based:** Uses `import.meta.url` to get actual file path (documented ESM pattern)
2. **Search-based detection:** Walks up directory tree looking for `.aiknowsys/` marker
3. **Execution-context independent:** Works whether running from:
   - Development: `mcp-server/src/tools/` (up 3 levels)
   - Production: `mcp-server/dist/mcp-server/src/tools/` (up 5 levels)
   - Tests: Any directory structure
   - CI/CD: Unknown working directories

4. **Compliant with Critical Invariant #2:** Uses absolute paths via file location, not dynamic `process.cwd()`

---

## What NOT to Do

**❌ Hardcoded relative path:**
```typescript
// FRAGILE: Assumes specific nesting level
const PROJECT_ROOT = resolve(__dirname, '../../..');
// Breaks when TypeScript compiler changes output structure
```

**❌ Using `process.cwd()`:**
```typescript
// VIOLATES Critical Invariant #2
const PROJECT_ROOT = resolve(process.cwd(), '..');
// Assumes cwd is always mcp-server/ (only true in tests)
```

---

## Testing Considerations

**Integration test cleanup:** When tests create files in `.aiknowsys/`, remember that CLI titleizes filenames:

```typescript
// Input: 'Integration Test Plan'
// CLI creates: PLAN_integration_test_plan.md (titleized + "_plan" suffix)

// Cleanup must use actual filename:
const testPlanPath = join(PROJECT_ROOT, '.aiknowsys/PLAN_integration_test_plan.md');
```

**Test from multiple contexts:** Run tests from both project root and mcp-server/ to verify path resolution:

```bash
# From mcp-server/
npm test

# From project root
npm test -- mcp-server/test/integration/
```

---

## Related Issues

- **Initial bug:** Integration tests failed with ENOENT errors (commit bbf66c9)
- **Architect review:** Identified `process.cwd()` fragility (commit b77d0b9)
- **Root cause:** TypeScript compilation creates nested dist structure
- **Resolution:** Dynamic search pattern (6/6 tests passing)

---

## Future MCP Tools

**Use this pattern for any MCP tool that:**
- Spawns CLI commands (`execFileAsync`)
- Reads/writes project files
- Needs project root for file operations

**Example tools using this pattern:**
- `mutations.ts` - create/update sessions and plans
- `validation.ts` - check TDD compliance, validate deliverables
- Any future tool calling `npx aiknowsys` commands

---

*Part of AIKnowSys MCP server development. See [CODEBASE_ESSENTIALS.md](../../CODEBASE_ESSENTIALS.md) for Critical Invariants.*
