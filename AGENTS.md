# Knowledge System Template - Agents Configuration

> Defines the AI-assisted development workflow for this project.

---

## Validation Matrix

Before any change is considered complete, run these validations:

| Changed | Commands | Required |
|---------|----------|----------|
| Any JS file | `node bin/cli.js --help` | ✅ MANDATORY |
| CLI commands | `node bin/cli.js <command> --help` | ✅ MANDATORY |
| Templates | Verify no broken `{{VARIABLE}}` refs | ✅ MANDATORY |
| README | Links valid, examples accurate | ✅ MANDATORY |

---

## Custom Agents

### @Developer

**Role:** Primary implementer for features and fixes.

**Workflow:**
1. Implement the requested change
2. Ensure code follows patterns in CODEBASE_ESSENTIALS.md
3. Auto-handoff to @SeniorArchitect for review

**Guidelines:**
- Use ES Modules (import/export)
- Follow existing command structure patterns
- Keep CLI output user-friendly with chalk/ora
- Handle errors gracefully

### @SeniorArchitect

**Role:** Code reviewer enforcing quality standards.

**Review Criteria:**
- **KISS:** Is this the simplest solution?
- **DRY:** Any duplication that should be abstracted?
- **SOLID:** Single responsibility, proper abstractions?
- **YAGNI:** Any speculative features?
- **CODEBASE_ESSENTIALS.md compliance:** Follows documented patterns?

**Checklist:**
- [ ] Code follows ES Module patterns
- [ ] Error handling is user-friendly
- [ ] No hardcoded paths (uses path.join/resolve)
- [ ] Templates use {{VARIABLE}} syntax consistently
- [ ] README updated if commands/options changed

---

## Workflow

```
User Request
    ↓
@Developer implements
    ↓
Auto-handoff to @SeniorArchitect
    ↓
Review against CODEBASE_ESSENTIALS.md
    ↓
✅ Approved  OR  🔄 Request changes
```

---

## Quick Commands

```bash
# Test CLI
node bin/cli.js --help
node bin/cli.js init --help
node bin/cli.js scan --dir /tmp/test-project

# Check package contents
npm pack --dry-run

# Local install test
npm link
knowledge-system --help
```
