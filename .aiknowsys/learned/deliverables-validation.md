# Deliverables Validation Protocol

**Type:** quality-assurance  
**Created:** 2026-02-03  
**Status:** Active

---

## Trigger Words

Use this skill when you see these phrases:
- "breaking change"
- "template update"
- "release prep"
- "validate deliverables"
- "pre-release"
- "ship broken templates"
- "deliverables consistency"

---

## Purpose

Prevent shipping broken templates by validating deliverables systematically before commits and releases.

**Context:** Templates in `templates/` directory are deliverables distributed to users via `npx aiknowsys init`. Any mismatch between templates and non-template files breaks user experience.

---

## When to Use

### Automatic (No Action Required)
- ✅ Pre-commit hook validates when `templates/` files are staged
- ✅ quality-check includes deliverables validation

### Manual Validation Required
- Before any release (`npm publish`)
- After changing agent behavior or patterns
- When modifying template files directly
- During breaking changes implementation
- When user reports template issues

---

## Validation Approaches

### 1. Pre-Commit Hook (Automatic - <2s)

**Location:** `.git/hooks/pre-commit` (from `templates/git-hooks/pre-commit-enhanced`)

**What it does:**
- Detects staged changes in `templates/` directory
- Runs fast validation checks only
- **Blocks commit** if validation fails
- Skips expensive checks (fresh init test)

**Output:**
```bash
📋 Step 2/4: Deliverables validation...
  📝 Templates changed - validating deliverables...
  ❌ Deliverables validation failed - commit blocked
  
  Templates must match non-template equivalents.
  Run: npx aiknowsys validate-deliverables
  Fix: npx aiknowsys validate-deliverables --fix
  Or skip: git commit --no-verify (not recommended)
```

**Bypass (emergency only):**
```bash
git commit --no-verify -m "WIP: known broken templates"
```

### 2. quality-check Command (Pre-Release - Comprehensive)

**Command:**
```bash
npx aiknowsys quality-check
```

**What it does:**
- Part of pre-release validation matrix
- Runs ALL validation checks (including expensive ones)
- Includes fresh init test (creates temp project)
- Shows metrics (templates checked, duration)
- **Does NOT block** - for informational purposes

**Output:**
```bash
Deliverables Validation:
  ✅ Template Schema (8 templates)
  ✅ Pattern Consistency (14 patterns)
  ✅ Legacy Patterns (5 anti-patterns)
  ✅ Placeholders (no unresolved)
  ✅ Template Execution (YAML valid)
  ✅ Fresh Init (generated files match)
  
  Metrics:
  - Templates checked: 8
  - Duration: 4.2s
```

### 3. Standalone Command (Development)

**Basic validation:**
```bash
npx aiknowsys validate-deliverables
```

**Comprehensive validation:**
```bash
npx aiknowsys validate-deliverables --full
```

**Auto-fix simple issues:**
```bash
npx aiknowsys validate-deliverables --fix
```

**Show metrics:**
```bash
npx aiknowsys validate-deliverables --metrics
```

---

## What Gets Validated

### 1. Template Schema (Required Placeholders)
- Ensures templates have correct `{{VARIABLES}}`
- Detects forbidden patterns in templates
- Example: `{{ESSENTIALS_FILE}}` must exist in agent templates

### 2. Pattern Consistency (Template ↔ Non-Template Mapping)
- Compares `templates/agents/*.md` with `.github/agents/*.md`
- Detects mismatches in patterns/references
- Ensures breaking changes reflected in both

**Mappings checked:**
```javascript
{
  'templates/agents/architect.agent.template.md': [
    '.github/agents/architect.agent.md'
  ],
  'templates/agents/developer.agent.template.md': [
    '.github/agents/developer.agent.md'
  ],
  'templates/AGENTS.template.md': [
    'AGENTS.md'
  ]
}
```

### 3. Legacy Pattern Detection
- Greps templates for known anti-patterns
- Example: `PENDING_REVIEW.md` (old single-dev pattern)
- Example: `Edit CURRENT_PLAN.md` (should be `plans/active-<username>.md`)

### 4. Unresolved Placeholder Check
- Finds `{{VARIABLES}}` in generated files
- Exceptions: `.template.md` files (source templates)
- Ensures init command properly substitutes variables

### 5. Template Execution Test (--full mode only)
- Parses template as YAML frontmatter
- Validates agent structure (name, description, model)
- Checks for syntax errors
- Compares with known-good agents

### 6. Fresh Init Test (--full mode only)
- Actually runs `npx aiknowsys init` in temp directory
- Verifies generated files are correct
- Validates multi-dev structure created
- **Expensive check:** ~1-2 seconds

---

## Common Issues & Solutions

### Issue: "Legacy pattern detected: PENDING_REVIEW.md"

**Cause:** Template still uses old single-dev pattern

**Solution:**
```bash
# Check which templates have the issue
npx aiknowsys validate-deliverables

# Review the diff
# templates/agents/architect.agent.template.md:35
# Should be: reviews/PENDING_<username>.md
# Found: PENDING_REVIEW.md

# Auto-fix if simple pattern
npx aiknowsys validate-deliverables --fix

# Or manually update templates/agents/*.md
```

### Issue: "Unresolved placeholder: {{PROJECT_NAME}}"

**Cause:** Template variable not substituted during init

**Solution:**
1. Check if placeholder exists in source template
2. Verify init command includes substitution
3. Add to variable replacement map in `lib/commands/init.js`

### Issue: "Template execution failed: Invalid YAML"

**Cause:** Template has syntax errors or malformed frontmatter

**Solution:**
```bash
# Run with --full to see exact error
npx aiknowsys validate-deliverables --full

# Check YAML frontmatter syntax:
# - name: "..."
# - description: "..."
# - model: "..."
```

### Issue: "Fresh init test failed"

**Cause:** Generated files don't match expected structure

**Solution:**
1. Run init manually in temp directory
2. Compare generated files with templates
3. Check for missing variable substitutions
4. Verify multi-dev structure (plans/, reviews/)

---

## Example Workflow: Breaking Change

**Scenario:** Changing from single-dev to multi-dev pattern

**Steps:**

1. **Update non-template files:**
   ```bash
   # Update actual agent files
   vim .github/agents/architect.agent.md
   vim .github/agents/developer.agent.md
   vim AGENTS.md
   ```

2. **Update template files:**
   ```bash
   # Update template equivalents
   vim templates/agents/architect.agent.template.md
   vim templates/agents/developer.agent.template.md
   vim templates/AGENTS.template.md
   ```

3. **Validate changes:**
   ```bash
   # Check for issues
   npx aiknowsys validate-deliverables
   
   # Auto-fix simple patterns
   npx aiknowsys validate-deliverables --fix
   ```

4. **Commit (hook validates automatically):**
   ```bash
   git add .github/agents/ templates/agents/ AGENTS.md templates/AGENTS.template.md
   git commit -m "feat: migrate to multi-dev pattern"
   # Hook runs automatically, blocks if validation fails
   ```

5. **Before release:**
   ```bash
   # Run comprehensive validation
   npx aiknowsys quality-check
   
   # If all checks pass
   npm version minor
   npm publish
   ```

---

## Critical Invariant

**From CODEBASE_ESSENTIALS.md - Critical Invariant #8:**

> Templates (`templates/` directory) are **deliverables** distributed to users. ANY change to core functionality MUST update corresponding templates. Breaking changes MUST be reflected in all deliverables before release.

**Rule:** Never ship templates that don't match non-template files.

---

## Metrics & History

Validation runs are logged to `.aiknowsys/validation-history.json`:

```json
{
  "2026-02-03": {
    "preCommit": { "runs": 5, "failures": 1, "avgDuration": 850 },
    "qualityCheck": { "runs": 1, "failures": 0, "avgDuration": 4200 },
    "standalone": { "runs": 3, "failures": 0, "avgDuration": 1100 }
  }
}
```

Use metrics to:
- Track validation reliability
- Identify recurring issues
- Monitor performance over time

---

## See Also

- [CODEBASE_ESSENTIALS.md](../../CODEBASE_ESSENTIALS.md#5-critical-invariants) - Critical Invariant #8
- [AGENTS.md](../../AGENTS.md#validation-matrix) - Validation matrix
- [templates/git-hooks/README.md](../../templates/git-hooks/README.md) - Git hooks documentation
- [lib/commands/validate-deliverables.js](../../lib/commands/validate-deliverables.js) - Implementation
- [test/commands/validate-deliverables.test.js](../../test/commands/validate-deliverables.test.js) - Test suite

---

*Part of AIKnowSys deliverables validation protocol. Last updated: 2026-02-03*
