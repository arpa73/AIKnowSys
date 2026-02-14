---
name: 3rd-party-framework-docs
description: Query up-to-date 3rd-party framework/library documentation using Context7 MCP
triggers:
  - "query framework docs"
  - "library documentation"
  - "current API docs"
  - "latest docs for"
  - "framework API"
  - "check current docs"
  - "context7"
  - "version-specific docs"
maintainer: false
---

# Framework Documentation Query Skill

**What:** Query current framework/library documentation using Context7 MCP

**When to use:**
- Need current library API documentation
- Validating learned patterns against latest APIs
- Working with unfamiliar frameworks
- Checking version-specific features
- Planning with external dependencies

**Why not web search:** Context7 provides structured, version-specific docs optimized for AI consumption

---

## Prerequisites

- Context7 MCP installed and configured
- MCP-compatible AI client (Claude Desktop, Cursor, etc.)
- See [docs/context7-integration.md](../../../docs/context7-integration.md) for setup

---

## Workflow

### Step 1: Identify the Use Case

**Ask yourself:**
- Am I working with an external library/framework?
- Do I need current API documentation?
- Is this a version-specific question?

**If YES → Use Context7**  
**If NO → Use existing project knowledge**

---

### Step 2: Determine Library ID

**Format:** `/owner/repo` or `/owner/repo/version`

**Common examples:**
```
/vercel/next.js           # Latest Next.js
/vercel/next.js/v15.0.0   # Specific version
/facebook/react           # Latest React
/supabase/supabase        # Supabase
/mongodb/docs             # MongoDB
/vitejs/vite              # Vite
```

**Finding IDs:**
- Ask AI: "What's the Context7 library ID for [framework]?"
- Check Context7 docs: https://context7.com/libraries
- Format: GitHub repository path

---

### Step 3: Formulate Query

**Good queries (specific):**
```
"Query Context7 for Next.js 15 middleware patterns"
"Use Context7: How to implement auth in Supabase v2?"
"Check Context7 for current React hooks best practices"
```

**Poor queries (too vague):**
```
"How does Next.js work?"  # Too broad
"Get docs"  # Missing library
"Latest API"  # Which library?
```

**Best practice:** Include library name + version + specific topic

---

### Step 4: Apply Response to AIKnowSys

**For learned skills:**
```markdown
# Skill: Next.js Middleware Pattern

**Source:** Context7 `/vercel/next.js/v15.0.0` (Feb 2026)

**Pattern:**
\`\`\`typescript
// Current Next.js 15 middleware
export function middleware(request: NextRequest) {
  // ... (code from Context7)
}
\`\`\`

**When to use:** [your project-specific context]
```

**For tech stack scaffolding:**
- Use Context7 response to verify CODEBASE_ESSENTIALS patterns
- Update tech stack examples with current conventions
- Reference version in documentation

**For validation:**
- Compare existing skill with Context7 response
- Flag deprecated patterns
- Suggest updates if drift detected

---

## Integration Points

### With @Planner Agent

**Scenario:** Planning a new feature with unfamiliar tech

**Workflow:**
```
1. @Planner I need to implement [feature] with [technology]
2. AI: "I'll query Context7 for current patterns"
3. AI uses Context7 to get latest docs
4. Planner creates plan with accurate APIs
5. Plan includes version references
```

**Example:**
```
@Planner Plan authentication for Next.js 15 app
Use Context7 to get current middleware and route handler patterns.
```

### With @Developer Agent

**Scenario:** Implementing a feature with external dependency

**Workflow:**
```
1. Developer reads CODEBASE_ESSENTIALS (project patterns)
2. Identifies external library usage
3. Queries Context7 for current API
4. Implements with up-to-date patterns
5. Documents in learned skill with version
```

**Example:**
```
@Developer Implement Supabase auth
Use Context7 for Supabase v2 current auth patterns.
Follow TDD workflow.
```

### With Skill Creation

**Scenario:** Creating a learned skill about external library

**Workflow:**
```
1. Discover pattern in your code
2. Query Context7 for library documentation
3. Validate pattern is current best practice
4. Document in SKILL.md with:
   - Source: Context7 /owner/repo/version
   - Last validated: Date
   - Version-specific notes
```

**Example skill header:**
```markdown
# Skill: Supabase Row Level Security

**Source:** Context7 `/supabase/supabase` (Feb 2026)
**Last Validated:** 2026-02-01
**Supabase Version:** 2.x
```

---

## Best Practices

### DO ✅

- **Include version numbers** in queries and skill documentation
- **Validate before committing** learned skills
- **Cache responses** for repeated queries (24 hour TTL)
- **Document source** when using Context7 in skills
- **Combine with project knowledge** (Context7 + CODEBASE_ESSENTIALS)

### DON'T ❌

- **Don't use for project-specific code** (use CODEBASE_ESSENTIALS)
- **Don't skip version** when version matters
- **Don't trust blindly** - validate Context7 responses make sense
- **Don't query for general concepts** (use built-in AI knowledge)
- **Don't use for performance-critical workflows** (adds latency)

---

## When Context7 is Unavailable

**Graceful degradation:**

```
If Context7 not available:
  1. Use AI's built-in knowledge (may be outdated)
  2. Manually check official docs
  3. Add TODO to validate with Context7 later
  4. Document assumption in code
```

**Example:**
```javascript
// TODO: Validate with Context7 when available
// Assumption: Next.js 15 middleware pattern (as of Feb 2026)
export function middleware(req) {
  // ...
}
```

---

## Troubleshooting

### Query Returns No Results

**Possible causes:**
- Library ID incorrect (check format)
- Version doesn't exist or isn't documented
- Library not indexed by Context7

**Solutions:**
- Verify library ID with AI: "Is `/owner/repo` correct?"
- Try without version (use latest)
- Check Context7 library list: https://context7.com/libraries
- Manual fallback: Check official docs directly

### Response Seems Outdated

**Possible causes:**
- Context7 cache
- Library docs not updated
- Wrong version specified

**Solutions:**
- Clear cache: `.aiknowsys/context7-cache/`
- Verify version number matches expectation
- Check library's official changelog
- Report to Context7 if docs should be current

### Timeout or Slow

**Possible causes:**
- Network latency
- Large documentation
- Rate limiting

**Solutions:**
- Be more specific in query (reduce scope)
- Enable caching (see Advanced Features in docs)
- Use cached skills for repeated needs
- Consider offline fallback workflow

---

## Examples

### Example 1: Validating Learned Skill

**Scenario:** You created a skill 3 months ago about React hooks

**Workflow:**
```
1. Open skill: .github/skills/react-hooks-pattern/SKILL.md
2. Ask AI: "Use Context7 to check if this React hooks skill is current.
            Compare with /facebook/react latest docs."
3. AI queries Context7
4. AI reports: "✅ Pattern is current" or "⚠️ Deprecated, use X instead"
5. Update skill if needed
6. Update "Last Validated" date
```

### Example 2: Scaffolding with Specific Version

**Scenario:** Starting a new Next.js 15 project

**Workflow:**
```bash
npx aiknowsys init --stack nextjs

# In AI chat:
"Use Context7 /vercel/next.js/v15.0.0 to verify:
 1. App Router structure is current
 2. Middleware patterns are up-to-date
 3. Server Components conventions are correct
 
Update CODEBASE_ESSENTIALS if any patterns are outdated."
```

### Example 3: Planning with Unfamiliar Tech

**Scenario:** Need to add Supabase to existing project

**Workflow:**
```
@Planner Create plan for Supabase integration
Requirements:
- Authentication (email/password + OAuth)
- Row Level Security
- Real-time subscriptions

Use Context7 /supabase/supabase to:
1. Get current auth patterns
2. Check RLS best practices
3. Verify real-time API

Create implementation plan with current APIs.
```

---

## Related Skills

- [skill-validation](../skill-validation/SKILL.md) - Automated skill validation
- [skill-creator](../skill-creator/SKILL.md) - Creating learned skills
- [tdd-workflow](../tdd-workflow/SKILL.md) - Test-driven development

---

## See Also

- [Context7 Integration Guide](../../../docs/context7-integration.md) - Full setup and usage
- [Advanced Workflows](../../../docs/advanced-workflows.md) - Integration patterns
- [Context7 Official Docs](https://context7.com/docs) - MCP server documentation

---

**Last Updated:** 2026-02-01  
**AIKnowSys Version:** 0.8.0+
