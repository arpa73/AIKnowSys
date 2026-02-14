# ESSENTIALS Compression Guide

**Keep CODEBASE_ESSENTIALS.md focused and navigable**

---

## Why Compress?

**Problem:** CODEBASE_ESSENTIALS.md grows over time as patterns accumulate, examples become verbose, and historical context gets embedded.

**Impact:**
- Slower AI context loading (more tokens = higher costs + slower responses)
- Harder to navigate (scrolling through 1400 lines to find patterns)
- Lower signal-to-noise ratio (core patterns buried in verbose examples)
- Eventually hits AI context limits (some AI tools have token limits)

**Ideal state:** ESSENTIALS stays **600-800 lines** containing core patterns only, with verbose details extracted to `docs/` and historical patterns moved to `.aiknowsys/learned/`.

---

## When to Compress

### Thresholds

| Lines | Status | Action |
|-------|--------|--------|
| < 600 | ✅ Optimal | No action needed |
| 600-800 | ✅ Good | Monitor, compress if specific sections are verbose |
| 800-1500 | ⚠️ Warning | Compress recommended (run `--analyze`) |
| > 1500 | 🚨 Critical | Compress urgently (impacts AI performance) |

**Section thresholds:**
- Individual sections > 150 lines should be reviewed
- Code examples > 15 lines should be extracted

### Triggers

**Compress when:**
- ✅ `npx aiknowsys check` warns about file size
- ✅ After major feature implementation (patterns added but not pruned)
- ✅ Monthly maintenance (periodic health check)
- ✅ Before major releases (clean up for next development cycle)
- ✅ When AI responses slow down (context overload)

**Don't compress during:**
- ❌ Active feature development (wait until stable)
- ❌ When tests are failing (fix tests first)
- ❌ During emergency hotfixes (focus on the fix)

---

## How to Use CLI

### 1. Check Status

```bash
npx aiknowsys check
```

**Output:**
```
✓ CODEBASE_ESSENTIALS.md exists
⚠️  ESSENTIALS: 1400 lines (recommended: <800)
⚠️  Verbose sections detected:
    • "Core Patterns" (350 lines)
    • "Common Gotchas" (280 lines)

💡 Run: npx aiknowsys compress-essentials --analyze
```

### 2. Analyze Opportunities (Preview)

```bash
npx aiknowsys compress-essentials --analyze
```

**Output:**
```
Analyzing CODEBASE_ESSENTIALS.md (1400 lines)...

Found 4 compression opportunities:

1. Section "API Patterns" (lines 120-210)
   - 90 lines of code examples
   - Recommend: Extract to docs/patterns/api-patterns.md
   - Keep in ESSENTIALS: Summary + link
   - Savings: ~75 lines

2. Section "Testing Patterns" (lines 350-480)
   - 130 lines of test examples
   - Recommend: Extract to docs/patterns/testing-patterns.md
   - Keep in ESSENTIALS: Core principles + link
   - Savings: ~110 lines

3. Section "Database Queries" (lines 650-780)
   - Verbose Prisma examples (60+ lines)
   - Recommend: Extract to docs/patterns/database.md
   - Savings: ~50 lines

4. Section "Deployment" (lines 1100-1200)
   - Historical deployment decisions (deprecated)
   - Recommend: Move to .aiknowsys/learned/deployment-history.md
   - Savings: ~100 lines

Total potential reduction: 335 lines (1400 → 1065)

Run with --interactive to compress step-by-step
Run with --auto to compress automatically
```

### 3. Auto Mode (Recommended)

```bash
npx aiknowsys compress-essentials --auto
```

**What it does:**
1. Detects verbose sections automatically
2. Creates files in `docs/patterns/` for each section
3. Moves content to new files
4. Updates ESSENTIALS with summary + link
5. Validates all links work
6. Shows before/after comparison

**Output:**
```
✓ Extracted "API Patterns" → docs/patterns/api-patterns.md
✓ Extracted "Testing Patterns" → docs/patterns/testing-patterns.md
✓ Extracted "Database Queries" → docs/patterns/database.md
✓ Moved "Deployment" → .aiknowsys/learned/deployment-history.md
✓ Updated ESSENTIALS with links
✓ Validated all references

ESSENTIALS compressed: 1400 → 720 lines (-680 lines)

Next steps:
  1. Review changes: git diff CODEBASE_ESSENTIALS.md
  2. Check extracted files: ls docs/patterns/
  3. Run tests: npm test
  4. Commit: git add . && git commit -m "Compress ESSENTIALS"
```

**Safe by design:**
- Never deletes content (only moves)
- Git tracks everything (easy rollback)
- Creates backups before modifying
- Validates links after extraction

### 4. Interactive Mode (Manual Control)

```bash
npx aiknowsys compress-essentials --interactive
```

**Workflow:**
```
Analyzing CODEBASE_ESSENTIALS.md...

Found section "API Patterns" (90 lines)

Extract to docs/patterns/api-patterns.md?
  [y] Yes, extract
  [n] No, skip
  [e] Edit destination path
  [p] Preview extraction
  [q] Quit

> y

✓ Extracted to docs/patterns/api-patterns.md

What to keep in ESSENTIALS?
  [s] Summary paragraph + link (recommended)
  [n] Just link
  [c] Custom (manual edit)

> s

✓ Updated ESSENTIALS with summary

Next section "Testing Patterns" (130 lines)...
```

**Use when:**
- First time compressing (learn the process)
- Want to review each extraction
- Custom extraction destinations needed
- Unsure about auto mode

---

## Manual Extraction Patterns

If you prefer manual extraction or the CLI doesn't catch something:

### Pattern 1: Extract Verbose Example

**Before (ESSENTIALS):**
```markdown
### API Calls

We use Axios with interceptors for all API calls.

**Standard pattern:**
```javascript
// 60+ line example showing every detail...
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ... 40 more lines ...
```
```

**After (ESSENTIALS):**
```markdown
### API Calls

We use Axios with interceptors for authentication and error handling.

**Quick reference:**
```javascript
// Create instance with auth interceptor
const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});
```

**See:** [docs/patterns/api-patterns.md](docs/patterns/api-patterns.md) for complete implementation.
```

**New file (docs/patterns/api-patterns.md):**
```markdown
# API Patterns

Complete Axios setup with interceptors, error handling, and retry logic.

[Full verbose example here...]
```

### Pattern 2: Move Historical Context

**Before (ESSENTIALS):**
```markdown
### Deployment

We tried Vercel, then Netlify, then settled on Railway because...
[200 lines of historical decisions and migration stories]
```

**After (ESSENTIALS):**
```markdown
### Deployment

We deploy to Railway with automatic preview deployments on PRs.

**Commands:**
- Production: `npm run deploy`
- Preview: Automatic on PR push

**See:** [.aiknowsys/learned/deployment-history.md](.aiknowsys/learned/deployment-history.md) for migration history.
```

**New file (.aiknowsys/learned/deployment-history.md):**
```markdown
# Deployment History

## Why Railway? (Feb 2024)

We evaluated 3 platforms:
[Historical context, lessons learned...]
```

### Pattern 3: Extract to Stack-Specific Docs

For fullstack projects with separate backend/frontend:

**Extract backend patterns:**
- `docs/backend/api-design.md`
- `docs/backend/database-patterns.md`
- `docs/backend/auth.md`

**Extract frontend patterns:**
- `docs/frontend/component-structure.md`
- `docs/frontend/state-management.md`
- `docs/frontend/routing.md`

**Keep in ESSENTIALS:** One-paragraph summaries + links

---

## File Organization

### Recommended Structure

```
docs/
├── patterns/               # Extracted code patterns
│   ├── api-patterns.md
│   ├── testing-patterns.md
│   ├── database.md
│   └── error-handling.md
├── backend/               # Backend-specific (if fullstack)
│   ├── api-design.md
│   └── database-patterns.md
├── frontend/              # Frontend-specific (if fullstack)
│   ├── components.md
│   └── state-management.md
└── troubleshooting/       # Common gotchas with solutions
    ├── env-vars.md
    └── build-errors.md

.aiknowsys/
└── learned/              # Historical context
    ├── deployment-history.md
    ├── migration-2024.md
    └── deprecated-patterns.md
```

### Naming Conventions

**For patterns:** `docs/patterns/[topic]-patterns.md`
- `api-patterns.md`
- `testing-patterns.md`
- `auth-patterns.md`

**For historical:** `.aiknowsys/learned/[topic]-history.md`
- `deployment-history.md`
- `migration-history.md`

**For gotchas:** `docs/troubleshooting/[issue].md`
- `env-vars.md`
- `type-errors.md`

---

## Prevention Strategies

### 1. Template Hints (Built-in)

AIKnowSys templates include HTML comments that guide AI:

```markdown
## Core Patterns

<!-- 
  AI GUIDANCE: Keep code examples concise (under 15 lines each)
  For verbose examples, create separate docs/patterns/*.md files
  Focus on WHAT and WHY, not exhaustive HOW
-->

### Your Pattern Here
```

**How it works:**
- AI assistants see these comments as instructions
- Encourages concise examples during initial fill
- Invisible to users (HTML comments don't render)

### 2. Post-Init Check (Automatic)

After running `npx aiknowsys init`, automatic check warns if bloated:

```bash
npx aiknowsys init
# ... setup completes ...

⚠️  Post-init check: ESSENTIALS is larger than recommended
   Current: 1200 lines (recommended: <800)

💡 Compress before committing:
   npx aiknowsys compress-essentials --analyze
```

**Catches bloat before first commit.**

### 3. Monthly Maintenance

Add to your workflow:

```bash
# Monthly health check (add to calendar)
npx aiknowsys check
npx aiknowsys audit

# If bloated, compress
npx aiknowsys compress-essentials --analyze
```

**Best practice:** Check ESSENTIALS size during sprint planning or monthly retros.

### 4. Code Review Checklist

When reviewing PRs that modify ESSENTIALS:

- [ ] Does this add >50 lines? Consider extracting to docs/
- [ ] Are code examples <15 lines? If not, extract
- [ ] Is this historical context? Move to .aiknowsys/learned/
- [ ] Run `npx aiknowsys check` to verify size

---

## Common Scenarios

### Scenario 1: Fresh Install Bloat

**Situation:** Just ran `init`, AI filled ESSENTIALS with verbose examples.

**Solution:**
```bash
# Check size
npx aiknowsys check

# If >800 lines, compress before first commit
npx aiknowsys compress-essentials --auto

# Review changes
git diff CODEBASE_ESSENTIALS.md

# Commit compressed version
git add .
git commit -m "Initialize knowledge system (compressed)"
```

### Scenario 2: Growing Project

**Situation:** Project running for 6 months, patterns accumulated, now at 1400 lines.

**Solution:**
```bash
# Analyze what can be extracted
npx aiknowsys compress-essentials --analyze

# Use auto mode for standard extractions
npx aiknowsys compress-essentials --auto

# Review extracted files
ls docs/patterns/

# Validate tests still pass
npm test

# Commit
git add .
git commit -m "Compress ESSENTIALS: extract verbose patterns to docs/"
```

### Scenario 3: Pre-Release Cleanup

**Situation:** Preparing for v2.0 release, want clean documentation.

**Solution:**
```bash
# Full audit
npx aiknowsys audit

# Compress ESSENTIALS
npx aiknowsys compress-essentials --auto

# Archive old CHANGELOG entries (separate command)
# See: documentation-management skill

# Final validation
npx aiknowsys check
npm test

# Tag release
git tag v2.0.0
```

---

## Troubleshooting

### "Compression broke my links!"

**Cause:** References to extracted content not updated.

**Fix:**
```bash
# The CLI should update all internal links automatically
# But if you manually extracted, search for broken references:

grep -r "TODO\|FIXME" CODEBASE_ESSENTIALS.md
```

**Prevention:** Use `--auto` mode instead of manual extraction.

### "I extracted too much!"

**Cause:** Overly aggressive compression removed essential context.

**Fix:**
```bash
# Git tracks everything, easy rollback
git diff CODEBASE_ESSENTIALS.md

# If needed, restore from commit
git checkout HEAD~1 CODEBASE_ESSENTIALS.md

# Or cherry-pick content back from extracted files
```

**Prevention:** Use `--analyze` first to preview, or `--interactive` for control.

### "CLI not detecting verbose sections"

**Cause:** Thresholds might be too high for your project size.

**Fix:**
```bash
# Check current thresholds (hardcoded in CLI)
# Section threshold: 150 lines
# Total threshold: 800 lines

# Manual extraction: See "Manual Extraction Patterns" above
```

**Future:** Configurable thresholds per project (see roadmap).

---

## Best Practices

### ✅ Do

- **Extract code examples >15 lines** to docs/patterns/
- **Move historical context** to .aiknowsys/learned/
- **Keep summaries in ESSENTIALS** with links to details
- **Run `--analyze` before `--auto`** to preview changes
- **Commit extracted files** (they're valuable documentation)
- **Use template hints** when initially filling ESSENTIALS
- **Monthly health checks** with `npx aiknowsys check`

### ❌ Don't

- **Delete content** - Always extract/move, never delete
- **Remove critical invariants** - Keep all "must never violate" rules
- **Break links** - CLI updates references automatically
- **Compress during active work** - Wait for stable state
- **Skip testing** - Run `npm test` after compression
- **Ignore warnings** - Post-init check is there for a reason

---

## Related Resources

- **Learned Skill:** [.aiknowsys/learned/essentials-compression.md](.aiknowsys/learned/essentials-compression.md) - Detailed AI agent workflow
- **Documentation Management:** [.github/skills/documentation-management/SKILL.md](../.github/skills/documentation-management/SKILL.md) - Changelog archiving and doc organization
- **Source Code:** [lib/commands/compress-essentials.js](../lib/commands/compress-essentials.js) - CLI implementation
- **Parsing Logic:** [lib/parse-essentials.js](../lib/parse-essentials.js) - Section detection and thresholds

---

*Keep ESSENTIALS focused. Extract the rest. Maintain velocity.*
