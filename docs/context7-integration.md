# Context7 MCP Integration Guide

**Last Updated:** February 1, 2026  
**Status:** Optional Enhancement  
**Compatibility:** AIKnowSys 0.8.0+

---

## What is Context7?

Context7 is a Model Context Protocol (MCP) server that provides real-time access to up-to-date library and framework documentation. It prevents AI assistants from generating outdated code by fetching version-specific documentation directly from official sources.

**Key Benefits:**
- ✅ Prevents hallucinated APIs and deprecated patterns
- ✅ Version-specific documentation (e.g., Next.js 14 vs 15)
- ✅ Current best practices for scaffolding
- ✅ Validates learned skills against latest APIs
- ✅ Works with Claude Desktop, Cursor, and other MCP clients

**Project:** [context7.com](https://context7.com) | 44k+ GitHub stars | MIT licensed

---

## Why Use with AIKnowSys?

AIKnowSys helps you build and maintain project knowledge. Context7 ensures that knowledge stays current:

| Use Case | Without Context7 | With Context7 |
|----------|------------------|---------------|
| Creating skills | AI might reference old API | Fetches current docs automatically |
| Tech stack templates | Examples may use deprecated patterns | Generated from latest conventions |
| Validating patterns | Manual doc checking required | Automated drift detection |
| Planner workflows | Generic framework suggestions | Version-specific recommendations |

**Integration Philosophy:**
- 100% optional (graceful degradation if unavailable)
- Documentation-first (users can adopt immediately)
- No hard dependencies (AIKnowSys works standalone)

---

## Installation

### Prerequisites

- Claude Desktop, Cursor, or another MCP-compatible client
- AIKnowSys 0.8.0 or later
- Node.js 20+ (for MCP server)

### Step 1: Install Context7 MCP

**For Claude Desktop:**

1. Install the MCP server:
   ```bash
   npm install -g @context7/mcp-server
   ```

2. Configure Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
   ```json
   {
     "mcpServers": {
       "context7": {
         "command": "npx",
         "args": ["-y", "@context7/mcp-server"]
       }
     }
   }
   ```

3. Restart Claude Desktop

**For Cursor:**

See [Cursor MCP Setup Guide](https://docs.cursor.com/mcp/setup)

**Verify Installation:**

In your AI assistant, try:
```
Query Context7 for React 19 hooks documentation
```

You should see current React 19 docs fetched automatically.

---

## Using Context7 with AIKnowSys

### 1. Planning Tech Stacks (with @Planner)

When planning a new feature or choosing technologies, use Context7 to get current best practices:

**Example conversation:**
```
@Planner I need to implement authentication in a Next.js 15 app.
Use Context7 to check current auth patterns for Next.js 15.
```

**What happens:**
- Planner queries Context7 for `/vercel/next.js/v15` auth patterns
- Receives current middleware and route handler conventions
- Suggests implementation based on latest APIs
- Creates plan with accurate code examples

### 2. Creating Learned Skills

When discovering a new pattern, validate it against current docs:

**Example workflow:**
```bash
# Discover pattern during development
# Draft skill manually or via learn command

# Then ask AI to validate:
"Check if this nextjs-middleware skill references current APIs.
Use Context7 to compare with Next.js 15 documentation."
```

**AI will:**
- Extract library references (Next.js)
- Query Context7 for current docs
- Compare skill content with latest API
- Suggest updates if drift detected

### 3. Scaffolding Tech Stack Templates

When creating a new project with a specific stack:

**Example:**
```bash
npx aiknowsys init --stack nextjs

# In AI chat:
"Use Context7 to verify the Next.js template uses current conventions.
Check app router patterns, server components, and middleware setup."
```

**Benefits:**
- Template matches current framework version
- No deprecated patterns in scaffold
- Links to current documentation

### 4. Maintaining Skill Library

Periodically validate learned skills:

**Manual check:**
```
Review .github/skills/my-skill/SKILL.md
Use Context7 to check if referenced APIs are still current.
Update skill if drift detected.
```

**Future automation:** The `check-skills --context7` command (planned) will automate this.

---

## Best Practices

### When to Use Context7

✅ **Use Context7 for:**
- Library/framework API questions
- Scaffolding new projects with specific stack
- Creating skills about external dependencies
- Validating patterns after major version updates
- Planning features with unfamiliar technologies

❌ **Skip Context7 for:**
- Project-specific code (your codebase)
- General programming concepts (algorithms, patterns)
- Questions about AIKnowSys itself
- Performance-critical operations (Context7 adds latency)

### Specifying Library IDs

Context7 uses GitHub-style library identifiers:

```
/owner/repo              # Latest version
/owner/repo/version      # Specific version
```

**Examples:**
- `/vercel/next.js` - Latest Next.js
- `/vercel/next.js/v15.0.0` - Specific version
- `/facebook/react` - Latest React
- `/supabase/supabase` - Supabase docs

**Finding Library IDs:**
Ask your AI: "What's the Context7 library ID for [framework name]?"

### Combining with AIKnowSys Workflows

**TDD Workflow with Context7:**
```
1. Write test (use Context7 for test framework current API)
2. Implement (use Context7 for library API)
3. Refactor (validate patterns with Context7)
4. Document in learned skill (include version references)
```

**Skill Creation with Context7:**
```
1. Discover pattern in your code
2. Validate with Context7 (is this still recommended?)
3. Document in SKILL.md with version references
4. AI future-proofs by checking periodically
```

---

## Advanced Features

### Auto-Invocation Rules

Configure your AI assistant to automatically use Context7 for certain queries:

**Example rules (Claude Desktop):**
```json
{
  "rules": [
    {
      "trigger": "library documentation",
      "action": "use_context7",
      "description": "Automatically query Context7 for library docs"
    },
    {
      "trigger": "current API",
      "action": "use_context7",
      "description": "Fetch latest API documentation"
    }
  ]
}
```

### Caching Responses

Context7 responses can be cached to avoid rate limits:

**In your project:**
```bash
# Create cache directory
mkdir -p .aiknowsys/context7-cache

# AI will cache responses for 24 hours
# Clear cache: rm -rf .aiknowsys/context7-cache/*
```

---

## Troubleshooting

### Context7 Not Available

**Symptom:** AI says "Context7 MCP is not configured"

**Solutions:**
1. Verify MCP server is installed: `npx @context7/mcp-server --version`
2. Check client config (claude_desktop_config.json or similar)
3. Restart your AI client
4. Check MCP server logs

### Slow Responses

**Symptom:** Context7 queries take >5 seconds

**Solutions:**
- Use more specific library IDs (include version)
- Enable caching (see Advanced Features)
- Check internet connection
- Consider using cached skills for repeated queries

### Outdated Documentation

**Symptom:** Context7 returns old docs despite specifying version

**Solutions:**
- Clear Context7 cache
- Verify library ID format (`/owner/repo/vX.X.X`)
- Check if library documentation is actually published for that version
- Report to Context7 project if docs should exist

---

## Feature Requests & Roadmap

**Planned CLI Enhancements:**
- `npx aiknowsys check-skills --context7` - Auto-validate all learned skills
- `npx aiknowsys init --with-context7` - Scaffold with current framework conventions
- `npx aiknowsys learn extract --validate-context7` - Validate during skill creation

**Planned VSCode Hooks:**
- `sessionStart` - Detect Context7 availability and suggest usage
- `validatePattern` - Auto-check learned skills on save

**Community Contributions Welcome:**
See [CONTRIBUTING.md](../CONTRIBUTING.md) for how to propose features.

---

## Related Documentation

- [Advanced Workflows](advanced-workflows.md) - Integration with other tools
- [Skill Creator Guide](.github/skills/skill-creator/SKILL.md) - Creating learned skills
- [Planner Agent](AGENTS.md#planner) - Using Planner with Context7
- [Context7 Official Docs](https://context7.com/docs) - Full MCP server documentation

---

**Questions or Issues?**  
Open an issue: [github.com/arpa73/AIKnowSys/issues](https://github.com/arpa73/AIKnowSys/issues)
