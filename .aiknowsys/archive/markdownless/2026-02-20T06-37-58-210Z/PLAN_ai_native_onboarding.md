---
title: "AI-Native Onboarding Simplification"
status: "PLANNED"
priority: "high"
created: "2026-02-16"
author: "Planner"
topics: ["onboarding", "ux", "simplification", "ai-native", "breaking-change"]
depends_on: ["PLAN_knowledge_bank_evolution"]
evolution_of: []
---

# PLAN: AI-Native Onboarding Simplification

**Status:** 📋 PLANNED  
**Priority:** 🔴 HIGH  
**Created:** 2026-02-16  
**Timeline:** 2-3 weeks (4 phases: Foundation → Cleanup → Documentation → Release)

**Goal:** Eliminate bloated CLI onboarding commands (scan/init/migrate) and replace with AI-driven conversational setup using sensible defaults.

**User Request:**
> "Those cli onboarding things are actually non-sense, why not give a nice onboarding-setup.md with all an AI-AGENT needs for the setup, no more manual scan, init tools, we'll ship some sensible defaults like the stacks that's it no more bloated init with a zillion commands."

---

## Problem Statement

### Current Onboarding is CLI-Heavy, Not AI-Native

**Current workflow (command-heavy):**
```bash
# New project
npx aiknowsys init                    # Interactive prompts, stack selection
npx aiknowsys install-agents          # Separate command
npx aiknowsys install-skills          # Separate command

# Existing project
npx aiknowsys scan                    # Codebase scanning
npx aiknowsys migrate                 # Full migration workflow
```

**Issues:**
1. ❌ **Too many commands** - 5+ commands for complete setup
2. ❌ **Manual CLI interaction** - Not AI-native (AI can't easily drive CLI prompts)
3. ❌ **Scanning bloat** - Complex file scanning, tech stack detection
4. ❌ **Template bloat** - Stack templates are just pre-filled markdown files
5. ❌ **Not conversational** - AI agents can't naturally guide user through setup
6. ❌ **Prescriptive** - Assumes specific project structure

### Vision: Conversational AI-Driven Setup

**New workflow (AI-native):**
```bash
# One-time global install
npm install -g aiknowsys

# That's it! Then just talk to AI:
Human: "Initialize AIKnowSys for this Next.js project"
AI: [Reads onboarding-setup.md]
AI: "I see this is a Next.js project with TypeScript. I'll set up:
     - MCP tools for fast queries
     - TDD workflow 
     - Stack-specific patterns
     
     Ready to create AGENTS.md and start working?"
     
Human: "Yes"
AI: [Creates AGENTS.md, sets up .aiknowsys/ structure]
AI: "Setup complete! What would you like to build?"
```

**Benefits:**
- ✅ **Single command** - npm install, then natural conversation
- ✅ **AI-driven** - AI reads onboarding guide, not CLI
- ✅ **Conversational** - Back-and-forth dialogue, not sequential prompts
- ✅ **Zero scanning** - Ship sensible defaults, customize via conversation
- ✅ **Framework-agnostic** - Works for any project type

---

## Architecture Analysis

### What Gets Removed

**Commands to deprecate:**
1. `npx aiknowsys init` → Replace with conversational setup
2. `npx aiknowsys scan` → Replace with AI observation + defaults
3. `npx aiknowsys migrate` → Replace with AI-guided migration
4. `npx aiknowsys install-agents` → Auto-installed with onboarding
5. `npx aiknowsys install-skills` → Auto-installed with onboarding

**What stays:**
- `npx aiknowsys check` - Validation
- `npx aiknowsys sync-plans` - Maintenance
- `npx aiknowsys update` - Updates
- MCP tools (all of them!)

### What Gets Simplified

**Current: Stack templates (7 templates × 200 lines = 1400 lines)**
```
templates/stacks/nextjs/CODEBASE_ESSENTIALS.md           ❌ Remove
templates/stacks/vue-vite/CODEBASE_ESSENTIALS.md         ❌ Remove
templates/stacks/express-api/CODEBASE_ESSENTIALS.md      ❌ Remove
templates/stacks/fastapi/CODEBASE_ESSENTIALS.md          ❌ Remove
templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md       ❌ Remove
templates/stacks/vue-express/CODEBASE_ESSENTIALS.md      ❌ Remove
```

**New: Stack examples (AI guidance, not defaults)**
```markdown
# .github/onboarding-setup.md

## Example Stacks (For AI Reference)

These are examples to guide AI, not prescriptive templates.
AI uses Context7 plugin to fetch current library documentation.

### Web App Examples
- Next.js (React/TypeScript/Tailwind)
- Vue (Vite/TypeScript/Pinia)
- SvelteKit (TypeScript/Tailwind)

### API Examples
- Express (Node/TypeScript)
- FastAPI (Python/Pydantic)
- Axum (Rust/Tokio)

### DevOps/IaC Examples ✨ NEW
- Terraform (AWS/GCP/Azure)
- Ansible (Configuration management)
- Kubernetes (Helm charts)
- Docker Compose (Container orchestration)

**AI Workflow:**
1. User: "Initialize for Terraform AWS project"
2. AI: [Queries Context7 for latest Terraform docs]
3. AI: [Creates appropriate structure based on IaC patterns]
4. AI: "Terraform AWS setup complete. Ready to define infrastructure?"
```

**No hardcoded defaults - AI is smart enough to figure it out!**

---

## Proposed Architecture

### onboarding-setup.md (AI Instruction Manual)

```markdown
# AIKnowSys Onboarding Guide (For AI Agents)

**Purpose:** Guide AI agents through initializing AIKnowSys for any project.

## Setup Workflow

### Step 1: Detect Project Type

**Observation Methods:**
- Check `package.json` for framework (Next.js, Vue, Express)
- Check `pyproject.toml` for Python frameworks (FastAPI, Django)
- Check `Cargo.toml` for Rust
- Check `go.mod` for Go

**Example:**
```
AI: Checking package.json...
Found: "next": "^14.0.0"
Detected: Next.js project
```

### Step 2: Load Stack Defaults

**Query MCP for defaults:**
```typescript
const defaults = await mcp.get_stack_defaults({ framework: 'nextjs' });
// Returns: { language, patterns, validation, invariants }
```

### Step 3: Create Core Files

**Files to create:**
1. `AGENTS.md` - Workflow protocol (from template)
2. `.aiknowsys/` - Directory structure
3. `.aiknowsys.config.json` - Project configuration

**Do NOT create:**
- ❌ CODEBASE_ESSENTIALS.md (knowledge goes in database)
- ❌ Stack-specific templates (use defaults from config)

### Step 4: Register Project in Knowledge Bank

**MCP command:**
```typescript
await mcp.register_project({
  name: detectProjectName(),
  framework: 'nextjs',
  language: 'TypeScript',
  defaults: stackDefaults
});
```

### Step 5: Conversational Customization

**AI prompts user:**
```
AI: "I've set up AIKnowSys with Next.js defaults. 
     Would you like to customize:
     
     1. Validation commands (test/lint/type-check)
     2. Critical invariants (project rules)
     3. Common patterns (coding conventions)
     
     Or start working immediately with defaults?"
     
Human: "Start working"
AI: "Great! What would you like to build?"
```

### Step 6: Learning Mode

**As AI works, it learns project-specific patterns:**
- Test patterns discovered → Stored in database
- Common errors fixed → Stored as learned patterns
- Architecture decisions made → Stored in database

**No manual documentation needed!**

---

## Migration From Current System

**For existing users:**

### Option A: Automatic Migration (Recommended)

```bash
# Run migration once
npx aiknowsys migrate-to-ai-native

# Reads existing CODEBASE_ESSENTIALS.md
# Extracts project-specific patterns
# Stores in database
# Creates onboarding-setup.md pointer
# Done!
```

### Option B: Manual Migration

```
1. AI: "I see you have existing AIKnowSys files. Migrate?"
2. Human: "Yes"
3. AI: [Reads CODEBASE_ESSENTIALS.md, extracts patterns]
4. AI: [Stores patterns in database]
5. AI: "Migration complete. Old files backed up to .aiknowsys/archive/"
```

---

## Implementation Plan (Revised)

### Phase 1: Foundation (1 week)

**Step 1.1: Create onboarding-setup.md** (1 day)
- **File:** `.github/onboarding-setup.md`
- **Action:** Write comprehensive AI instruction manual
- **Sections:**
  - Project detection strategies (any language/framework)
  - Example stacks (web, API, DevOps/IaC)
  - Integration with Context7 (fetch latest docs)
  - File creation workflow (minimal AGENTS.md only)
  - Conversational customization examples
  - Learning mode activation
- **Examples:**
  - Web: Next.js, Vue, SvelteKit
  - API: Express, FastAPI, Axum
  - DevOps: Terraform, Ansible, Kubernetes, Docker Compose
- **Tests:** Manual testing with Claude/GPT-4 on 3+ project types

**Step 1.2: MCP Tool - register_project()** (4 hours)
- **File:** `mcp-server/src/tools/projects.ts`
- **Action:** Store project config in database
- **Schema:** projects table (already exists from Knowledge Bank plan)
- **No hardcoded stacks** - AI determines stack via conversation + Context7
- **Tests:** Database insertion verification

**Step 1.3: Conversational Setup POC** (1 day)
- **Test scenarios:**
  1. "Initialize AIKnowSys for this Next.js project"
  2. "Set up AIKnowSys for my FastAPI microservice"
  3. "Initialize for Terraform AWS infrastructure"
- **Validation:** AI reads onboarding-setup.md, queries Context7, creates setup
- **Success Criteria:** Zero CLI commands, pure conversation

**Step 1.4: Update Context7 Plugin Documentation** (2 hours)
- **Action:** Document how AI uses Context7 during onboarding
- **Example:** AI queries Context7 for latest Next.js patterns
- **Integration:** Show onboarding → Context7 → setup workflow

### Phase 2: Cleanup & Simplification (1 week)

**Step 2.1: Remove ALL Onboarding Commands** (1 day)
- **Delete entirely:**
  - `lib/commands/init.ts` (554 lines)
  - `lib/commands/scan.ts` (600+ lines)
  - `lib/commands/migrate.ts` (200+ lines)
  - `lib/commands/install-agents.ts` (150+ lines)
  - `lib/commands/install-skills.ts` (100+ lines)
- **Total: ~1600 lines deleted**
- **No deprecation warnings** - Clean removal, fresh start only

**Step 2.2: Remove Stack Templates** (1 day)
- **Delete:** `templates/stacks/` directory (7 files, ~1400 lines)
- **No replacement** - AI is smart enough with examples + Context7
- **Update:** AGENTS.md template to reference onboarding-setup.md

**Step 2.3: Update CLI Entry Point** (4 hours)
- **File:** `bin/cli.js`
- **Remove:** init, scan, migrate, install-agents, install-skills
- **Keep:** check, sync-plans, update, validate-deliverables, query commands
- **Result:** Minimal CLI (7-8 commands vs 13+)

**Step 2.4: Simplify Templates** (4 hours)
- **Action:** Remove complex placeholder logic
- **Result:** AGENTS.md is minimal (references onboarding-setup.md)
- **No CODEBASE_ESSENTIALS template** - Knowledge goes in database

### Phase 3: Documentation & Testing (1 week)

**Step 3.1: Rewrite README.md** (1 day)
- **Remove:** CLI quickstart sections
- **Add:** AI-native onboarding section
- **Example workflow:**
  ```
  npm install -g aiknowsys
  
  # Then just talk to your AI:
  "Initialize AIKnowSys for this project"
  ```
- **Emphasize:** Context7 integration for any stack

**Step 3.2: Update SETUP_GUIDE.md** (4 hours)
- **Replace:** CLI instructions with conversational examples
- **Add:** DevOps/IaC setup examples
- **Show:** How AI uses Context7 to stay current

**Step 3.3: Real-World Testing** (2 days)
- **Test with 5+ project types:**
  1. Fresh Next.js project
  2. Fresh FastAPI project
  3. Fresh Terraform AWS project
  4. Fresh Ansible playbook project
  5. Fresh Kubernetes Helm chart project
- **Success:** AI-driven setup works for all, <30 seconds each

**Step 3.4: Update AGENTS.md Template** (2 hours)
- **Remove:** References to CODEBASE_ESSENTIALS.md
- **Add:** Section pointing to onboarding-setup.md
- **Emphasize:** Knowledge in database, not files

### Phase 4: Release Preparation (3 days)

**Step 4.1: Version Bump & Changelog** (1 day)
- **Version:** v0.11.0 (major breaking changes)
- **Changelog:**
  - 🔥 REMOVED: All CLI onboarding commands
  - 🔥 REMOVED: Stack templates (Context7 handles this)
  - ✨ NEW: AI-native conversational onboarding
  - ✨ NEW: DevOps/IaC examples
  - ✨ NEW: Context7 integration during setup
- **Note:** "Fresh installs only - existing users stay on v0.10.x"

**Step 4.2: Migration Notice** (4 hours)
- **Create:** docs/v0.11-breaking-changes.md
- **Explain:** This is a paradigm shift (fresh start architecture)
- **Recommend:** Existing users stay on v0.10.x (stable, feature-complete)
- **Future:** v0.12+ will have migration path when architecture stabilizes

**Step 4.3: Final Testing** (1 day)
- **Clean install test** on 3 machines
- **AI conversation test** with Claude, GPT-4, Copilot Chat
- **Verify:** No broken references to old commands/templates
- **Performance:** Onboarding <30 seconds for all tested stacks

---

## Success Criteria (Revised)

**Phase 1 (Foundation):**
- [ ] onboarding-setup.md complete with 10+ stack examples
- [ ] DevOps/IaC examples included (Terraform, Ansible, K8s, Docker)
- [ ] Context7 integration documented in onboarding guide
- [ ] MCP tool register_project() operational
- [ ] POC: AI completes setup via conversation for 3+ stack types

**Phase 2 (Cleanup):**
- [ ] All onboarding commands deleted (~1600 lines)
- [ ] Stack templates deleted (~1400 lines)
- [ ] CLI streamlined (7-8 commands vs 13+)
- [ ] No deprecation code (clean removal)

**Phase 3 (Documentation):**
- [ ] README.md rewritten (AI-native workflow)
- [ ] SETUP_GUIDE.md updated (conversational examples)
- [ ] AGENTS.md template updated (no ESSENTIALS references)
- [ ] Real-world testing passed (5+ project types)

**Phase 4 (Release):**
- [ ] v0.11.0 changelog complete
- [ ] Breaking changes documented
- [ ] Fresh install tested on clean machines
- [ ] AI conversation tested with 3+ AI assistants

---

## Breaking Changes

**v0.10.x → v0.11.0: PARADIGM SHIFT**

### 🔥 Removed Commands (No Migration Path)
- ❌ `npx aiknowsys init` - Use AI conversation instead
- ❌ `npx aiknowsys scan` - AI observes project directly
- ❌ `npx aiknowsys migrate` - Fresh start only
- ❌ `npx aiknowsys install-agents` - Auto-installed
- ❌ `npx aiknowsys install-skills` - Auto-installed

### 🔥 Removed Files (~3000 lines deleted)
- ❌ `templates/stacks/` directory (7 templates, ~1400 lines)
- ❌ `lib/commands/init.ts` (554 lines)
- ❌ `lib/commands/scan.ts` (600+ lines)
- ❌ `lib/commands/migrate.ts` (200+ lines)
- ❌ `lib/commands/install-agents.ts` (150+ lines)
- ❌ `lib/commands/install-skills.ts` (100+ lines)

### ✨ Added (New AI-Native Architecture)
- ✅ `.github/onboarding-setup.md` - AI instruction manual
- ✅ DevOps/IaC examples (Terraform, Ansible, K8s, Docker)
- ✅ Context7 integration for latest library docs
- ✅ Database-first knowledge storage

### ⚠️ Migration Notice
**This is a fresh start architecture, not an upgrade.**

- **Existing users:** Stay on v0.10.x (stable, feature-complete)
- **New users:** Install v0.11.0+ (AI-native paradigm)
- **Future:** Migration path in v0.12+ when architecture stabilizes

**Why fresh start?**MEDIUM - ACCEPTED)
- **Description:** AI doesn't follow onboarding-setup.md correctly
- **Likelihood:** MEDIUM (30%) - Depends on AI capability
- **Impact:** HIGH - Users can't onboard
- **Mitigation:**
  - Test with multiple AI assistants (Claude, GPT-4, Copilot)
  - Clear, unambiguous instructions in onboarding-setup.md
  - Example conversations included in guide
- **Acceptance:** If AI can't do it, user shouldn't use this project (AI-first philosophy)

### Risk 2: Users Want CLI Back (LOW - ACCEPTED)
- **Description:** Users prefer CLI commands over AI conversation
- **Likelihood:** LOW (20%) - Target users are AI-forward
- **Impact:** MEDIUM - Vocal complaints
- **Mitigation:**
  - Clear docs: "This project is AI-native by design"
  - v0.10.x remains available (CLI-based)
- **Acceptance:** This is a feature, not a bug (AI-first design decision)

### Risk 3: Context7 Integration Issues (MEDIUM)
- **Description:** Context7 doesn't return useful docs for all stacks
- **Likelihood:** MEDIUM (40%) - External dependency
- **Impact:** MEDIUM - AI falls back to generic advice
- **Mitigation:**
  - Fallback to generic patterns if Context7 fails
  - Examples in onboarding-setup.md still useful
  - AI can ask user for stack-specific info
  - Document limitations in README

### Risk 4: DevOps/IaC Patterns Too Diverse (MEDIUM)
- **Description:** IaC projects vary wildly (Terraform, Ansible, K8s, etc.)
- **Likelihood:** HIGH (60%) - Very diverse domain
- **Impact:** LOW - Generic patterns still work
- **Mitigation:**
  - Provide diverse examples (Terraform, Ansible, K8s, Docker)
  - AI learns project-specific patterns via conversation
  - Start with common patterns, refine as needed

### Risk 5: Fresh Start Adoption Slow (LOW - ACCEPTED)
- **Description:** Users hesitant to abandon v0.10.x
- **Likelihood:** HIGH (70%) - Breaking change resistance
- **Impact:** LOW - v0.10.x is stable, no pressure
- **Mitigation:**
  - Clear communication: "v0.10.x is stable, no rush"
  - v0.11+ is for early adopters and new users
  - Migration path in v0.12+ (future)
- **Acceptance:** This is fine - stabilize new architecture first
### Risk 5: Onboarding-Setup.md Gets Stale (LOW)
- **Description:** New features added, onboarding not updated
- **Likelihood:** MEDIUM (30%) - Maintenance neglect
- **Impact:** LOW - AI uses outdated workflow
- **Mitigation:**
  - Automated tests (CLI → onboarding consistency)
  - Version in frontmatter (detect staleness)
  - CI check (validate onboarding references real tools)
  - Quarterly review

---

## Alternatives Considered

### Alternative A: Keep CLI Commands (Status Quo)
**Pros:**~1600 lines)
- ❌ Manual, not conversational
- ❌ Slow onboarding (5-10 minutes)

**Decision:** ❌ REJECTED - Violates core AI-native philosophy

### Alternative B: Hybrid (CLI + AI Coexistence)
**Pros:**
- Supports both workflows
- Gradual transition
- Fallback if AI fails

**Cons:**
- ⚠️ Dual maintenance (2 paths to maintain)
- ⚠️ Code complexity (2x the code)
- ⚠️ User confusion (which path?)
- ⚠️ Dilutes AI-first vision

**Decision:** ❌ REJECTED - Stakeholder decision: "No grace period, no fallback"

### Alternative C: AI-Only (Fresh Start)
**Pros:**
- ✅ Simplest codebase (~3000 lines removed)
- ✅ Best AI UX (pure conversation)
- ✅ Conversational, natural
- ✅ Fast onboarding (<30 sec)
- ✅ Clean architecture (no legacy code)
- ✅ Context7 integration (always current)

**Cons:**
- ⚠️ Breaking change (fresh start only)
- ⚠️ AI dependency (intentional)
- ⚠️ Existing users stay on v0.10.x

**Decision:** ✅ ACCEPTED - Stakeholder confirmed

**Rationale:**
- Project philosophy is "AI-first or nothing"
- Clean break better than maintaining compatibility
- v0.10.x stable for users who prefer CLI
- v0.11+ is new paradigm for AI-native workflows
- ✅ Fast onboarding (<30 sec)

**Cons:**
- ⚠️ Breaking change (requires migration)
- ⚠️ Dependency on AI capability

**Decision:** ACCEPTED - Aligns with vision, simplifies codebase

---

## Stakeholder Decisions (2026-02-16)

**Confirmed:**

1. **No Grace Period** ✅
   - Remove CLI commands immediately
   - Won't release until finished (v0.10.x stable for now)
   - Clean break, no coexistence code

2. **No Fallback CLI** ✅
   - AI-first or nothing - project makes no sense without AI
   - Simplifies implementation (no safety nets)

3. **Stack Examples = AI Guidance** ✅
   - Not "defaults" - just examples to guide AI
   - AI creates what user wants via conversation
   - Use Context7 plugin for latest library docs
   - Add DevOps/IaC example (Terraform, Ansible, etc.)

4. **Fresh Install Only** ✅
   - No migration tooling needed
   - This is actually "something else" (new paradigm)
   - Old users stay on v0.10.x until they're ready for fresh start

---

## Notes for Developer

### Key Files to Create
1. `.github/onboarding-setup.md` - AI instruction manual (core)
2. `lib/stacks/defaults.ts` - Stack configurations
3. `mcp-server/src/tools/stacks.ts` - MCP tool
4. `lib/commands/migrate-to-ai-native.ts` - Migration script

### Key Files to Delete (Phase 3)
1. `lib/commands/init.ts` (554 lines)
2. `lib/commands/scan.ts` (600+ lines)
3. `lib/commands/migrate.ts` (200+ lines)
4. `lib/commands/install-agents.ts`
5. `lib/commands/install-skills.ts`
6. `templates/stacks/` (entire directory)

### Integration Points
- **AGENTS.md:** Remove ESSENTIALS references
- **README.md:** Replace CLI quickstart with AI quickstart
- **SETUP_GUIDE.md:** Conversational setup instructions
- **mcp-server/README.md:** Document new MCP tools

### Testing Strategy
1. **Unit:** Stack defaults loading
2. **Integration:** MCP tools (get_stack_defaults, register_project)
3. **E2E:** AI-driven setup (manual with GPT-4/Claude)
4. **Migration:** Roundtrip (migrate → export → diff)

### Performance Targets
- **Onboarding:** <30 seconds (vs 5-10 min CLI)
- **Migration:** <10 seconds (existing projects)
- **MCP queries:** <10ms (stack defaults)

---

**This plan simplifies AIKnowSys by ~3000 lines while improving AI UX. Ready for approval?**
