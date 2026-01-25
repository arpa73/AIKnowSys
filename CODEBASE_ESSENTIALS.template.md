# Codebase Essentials - {{PROJECT_NAME}}

**Last Updated:** {{DATE}}  
**Purpose:** Single-source reference for architecture, patterns, and critical invariants. Read this at session start before making any changes.

---

## 🚨 CRITICAL RULE: Never Rush - Always Follow Process

**"Never rush, just fix it well and ALWAYS follow knowledge system procedures"**

**This applies to ALL changes, including:**
- ✅ "Quick fixes" and "little bugs"
- ✅ Urgent production issues
- ✅ Simple one-line changes
- ✅ Documentation updates
- ✅ Configuration tweaks

**Why this matters:**
- Quick fixes often create inconsistencies
- Skipping validation causes production bugs
- Not documenting patterns means repeating mistakes
- Rushing breaks the single source of truth

**The process (non-negotiable):**
1. Read CODEBASE_ESSENTIALS.md at session start
2. Check for existing patterns before implementing
3. Make changes + write/update tests
4. Run validation (see matrix below)
5. Update documentation if patterns changed
6. Commit with proper message

**Remember:** Taking 10 extra minutes to follow the process saves hours debugging later.

---

## 📚 Knowledge System: Document Roles

**Your project has three core knowledge files that work together:**

### 1️⃣ CODEBASE_ESSENTIALS.md (This File)
**Role:** Single source of truth for architecture, patterns, and invariants  
**Read:** At the start of EVERY session before making changes  
**Contains:**
- Technology stack and versions
- Validation commands (test, lint, build)
- Project structure and file organization
- Code patterns and conventions
- Critical rules that must never be violated
- Common gotchas and workarounds

**Use this when:**
- Starting a coding session (read first!)
- Implementing new features (check existing patterns)
- Debugging issues (review gotchas)
- Onboarding new developers (comprehensive reference)

### 2️⃣ AGENTS.md
**Role:** AI assistant workflow and session procedures  
**Read:** When working with AI coding assistants  
**Contains:**
- Mandatory session start protocol
- Validation matrix (copy from this file)
- Skill trigger words and workflows
- Project-specific invariants for AI
- Changelog update procedures

**Use this when:**
- Using GitHub Copilot, Claude, ChatGPT, etc.
- Need workflow reminders (read → plan → implement → validate → document)
- Looking for relevant skills for a task

### 3️⃣ CODEBASE_CHANGELOG.md
**Role:** Session-by-session development history  
**Read:** When you need project history or context  
**Contains:**
- Session entries (what changed, when, why)
- Validation results for each session
- Key learnings and discoveries
- Links to changed files with line numbers

**Use this when:**
- Understanding why a decision was made
- Tracking down when a bug was introduced
- Reviewing project evolution
- After each session (add new entry)

### 🔄 How They Work Together

```
┌─────────────────────────────────────────────────────────┐
│ 1. Session Start: Read CODEBASE_ESSENTIALS.md          │
│    (Get current architecture, patterns, invariants)     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Work Session: Follow AGENTS.md workflow             │
│    (AI-guided: read → plan → code → validate → doc)    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Session End: Update CODEBASE_CHANGELOG.md           │
│    (Document what changed, validation, learnings)       │
└─────────────────────────────────────────────────────────┘
```

**Golden Rule:** ESSENTIALS = "what is", AGENTS = "how to work", CHANGELOG = "what happened"

---

## Technology Stack

**{{STACK_CATEGORY}}:**
- **Framework:** {{FRAMEWORK}}
- **Version:** {{VERSION}}
- **Language:** {{LANGUAGE}}
- **Build Tool:** {{BUILD_TOOL}}
- **Package Manager:** {{PACKAGE_MANAGER}}

**Testing:**
- **Framework:** {{TEST_FRAMEWORK}}
- **Coverage Tool:** {{COVERAGE_TOOL}}
- **Linting:** {{LINTER}}

**Infrastructure:**
- **Containerization:** {{CONTAINER_PLATFORM}}
- **Database:** {{DATABASE}}
- **Deployment:** {{DEPLOYMENT_PLATFORM}}

---

## Validation Matrix

**Run these commands before claiming work is complete:**

| Changed | Command | Required |
|---------|---------|----------|
{{VALIDATION_ROWS}}

**🚨 RULE: Never claim work is complete without running validation!**

**Example validation commands:**

```bash
# Backend (Python example)
{{BACKEND_TEST_CMD}}

# Frontend (TypeScript example)
{{FRONTEND_TEST_CMD}}

# Type checking
{{TYPE_CHECK_CMD}}

# Linting
{{LINT_CMD}}
```

**Expected output:**
- ✅ "X passed, Y skipped" with no failures
- ✅ No TypeScript errors (empty output = success)
- ✅ No linting errors

---

## Project Structure

**{{PROJECT_TYPE}} structure:**

```
{{PROJECT_ROOT}}/
├── {{BACKEND_DIR}}/           # {{BACKEND_DESCRIPTION}}
├── {{FRONTEND_DIR}}/          # {{FRONTEND_DESCRIPTION}}
├── {{TEST_DIR}}/              # {{TEST_DESCRIPTION}}
└── {{CONFIG_DIR}}/            # {{CONFIG_DESCRIPTION}}
```

**Key directories:**
- `{{SOURCE_DIR}}` - {{SOURCE_DESCRIPTION}}
- `{{TEST_DIR}}` - {{TEST_DESCRIPTION}}
- `{{BUILD_DIR}}` - {{BUILD_DESCRIPTION}}

---

## Core Patterns

### {{PATTERN_CATEGORY_1}}

**Pattern:** {{PATTERN_DESCRIPTION}}

**Why:** {{PATTERN_RATIONALE}}

**Example:**
```{{LANGUAGE}}
{{PATTERN_EXAMPLE}}
```

**Anti-pattern:**
```{{LANGUAGE}}
{{ANTI_PATTERN_EXAMPLE}}
```

---

### {{PATTERN_CATEGORY_2}}

**Pattern:** {{PATTERN_DESCRIPTION_2}}

**Why:** {{PATTERN_RATIONALE_2}}

**Example:**
```{{LANGUAGE}}
{{PATTERN_EXAMPLE_2}}
```

---

## Critical Invariants

**Rules that must NEVER be violated:**

1. **{{INVARIANT_1}}**
   - What: {{INVARIANT_1_DESCRIPTION}}
   - Why: {{INVARIANT_1_RATIONALE}}
   - Example: {{INVARIANT_1_EXAMPLE}}

2. **{{INVARIANT_2}}**
   - What: {{INVARIANT_2_DESCRIPTION}}
   - Why: {{INVARIANT_2_RATIONALE}}
   - Example: {{INVARIANT_2_EXAMPLE}}

---

## Common Gotchas

### {{GOTCHA_1}}

**Problem:** {{GOTCHA_1_DESCRIPTION}}

**Solution:** {{GOTCHA_1_SOLUTION}}

**Example:**
```{{LANGUAGE}}
{{GOTCHA_1_EXAMPLE}}
```

---

### {{GOTCHA_2}}

**Problem:** {{GOTCHA_2_DESCRIPTION}}

**Solution:** {{GOTCHA_2_SOLUTION}}

---

## Architecture Decisions

### {{DECISION_1}}

**Decision:** {{DECISION_1_WHAT}}

**Rationale:** {{DECISION_1_WHY}}

**Trade-offs:**
- ✅ {{DECISION_1_PRO}}
- ⚠️ {{DECISION_1_CON}}

**Alternatives considered:** {{DECISION_1_ALTERNATIVES}}

---

## Change Management (OpenSpec)

**Recommended:** Use OpenSpec for spec-driven development on major changes.

### When to Create OpenSpec Proposals:

| Change Type | Create Proposal? |
|-------------|------------------|
| New features or capabilities | ✅ Yes |
| Breaking changes (API, schema) | ✅ Yes |
| Architecture changes | ✅ Yes |
| Security-related changes | ✅ Yes |
| Bug fixes, typos, formatting | ❌ No |
| Non-breaking dependency updates | ❌ No |
| Configuration changes | ❌ No |

### OpenSpec Commands:

```bash
openspec list              # List active changes
openspec list --specs      # List specifications  
openspec create add-X      # Create new proposal
openspec validate --strict # Validate all specs
openspec archive X --yes   # Archive after deployment
```

### OpenSpec Workflow:

1. **Create proposal:** `openspec create add-feature-name`
2. **Fill out:** `proposal.md`, `tasks.md`, spec deltas
3. **Validate:** `openspec validate add-feature-name --strict`
4. **Get approval** before implementing
5. **Implement** following tasks.md checklist
6. **Archive** after deployment

**See:** `openspec/AGENTS.md` for full workflow (if OpenSpec is installed)

---

## Development Workflow

### Setting Up Local Environment

```bash
{{SETUP_COMMANDS}}
```

### Running Tests

```bash
{{TEST_COMMANDS}}
```

### Building for Production

```bash
{{BUILD_COMMANDS}}
```

### Deployment

{{DEPLOYMENT_WORKFLOW}}

---

## Dependencies Management

**Update strategy:** {{UPDATE_STRATEGY}}

**Security:** {{SECURITY_POLICY}}

**Deprecated dependencies:** {{DEPRECATED_DEPS}}

**See also:** [dependency-updates skill](.github/skills/dependency-updates/SKILL.md)

---

## Testing Guidelines

### Test Organization

{{TEST_ORGANIZATION}}

### Coverage Requirements

{{COVERAGE_REQUIREMENTS}}

### Testing Patterns

**Unit tests:**
```{{LANGUAGE}}
{{UNIT_TEST_EXAMPLE}}
```

**Integration tests:**
```{{LANGUAGE}}
{{INTEGRATION_TEST_EXAMPLE}}
```

---

## Security Considerations

{{SECURITY_CONSIDERATIONS}}

---

## Performance Guidelines

{{PERFORMANCE_GUIDELINES}}

---

## Accessibility Standards

{{ACCESSIBILITY_STANDARDS}}

---

## Documentation Standards

**Code comments:**
{{COMMENT_STANDARDS}}

**README updates:**
{{README_STANDARDS}}

**API documentation:**
{{API_DOC_STANDARDS}}

---

## 🚀 First Implementation Guide

**Once this template is filled, here's your recommended build order:**

### Step 1: Foundation (Week 1)
**Goal:** Get basic project running with validation

**Build:**
1. Set up project structure (directories from "Project Structure" section)
2. Initialize package manager and install dependencies
3. Configure build tools and linters
4. Write "Hello World" or minimal working version
5. Set up validation commands from Validation Matrix

**Validate:**
- [ ] All validation commands work (`npm test`, etc.)
- [ ] Can build and run the project
- [ ] Linting passes

**Document:** Update CODEBASE_CHANGELOG.md with first session

---

### Step 2: Core Patterns (Week 2-3)
**Goal:** Implement fundamental patterns from this document

**Build:**
1. Create pattern examples (from "Core Patterns" section)
2. Set up error handling structure
3. Implement logging/monitoring basics
4. Add configuration management
5. Write tests for core patterns

**Validate:**
- [ ] Pattern examples work as documented
- [ ] Tests cover core patterns
- [ ] No critical invariants violated

**Why this order:** Patterns guide all future code. Establish them early.

---

### Step 3: Feature Development (Ongoing)
**Goal:** Build actual features following established patterns

**Build:**
1. Reference "Core Patterns" for each implementation
2. Follow "Critical Invariants" religiously
3. Watch out for "Common Gotchas"
4. Run validation before each commit
5. Update changelog after each session

**Validate:**
- [ ] New code follows documented patterns
- [ ] All validation passes
- [ ] No gotchas violated

**When stuck:** Review this document, check AGENTS.md for relevant skills

---

### Step 4: Hardening (Before Production)
**Goal:** Production-ready quality

**Build:**
1. Implement security measures (Security section)
2. Add performance optimizations (Performance section)
3. Ensure accessibility (Accessibility section)
4. Set up monitoring and alerting
5. Document deployment process

**Validate:**
- [ ] Security checklist complete
- [ ] Performance targets met
- [ ] Accessibility standards met
- [ ] Deployment tested

---

**Golden Rule:** Always refer back to this document. Don't drift from documented patterns.

---

## Version Control

**Branch strategy:** {{BRANCH_STRATEGY}}

**Commit message format:** {{COMMIT_FORMAT}}

**PR requirements:** {{PR_REQUIREMENTS}}

---

## 📝 Customization Instructions

**This is a template file. To customize it for your project:**

👉 **See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions**

**Quick start:**
1. Replace all `{{PLACEHOLDERS}}` with real values from your project
2. Use actual commands, file paths, and code examples (not generic descriptions)
3. Keep section headings exactly as written
4. Remove sections that don't apply to your project

**⚠️ Critical:** Replace placeholders with REAL values, not other placeholders  
Example: `{{TEST_CMD}}` → `npm test` (not "run your tests")

**AI-Assisted:** Use the prompt from `npx aiknowsys init` to have AI fill this automatically

---

*This template is part of aiknowsys. See [README](README.md) and [SETUP_GUIDE.md](SETUP_GUIDE.md) for full documentation.*
