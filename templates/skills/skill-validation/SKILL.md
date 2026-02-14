# Skill Validation with Context7

**Trigger Words:** `validate skill`, `check skill accuracy`, `outdated API`, `skill drift`, `verify skill`, `update skill`

**What:** Validate learned skills against current library documentation using Context7

**When to use this skill:**
- After major library version updates
- Periodic maintenance (quarterly/bi-annual)
- Before sharing skills with team
- When encountering deprecated warnings in code
- Creating new skills from old code

---

## Prerequisites

- Context7 MCP installed and configured
- Learned skills in `.github/skills/` or `.aiknowsys/learned/`
- See [docs/context7-integration.md](../../../docs/context7-integration.md) for setup

---

## Workflow

### Step 1: Identify Skills to Validate

**Manual selection:**
```bash
# List all learned skills
ls .github/skills/*/SKILL.md
ls .aiknowsys/learned/*.md

# Pick skills that reference external libraries
# Examples: nextjs-middleware, supabase-auth, react-hooks
```

**Automated detection (future):**
```bash
# Planned: CLI command to scan for library references
npx aiknowsys check-skills --list-external
```

**Prioritize:**
1. Skills with version numbers in content
2. Skills about rapidly evolving frameworks (React, Next.js, Vite)
3. Skills created >6 months ago
4. Skills with deprecation warnings in code

---

### Step 2: Extract Library References

**Read skill content and identify:**
- Library/framework names
- Version numbers (if present)
- API method names
- Code patterns

**Example skill header:**
```markdown
# Skill: Next.js Middleware Pattern

**Library:** Next.js
**Version:** 13.x (documented in skill)
**APIs:** middleware(), NextRequest, NextResponse
```

**Extraction checklist:**
- [ ] What library is this about?
- [ ] What version is referenced?
- [ ] What specific APIs are used?
- [ ] Are there code examples?

---

### Step 3: Query Context7 for Current Documentation

**Basic query:**
```
Use Context7 to get current documentation for [library]
Library ID: /owner/repo
Topic: [specific API or pattern]
```

**Example queries:**

**Next.js middleware:**
```
Query Context7 /vercel/next.js for current middleware patterns.
Compare with:
- middleware() function signature
- NextRequest/NextResponse usage
- Recommended patterns for auth/i18n
```

**Supabase auth:**
```
Query Context7 /supabase/supabase for current auth patterns.
Check:
- signIn() vs signInWithPassword() (method names)
- Auth helpers usage
- Session management best practices
```

**React hooks:**
```
Query Context7 /facebook/react for current hooks API.
Verify:
- useEffect dependencies
- Recommended patterns vs legacy patterns
- New hooks since skill was created
```

---

### Step 4: Compare Skill Content with Current Docs

**Comparison matrix:**

| Aspect | Skill Content | Context7 Response | Status |
|--------|---------------|-------------------|--------|
| Method names | `auth.signIn()` | `auth.signInWithPassword()` | ⚠️ OUTDATED |
| Parameters | `{ email, password }` | `{ email, password, options }` | ⚠️ INCOMPLETE |
| Return type | `Promise<User>` | `Promise<AuthResponse>` | ⚠️ CHANGED |
| Pattern | Middleware chaining | App Router approach | ⚠️ DEPRECATED |

**Status codes:**
- ✅ CURRENT - Skill matches current docs
- ⚠️ OUTDATED - Minor changes, still works
- 🔴 DEPRECATED - No longer recommended
- ❌ BROKEN - Will not work with current version

---

### Step 5: Decide on Action

**Based on drift severity:**

**✅ CURRENT (No action needed):**
```markdown
# Add validation marker to skill:

---
**Last Validated:** 2026-02-01
**Context7 Source:** /vercel/next.js/v15.0.0
**Status:** ✅ Current (verified with latest docs)
```

**⚠️ OUTDATED (Update skill):**
```markdown
# Update skill content
# Add note about version compatibility
# Keep old approach in "Legacy" section if still useful

## Current Approach (Next.js 15+)
[updated pattern]

## Legacy Approach (Next.js 13)
[old pattern - kept for reference]
```

**🔴 DEPRECATED (Mark and suggest replacement):**
```markdown
# Add deprecation warning at top:

> **⚠️ DEPRECATION WARNING**
> This pattern is deprecated as of [library] [version].
> Use [alternative skill] instead.
> See: [link to new docs]

# Consider archiving skill or converting to "historical reference"
```

**❌ BROKEN (Archive or remove):**
```bash
# Move to archive
mkdir -p .aiknowsys/learned/archived
mv .aiknowsys/learned/old-pattern.md .aiknowsys/learned/archived/

# Or add tombstone:
echo "# ARCHIVED: Pattern no longer valid" > skill.md
echo "Replaced by: [new-pattern.md]" >> skill.md
```

---

### Step 6: Update Skill with Findings

**Template for skill update:**

```markdown
# Skill: [Name]

**Library:** [Name]
**Version:** [Current version from Context7]
**Last Validated:** [Date]
**Context7 Source:** /owner/repo/vX.X.X
**Status:** ✅ Current | ⚠️ Minor changes | 🔴 Deprecated

---

[Updated content based on Context7 response]

---

## Version History

### v2.0 (2026-02-01)
- Updated for [Library] v15
- Changed method names from X to Y
- Added new parameters
- **Validated with Context7**

### v1.0 (2025-08-01)
- Initial version
- Based on [Library] v13
```

---

## Integration with AIKnowSys Workflows

### Periodic Skill Maintenance

**Quarterly review workflow:**

```bash
# 1. List all external-library skills
find .github/skills .aiknowsys/learned -name "*.md" \
  | xargs grep -l "Library:" \
  | sort > skills-to-validate.txt

# 2. For each skill in list:
cat skills-to-validate.txt | while read skill; do
  echo "Validating: $skill"
  # Ask AI: "Validate this skill with Context7"
done

# 3. Generate validation report
# (Future: automated command)
```

### Before Team Sharing

**Pre-commit validation:**

```bash
# If skill references external library:
# 1. Validate with Context7
# 2. Add validation marker
# 3. Commit with version info

git add .github/skills/my-skill/
git commit -m "feat(skill): add [skill name]

Validated with Context7 /owner/repo/vX.X.X
Status: ✅ Current as of $(date +%Y-%m-%d)
"
```

### After Framework Updates

**Post-update workflow:**

```bash
# After: npm update next@15
# Check which skills reference Next.js:

grep -r "Next.js" .github/skills .aiknowsys/learned

# Validate each with Context7 /vercel/next.js/v15.0.0
# Update skills with breaking changes
# Mark others as validated
```

---

## Automation Opportunities

### Planned: CLI Command (Future)

```bash
# Scan all skills for external library references
npx aiknowsys check-skills --context7

# Output:
# 🔍 Scanning 23 skills...
# 
# ✅ 15 skills validated (current)
# ⚠️  5 skills need updates:
#   - nextjs-middleware.md (v13 → v15)
#   - supabase-auth.md (deprecated method)
#   - react-hooks.md (missing new APIs)
# 🔴 2 skills deprecated:
#   - webpack-config.md (replaced by Vite)
# ❌ 1 skill broken:
#   - old-api-pattern.md (library removed)
#
# Update skills? (Y/n)
```

### Planned: GitHub Action (Future)

```yaml
# .github/workflows/validate-skills.yml
name: Validate Skills

on:
  schedule:
    - cron: '0 0 1 * *'  # Monthly
  workflow_dispatch:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate skills with Context7
        run: npx aiknowsys check-skills --context7 --ci
      - name: Create PR if updates needed
        if: failure()
        uses: peter-evans/create-pull-request@v5
        with:
          title: "chore: update outdated skills"
          body: "Automated skill validation found updates needed."
```

---

## Examples

### Example 1: Validating Next.js Middleware Skill

**Skill content (v13):**
```javascript
// .github/skills/nextjs-middleware/SKILL.md
export function middleware(req) {
  if (!req.cookies.auth) {
    return NextResponse.redirect('/login');
  }
}
```

**Validation process:**
```
1. Query Context7: /vercel/next.js (latest)
2. Compare: Method signature changed in v15
3. Update skill:

export function middleware(req: NextRequest) {
  const session = req.cookies.get('auth');
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

4. Add validation marker:
**Last Validated:** 2026-02-01
**Context7 Source:** /vercel/next.js/v15.0.0
**Status:** ✅ Updated for Next.js 15
```

### Example 2: Detecting Deprecated Pattern

**Skill content:**
```javascript
// Supabase auth (old)
const { user } = await supabase.auth.signIn({
  email, password
});
```

**Context7 check:**
```
Query: /supabase/supabase auth patterns
Response: "signIn() deprecated, use signInWithPassword()"

Action: Update skill with deprecation warning
```

**Updated skill:**
```markdown
> **⚠️ DEPRECATION NOTICE**
> `signIn()` deprecated in Supabase v2.
> Use `signInWithPassword()` instead.

## Current Pattern (Supabase v2+)
\`\`\`javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});
\`\`\`

## Legacy Pattern (Supabase v1)
\`\`\`javascript
// ⚠️ Deprecated
const { user } = await supabase.auth.signIn({ email, password });
\`\`\`
```

---

## Best Practices

### DO ✅

- **Validate before sharing** skills with team
- **Document version** in skill header
- **Add validation date** after Context7 check
- **Keep legacy patterns** for reference (with deprecation notice)
- **Create new skill** instead of overwriting if major breaking change

### DON'T ❌

- **Don't delete old content** without preserving history
- **Don't blindly trust** Context7 - verify changes make sense
- **Don't skip validation** for "small" skills
- **Don't assume** current AI knowledge is up-to-date
- **Don't validate** project-specific patterns (Context7 is for external libs)

---

## Troubleshooting

### Context7 Returns Different API than Expected

**Possible causes:**
- You're looking at wrong version
- Library had breaking change
- Context7 showing beta/preview docs

**Solutions:**
- Specify exact version: `/owner/repo/vX.X.X`
- Check library's changelog
- Cross-reference with official docs
- Document uncertainty in skill

### Skill References Multiple Libraries

**Example:** Next.js + Supabase + React Hook Form

**Approach:**
```
1. Query each library separately:
   - /vercel/next.js
   - /supabase/supabase
   - /react-hook-form/react-hook-form

2. Validate integration pattern:
   - Does the combination still work?
   - Are there new recommended approaches?

3. Update skill with all library versions:
   **Dependencies:**
   - Next.js v15
   - Supabase v2
   - React Hook Form v7
   **Last Validated:** 2026-02-01
```

---

## Related Skills

- [context7-usage](../context7-usage/SKILL.md) - Using Context7 with AIKnowSys
- [skill-creator](../skill-creator/SKILL.md) - Creating learned skills
- [code-refactoring](../code-refactoring/SKILL.md) - Updating code based on skill changes

---

## See Also

- [Context7 Integration Guide](../../../docs/context7-integration.md) - Full setup
- [Learned Patterns Guide](../../../AGENTS.md#continuous-learning) - Pattern management
- [Context7 Library Index](https://context7.com/libraries) - Available libraries

---

**Last Updated:** 2026-02-01  
**AIKnowSys Version:** 0.8.0+
