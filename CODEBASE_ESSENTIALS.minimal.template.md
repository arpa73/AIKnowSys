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

## Document Purpose & Usage

**When to read this document:**
- At the start of EVERY session before making changes
- Before implementing new features (patterns + constraints)
- When debugging issues (gotchas + known quirks)
- Before updating dependencies (stack snapshot)

**Related documentation:**
- Session history: [CODEBASE_CHANGELOG.md](CODEBASE_CHANGELOG.md)
- AI workflow: [AGENTS.md](AGENTS.md)
- Skills: [.github/skills/](.github/skills/)

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
# Testing
{{TEST_CMD}}

# Type checking (if applicable)
{{TYPE_CHECK_CMD}}

# Linting
{{LINT_CMD}}
```

**Expected output:**
- ✅ "X passed, Y skipped" with no failures
- ✅ No type errors (empty output = success)
- ✅ No linting errors

---

## Project Structure

**{{PROJECT_TYPE}} structure:**

```
{{PROJECT_ROOT}}/
├── {{SOURCE_DIR}}/            # {{SOURCE_DESCRIPTION}}
├── {{TEST_DIR}}/              # {{TEST_DESCRIPTION}}
├── {{BUILD_DIR}}/             # {{BUILD_DESCRIPTION}}
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

## Testing Patterns

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

## 📝 Customization Instructions

**This is a MINIMAL template for small projects (learning projects, prototypes, simple tools).**

**Stripped sections:**
- Security Considerations (add if handling sensitive data)
- Performance Guidelines (add if performance-critical)
- Accessibility Standards (add if building UI)

**To use this template:**

1. **Replace all {{PLACEHOLDERS}}** with your actual values
2. **Remove sections** that don't apply
3. **Add sections** if you need the stripped ones
4. **Fill in examples** with real code
5. **Update regularly** as patterns evolve

**⚠️ CRITICAL RULES FOR AI AGENTS:**

When filling this template, you MUST:
- ✅ Replace `{{PLACEHOLDERS}}` with **REAL values from the project**, not generic text
- ✅ Keep section headings **EXACTLY as written** (e.g., "Testing Patterns" stays "Testing Patterns")
- ✅ Use actual commands, file paths, and code snippets from the codebase
- ✅ Make content specific to THIS project, not generic advice

When filling this template, you MUST NOT:
- ❌ Change section headings (e.g., "Testing Patterns" → "Testing Guidelines")
- ❌ Replace placeholders with other placeholders (e.g., `{{TEST_ORGANIZATION}}` → "Manual testing only")
- ❌ Add generic content that could apply to any project
- ❌ Skip sections - fill them or remove them

**Common placeholders:**
- `{{PROJECT_NAME}}` - Your project name
- `{{DATE}}` - Current date
- `{{FRAMEWORK}}` - Framework name and version
- `{{LANGUAGE}}` - Programming language
- `{{*_CMD}}` - Actual commands to run
- `{{*_DESCRIPTION}}` - Your explanations
- `{{*_EXAMPLE}}` - Real code examples

**After customization:**
1. Rename to `CODEBASE_ESSENTIALS.md`
2. Commit to repository
3. Reference in AGENTS.md
4. Update as patterns change

**Need more sections?** Use the full template: `CODEBASE_ESSENTIALS.template.md`

---

*This template is part of the Knowledge System Template. See [README](README.md) for full documentation.*
