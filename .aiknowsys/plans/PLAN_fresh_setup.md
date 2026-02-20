---
id: fresh_setup_and_db_seed_v2
title: "Radical Init Simplification: MCP-First, No Legacy Markdown"
status: PLANNED
priority: high
type: feature
author: Planner
created: 2026-02-20
---

# Radical Init Simplification: MCP-First, No Legacy Markdown

**Status:** 📋 PLANNED — ⚠️ BLOCKED on `markdown_less_architecture`  
**Goal:** `npx aiknowsys init` produces a seeded SQLite DB + AGENTS.md + skills. No CODEBASE_ESSENTIALS.md. No CODEBASE_CHANGELOG.md. MCP is the only supported context access layer.

## ⚠️ Prerequisite: Mutation Layer Must Write to SQLite (Partially Unfinished)

**This plan cannot be fully executed until the mutation layer writes to SQLite directly.**

### The Bug

Every MCP "mutation" tool (`mcp_aiknowsys_create_plan`, `mcp_aiknowsys_create_session`, etc.) currently writes **markdown files**, not the DB:

```
mcp_aiknowsys_create_plan()
    → lib/core/create-plan.ts
    → writes .aiknowsys/PLAN_*.md        ← markdown is the real store
    → updates JsonStorage JSON index
    → SQLite: ❌ not touched

mcp_aiknowsys_query_plans_sqlite()
    → reads .aiknowsys/knowledge.db      ← stale until manual migrate-to-sqlite
    → does NOT see the new plan
```

SQLite is currently a **read cache** populated by a manual migration command, not a live store. The MCP tools advertise DB-first behaviour but write markdown behind the scenes.

### The Meta-Bug

`markdown_less_architecture` (the plan intended to fix this) is marked **COMPLETE** and archived — but `lib/core/create-plan.ts` still writes markdown. Its status in the DB is wrong. This is the same consistency problem manifesting in the plan tracker itself: you cannot trust DB status fields if mutations bypass the DB.

That plan completed Phase 1 (schema, constraint engine, event sourcing tables) and Phase 2 (constraint enforcement), but **never flipped the actual mutation write path from markdown to SQLite**. It was marked complete prematurely.

### Why This Blocks the Fresh Setup Plan

If `init` creates a seeded `knowledge.db` but all subsequent MCP writes go to markdown, the DB becomes stale immediately after the first `create_plan` or `create_session` call. The seeded state is valid for about 30 seconds.

### What Still Needs to Be Done (from `markdown_less_architecture`)

Plan ID: `markdown_less_architecture` (marked COMPLETE in archive — but incomplete)

The **missing piece** (never shipped despite COMPLETE status):
- Flip `lib/core/create-plan.ts` to write to SQLite as the primary store
- Flip `lib/core/create-session.ts` (and append/prepend variants) to write to SQLite
- Remove or deprecate `JsonStorage` / `rebuildIndex()` calls in mutation paths
- Make markdown an **optional export** (`aiknowsys export plan <id>` or `--export-md` flag)
- Ensure `query_plans_sqlite` and `query_sessions_sqlite` reflect writes immediately (no manual migration step)

**Recommended action:** Reopen `markdown_less_architecture` as ACTIVE (or create `PLAN_mutation_writes_sqlite`) scoped tightly to these mutation write-path changes. Schema work is already done (Phase 1 of that plan); only the write-path flip is missing.

### What Can Be Done Now (Pre-Prerequisite Work)

Phases that do NOT depend on the mutation fix and can proceed in parallel:
- **Phase 1** (seed data architecture) — pure adds, no mutation path changes
- **Phase 3** (delete dead template files) — deletions only
- **Phase 4** (skills cleanup) — documentation edits
- **Phase 5** (AGENTS.template.md final pass) — documentation edits
- **Phase 6** (docs rewrite) — documentation edits

Phases that MUST wait for `markdown_less_architecture`:
- **Phase 2.1** (init calls `migrateToSqlite` + `seedDatabase`) — pointless if mutations bypass SQLite
- **Phase 2.3** (post-init MCP config snippet) — can be written but DB value claim would be misleading

---

## Core Insight

> Without MCP, this system adds no value.

Therefore `init` should not produce markdown files that AI agents are supposed to read — it should produce a SQLite DB that MCP serves. CODEBASE_ESSENTIALS.md and CODEBASE_CHANGELOG.md are **legacy artefacts from the pre-MCP era** and should be removed from the init output.

---

## Template Audit: What Goes, What Stays

### ❌ DELETE from templates/ (stop generating into user projects)

| File/Dir | Reason |
|---|---|
| `CODEBASE_ESSENTIALS.minimal.template.md` | DB + MCP replaces this entirely |
| `CODEBASE_ESSENTIALS.minimal.md` | Filled reference example, no longer needed |
| `CODEBASE_CHANGELOG.template.md` | Session history lives in DB; export on demand |
| `aiknowsys-structure/sessions/README.md` | DB owns its structure, no README needed |
| `aiknowsys-structure/learned/README.md` | Same |
| `aiknowsys-structure/personal/README.md` | Same |
| `.aiknowsys/plans/README.template.md` | Same |
| `.aiknowsys/reviews/README.template.md` | Same |
| `stacks/` (6 empty dirs) | Was never populated; delete |
| SETUP_GUIDE.md (copied into user projects) | 857-line guide per project; link to npm docs instead |

### → CONVERT to seed data (insert into DB during init instead of copying as files)

| File | Target table |
|---|---|
| `aiknowsys-structure/learned/plan-management.md` | `learned_patterns` |
| `aiknowsys-structure/learned/essentials-compression.md` | `learned_patterns` (or delete if ESSENTIALS gone) |
| `aiknowsys-structure/learned/vscode-file-operations.md` | `learned_patterns` |
| `aiknowsys-structure/PENDING_REVIEW.template.md` | Move to `install-agents` step only (not default init) |

### ✅ KEEP in templates/

| File/Dir | Why |
|---|---|
| `AGENTS.template.md` | Core AI workflow instructions |
| `agents/` (planner, developer, architect) | 3 custom agents |
| `skills/` (13 skills) | Consumed by agents as workflow reference |
| `git-hooks/pre-commit*` | Keep without ESSENTIALS size check |
| `hooks/` | VS Code session triggers |
| `workflows/tdd-compliance.yml` | CI |
| `scripts/install-git-hooks*` | Hook installer |

---

## What `init` Produces (Target State)

```
npx aiknowsys init --dir ./my-project

my-project/
├── AGENTS.md                          ← AI workflow instructions
├── .github/
│   ├── agents/                        ← planner, developer, architect
│   └── skills/                        ← 13 universal skills
└── .aiknowsys/
    └── knowledge.db                   ← seeded SQLite DB
          ├── critical_invariants (8 base + stack overlays)
          └── learned_patterns (plan-management, vscode-file-ops, ...)

[Post-init output]
✅ Database seeded: 8 invariants, 3 patterns
✅ MCP config for VS Code (.vscode/mcp.json):
   { "servers": { "aiknowsys": { "type": "stdio", "command": "node", ... } } }
✅ Run: mcp_aiknowsys_get_critical_invariants() to verify
```

Optional flags:
- `--hooks` → also installs git hooks + VS Code session hooks
- `--tdd` → also installs tdd-compliance.yml
- `--skip-db` → skip DB creation (CI environments)

---

## Implementation Phases

### Phase 1: Seed Data Architecture

#### 1.1 Create `lib/seeds/base.ts`
- Define `SeededInvariant` and `SeededPattern` types matching SqliteStorage insert API
- Export `BASE_INVARIANTS: SeededInvariant[]` — 8 records with `title`, `rule`, `details`
- Export `BASE_PATTERNS: SeededPattern[]` — port the 3 `aiknowsys-structure/learned/` md files; reuse their YAML frontmatter fields
- TDD: Write test — assert all 8 invariants have required fields, all patterns have `name`/`type`/`triggers`

#### 1.2 Create per-stack overlays `lib/seeds/stacks/typescript.ts`, `python.ts`
- Each exports `STACK_INVARIANTS` and `STACK_PATTERNS` arrays with stack-specific additions
- TDD: Test that overlays don't duplicate base keys

#### 1.3 Create `lib/commands/init/seed.ts`
- Export `seedDatabase(db: SqliteStorage, stackId?: string): Promise<SeedResult>`
- Load base + optional stack overlay; upsert into DB (idempotent)
- Return `{ invariants: number, patterns: number }`
- TDD: Test with in-memory DB; assert counts

---

### Phase 2: Init Flow Overhaul

#### 2.1 Update `lib/commands/init/templates.ts` — remove legacy file generation
- Remove `CODEBASE_ESSENTIALS` copy calls
- Remove `CODEBASE_CHANGELOG` copy call
- Remove `SETUP_GUIDE` copy call
- Remove all `aiknowsys-structure/` README copy calls
- Add: Call `migrateToSqlite()` then `seedDatabase()` after directory creation
- TDD: Update init integration test — assert `knowledge.db` exists; assert CODEBASE_ESSENTIALS.md does NOT exist

#### 2.2 Update `lib/commands/init/constants.ts` — remove stale TEMPLATE_PATHS
- Delete: `ESSENTIALS_FULL`, `ESSENTIALS_MINIMAL`, `CHANGELOG`, `SETUP_GUIDE`, `SESSIONS_README`, `LEARNED_README`, `PERSONAL_README`, `PLAN_MANAGEMENT`, `ESSENTIALS_COMPRESSION`, `PLANS_README`, `REVIEWS_README`

#### 2.3 Update `lib/commands/init/display.ts` — MCP config snippet in post-init output
- Print VS Code `.vscode/mcp.json` snippet and Claude Desktop snippet
- Print verify command: `mcp_aiknowsys_get_critical_invariants()`

#### 2.4 Update `bin/cli.js` init command
- Add `--skip-db` flag
- Remove `--essentials` option (no longer generates ESSENTIALS file)
- Keep `--template` as no-op with deprecation notice (backwards compat)

#### 2.5 Remove `{{SKILL_MAPPING}}` static table from `templates/AGENTS.template.md`
- Replace the entire "Check Skills Before Coding" table section with MCP call:
  ```markdown
  **Find the relevant skill for your task:**
  Call `mcp_aiknowsys_find_skill_for_task({ task: "brief description" })`
  → Returns the correct skill workflow, always reflecting installed skills.
  ```
- Remove `buildSkillMapping()` call from `lib/commands/init/templates.ts` (the string replace after skills install)
- Remove `buildSkillMapping()` calls from `lib/commands/install-skills.ts` and `lib/commands/config.ts` (or keep as legacy no-op if those commands are still needed)
- **Why:** The MCP `find_skill_for_task` tool is dynamic and always current; the static markdown table is a snapshot that goes stale. `mcp-server/src/tools/skills.ts` already has the live equivalent.

---

### Phase 3: Delete Legacy Template Files

```bash
templates/CODEBASE_ESSENTIALS.minimal.md
templates/CODEBASE_ESSENTIALS.minimal.template.md
templates/CODEBASE_CHANGELOG.template.md
templates/aiknowsys-structure/sessions/README.md
templates/aiknowsys-structure/learned/README.md
templates/aiknowsys-structure/learned/essentials-compression.md   # → seed data
templates/aiknowsys-structure/learned/plan-management.md          # → seed data
templates/aiknowsys-structure/learned/vscode-file-operations.md   # → seed data
templates/aiknowsys-structure/personal/README.md
templates/.aiknowsys/plans/README.template.md
templates/.aiknowsys/reviews/README.template.md
templates/stacks/                                                   # entire dir (empty)
```

- Verify no remaining `copyTemplate(...ESSENTIALS...)` calls
- Run `npx aiknowsys validate-deliverables`
- Update `validate-deliverables` command if it still checks ESSENTIALS existence

---

### Phase 4: Skills Cleanup (remove ESSENTIALS instructions from distributed skills)

- `templates/skills/context-query/SKILL.md` — demote `query-essentials-section` to "Legacy" section
- `templates/skills/feature-implementation/SKILL.md` — remove "update CODEBASE_ESSENTIALS.md" instruction
- Run `grep -r "CODEBASE_ESSENTIALS" templates/skills/` to catch remaining hits

---

### Phase 5: `templates/AGENTS.template.md` final pass

- Confirm zero references to "read CODEBASE_ESSENTIALS.md"
- Confirm zero references to "CODEBASE_CHANGELOG"
- Confirm `{{SKILL_MAPPING}}` placeholder is gone (replaced in Phase 2.5)
- Confirm `{{VALIDATION_MATRIX}}` is replaced with MCP call (`mcp_aiknowsys_get_validation_matrix()` is already the live tool)

---

### Phase 6: Docs

- `SETUP_GUIDE.md` — rewrite Quick Start: `init` → MCP config → verify; remove placeholder-filling section
- `mcp-server/SETUP.md` — add per-client HTML anchors (`#vscode`, `#claude-desktop`, `#cursor`)

### Phase 7 → Moved to `PLAN_markdown_less_architecture`

Architect-gated plan completion (agent template changes) is tracked in [PLAN_markdown_less_architecture.md](PLAN_markdown_less_architecture.md) as **Missing Piece F** — it belongs with the overall workflow enforcement work, not the init simplification.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Existing users have CODEBASE_ESSENTIALS.md | `migrate-essentials` command stays; release notes |
| `compress-essentials` targets non-existent file for new projects | Degrade gracefully if absent; no command deletion |
| `validate-deliverables` checks ESSENTIALS/CHANGELOG sync | Update to only validate templates that still exist |
| Tests asserting ESSENTIALS.md exists after init | Update in same PR as 2.1 |
| `buildSkillMapping` removal breaks existing AGENTS.md files that still have `{{SKILL_MAPPING}}` | `install-skills` keeps the replace as fallback for existing projects |

---

## Success Criteria

- [ ] `npx aiknowsys init` on empty dir → no CODEBASE_ESSENTIALS.md, no CODEBASE_CHANGELOG.md
- [ ] `npx aiknowsys init` → `knowledge.db` exists with >0 invariants and patterns
- [ ] Post-init output includes MCP config snippet
- [ ] `grep -r "CODEBASE_ESSENTIALS" templates/` → zero AI-instruction matches
- [ ] `grep "SKILL_MAPPING" templates/AGENTS.template.md` → no match
- [ ] `mcp_aiknowsys_find_skill_for_task` replaces static table in AGENTS.md
- [ ] `npx aiknowsys validate-deliverables` passes
- [ ] All tests passing
- [ ] `mcp_aiknowsys_get_critical_invariants()` returns data on brand-new project
- [ ] templates/ directory reduced from ~35 files to ~20

---

## Workflow Gap → See `PLAN_markdown_less_architecture`

Architect-gated plan completion analysis and fix details have moved to [PLAN_markdown_less_architecture.md](PLAN_markdown_less_architecture.md) (**Missing Piece F**).

---

## Notes for Developer

**Do NOT delete `compress-essentials` or `migrate-essentials` CLI commands** — existing users need them.

**`buildSkillMapping()` removal (Phase 2.5):** The MCP server `find_skill_for_task` tool in `mcp-server/src/tools/skills.ts` scans `.github/skills/` dynamically — it already does everything `buildSkillMapping()` did, live. Keep `buildSkillMapping()` in `lib/skill-mapping.ts` for existing projects that still have `{{SKILL_MAPPING}}` in their AGENTS.md (the `install-skills` fallback path), but don't call it during fresh `init` anymore.

**SqliteStorage API:** Check `lib/context/sqlite-storage.ts` for exact insert method signatures before writing seed types.

**`aiknowsys-structure/learned/*.md` files have YAML frontmatter** — extract those fields directly into seed record types.
