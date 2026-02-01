# aiknowsys-plugin-context7

> Context7 MCP integration for aiknowsys - automated deliverable validation and documentation queries

[![npm version](https://badge.fury.io/js/aiknowsys-plugin-context7.svg)](https://www.npmjs.com/package/aiknowsys-plugin-context7)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is this?

A plugin for [aiknowsys](https://github.com/arpa73/AIKnowSys) that adds Context7 MCP integration for:

- **Automated validation** of skills, CODEBASE_ESSENTIALS.md, and stack templates against current library versions
- **Ad-hoc documentation queries** using Context7's up-to-date library knowledge
- **Breaking change detection** when frameworks release new versions

## Installation

**Prerequisites:**
- [aiknowsys](https://www.npmjs.com/package/aiknowsys) v0.8.0 or higher
- [Context7 MCP server](https://github.com/modelcontextprotocol/servers) configured

```bash
npm install aiknowsys-plugin-context7
```

The plugin will be automatically discovered by aiknowsys.

## Usage

### Validate Your Project

Check if your skills, CODEBASE_ESSENTIALS.md, and stack templates use current best practices:

```bash
# Validate skills + CODEBASE_ESSENTIALS.md (default)
npx aiknowsys validate

# Validate only skills
npx aiknowsys validate --type skills

# Validate only CODEBASE_ESSENTIALS.md
npx aiknowsys validate --type essentials

# Validate only stack templates (internal use)
npx aiknowsys validate --type stacks

# Validate specific library
npx aiknowsys validate --library nextjs

# Get JSON output for automation
npx aiknowsys validate --format json

# Markdown report for documentation
npx aiknowsys validate --format markdown > validation-report.md
```

**Output Example:**
```
Project Validation Report
==================================================

Total items validated: 13

✓ Current (11):
  - dependency-updates
  - code-refactoring
  - testing-best-practices
  ... (8 more)

⚠ Outdated (2):
  - nextjs-stack (uses deprecated getServerSideProps)
    Suggestion: Migrate to async server components
  - vue-stack (uses Options API exclusively)
    Suggestion: Add Composition API examples

Validation Score: 85% (11/13 current)
```

### Query Documentation

Ask questions about library documentation:

```bash
# Query with library and question
npx aiknowsys query-docs --library nextjs --query "How to implement middleware?"

# Short form (library name normalization)
npx aiknowsys query-docs -l "Next.js" -q "Server actions best practices"

# Get JSON output
npx aiknowsys query-docs -l react -q "useEffect cleanup" --format json

# Get markdown output
npx aiknowsys query-docs -l vue -q "composables" --format markdown
```

**Output Example:**
```
Documentation Query
==================================================

Library: Next.js
Library ID: /vercel/next.js
Query: How to implement middleware?

Documentation:
--------------------------------------------------
Next.js middleware allows you to run code before a request
is completed. Middleware runs on every route by default,
or you can specify matchers...

[Full documentation response from Context7]
```

## How It Works

### Validate-Deliverables Flow

1. **Discovery:** Plugin scans your `.github/skills/` and `templates/stacks/` directories
2. **Library Detection:** Extracts framework/library references (Next.js, Vue, Django, etc.)
3. **Context7 Queries:** Uses MCP to fetch current documentation and patterns
4. **Validation:** Compares your deliverables against current best practices
5. **Report:** Shows outdated patterns, breaking changes, and suggestions

### Query-Docs Flow

1. **Library Normalization:** Converts "Next.js", "NextJS", "nextjs" to standard format
2. **Library ID Resolution:** Maps to Context7 library ID (e.g., `/vercel/next.js`)
3. **Documentation Query:** Fetches relevant docs from Context7 MCP server
4. **Formatting:** Outputs in text, JSON, or markdown format

## Mock Mode (Default)

**Important:** The plugin runs in **mock mode by default** for standalone CLI usage.

Mock mode enables:
- ✅ Testing without Context7 MCP server
- ✅ CI/CD integration without external dependencies
- ✅ Fast local development

Mock mode simulates Context7 responses for common libraries (Next.js, Vue, React).

**For real Context7 integration:** AI assistants (Claude, GPT) access Context7 directly via MCP. This plugin's primary use case is validation workflows, not real-time queries.

## Configuration

### For AI Assistants

If you're using this plugin through an AI assistant (Claude Desktop, etc.), Context7 integration happens automatically via MCP configuration.

### For Standalone CLI (Mock Mode)

No configuration needed - mock mode works out of the box.

### For Real MCP Server (Advanced)

To connect to a real Context7 MCP server:

1. Install Context7 server: [Context7 Setup Guide](https://github.com/context7/context7-mcp)
2. Configure MCP server connection (future feature - see TODO in code)
3. Set `useMockClient = false` in lib/query-docs.js

**Note:** Real MCP integration is planned but not required for main use cases.

## API Reference

### validate

Validate aiknowsys skills, CODEBASE_ESSENTIALS.md, and stack templates against current library documentation.

**Options:**
- `--type <type>` - Filter by deliverable type (skills|essentials|stacks|all) [default: all = skills + essentials]
- `--library <name>` - Filter by specific library (e.g., nextjs, vue, react)
- `--format <format>` - Output format (text|json|markdown) [default: text]

**Use Cases:**

1. **Validate User Project** (default - skills + ESSENTIALS):
   ```bash
   npx aiknowsys validate
   # Checks .github/skills/ and CODEBASE_ESSENTIALS.md
   ```

2. **Validate Only CODEBASE_ESSENTIALS.md**:
   ```bash
   npx aiknowsys validate --type essentials
   # Checks technologies listed in Section 1: Technology Snapshot
   ```

3. **Validate Stack Templates** (aiknowsys maintainers):
   ```bash
   npx aiknowsys validate --type stacks
   # Checks templates/stacks/ directory
   ```

**Example Outputs:**

**Text Format (default):**
```
Project Validation Report
==================================================
Total items validated: 13
✓ Current (11)
⚠ Outdated (2)
Validation Score: 85%
```

**JSON Format:**
```json
{
  "items": [
    {
      "name": "nextjs-stack",
      "type": "stack",
      "libraries": ["nextjs"],
      "status": "outdated",
      "issues": ["Uses deprecated getServerSideProps"],
      "suggestions": ["Migrate to async server components"]
    }
  ],
  "summary": {
    "total": 13,
    "current": 11,
    "outdated": 2,
    "score": 0.85
  }
}
```

### query-docs

Query library documentation via Context7 MCP.

**Options:**
- `-l, --library <name>` - Library name (required)
- `-q, --query <text>` - Documentation query (required)
- `--format <format>` - Output format (text|json|markdown) [default: text]

**Library Name Normalization:**
The following inputs are equivalent:
- `"Next.js"` → `nextjs`
- `"NextJS"` → `nextjs`  
- `"next.js"` → `nextjs`
- `"Vue"` → `vue`
- `"React"` → `react`

**Example Outputs:**

**Text Format:**
```
Documentation Query
==================================================
Library: Next.js
Library ID: /vercel/next.js
Query: How to implement middleware?

Documentation:
--------------------------------------------------
[Documentation content from Context7]
```

**JSON Format:**
```json
{
  "library": "Next.js",
  "libraryId": "/vercel/next.js",
  "query": "How to implement middleware?",
  "documentation": "...",
  "timestamp": "2026-02-01T20:15:00.000Z",
  "success": true
}
```

## Use Cases

### Monthly Quality Reviews

Run validation before major releases:

```bash
# Generate full validation report
npx aiknowsys validate --format markdown > reports/validation-$(date +%Y-%m).md

# Commit report to track quality over time
git add reports/
git commit -m "docs: Monthly validation report"
```

### After Dependency Updates

Check if your CODEBASE_ESSENTIALS.md patterns need updates after package upgrades:

```bash
# After npm update or package.json changes
npx aiknowsys validate --type essentials

# Check specific library for breaking changes
npx aiknowsys validate --library nextjs
npx aiknowsys query-docs -l nextjs -q "What changed in latest version?" --format markdown
```

**Automate with postinstall script** (package.json):
```json
{
  "scripts": {
    "postinstall": "npx aiknowsys validate --type essentials || echo 'Warning: Dependencies may need pattern updates'"
  }
}
```

### Framework Upgrade Detection

Check if your docs need updates after framework releases:

```bash
# Check Next.js patterns after v15 release
npx aiknowsys validate --library nextjs

# Get detailed changelog comparison
npx aiknowsys query-docs -l nextjs -q "What changed in v15?" --format markdown
```

### CI/CD Integration

Add validation to your GitHub Actions:

```yaml
# .github/workflows/validate.yml
name: Validate Documentation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install aiknowsys aiknowsys-plugin-context7
      - run: npx aiknowsys validate --format json > validation.json
      - run: |
          # Fail if validation score < 80%
          node -e "
            const report = require('./validation.json');
            if (report.summary.score < 0.8) {
              console.error('Validation score too low:', report.summary.score);
              process.exit(1);
            }
          "
```

### Documentation Maintenance

Quick checks while writing docs:

```bash
# Verify current best practice before documenting
npx aiknowsys query-docs -l vue -q "composables vs mixins" --format markdown

# Check if pattern is deprecated
npx aiknowsys query-docs -l react -q "class components still supported?"
```

### Dependency Update Validation

Automatically validate your CODEBASE_ESSENTIALS.md when dependencies change:

#### 1. Postinstall Hook (Recommended)

Add to your `package.json`:

```json
{
  "scripts": {
    "postinstall": "npx aiknowsys validate --type essentials || echo 'Warning: Check CODEBASE_ESSENTIALS.md for deprecated patterns'"
  }
}
```

**Triggers:**
- After `npm install`
- After `npm update`
- After adding new dependencies
- On CI/CD `npm ci`

#### 2. Git Hook (Post-Merge)

Detect package.json changes after pulling/merging:

```bash
# .github/hooks/post-merge
#!/bin/bash
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep --quiet 'package.json\|package-lock.json'; then
  echo "Dependencies changed - validating ESSENTIALS..."
  npx aiknowsys validate --type essentials
fi
```

#### 3. Monthly Scheduled Validation

For projects with infrequent dependency updates:

```bash
# crontab -e
0 9 1 * * cd /path/to/project && npx aiknowsys validate --type essentials --format markdown > reports/monthly-validation.md
```

#### 4. CI/CD Pipeline

Add to `.github/workflows/validate.yml`:

```yaml
on:
  pull_request:
    paths:
      - 'package.json'
      - 'package-lock.json'
      - 'requirements.txt'
      - 'pyproject.toml'

jobs:
  validate-essentials:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install aiknowsys-plugin-context7
      - run: npx aiknowsys validate --type essentials --format json
      - name: Comment on PR if outdated
        if: failure()
        run: echo "CODEBASE_ESSENTIALS.md may need updates after dependency changes"
```

**Supported Package Managers:**
- npm / yarn (package.json, package-lock.json, yarn.lock)
- Python (requirements.txt, pyproject.toml, poetry.lock, Pipfile)

## Troubleshooting

### "Library not found" Error

**Problem:** Query returns "Library not found" error

**Solutions:**
1. Check library name spelling (use `--library nextjs` not `--library next`)
2. Library normalization: "Next.js" → "nextjs", "Vue.js" → "vue"
3. Try exact library ID: `npx aiknowsys query-docs -l "/vercel/next.js" -q "..."`

### Nothing to Validate

**Problem:** `validate` reports 0 items found

**Solutions:**
1. Run from project root (where `.github/` or `CODEBASE_ESSENTIALS.md` exists)
2. Check directory structure: `.github/skills/` for skills, root for ESSENTIALS
3. Ensure SKILL.md files exist in skill directories
4. For essentials: Verify `CODEBASE_ESSENTIALS.md` has "## 1. Technology Snapshot" section

### Mock Mode vs Real MCP

**Question:** How do I use real Context7 instead of mock mode?

**Answer:**  
Mock mode is intentional for standalone CLI usage. For real Context7 integration:
- AI assistants (Claude, GPT) access Context7 directly via their MCP config
- Plugin validation uses mock mode for CI/CD workflows
- Real MCP integration is a future enhancement (see TODO in code)

## Development

```bash
# Clone the plugin
git clone https://github.com/arpa73/aiknowsys-plugin-context7.git
cd aiknowsys-plugin-context7

# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint
```

## Contributing

Contributions welcome! Please:

1. Follow the aiknowsys [Contributing Guide](https://github.com/arpa73/AIKnowSys/blob/main/CONTRIBUTING.md)
2. Write tests for new features
3. Update documentation

## License

MIT © arpa73

## Related Projects

- [aiknowsys](https://github.com/arpa73/AIKnowSys) - AI-powered development workflow
- [Context7 MCP](https://github.com/modelcontextprotocol/servers) - Library documentation server
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Model Context Protocol SDK
