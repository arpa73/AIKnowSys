# Knowledge System Setup Guide

**Version:** 0.2.0  
**Purpose:** Step-by-step guide for customizing your knowledge system templates

---

## Quick Start

After running `npx aiknowsys init`, you'll have three template files:
- `CODEBASE_ESSENTIALS.md` - Architecture and patterns (needs customization)
- `AGENTS.md` - AI workflow (mostly ready to use)
- `CODEBASE_CHANGELOG.md` - Session history (will grow over time)

**Two approaches to fill templates:**

1. **AI-Assisted** (Recommended): Use the AI prompt displayed after init
2. **Manual**: Follow the customization steps below

---

## Understanding Placeholders

All templates use `{{PLACEHOLDER}}` syntax for values you need to fill in.

### Common Placeholders

| Placeholder | Example Value | Where Used |
|-------------|---------------|------------|
| `{{PROJECT_NAME}}` | my-awesome-app | All templates |
| `{{DATE}}` | January 25, 2026 | All templates |
| `{{LANGUAGE}}` | TypeScript, Python | ESSENTIALS |
| `{{FRAMEWORK}}` | Next.js 14, Django 5 | ESSENTIALS |
| `{{VERSION}}` | Node 20.11.0, Python 3.12 | ESSENTIALS |
| `{{TEST_FRAMEWORK}}` | Jest, pytest | ESSENTIALS |
| `{{BUILD_TOOL}}` | Vite, webpack | ESSENTIALS |
| `{{*_CMD}}` | npm test, pytest | ESSENTIALS |
| `{{*_DESCRIPTION}}` | Your explanation | ESSENTIALS |
| `{{*_EXAMPLE}}` | Real code snippets | ESSENTIALS |

### Placeholder Categories

- **`{{*_CMD}}`** - Actual commands to run (e.g., `{{TEST_CMD}}` → `npm test`)
- **`{{*_DESCRIPTION}}`** - Your explanations (e.g., `{{PATTERN_DESC}}` → "We use Repository pattern...")
- **`{{*_EXAMPLE}}`** - Real code examples (e.g., `{{CODE_EXAMPLE}}` → actual code from your project)
- **`{{*_STANDARD}}`** - Your conventions (e.g., `{{NAMING_STANDARD}}` → "camelCase for variables")

---

## ⚠️ CRITICAL RULES FOR CUSTOMIZATION

### ✅ DO:

1. **Replace placeholders with REAL values**
   ```markdown
   ❌ BAD:  {{TEST_CMD}} → "Run your tests"
   ✅ GOOD: {{TEST_CMD}} → npm test
   ```

2. **Use actual code from YOUR project**
   ```markdown
   ❌ BAD:  Generic example that could apply to any project
   ✅ GOOD: Actual function from src/utils/validator.ts with line numbers
   ```

3. **Keep section headings EXACTLY as written**
   ```markdown
   ❌ BAD:  "Testing Patterns" → "Testing Guidelines"
   ✅ GOOD: "Testing Patterns" stays "Testing Patterns"
   ```

4. **Make content specific to YOUR codebase**
   ```markdown
   ❌ BAD:  "Follow best practices for error handling"
   ✅ GOOD: "All API routes use try/catch → handleApiError(err, res)"
   ```

5. **Remove sections that don't apply**
   - If you don't have a database, remove Database section
   - If no deployment pipeline, remove Deployment section
   - Don't leave placeholder-filled sections

### ❌ DON'T:

1. **Change section headings** - AI agents rely on exact headings
2. **Replace placeholders with other placeholders** - Use real values
3. **Add generic content** - Everything should be project-specific
4. **Skip sections** - Fill them completely or remove them

---

## Template Customization Steps

### CODEBASE_ESSENTIALS.md

**Step 1: Technology Snapshot**
```markdown
Before:
| Runtime | {{LANGUAGE}} {{VERSION}} |

After:
| Runtime | Node.js 20.11.0 |
```

**Step 2: Validation Matrix** (Most Important!)
```markdown
Before:
| {{FILE_TYPE}} | {{VALIDATION_CMD}} | {{WHEN}} |

After:
| Any file | npm test | ✅ Before commit |
| TypeScript | npm run type-check | ✅ Before commit |
| Backend | npm run test:api | ✅ Before deploy |
```

**Step 3: Project Structure**
- Replace with YOUR actual directory structure
- Include key files and their purpose
- Use `tree` command or manually document

**Step 4: Core Patterns**
- Document YOUR actual coding patterns
- Include real code examples with file paths
- Show how you structure components/modules

**Step 5: Critical Invariants**
- Rules that MUST NEVER be violated
- Example: "All database queries must use parameterized queries"
- Example: "Never commit .env files"

**Step 6: Common Gotchas**
- Things that trip up developers
- Example: "PostgreSQL returns UTC timestamps, convert to local"
- Project-specific quirks and workarounds

**Step 7: Testing Patterns**
- How you organize tests
- Naming conventions
- What gets tested (unit/integration/e2e)

**Step 8: Architecture Decisions**
- Why you chose certain technologies
- Trade-offs you made
- When to use pattern A vs pattern B

**Step 9: Change Management**
- How you handle breaking changes
- If using OpenSpec: mention it here
- PR review process

**Step 10: Development Workflow**
- Local development setup
- How to run the project
- Build and deployment process

---

### AGENTS.md

**Mostly pre-filled, but customize:**

1. **Validation Matrix** - Copy from your CODEBASE_ESSENTIALS.md
2. **Project Invariants** - Add project-specific rules
3. **Skill Mapping** - Add custom skills if you created any

Example customization:
```markdown
**Project invariants for YOUR_PROJECT:**
- All API routes must have try/catch error handling
- Database queries must use connection pool
- All user inputs must be validated with Joi
```

---

### CODEBASE_CHANGELOG.md

**No immediate customization needed!**

- This file grows organically as you work
- Add a new session entry after each coding session
- See template for entry format

---

## Template Size: Minimal vs Full

### Minimal Template (10 sections)
**Best for:**
- Learning projects
- Prototypes
- Simple CLI tools
- Solo developer projects
- Internal scripts

**Sections removed:**
- Security Considerations
- Performance Guidelines
- Accessibility Standards

**When to upgrade to full:**
- Project goes to production
- Handling sensitive data
- Performance becomes critical
- Building user-facing UI

### Full Template (13+ sections)
**Best for:**
- Production applications
- Team projects
- Web applications
- APIs handling user data
- Performance-critical systems

**Additional sections:**
- Security (auth, data protection, vulnerabilities)
- Performance (optimization, caching, monitoring)
- Accessibility (WCAG, screen readers, keyboard nav)

---

## Working with AI Assistants

### AI-Assisted Setup (Recommended)

After running `npx aiknowsys init`, you'll see a prompt like:

```
🤖 AI Assistant Prompt:
   Copy this prompt to your AI assistant to complete setup:
   
   "I just initialized aiknowsys for my project...
   [detailed instructions]"
```

**Copy and paste this entire prompt to:**
- GitHub Copilot Chat
- Claude Desktop
- ChatGPT
- Cursor
- Any AI coding assistant

The AI will:
1. Read your files
2. Scan your codebase
3. Fill in all placeholders with real values
4. Add project-specific examples

### Manual AI Assistance

If you prefer more control:

```
"I have a CODEBASE_ESSENTIALS.md template. Please:
1. Read the file
2. For the Technology Snapshot section, scan my package.json and fill in:
   - Runtime version
   - Framework and version
   - Build tool
   - Test framework
3. Keep all section headings unchanged
4. Replace {{PLACEHOLDERS}} with actual values from my code"
```

---

## Validation

After customizing, verify:

1. **No placeholders remain** (search for `{{`)
   ```bash
   grep -n "{{" CODEBASE_ESSENTIALS.md
   # Should return nothing or only intentional examples
   ```

2. **Validation Matrix commands work**
   ```bash
   # Test each command from your matrix
   npm test
   npm run lint
   # etc.
   ```

3. **Section headings are unchanged**
   - AI agents rely on exact section names
   - "Testing Patterns" not "Testing Guidelines"

4. **All content is project-specific**
   - No generic advice like "follow best practices"
   - Every example references YOUR code

---

## Common Mistakes

### ❌ Mistake 1: Leaving Generic Placeholders
```markdown
BAD:  {{TEST_ORGANIZATION}} → "Tests should be organized properly"
GOOD: {{TEST_ORGANIZATION}} → "Tests mirror src/ structure: src/auth/login.ts → tests/auth/login.test.ts"
```

### ❌ Mistake 2: Changing Section Headings
```markdown
BAD:  ## Testing Patterns → ## Testing Guidelines
GOOD: ## Testing Patterns (keep exact heading)
```

### ❌ Mistake 3: Generic Content
```markdown
BAD:  "Use proper error handling"
GOOD: "All async functions use try/catch → handleError(err, { context: 'functionName' })"
```

### ❌ Mistake 4: Incomplete Examples
```markdown
BAD:  "See utils folder"
GOOD: "See [src/utils/validator.ts](src/utils/validator.ts#L45-L67) for Joi schema pattern"
```

---

## Getting Help

- **Examples**: See [examples/filled-simple-api](examples/filled-simple-api) for a realistic filled template
- **Documentation**: Read [docs/customization-guide.md](docs/customization-guide.md)
- **Issues**: Report problems at https://github.com/arpa73/aiknowsys/issues

---

## Quick Reference

**After setup:**
```bash
# Verify no placeholders remain
grep -n "{{" CODEBASE_ESSENTIALS.md

# Test validation commands
npm test                    # (or your test command)

# Commit your customized templates
git add CODEBASE_ESSENTIALS.md AGENTS.md CODEBASE_CHANGELOG.md
git commit -m "docs: Initialize knowledge system"
```

**During development:**
- Read CODEBASE_ESSENTIALS.md at session start
- Update patterns when they change
- Add entries to CODEBASE_CHANGELOG.md after sessions
- Let AI agents guide you via AGENTS.md workflow

---

*This guide is part of aiknowsys. See [README](README.md) for full documentation.*
