---
id: "PLAN_ai_native_onboarding_simplification"
title: "AI-Native Onboarding Simplification"
status: "ACTIVE"
priority: "high"
author: "arno-paffen"
created: "2026-02-20"
topics: ["onboarding", "ux", "simplification", "ai-native", "breaking-change"]
depends_on: ["PLAN_markdown_less_architecture"]
---

# Implementation Plan: AI-Native Onboarding Simplification

**Status:** 🎯 ACTIVE  
**Priority:** 🔴 HIGH  
**Created:** 2026-02-20  
**Timeline:** 2–3 weeks (4 phases)  
**Dependency:** `PLAN_markdown_less_architecture` ✅ COMPLETE (Feb 20, 2026)

---

## 🎯 Goal

Replace the CLI-heavy onboarding commands (`init`, `scan`, `migrate`) with a single AI instruction manual (`.github/onboarding-setup.md`). AI agents read this guide and drive setup conversationally — no interactive prompts, no stack templates, no 5-step CLI dance.

**Target new workflow:**
```
npm install -g aiknowsys

# Then simply talk to your AI:
Human: "Initialize AIKnowSys for this Terraform AWS project"
AI: [Reads onboarding-setup.md, queries Context7 for latest Terraform patterns]
AI: "Setup complete. What would you like to build?"
```

---

## Problem Statement

Current workflow requires 5+ CLI commands that AI agents can't naturally drive. Stack templates (~1400 lines across 7 files) are prescriptive and stale. New philosophy: **ship sensible defaults via examples, let AI + Context7 handle the rest.**

---

## What Gets Removed (~3000 lines)

| File | Lines | Reason |
|------|-------|--------|
| `lib/commands/init.ts` | ~554 | Replaced by AI conversation |
| `lib/commands/scan.ts` | ~600 | AI observes project directly |
| `lib/commands/migrate.ts` | ~200 | Fresh start only |
| `lib/commands/install-agents.ts` | ~150 | Auto-installed via onboarding |
| `lib/commands/install-skills.ts` | ~100 | Auto-installed via onboarding |
| `templates/stacks/` (7 files) | ~1400 | AI uses Context7 instead |

## What Gets Added

- `.github/onboarding-setup.md` — AI instruction manual
- DevOps/IaC examples: Terraform, Ansible, Kubernetes, Docker Compose
- Context7 integration documented in guide

---

## Stakeholder Decisions (Confirmed 2026-02-16)

1. **No grace period** — remove CLI commands, v0.10.x stays stable for existing users
2. **No fallback CLI** — AI-first or nothing
3. **Stack examples = AI guidance**, not prescriptive defaults
4. **Fresh install only** — no migration tooling; this is a new paradigm

---

## Implementation Steps

### Phase 1: Foundation (1 week)

**Step 1.1 — Create `.github/onboarding-setup.md`** *(1 day)*
- **Files:** `.github/onboarding-setup.md` (new)
- **Action:** Write AI instruction manual with 10+ stack examples across web, API, and DevOps/IaC
- **Sections:** Project detection, example stacks, Context7 integration, file creation workflow, conversational customization, learning mode
- **Examples:** Next.js, Vue, SvelteKit, Express, FastAPI, Axum, Terraform, Ansible, Kubernetes, Docker Compose
- **Validation:** Manual test with Claude/GPT-4 on 3+ project types
- **Risk:** Low

**Step 1.2 — Update `templates/AGENTS.template.md`** *(2 hours)*
- **Files:** `templates/AGENTS.template.md`
- **Action:** Replace CODEBASE_ESSENTIALS references with `onboarding-setup.md` pointer
- **Risk:** Low

**Step 1.3 — Conversational Setup POC** *(1 day)*
- **Action:** Manually test AI-driven setup for Next.js, FastAPI, Terraform
- **Success criteria:** Zero CLI commands; pure conversation; <30 seconds each
- **Risk:** Medium — depends on AI capability

**Step 1.4 — Update Context7 plugin docs** *(2 hours)*
- **Files:** `plugins/context7/README.md`
- **Action:** Document how AI uses Context7 during onboarding
- **Risk:** Low

---

### Phase 2: Cleanup (1 week)

**Step 2.1 — Delete onboarding CLI commands** *(1 day)*
- **Files to delete:** `lib/commands/init.ts`, `lib/commands/scan.ts`, `lib/commands/migrate.ts`, `lib/commands/install-agents.ts`, `lib/commands/install-skills.ts`
- **Also:** Remove their registrations from `bin/cli.js`
- **Risk:** High — many tests depend on these files

**Step 2.2 — Delete stack templates** *(half day)*
- **Files to delete:** `templates/stacks/` directory (7 files, ~1400 lines)
- **Also:** Update any code/doc references to stacks directory
- **Risk:** Low

**Step 2.3 — Streamline CLI entry point** *(4 hours)*
- **Files:** `bin/cli.js`
- **Result:** ≤7 commands remain: `check`, `update`, `validate-deliverables`, query commands, export commands
- **Note:** `sync-plans` removed (see Step 2.5)
- **Risk:** Low

**Step 2.4 — Fix tests for deleted commands** *(1 day)*
- **Action:** Remove/rewrite tests for deleted commands; run full `npm test` to green
- **Key file:** `test/init.test.ts` (~600+ lines, mostly about deleted command)
- **Risk:** Medium — large test surface

**Step 2.5 — Remove pointer-based plan system** *(2 hours)*
- **Context:** `CURRENT_PLAN.md` and `plans/active-*.md` are vestigial artifacts from the pre-database pointer system. `mcp_aiknowsys_get_active_plans()` now queries YAML frontmatter/SQLite directly — neither file is read by any MCP tool.
- **Files to delete:**
  - `.aiknowsys/CURRENT_PLAN.md` (auto-generated index, never read by MCP tools)
  - `.aiknowsys/plans/active-*.md` (pointer files, superseded by `status:` YAML frontmatter)
  - `lib/commands/sync-plans.ts` (generates only the above)
- **Remove from `bin/cli.js`:** `sync-plans` command registration
- **Remove from tests:** any tests for `sync-plans` command
- **Update `templates/AGENTS.template.md`:** remove all references to `CURRENT_PLAN.md`, `active-*.md`, and `sync-plans`
- **Update `CONTRIBUTING.md`:** remove pointer-system documentation
- **Keep:** `mcp_aiknowsys_get_active_plans()` call pattern — this is the correct way to check active work
- **Risk:** Low — nothing runtime depends on these files

---

### Phase 3: Documentation (1 week)

**Step 3.1 — Rewrite README.md** *(1 day)*
- **Action:** Replace CLI quickstart with AI-native onboarding section
- **Keep:** MCP tools, validation matrix, skills system sections
- **Risk:** Low

**Step 3.2 — Update SETUP_GUIDE.md** *(4 hours)*
- **Action:** Replace CLI instructions with conversational examples; add DevOps/IaC examples
- **Risk:** Low

**Step 3.3 — Real-world testing** *(2 days)*
- **Projects:** Fresh Next.js, FastAPI, Terraform, Ansible, Kubernetes Helm chart
- **Success:** AI-driven setup works, <30 seconds each
- **Risk:** Medium

---

### Phase 4: Release (3 days)

**Step 4.1 — Version bump → v0.11.0** *(1 day)*
- **Files:** `package.json`, `CODEBASE_CHANGELOG.md`, `docs/v0.11-breaking-changes.md` (new)
- **Changelog highlights:** 🔥 REMOVED: CLI onboarding + stack templates; ✨ NEW: AI-native onboarding
- **Risk:** Low

**Step 4.2 — Final end-to-end testing** *(1 day)*
- **Clean install** on 3 machines; AI conversation tested with Claude + GPT-4 + Copilot Chat
- **Verify:** No broken references; retained commands still work
- **Risk:** Low

---

## Testing & Validation

| Phase | Command | Expected |
|-------|---------|----------|
| After Phase 2 | `npm test` | 0 failures |
| After Phase 2 | `npm run lint` | 0 errors, warnings ↓ (removed `any` types) |
| After Phase 2 | `node bin/cli.js --help` | Only ≤8 commands listed |
| After Phase 3 | `npx aiknowsys validate-deliverables` | Pass |
| Phase 4 | Manual AI POC | Setup completes in <30s for 3+ stacks |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI doesn't follow onboarding guide | 30% | High | Test 3+ AI assistants; include example conversations |
| Users want CLI back | 20% | Medium | Clear docs: AI-native by design; v0.10.x remains on npm |
| Context7 gaps for some stacks | 40% | Medium | Fallback to generic patterns in guide |
| DevOps/IaC patterns too diverse | 60% | Low | Diverse examples; AI learns via conversation |
| onboarding guide gets stale | 30% | Low | CI check; quarterly review |

---

## Success Criteria

- [ ] **Phase 1:** `onboarding-setup.md` complete (10+ examples incl. DevOps/IaC); AI POC works for 3+ stacks
- [ ] **Phase 2:** ~3000 lines deleted; CLI ≤7 commands; `CURRENT_PLAN.md` + `active-*.md` + `sync-plans` removed; `npm test` green
- [ ] **Phase 3:** README + SETUP_GUIDE rewritten; real-world testing passed (5+ project types)
- [ ] **Phase 4:** v0.11.0 released; clean install tested on 3 machines; 3 AI assistants validated

---

## Notes for Developer

- **Start with Phase 1.1** — `onboarding-setup.md` is the anchor; everything else references it
- **Phase 2.4 is the riskiest step** — `test/init.test.ts` is ~600+ lines tied to the deleted `init` command
- **Lint baseline will drop** — removing 1600+ lines with `any` types reduces warning count; re-establish baseline after deletion
- **`CURRENT_PLAN.md` / `active-*.md` are gone in Phase 2.5** — after that, the only way to check active plans is `mcp_aiknowsys_get_active_plans()` or querying YAML frontmatter directly
- **Keep all MCP tools** — they are the future, not legacy
- **Keep `check`, `sync-plans`, `update`, export commands** — essential maintenance tools  
- **Archived plan for reference:** `.aiknowsys/archive/markdownless/2026-02-20T06-37-58-210Z/PLAN_ai_native_onboarding.md`
