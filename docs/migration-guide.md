# Migration Guide - Adding Knowledge System to Existing Projects

**Purpose:** Step-by-step guide for integrating the knowledge system into an established codebase without disrupting active development.

---

## Overview: What You're Adding

The knowledge system consists of:

1. **CODEBASE_ESSENTIALS.md** - Pattern documentation
2. **AGENTS.md** - AI workflow instructions
3. **CODEBASE_CHANGELOG.md** - Session history
4. **.github/agents/** - Custom agents (Developer + Architect)
5. **.github/skills/** - Reusable workflow guides
6. **scripts/** - Setup and validation tools

**Time investment:** 4-8 hours initial setup, then 15-30 min/session maintenance

**Payoff:** Consistent patterns, faster onboarding, fewer regressions

---

## Before You Start

### Assessment Questions

**1. How mature is your codebase?**
- **< 1000 lines:** Knowledge system might be overkill
- **1000-10,000 lines:** Perfect fit, patterns are stabilizing
- **> 10,000 lines:** Essential for maintaining consistency

**2. How stable are your patterns?**
- **Prototyping:** Wait until patterns emerge
- **Early stage:** Start with minimal documentation
- **Established:** Full migration recommended

**3. What's your team situation?**
- **Solo:** Focus on validation matrix + gotchas
- **2-5 people:** Full system with emphasis on consistency
- **> 5 people:** Critical for alignment

**4. What's your development pace?**
- **Fast iteration:** Lightweight documentation, update monthly
- **Steady:** Standard documentation, update weekly
- **Slow/stable:** Comprehensive documentation, update as needed

### Prerequisites

- [ ] Git repository with active development
- [ ] CI/CD pipeline exists (or planned)
- [ ] Basic test coverage (or committed to adding it)
- [ ] Team consensus on adopting the system

---

## Migration Strategy: Phased Approach

**Don't try to document everything at once.** Use this 4-week plan:

### Week 1: Foundation (4 hours)

**Goal:** Get basic infrastructure in place.

**Tasks:**
1. Install files using migration script
2. Create minimal CODEBASE_ESSENTIALS.md
3. Set up changelog with first entry
4. Communicate to team

**Deliverables:**
- Working validation matrix (3-5 commands)
- Top 3 documented patterns
- First changelog entry

### Week 2: Observation (30 min/day)

**Goal:** Capture patterns as they're used.

**Tasks:**
1. During code review, note repeated patterns
2. When questions arise, document answers
3. When bugs occur, document gotchas
4. Add to ESSENTIALS as discoveries happen

**Deliverables:**
- 5-10 core patterns documented
- 3-5 gotchas captured
- 1-2 invariants identified

### Week 3: Workflow Integration (2 hours)

**Goal:** Make the system part of daily workflow.

**Tasks:**
1. Create first project-specific skill
2. Update PR template to reference ESSENTIALS
3. Add validation to CI/CD
4. Run first AI session with full context

**Deliverables:**
- 1 skill for common workflow
- Updated PR checklist
- CI validation enabled

### Week 4: Refinement (1 hour)

**Goal:** Polish based on usage.

**Tasks:**
1. Review what's working/not working
2. Archive irrelevant patterns
3. Expand high-value sections
4. Train team on usage

**Deliverables:**
- Refined documentation
- Team familiar with system
- Process sustainable

---

## Detailed Migration Steps

### Step 1: Automated Codebase Scan

Use the migration script to auto-detect your stack:

```bash
# 1. Clone the template repository
git clone https://github.com/your-org/aiknowsys.git /tmp/aiknowsys-template

# 2. Copy migration tools to your project
cd /path/to/your/project
cp -r /tmp/aiknowsys-template/scripts ./
cp -r /tmp/aiknowsys-template/templates ./

# 3. Run the migration script
bash scripts/migrate-existing.sh
```

**What the script does:**

1. **Scans for tech stack:**
   - Checks `package.json` for frontend framework
   - Checks `pyproject.toml` / `requirements.txt` for Python
   - Checks `Cargo.toml` for Rust
   - Checks `go.mod` for Go

2. **Discovers test commands:**
   - Reads `package.json` scripts
   - Parses `Makefile` targets
   - Analyzes `.github/workflows/*.yml`
   - Checks `pytest.ini` / `vitest.config.ts`

3. **Generates draft documentation:**
   - Creates `CODEBASE_ESSENTIALS.draft.md` (70% complete)
   - Fills in tech stack section
   - Fills in validation matrix
   - Leaves TODO sections for manual completion

4. **Installs infrastructure:**
   - Copies `.github/agents/` (custom agents)
   - Copies `.github/skills/` (universal skills)
   - Creates `CODEBASE_CHANGELOG.md` template
   - Creates `AGENTS.md` workflow file

**Output files:**
```
your-project/
├── CODEBASE_ESSENTIALS.draft.md  ← Review and complete
├── AGENTS.md                      ← Workflow configured
├── CODEBASE_CHANGELOG.md          ← Session template
├── .github/
│   ├── agents/
│   │   ├── developer.agent.md
│   │   └── architect.agent.md
│   └── skills/
│       ├── dependency-updates/
│       ├── documentation-management/
│       ├── code-refactoring/
│       └── skill-creator/
└── scripts/
    ├── scan-codebase.sh
    └── migrate-existing.sh
```

### Step 2: Complete the Draft

Open `CODEBASE_ESSENTIALS.draft.md` and fill in TODO sections:

#### A. Review Auto-Generated Sections

**Validation Matrix** - Verify commands work:
```bash
# Test each command the scanner found
npm run type-check          # Does it work?
npm run test:run           # Does it work?
docker-compose exec backend pytest -x  # Does it work?
```

If any command fails, update it in the draft.

#### B. Fill In Core Patterns

**What to document:** Patterns that cause confusion or inconsistency.

**How to identify:**
1. Check recent PR reviews for repeated comments
2. Search Slack/Discord for "how do we..."
3. Ask: "What confuses new contributors?"
4. Look for multiple implementations of same thing

**Example discovery process:**

```bash
# Find multiple API call patterns
grep -r "fetch(" frontend/src/
grep -r "axios" frontend/src/
grep -r "apiClient" frontend/src/

# Results show 3 different patterns - document the official one!
```

**Template:**
```markdown
## Core Patterns

### 1. {{Pattern Name}}

**Pattern: {{Short Description}}**

```{{language}}
{{code example from YOUR codebase}}
```

**Why:**
- {{reason from YOUR team's experience}}
```

**Example (from real migration):**
```markdown
## Core Patterns

### 1. API Calls

**Pattern: Use Generated OpenAPI Client**

```typescript
// ✅ GOOD - type-safe, auth included
import { useApiClient } from '@/composables/useApiClient'

const { articlesApi } = useApiClient()
const articles = await articlesApi.articlesList()
```

**Why:**
- Automatic JWT token handling
- Full TypeScript type safety
- Consistent error handling across app
- We found 3 different patterns in codebase (fetch, axios, client) - this is official
```

**How many patterns to document:**
- Week 1: Top 3 patterns
- Week 2: 5-10 patterns
- Month 2: 15-20 patterns
- Don't aim for 100% coverage - diminishing returns

#### C. Document Critical Invariants

**What to include:** Rules that cause production bugs when violated.

**How to find:**
1. Review post-mortem reports
2. Check security audit findings
3. Search git history for "FIXME" / "TODO" / "BUG"
4. Ask: "What should NEVER happen?"

**Template:**
```markdown
## Critical Invariants

### NEVER Violate These Rules

1. **{{Invariant Description}}**
   ```{{language}}
   // ❌ BAD - what NOT to do
   {{bad example}}
   
   // ✅ GOOD - correct approach
   {{good example}}
   ```
   
   **Why:** {{consequence of violation}}
```

**Example (from real production bug):**
```markdown
## Critical Invariants

### NEVER Violate These Rules

1. **Never expose DEBUG=True in production**
   ```python
   # ❌ BAD - security vulnerability
   DEBUG = True
   
   # ✅ GOOD - use environment variable
   DEBUG = os.getenv('DEBUG', 'False') == 'True'
   ```
   
   **Why:** DEBUG mode exposes database queries, stack traces, and sensitive data.
   Production incident (Dec 2024): DEBUG=True leaked API keys in error page.
```

**How many invariants:**
- Start with 3-5 from known bugs
- Add 1-2 per month from new issues
- Archive ones that become automatic (no violations in 6 months)

#### D. Capture Common Gotchas

**What to include:** Things that trip people up repeatedly.

**How to find:**
1. Search Slack/Discord for questions asked 3+ times
2. Check onboarding feedback
3. Review PR review comments for patterns
4. Ask: "What wasted hours debugging?"

**Template:**
```markdown
## Common Gotchas

### 1. {{Gotcha Title}}

**Problem:** {{What goes wrong}}

**Solution:**
```{{language}}
{{fix code}}
```

**Why:** {{Root cause explanation}}
```

**Example (from real developer pain):**
```markdown
## Common Gotchas

### 1. npm test Hangs in CI

**Problem:** CI pipeline stuck on test step for 30+ minutes.

**Solution:**
```json
// package.json
{
  "scripts": {
    "test": "vitest",           // Watch mode for dev
    "test:run": "vitest run"    // One-shot for CI
  }
}
```

Always use `npm run test:run` in CI.

**Why:** Vitest defaults to watch mode, waiting for file changes.
Wasted 4 hours debugging first time this happened (Nov 2025).
```

**How many gotchas:**
- Week 1: 2-3 from recent experience
- Month 1: 5-8 accumulated
- Month 6: 15-20 (but most become "known knowledge")

### Step 3: Rename and Review

Once TODOs are filled in:

```bash
# 1. Rename draft to final
mv CODEBASE_ESSENTIALS.draft.md CODEBASE_ESSENTIALS.md

# 2. Add to git
git add CODEBASE_ESSENTIALS.md AGENTS.md CODEBASE_CHANGELOG.md .github/

# 3. Commit
git commit -m "Add knowledge system documentation

- CODEBASE_ESSENTIALS.md with tech stack, validation, patterns
- AGENTS.md with AI workflow
- Custom agents (Developer + Architect)
- Universal skills (dependency-updates, refactoring, docs)

Enables consistent patterns and AI-assisted development."

# 4. Create PR for team review
git push origin add-knowledge-system
```

**PR description template:**
```markdown
## What This Adds

We're adopting a **knowledge system** to maintain pattern consistency and accelerate onboarding.

### New Files
- `CODEBASE_ESSENTIALS.md` - Our patterns, validation, and invariants
- `AGENTS.md` - AI workflow (read → plan → implement → validate → document)
- `.github/agents/` - Custom Developer/Architect agents
- `.github/skills/` - Reusable workflow guides

### How to Use
1. **For humans:** Read ESSENTIALS before making changes
2. **For AI:** Agents automatically read ESSENTIALS at session start
3. **For validation:** Run commands from validation matrix before PR

### Why This Helps
- ✅ Consistent patterns (no more "how do we handle X?")
- ✅ Faster onboarding (new devs productive in days, not weeks)
- ✅ Fewer bugs (validation catches issues before production)
- ✅ Better AI assistance (agents have full context)

See `docs/philosophy.md` for the full reasoning.

**Action needed:** Review ESSENTIALS and suggest missing patterns/gotchas.
```

### Step 4: Team Onboarding

After merge, hold a 30-minute team meeting:

**Agenda:**

1. **Why we're doing this** (5 min)
   - Show example of pattern inconsistency
   - Explain cost of knowledge silos
   - Demonstrate AI session with/without context

2. **How it works** (10 min)
   - Walk through CODEBASE_ESSENTIALS.md structure
   - Show validation matrix in action
   - Explain AGENTS.md workflow

3. **When to update** (5 min)
   - New pattern emerges → Add to ESSENTIALS
   - Production bug → Add to invariants
   - Repeated question → Add to gotchas
   - Session ends → Update changelog

4. **Q&A** (10 min)

**Follow-up:**
- Share screen recording of first AI session using system
- Create #knowledge-system Slack channel for questions
- Add to onboarding checklist for new hires

### Step 5: CI/CD Integration

Add validation to your pipeline:

#### GitHub Actions Example

```yaml
# .github/workflows/validate.yml
name: Validate

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # From validation matrix
      - name: TypeScript Check
        run: npm run type-check
      
      - name: Run Tests
        run: npm run test:run
      
      - name: Lint
        run: npm run lint
```

#### GitLab CI Example

```yaml
# .gitlab-ci.yml
validate:
  stage: test
  script:
    - npm run type-check  # From validation matrix
    - npm run test:run
    - npm run lint
```

**Important:** Match commands exactly to validation matrix in CODEBASE_ESSENTIALS.md.

### Step 6: Update PR Template

Add knowledge system checklist to `.github/pull_request_template.md`:

```markdown
## Pre-Merge Checklist

- [ ] Read CODEBASE_ESSENTIALS.md for relevant patterns
- [ ] Ran all validation commands from matrix
- [ ] Updated ESSENTIALS if new patterns introduced
- [ ] Updated CHANGELOG with session entry (if significant work)

### Validation Results

```bash
# Paste output from validation commands
npm run type-check  # ✅ No errors
npm run test:run    # ✅ 156 tests passed
```

## Changes

<!-- Describe your changes -->
```

---

## Migration Challenges & Solutions

### Challenge 1: "Too Much to Document"

**Problem:** Overwhelming to document entire codebase.

**Solution:** 
- Start with validation matrix only (Week 1)
- Add 1-2 patterns per week as they come up
- Don't aim for 100% coverage
- Focus on high-confusion areas

**Example timeline:**
```
Week 1: Validation + 3 patterns
Week 4: 10 patterns
Month 3: 20 patterns
Month 6: Stable at 25-30 patterns
```

### Challenge 2: "Patterns Aren't Consistent Yet"

**Problem:** Multiple ways of doing same thing exist in codebase.

**Solution:**
1. **Document current reality** (even if inconsistent)
2. **Mark official pattern** for new code
3. **Create refactoring task** for old code
4. **Add to changelog** when unified

**Example:**
```markdown
## Core Patterns

### 1. API Calls

**Current state:** Three patterns exist (fetch, axios, OpenAPI client)

**Official pattern (use for new code):**
```typescript
import { useApiClient } from '@/composables'
const { articlesApi } = useApiClient()
```

**Refactoring:** See issue #42 - migrating old code to OpenAPI client

**Why:** Type safety, auth handling, consistent errors
```

### Challenge 3: "Knowledge System Becomes Stale"

**Problem:** Documentation diverges from code.

**Solution:**
- Add "Update ESSENTIALS if needed" to PR template
- Monthly review in team meeting
- Architect agent catches violations during review
- Archive old patterns when refactored

**Automation:**
```bash
# scripts/check-stale.sh - Run monthly
git log --since="6 months ago" CODEBASE_ESSENTIALS.md
# If no commits, review for staleness
```

### Challenge 4: "Team Ignores It"

**Problem:** Developers don't read/update documentation.

**Solution:**
- Make validation required in CI (can't merge without it)
- Architect agent reviews catch violations
- Celebrate wins (bugs caught, time saved)
- Lead by example (managers update too)

**Metrics to track:**
- Bugs caught by validation (show value)
- Time saved in onboarding (show ROI)
- PR review time reduction (show efficiency)

### Challenge 5: "Too Much Overhead"

**Problem:** Updating docs feels like busywork.

**Solution:**
- Only update for significant changes
- Batch updates weekly vs per-commit
- Use changelog for temporary notes
- Archive old content aggressively

**Rule of thumb:**
- Update if 3+ people will benefit
- Don't update for one-off fixes
- Move to changelog if uncertain

---

## Special Cases

### Migrating Monorepo

**Challenge:** Multiple apps/packages with different patterns.

**Solution:**

**Option A: Separate ESSENTIALS per package**
```
monorepo/
├── packages/
│   ├── frontend/
│   │   └── CODEBASE_ESSENTIALS.md  # Frontend patterns
│   └── backend/
│       └── CODEBASE_ESSENTIALS.md  # Backend patterns
└── CODEBASE_ESSENTIALS.md          # Shared patterns
```

**Option B: Sections in single file**
```markdown
# CODEBASE_ESSENTIALS.md

## Frontend Patterns
...

## Backend Patterns
...

## Shared Patterns
...
```

**Recommendation:** Option A for large monorepos (> 100k lines), Option B for small.

### Migrating Legacy Codebase

**Challenge:** 10-year-old project with accumulated cruft.

**Solution:**
- Document "aspirational patterns" vs "legacy patterns"
- Mark legacy with `[DEPRECATED]` tag
- Create migration path in docs
- Focus validation on new code only

**Example:**
```markdown
## Core Patterns

### API Calls

**Modern pattern (use for new code):**
```typescript
const { articlesApi } = useApiClient()
```

**[DEPRECATED] Legacy pattern (old code only):**
```typescript
axios.get('/api/articles/')  // Don't use in new code
```

**Migration:** See docs/migrations/api-client-migration.md
```

### Migrating Microservices

**Challenge:** 20+ services, can't document all at once.

**Solution:**
- Start with 1-2 most active services
- Create shared ESSENTIALS for common patterns
- Service-specific ESSENTIALS for unique logic
- Share skills across services

**Structure:**
```
services/
├── shared-docs/
│   ├── CODEBASE_ESSENTIALS.md      # Shared patterns
│   └── .github/skills/             # Shared skills
├── user-service/
│   └── CODEBASE_ESSENTIALS.md      # Service-specific
└── payment-service/
    └── CODEBASE_ESSENTIALS.md      # Service-specific
```

---

## Measuring Success

### Week 1 Metrics

- [ ] Validation matrix documented
- [ ] All validation commands run successfully
- [ ] First changelog entry written
- [ ] Team aware of new system

### Month 1 Metrics

- [ ] 5+ core patterns documented
- [ ] 3+ gotchas captured
- [ ] 1+ skill created
- [ ] Validation catching issues (track count)

### Month 3 Metrics

- [ ] New contributor onboarded in < 1 week
- [ ] 10+ bugs caught by validation
- [ ] PR review time decreased 20%+
- [ ] AI sessions reference ESSENTIALS consistently

### Month 6 Metrics

- [ ] Zero production bugs from pattern violations
- [ ] Onboarding time < 2 days
- [ ] System updates < 30 min/week
- [ ] Team consensus: system is valuable

---

## Troubleshooting

### "Script detected wrong tech stack"

**Fix:** Manually edit `CODEBASE_ESSENTIALS.draft.md` before renaming.

### "Validation commands don't work"

**Fix:** Test each command, update matrix with working versions.

### "Too many gotchas to document"

**Fix:** Prioritize top 5, add others over time.

### "Team not updating docs"

**Fix:** Make it required in PR template, Architect catches violations.

### "Documentation getting too long"

**Fix:** Archive old sessions to `docs/changelog/`, split into sections.

---

## Migration Checklist

Before considering migration complete:

### Infrastructure
- [ ] Files installed (ESSENTIALS, AGENTS, CHANGELOG, .github/)
- [ ] Validation matrix verified (all commands work)
- [ ] Custom agents configured
- [ ] Skills installed and customized

### Documentation
- [ ] Tech stack documented
- [ ] Top 3-5 patterns documented
- [ ] 3-5 gotchas captured
- [ ] Critical invariants identified
- [ ] Examples from actual codebase

### Process
- [ ] PR template updated
- [ ] CI/CD running validation
- [ ] Team onboarded
- [ ] First AI session successful

### Validation
- [ ] Ran full validation matrix
- [ ] Tested AI agent workflow
- [ ] Reviewed by team
- [ ] Merged to main branch

---

*Migration is complete when the system is being used daily, not when documentation is perfect.*
