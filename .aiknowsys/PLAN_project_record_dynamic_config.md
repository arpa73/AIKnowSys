---
id: PLAN_project_record_dynamic_config
title: Implementation Plan - Project Record Lifecycle + Dynamic Config
status: ACTIVE
author: Planner
priority: high
type: feature
created: '2026-02-20'
updated: '2026-02-22'
topics:
  - project-record
  - dynamic-config
  - validation-matrix
  - tech-stack
  - mcp-tools
---

# Implementation Plan: Project Record Lifecycle + Dynamic Config

**Status:** 🎯 PLANNING  
**Created:** 2026-02-20  
**Author:** Planner  
**Priority:** high  
**Topics:** project-record, dynamic-config, validation-matrix, tech-stack, mcp-tools

## Overview

Currently, the `projects` table in `knowledge.db` is never populated during normal usage — only during `migrate-to-sqlite`. Sessions and plans are written with a `project_id` string that references no actual row, making FK constraints meaningless and multi-project DB isolation impossible. In parallel, the MCP tools `getCriticalInvariants()` and `getValidationMatrix()` return hardcoded AIKnowSys-specific data (Node.js, vitest, npm) that is wrong for every user project (Python, Rust, Go, etc.).

This plan fixes both problems together: **a `projects` row with `tech_stack` + a `project_config` table for dynamic per-project configuration**.

See `workdocs/ARCHITECTURE.md` for full system context and gap analysis.

## Requirements

### Functional
- `projects` row is created/upserted on every DB write (create-session, create-plan, migrate-to-sqlite)
- New `project_config` table stores dynamic key/value config per project
- `init` detects tech stack and seeds default validation matrix + critical invariants
- MCP tools read from `project_config` first, fall back to hardcoded defaults if no row found

### Non-Functional
- All existing 737+ tests still pass
- New code follows TDD (tests written first)
- No breaking changes to CLI or MCP API surface
- Stack detection: file existence checks only (no subprocess)

## Architecture Changes

| File | Change |
|------|--------|
| `lib/context/storage-adapter.ts` | Add `upsertProject()`, `upsertProjectConfig()`, `getProjectConfig()` stubs; deprecate `insertProject()` |
| `lib/context/schema.sql` | Add `project_config` table |
| `lib/context/sqlite-storage.ts` | Implement new adapter methods; add FK pragma |
| `lib/core/create-session.ts` | Call `upsertProject()` before insert |
| `lib/core/create-plan.ts` | Call `upsertProject()` before insert |
| `lib/migration/migration-coordinator.ts` | Replace crash-on-conflict with `upsertProject()` |
| NEW: `lib/utils/stack-detector.ts` | Detect tech stack from project files |
| NEW: `lib/utils/config-seeds.ts` | Map detected stack → default config values |
| NEW: `lib/core/seed-project-config.ts` | Orchestrate detection + seeding |
| `mcp-server/src/tools/context.ts` | Read from `project_config` first; hardcoded fallback |
| `bin/cli.js` (init action) | Call `upsertProject()` + `seedProjectConfig()` |
| `templates/` schema equivalent | Mirror `project_config` table (Critical Invariant #8) |

## Implementation Steps

---

### Phase 0: Extend StorageAdapter Contract (PREREQUISITE)

**0.1 — Add method stubs to `StorageAdapter`** (`lib/context/storage-adapter.ts`)
- Add `upsertProject()`, `upsertProjectConfig()`, `getProjectConfig()` with `throw` stubs
- Mark `insertProject()` as `@deprecated`
- **Why:** New methods on the adapter first = Postgres/Turso portability preserved (see ARCHITECTURE.md Gap #1)

**0.2 — Verify FK pragma** (`lib/context/sqlite-storage.ts` ~line 200)
- Confirm `this.db.pragma('foreign_keys = ON')` exists in `initSchema()`
- If absent, add it immediately after `new Database(dbPath)`

---

### Phase 1: Schema + Storage Layer

**1.1** 🔴 RED — Write tests (`test/lib/context/sqlite-storage-project.test.ts`)
- upsertProject creates row
- upsertProject updates row on conflict (COALESCE preserves tech_stack)
- upsertProjectConfig sets key
- getProjectConfig returns value / null for missing

**1.2** 🟢 GREEN — Add `project_config` to `lib/context/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS project_config (
  project_id TEXT NOT NULL,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (project_id, key),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_project_config_project ON project_config(project_id);
```

**1.3** 🟢 GREEN — Implement `upsertProject()` in `SqliteStorage` (INSERT ... ON CONFLICT DO UPDATE with COALESCE for tech_stack)

**1.4** 🟢 GREEN — Implement `upsertProjectConfig()` and `getProjectConfig()` in `SqliteStorage`

**1.5** ✅ VALIDATE — Update template schema equivalent; run `npx aiknowsys validate-deliverables`

---

### Phase 2: Ensure Project Row on Every DB Write

**2.1** 🔴 RED — Add assertions to existing create-session/create-plan tests: projects row exists after create

**2.2** 🟢 GREEN — Call `upsertProject()` in `lib/core/create-session.ts` before insert

**2.3** 🟢 GREEN — Call `upsertProject()` in `lib/core/create-plan.ts` before insert

---

### Phase 3: Stack Detection

**3.1** 🔴 RED — `test/lib/utils/stack-detector.test.ts` (Node, Python, Rust, Go, unknown)

**3.2** 🟢 GREEN — Implement `lib/utils/stack-detector.ts`:
```typescript
export interface TechStack {
  runtime: string;        // 'Node.js 20+' | 'Python 3.x' | 'Rust' | 'Go' | 'unknown'
  language: string;       // 'TypeScript' | 'JavaScript' | 'Python' | 'Rust' | 'Go' | 'unknown'
  testFramework: string;  // 'Vitest' | 'Jest' | 'pytest' | 'cargo test' | 'go test' | 'unknown'
  packageManager: string; // 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo' | 'go' | 'unknown'
  frameworks: string[];
}
export async function detectTechStack(projectDir: string): Promise<TechStack>
```
Detection order: Cargo.toml → Rust, go.mod → Go, pyproject.toml/requirements.txt → Python, package.json → Node (read JSON for vitest/jest, frameworks)

---

### Phase 4: Default Config Seeds

**4.1** 🔴 RED — `test/lib/utils/config-seeds.test.ts` (Node → npm test, Python → pytest, etc.)

**4.2** 🟢 GREEN — Implement `lib/utils/config-seeds.ts`:
- Node seed = current hardcoded values (npm test, vitest, validate-deliverables)
- Python: pytest, ruff check ., python -m pytest --cov, pip check
- Rust: cargo test, cargo clippy, cargo build --release, cargo audit
- Go: go test ./..., go vet ./..., go build ./...
- Unknown: generic guidance

---

### Phase 5: Init Seeds Project Config

**5.1** 🔴 RED — `test/lib/commands/init-seed.test.ts` (init → project_config rows exist)

**5.2** 🟢 GREEN — Implement `lib/core/seed-project-config.ts`:
- Calls detectTechStack → getConfigSeeds → upsertProjectConfig for each key
- Skip-if-exists logic (preserves user customizations on re-init)

**5.3** — Hook into `bin/cli.js` init action (find `.command('init')`) + `migration-coordinator.ts` `ensureProjectExists()`

---

### Phase 6: MCP Tools Read from DB

**6.1** 🔴 RED — `mcp-server/test/tools/context-db.test.ts` (DB row exists → returns it; no row → hardcoded fallback)

**6.2** 🟢 GREEN — Update `mcp-server/src/tools/context.ts`:
- `getCriticalInvariants(projectId?)` and `getValidationMatrix(projectId?)` — optional params, backward compatible
- Resolution: DatabaseLocator → query project_config → if missing, return existing hardcoded object
- **Remember:** `cd mcp-server && npm run build` after changes

---

### Phase 7: Validate

```bash
npm test                              # 737+ tests + ~30 new
npx aiknowsys validate-deliverables  # templates in sync
# Smoke test: init fresh dir, inspect DB for projects + project_config rows
```

Update `mcp-server/SETUP.md` to document DB-backed context tools.

---

## Success Criteria

- [ ] `projects` row exists after create-session, create-plan, migrate-to-sqlite
- [ ] `project_config` table in schema + templates
- [ ] detectTechStack identifies Node/Python/Rust/Go/unknown
- [ ] init seeds validation_matrix + critical_invariants
- [ ] getValidationMatrix() returns stack-appropriate commands
- [ ] getValidationMatrix() returns hardcoded fallback when no DB row
- [ ] upsertProject/upsertProjectConfig/getProjectConfig declared on StorageAdapter
- [ ] PRAGMA foreign_keys = ON confirmed
- [ ] 737+ existing tests still pass, ~30 new tests added
- [ ] validate-deliverables passes

## Notes for Developer

1. **Phase 0 is mandatory first.** Add to `StorageAdapter` before `SqliteStorage`. See ARCHITECTURE.md Gap #1.
2. **FK pragma.** `lib/context/sqlite-storage.ts` ~line 200, `initSchema()` method. Add `this.db.pragma('foreign_keys = ON')` after opening DB.
3. **insertProject() shim.** In `migration-coordinator.ts` ~line 177, the crash-on-UNIQUE is swallowed. Replace with `upsertProject()` — no error handling needed.
4. **Init location.** No `lib/commands/init.ts` exists. Init handler is inline in `bin/cli.js` — search for `.command('init')`.
5. **MCP build.** After `mcp-server/src/` changes: `cd mcp-server && npm run build`.
6. **tech_stack column** on `projects` is always NULL today. Populate from `detectTechStack()` during Phase 5.
