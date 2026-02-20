---
id: "markdown_less_architecture"
title: "Markdown-Less Architecture: SQLite as Live Store (Reopened)"
status: "ACTIVE"
priority: "high"
type: "feature"
author: "arno"
created: "2026-02-17"
updated: "2026-02-20"
started: "2026-02-20"
---

# Markdown-Less Architecture: SQLite as Live Store

**Status:** 🎯 ACTIVE (reopened 2026-02-20 — was incorrectly marked COMPLETE)  
**Goal:** MCP mutation tools write to SQLite as the primary store. Markdown is a human export, never the source of truth. AI agents physically cannot corrupt files that don't exist in the workflow.


## Progress

**2026-02-20:** Started implementation on reopened markdown-less architecture plan: completed Phase F (architect-gated completion workflow) by updating developer/architect live agent specs and templates to require active-plan success-criteria verification before COMPLETE; architect now owns COMPLETE transition.

**2026-02-20:** 
## 2026-02-20 (Phase F closure)

Phase F fully delivered and architect-approved:
- YAML handoff parse fix in `.github/agents/developer.agent.md` and `templates/agents/developer.agent.template.md`
- Regression test `test/agent-handoff-config.test.ts` added with `extractYamlBlock` DRY helper and generic Handlebars normalizer
- All Phase F success criteria verified ✅
- 6/10 plan success criteria now met; Phases A–E remain

**Next:** Phase A — write RED test asserting `create_plan` immediately queryable via `query_plans_sqlite()` without migration.

## Why Reopened

This plan was marked COMPLETE on 2026-02-19 but the defining deliverable — **mutation tools writing to SQLite directly** — was never shipped. The plan completed excellent infrastructure work (schema, constraints, event sourcing, export commands, `create_learned_pattern`) but the write-path flip itself was never done.

Evidence: `lib/core/create-plan.ts` and `lib/core/create-session.ts` both call `JsonStorage` and write `.md` files as of 2026-02-20. SQLite is still a read cache populated by `migrate-to-sqlite`, not a live store.

This also caused a meta-bug: the plan tracker's own data is wrong — you can't trust plan status fields when mutations bypass the DB.

---

## What Was Completed ✅

| Phase | Item | Status |
|-------|------|--------|
| Phase 1 | Schema: `reviews`, `links`, `knowledge_events` tables | ✅ Done |
| Phase 1 | Storage layer CRUD (`insertReview`, `insertLink`, etc.) | ✅ Done |
| Phase 2 | Constraint engine (`lib/core/constraints.ts`) | ✅ Done |
| Phase 2 | Event logging (`lib/tools/log-work-event.ts`) | ✅ Done |
| Phase 3 | Export session / plan (all 4 formats) | ✅ Done |
| Phase 3 | CLI `aiknowsys export session|plan` wiring | ✅ Done |
| Phase 5 | `sync-plans` removed (no files to sync) | ✅ Done |
| Phase 5 | File mutation commands marked "human CLI only" with MCP-first warnings | ✅ Done |
| Phase 5 | AGENTS.md and templates updated to DB-first workflow guidance | ✅ Done |
| Phase 6 | `create_learned_pattern` MCP tool (writes pattern + `PATTERN_DISCOVERED` event) | ✅ Done |
| Phase 6 | Migration coordinator emits idempotent `pattern_discovered` events | ✅ Done |
| Phase 6 | DB pointer sync: `create_plan` / `set_plan_status` write `user_state.active_plan_id` | ✅ Done |

---

## What Still Needs to Be Done ❌

These are the items that were **never shipped** despite the COMPLETE status.

### Missing Piece A: Mutation Write-Path Flip (Core)

The mutation core functions still write markdown as the source of truth and completely bypass SQLite for their primary writes:

**`lib/core/create-plan.ts`**
- Currently: writes `PLAN_*.md`, calls `JsonStorage().rebuildIndex()`
- Required: write plan to SQLite (`insertPlan`), make `.md` an optional side-effect
- File: [lib/core/create-plan.ts](../../lib/core/create-plan.ts)

**`lib/core/create-session.ts`**
- Currently: writes session `.md` file as primary path; SQLite write is a "hybrid" secondary path that was wired but appears incomplete
- Required: SQLite write is the only required path; `.md` write is optional/off by default
- File: [lib/core/create-session.ts](../../lib/core/create-session.ts)

**`lib/core/update-plan.ts` / `update-session.ts` / `append-to-*.ts`**
- All append/prepend/update variants write markdown and call `rebuildIndex()`
- Required: write to SQLite only; rebuild is a no-op once SQLite is primary
- Files: `lib/core/` directory

**Definition of done for this piece:**
- `mcp_aiknowsys_create_plan()` → plan immediately visible in `query_plans_sqlite()` — no `migrate-to-sqlite` required
- `mcp_aiknowsys_create_session()` → session immediately visible in `query_sessions_sqlite()`
- `mcp_aiknowsys_append_to_session()` → content appended in DB, visible on next query
- No `.md` file is created in `.aiknowsys/` by default (human can request export explicitly)

---

### Missing Piece B: Session-Plan Auto-Linking (Phase 3 steps 6-7)

`createSessionCore` does not auto-link to the active plan:
- Step 6: Pass `planId` into `insertSession()` in the hybrid storage path (currently not stored in DB FK)
- Step 7: If no `planId` provided, check `user_state.active_plan_id` and auto-link silently
- **Why it matters:** Agents currently must remember and pass plan IDs — the whole point of `user_state.active_plan_id` is to make this invisible

---

### Missing Piece C: Enriched Query Results (Phase 3 step 8)

`getSession()` returns bare session data. It should JOIN and include:
- Linked plan metadata (`plan_id → plans.id`)
- Associated reviews (`LEFT JOIN reviews WHERE target_id = session.id`)

One call should return everything — no follow-up queries needed.

---

### Missing Piece D: `create_review` and `create_link` MCP Tools (Phase 3 steps 9-10)

The DB schema has `reviews` and `links` tables with full CRUD. No MCP tools expose them yet.
- `create_review({ targetId, content, author? })`
- `create_link({ sourceId, targetId, type })` with types: `depends_on`, `relates_to`, `blocks`, `implements`

---

### Missing Piece E: Constraint Integration into MCP Tools (Phase 4)

`lib/core/constraints.ts` exists but is not called by mutation tools:
- `set_plan_status(COMPLETE)` does not check for pending reviews
- `set_plan_status(COMPLETE)` does not check for validation events
- No `check_constraints()` MCP tool exposed

---

### Missing Piece F: Architect-Gated Plan Completion (NEW — moved from PLAN_fresh_setup)

**Discovered 2026-02-20 — root cause of the premature COMPLETE marking.**

The Developer decides unilaterally when a plan is COMPLETE. The Architect reviews code quality (patterns, invariants) but never checks the plan spec. Nobody verifies success criteria before COMPLETE is set.

**Required changes:**

**`templates/agents/developer.agent.template.md`:**
- Change the Architect handoff prompt from:  
  `"Please review the code I just wrote against {{ESSENTIALS_FILE}}."`
  to:  
  `"Please review the code I just wrote. Check: (1) code quality against {{ESSENTIALS_FILE}}, (2) plan compliance — read the active plan and verify all success criteria are met before approving COMPLETE."`
- Remove any instruction for the Developer to call `set_plan_status(COMPLETE)`. Developer sets `IN_PROGRESS`; COMPLETE is Architect's responsibility only.

**`templates/agents/architect.agent.template.md`:**
- Add mandatory **Plan Compliance Check** section to the review template:
  ```markdown
  ## Plan Compliance Check
  1. Call `mcp_aiknowsys_query_plans_sqlite({ status: "ACTIVE" })` to get the active plan
  2. Read the plan's **Success Criteria** checklist
  3. For each criterion: verified ✅ or failed ❌ with evidence
  
  | Criterion | Status | Evidence |
  |-----------|--------|---------|
  | [from plan success criteria] | ✅/❌ | [code reference or reason] |
  
  **Plan Verdict:** ✅ ALL CRITERIA MET — safe to mark COMPLETE
               OR ❌ INCOMPLETE — [list unmet criteria]
  ```
- Add as final step of APPROVED verdict:  
  `mcp_aiknowsys_set_plan_status({ planId, status: "COMPLETE" })`

This closes the loop: plan lifecycle is fully owned by the workflow, not by whoever finishes last.

---

## Implementation Order

Recommended sequencing based on dependencies:

1. **F first** (agent templates) — zero code risk, immediate process improvement, independent
2. **A next** (mutation write-path) — blocked nothing in F; unlocks B, C, E
3. **B + C together** (auto-linking + enriched queries) — both in `createSessionCore` / `getSession`
4. **D** (create_review / create_link tools) — additive MCP tools, no mutation path dependency
5. **E last** (constraint integration) — needs A, B, C to be reliable first

---

## TDD Requirements

For each missing piece:
- **A:** Write test asserting `create_plan` result is immediately queryable via `query_plans_sqlite` (no migration step) — must fail before implementation
- **B:** Write test asserting `create_session({ title })` auto-links to active plan when `user_state.active_plan_id` is set
- **C:** Write test asserting `get_session()` returns `plan` and `reviews` fields
- **D:** Write test for `create_review` and `create_link` tool schemas and DB round-trip
- **E:** Write test asserting `set_plan_status(COMPLETE)` throws when pending review exists
- **F:** No code — validate with `npx aiknowsys validate-deliverables` after template changes

---

## Success Criteria

- [ ] `mcp_aiknowsys_create_plan()` → immediately visible in `query_plans_sqlite()` (no migration)
- [ ] `mcp_aiknowsys_create_session({ title })` → auto-links to active plan silently
- [ ] `mcp_aiknowsys_query_sessions_sqlite()` results include plan metadata and reviews
- [ ] `create_review` and `create_link` MCP tools exist and round-trip to DB
- [ ] `set_plan_status(COMPLETE)` blocked when pending review exists
- [ ] Architect agent template includes "Plan Compliance Check" section
- [ ] Developer agent handoff prompt references active plan, not just ESSENTIALS
- [ ] Only the Architect calls `set_plan_status(COMPLETE)` — after plan criteria verified
- [ ] `npx aiknowsys validate-deliverables` passes
- [ ] All tests passing

---

## Notes

**Do not delete markdown-writing code paths yet** — keep them as the `--export-md` / human CLI paths. The goal is SQLite-first with markdown as optional export, not markdown elimination entirely. Humans still benefit from readable files; the problem is only when markdown is the *write* path for AI agents.

**`JsonStorage` / `rebuildIndex()` in mutation cores:** Once SQLite is primary, these become no-ops for AI workflow but should remain functional for human CLI users who run commands directly without MCP.
