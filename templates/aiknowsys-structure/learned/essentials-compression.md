# Learned Skill: ESSENTIALS Compression Workflow

**Pattern Type:** project_specific  
**Created:** January 31, 2026  
**Discovered During:** Phase 3 ESSENTIALS Compression System implementation  
**Trigger Words:** "ESSENTIALS bloat", "compress essentials", "file too large", "CODEBASE_ESSENTIALS", "extract verbose", "docs/patterns", "essentials compression"

## When to Use

Use ESSENTIALS compression when:
- CODEBASE_ESSENTIALS.md exceeds 800 lines (warning threshold)
- CODEBASE_ESSENTIALS.md exceeds 1500 lines (critical threshold)
- Individual sections exceed 150 lines with code examples
- User mentions "ESSENTIALS is too large" or "slow to load"
- Fresh init/migrate results in bloated ESSENTIALS
- AI context warnings about token limits

## Problem

**Symptoms:**
- ESSENTIALS file grows beyond recommended 600-800 lines
- Sections contain verbose code examples (>150 lines)
- Historical patterns accumulate without pruning
- AI takes longer to load context (more tokens)
- Harder to navigate and maintain
- Signal-to-noise ratio drops

**Root Causes:**
1. **Fresh install bloat:** AI fills TODOs with verbose examples during `init`
2. **Running system growth:** Patterns accumulate over 3-6 months without cleanup
3. **No compression awareness:** Users don't know when/how to compress

## Detection Workflow

### Step 1: Check ESSENTIALS Size

```bash
# Run check command (includes ESSENTIALS bloat detection)
npx aiknowsys check

# Output if bloated:
# ⚠️  CODEBASE_ESSENTIALS.md: 1400 lines (recommended: <800)
# ⚠️  Section "API Patterns" is 250 lines (recommended: <150)
```

**Thresholds (from `lib/parse-essentials.js`):**
- `TOTAL_WARN: 800` - Warn when file exceeds this line count
- `TOTAL_ERROR: 1500` - Error when file critically bloated
- `SECTION_VERBOSE: 150` - Lines before section considered verbose
- `SECTION_CODE_BLOCK: 100` - Lines threshold for sections with code blocks

### Step 2: Analyze Compression Opportunities

```bash
# Dry-run analysis (no changes made)
npx aiknowsys compress-essentials --analyze

# Output:
# Found 3 compression opportunities:
# 
# 1. Section "API Examples" (line 150-210)
#    - 60 lines with code blocks
#    - Recommend: Extract to docs/patterns/api-examples.md
#    - Savings: ~42 lines (70% reduction)
# 
# 2. Section "Testing Patterns" (line 320-400)
#    - 80 lines with test examples
#    - Recommend: Extract to docs/patterns/testing-patterns.md
#    - Savings: ~56 lines (70% reduction)
#
# Total potential reduction: 98 lines (1400 → 1302)
```

## Extraction Patterns

### What to Extract

**Extract to `docs/patterns/`:**
- ✅ Verbose code examples (>150 lines)
- ✅ Detailed implementation guides
- ✅ Framework-specific patterns
- ✅ Step-by-step tutorials
- ✅ Multiple code blocks with explanations

**Keep in ESSENTIALS:**
- ❌ Critical invariants (< 20 lines)
- ❌ Quick reference patterns
- ❌ Project structure overview
- ❌ Validation commands
- ❌ Technology snapshot

**Extract to `.aiknowsys/learned/`:**
- ✅ Historical context (deprecated patterns)
- ✅ Evolution explanations
- ✅ One-time decisions
- ✅ Legacy workarounds

### How Extraction Works

**Automated Process:**
1. **Identify verbose sections:** Sections >150 lines with code blocks
2. **Create extracted file:** `docs/patterns/section-name.md`
3. **Replace in ESSENTIALS:** Summary + link to extracted file
4. **Preserve content:** Nothing deleted, all moved to extracted files

**File Structure After Extraction:**
```
docs/
  patterns/
    api-examples.md          # Extracted: Full verbose content
    testing-patterns.md      # Extracted: Full verbose content
CODEBASE_ESSENTIALS.md       # Updated: Summaries + links
```

**ESSENTIALS After Extraction:**
```markdown
## API Examples

Brief overview of API patterns including REST endpoints, error handling, 
and authentication flows.

**[See detailed API examples documentation →](docs/patterns/api-examples.md)**
```

## CLI Commands

### Analysis Mode (Recommended First Step)

```bash
# Analyze without making changes
npx aiknowsys compress-essentials --analyze

# Shows:
# - Sections that exceed thresholds
# - Estimated savings
# - Recommended actions
# - No files modified
```

**When to use:** Always run first to preview what will be extracted

### Auto Mode (AI Agents / Non-Interactive)

```bash
# Automatic extraction (no prompts)
npx aiknowsys compress-essentials --auto

# Silent mode for scripts
npx aiknowsys compress-essentials --auto --silent
```

**When to use:**
- AI agents performing automated maintenance
- CI/CD pipelines checking for bloat
- Batch processing multiple projects
- When recommendations are clear and trusted

**What it does:**
- Automatically extracts all verbose sections (>150 lines with code)
- Creates `docs/patterns/` directory if needed
- Updates ESSENTIALS with summaries + links
- Reports results (files created, lines saved)

### Manual Mode (Future: Phase 3.4)

```bash
# Interactive prompts (coming in Phase 3.4)
npx aiknowsys compress-essentials --interactive

# Will show:
# - Preview of each section
# - Before/after comparison
# - Confirmation for each extraction
```

**When to use:** When you want control over what gets extracted

## Prevention Tips

### During Fresh Install

**Problem:** AI fills TODOs with verbose examples during `init` or `migrate`

**Solution:**
```markdown
When filling CODEBASE_ESSENTIALS.md TODOs:
1. Keep code examples under 15 lines
2. Use "See docs/X for detailed examples" instead of embedding
3. Focus on patterns, not exhaustive documentation
4. Run `npx aiknowsys check` after filling
```

**Template Hints:**
```markdown
<!-- AI: Keep examples brief (<15 lines). Extract verbose details to docs/ -->
{{TESTING_PATTERNS}}
<!-- End: Focus on patterns, not exhaustive examples -->
```

### During Development

**Problem:** Patterns accumulate over 3-6 months without cleanup

**Solution:**
- Run `npx aiknowsys check` monthly
- When adding new patterns, check if old ones can be extracted
- Keep ESSENTIALS focused on **current** patterns
- Move deprecated/historical patterns to `.aiknowsys/learned/`

## Common Scenarios

### Scenario 1: Fresh Init Resulted in Bloat

```bash
# After completing init TODOs
npx aiknowsys init
# ... AI fills ESSENTIALS with verbose examples ...

# Check immediately
npx aiknowsys check
# ⚠️  CODEBASE_ESSENTIALS.md: 1200 lines (recommended: <800)

# Compress before first commit
npx aiknowsys compress-essentials --analyze  # Preview
npx aiknowsys compress-essentials --auto     # Execute
git add .
git commit -m "chore: compress ESSENTIALS after init"
```

### Scenario 2: Running Project Maintenance

```bash
# Periodic check (every 1-3 months)
npx aiknowsys check

# If bloated, analyze
npx aiknowsys compress-essentials --analyze

# Review recommendations, then compress
npx aiknowsys compress-essentials --auto
```

### Scenario 3: AI Context Limits Hit

```bash
# When AI complains about context size
# 1. Check ESSENTIALS
npx aiknowsys check

# 2. Compress to reduce tokens
npx aiknowsys compress-essentials --auto

# 3. Verify reduction
npx aiknowsys check
# ✅ CODEBASE_ESSENTIALS.md: 720 lines
```

## Key Principles

1. **ESSENTIALS is for patterns, not documentation:**
   - Keep it focused on "what" and "why"
   - Extract "how" (detailed examples) to `docs/`

2. **Compression is lossless:**
   - Nothing is deleted, only moved
   - All content preserved in extracted files
   - Links maintain discoverability

3. **Automate detection, not always extraction:**
   - `check` command warns automatically
   - `--analyze` previews before acting
   - `--auto` trusts AI judgment for clear cases

4. **Prevention > Cure:**
   - Write concisely during init
   - Regular maintenance prevents critical bloat
   - Template hints guide AI to be brief

## Technical Implementation

**Command:** `lib/commands/compress-essentials.js`

**Shared Utilities:**
- `lib/parse-essentials.js` - Section parsing logic
- `COMPRESSION_THRESHOLDS` - Centralized threshold constants

**Detection Logic:**
```javascript
// Identifies verbose sections
function findVerboseSections(sections) {
  return sections.filter(section => {
    // Must exceed verbose threshold
    if (section.lines <= COMPRESSION_THRESHOLDS.SECTION_VERBOSE) return false;
    
    // Must have code blocks (verbose examples worth extracting)
    const codeBlockCount = (section.content.match(/```/g) || []).length / 2;
    return codeBlockCount > 0 && section.lines > COMPRESSION_THRESHOLDS.SECTION_CODE_BLOCK;
  });
}
```

**Replacement Strategy:**
- Position-based (not string matching) for robustness
- Processes replacements in reverse order (maintains line accuracy)
- Handles multiple sections without interference

## Related Files

- [lib/commands/compress-essentials.js](../lib/commands/compress-essentials.js) - Compression command
- [lib/commands/check.js](../lib/commands/check.js) - Bloat detection
- [lib/parse-essentials.js](../lib/parse-essentials.js) - Shared parsing utilities
- [test/compress-essentials.test.js](../test/compress-essentials.test.js) - Comprehensive tests

## Examples

### Before Compression (1400 lines)

```markdown
## API Patterns

Our API follows RESTful conventions with the following endpoints:

**Authentication:**
```javascript
// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // ... 50 more lines of example code ...
});

// Register endpoint  
app.post('/api/auth/register', async (req, res) => {
  // ... 50 more lines ...
});
```

**CRUD Operations:**
```javascript
// ... 100 more lines of CRUD examples ...
```
```

### After Compression (720 lines)

**ESSENTIALS:**
```markdown
## API Patterns

Our API follows RESTful conventions with authentication, CRUD operations, 
and error handling. Core patterns include JWT tokens, validation middleware, 
and standardized error responses.

**[See detailed API patterns documentation →](docs/patterns/api-patterns.md)**
```

**Extracted File (`docs/patterns/api-patterns.md`):**
```markdown
# API Patterns

## Authentication

**Login Endpoint:**
```javascript
app.post('/api/auth/login', async (req, res) => {
  // ... full 50-line example preserved ...
});
```

## CRUD Operations

**Create Resource:**
```javascript
// ... full 100-line CRUD examples preserved ...
```
```

---

*This skill helps maintain lean, focused ESSENTIALS files while preserving all documentation in organized extracted files.*
