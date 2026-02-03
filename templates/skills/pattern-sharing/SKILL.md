---
name: pattern-sharing
description: AI-assisted workflow for sharing personal patterns with the team. Detects valuable patterns, checks duplicates, and guides sharing decisions.
---

# Pattern Sharing Skill

## When to Use This Skill

**Trigger words:**
- "share pattern", "share this pattern", "share with team"
- "make this a team pattern", "this could help others"
- "team would benefit", "share my patterns"
- "what patterns can I share", "list my patterns"
- "end of session" (consider suggesting pattern sharing)

**Use this skill when:**
- You've created a pattern during the session that could help others
- User asks to share personal patterns with the team
- User wants to see what personal patterns they have
- Session ending and user has valuable unshared patterns
- User mentions team collaboration on patterns

---

## Prerequisites

**Before starting, ensure:**
- [ ] `.aiknowsys/personal/<username>/` directory exists (user's personal patterns)
- [ ] `.aiknowsys/learned/` directory exists (create if missing)
- [ ] Git is available (optional - for suggesting commits)

**Required knowledge:**
- Understanding of personal vs learned pattern distinction
- YAML frontmatter parsing
- File operations (read, write, move)
- Duplicate detection strategies

---

## Step-by-Step Workflow

### Step 1: Identify Pattern to Share

**Goal:** Determine which pattern(s) the user wants to share

**Scenario A: Agent suggests sharing (proactive)**

```markdown
Agent: "I noticed we're handling API rate limiting repeatedly. I've created 
a learned pattern: .aiknowsys/personal/<username>/api-rate-limiting.md

This seems valuable for the team (used 8 times today). Would you like me to 
share it with the team?"
```

**Actions:**
1. Mention pattern location clearly
2. Explain why valuable (usage count, problem solved, team benefit)
3. Ask for permission: "Would you like me to share this?"

**Scenario B: User requests sharing**

```markdown
User: "share my patterns" or "what patterns can I share?"
```

**Actions:**
1. Read `.aiknowsys/personal/<username>/` directory
2. List all `.md` files
3. For each pattern, extract:
   - Title (from frontmatter or first # heading)
   - Created date (from frontmatter or file stats)
   - Usage hints (if tracked in session files)
4. Present organized list:

```markdown
"You have 5 personal patterns:

HIGH VALUE (used frequently):
 • api-rate-limiting.md - Created Jan 15, used 12 times
 • error-recovery-strategy.md - Created Jan 20, used 8 times

RECENT (created within last week):
 • vue-composable-lifecycle.md - Created yesterday

EXPERIMENTAL (low usage):
 • temp-debugging-notes.md - Created today, used once
 • webgl-experiment.md - Created Jan 10, used once

Which would you like to share?"
```

**User responses:**
- "all of them" → Share all patterns
- "the high value ones" → Share first 2
- "just the api one" → Share single pattern
- "show me the api pattern first" → Display content before sharing

---

### Step 2: Check for Duplicates

**Goal:** Avoid creating duplicate patterns in learned/

**Actions:**
1. Read `.aiknowsys/learned/` directory
2. For each learned pattern:
   - Extract title
   - Extract keywords/tags (from frontmatter or content)
3. Compare with pattern to share:
   - **Exact title match** → Likely duplicate
   - **Similar keywords (>50% overlap)** → Possibly related
   - **Same problem domain** → Might be duplicate

**Duplicate detection logic:**

```javascript
function checkDuplicates(newPattern, learnedPatterns) {
  const newTitle = extractTitle(newPattern);
  const newKeywords = extractKeywords(newPattern);
  
  for (const learned of learnedPatterns) {
    const learnedTitle = extractTitle(learned);
    const learnedKeywords = extractKeywords(learned);
    
    // Exact title match
    if (titleSimilarity(newTitle, learnedTitle) > 0.8) {
      return { isDuplicate: true, pattern: learned, confidence: 'high' };
    }
    
    // Keyword overlap
    const overlap = keywordOverlap(newKeywords, learnedKeywords);
    if (overlap > 0.6) {
      return { isDuplicate: true, pattern: learned, confidence: 'medium' };
    }
  }
  
  return { isDuplicate: false };
}
```

**If unique pattern (no duplicates):**
- Proceed to Step 3 (Move Pattern)

**If duplicate found:**

```markdown
"Similar pattern exists: api-retry-strategy.md

Your pattern: API Rate Limiting
- Focuses on backoff algorithms
- Created Jan 15, 2026
- 150 lines

Existing team pattern: API Retry Strategy  
- Focuses on circuit breakers
- Created by jane-smith, Dec 2025
- 120 lines

These seem related but have different focuses. Would you like to:
1. **Merge them** - Combine both approaches into one comprehensive pattern
2. **Keep separate** - Different focus areas, both valuable
3. **Cancel** - Review manually and decide later
```

**User chooses:**
- **Merge** → Go to Step 5 (Merge Workflow)
- **Keep separate** → Proceed to Step 3 (still share, different name)
- **Cancel** → Abort sharing, let user decide later

---

### Step 3: Move Pattern to Learned

**Goal:** Transfer pattern from personal/ to learned/ directory

**File operations:**

```markdown
1. Read pattern content:
   - Source: `.aiknowsys/personal/<username>/<pattern-name>.md`

2. Update frontmatter:
   - Add `shared_by: <username>`
   - Add `shared_date: <YYYY-MM-DD>`
   - Preserve existing frontmatter (type, created, tags)

3. Write to learned:
   - Destination: `.aiknowsys/learned/<pattern-name>.md`

4. Handle original file (user preference):
   - **Default:** Delete from personal/ (pattern now belongs to team)
   - **Option:** Keep copy in personal/ (user's reference)
```

**Example frontmatter transformation:**

Before (personal/):
```yaml
---
type: error_resolution
created: 2026-01-15
tags: [api, rate-limiting, backoff]
---
```

After (learned/):
```yaml
---
type: error_resolution
created: 2026-01-15
shared_by: arno-paffen
shared_date: 2026-02-03
tags: [api, rate-limiting, backoff]
---
```

**Validation:**
```bash
# Verify file was written successfully
cat .aiknowsys/learned/<pattern-name>.md

# Confirm frontmatter is valid YAML
# Check that content is intact
# Verify no data loss from move operation
```

---

### Step 4: Confirm Success

**Goal:** Inform user of successful sharing

**Agent response:**

```markdown
"✅ Pattern shared successfully!

📁 Location: .aiknowsys/learned/api-rate-limiting.md
👥 Teammates will see it after pulling from git

💡 Tip: Consider committing this now:
   git add .aiknowsys/learned/api-rate-limiting.md
   git commit -m 'Add learned pattern: API Rate Limiting'
   
Would you like me to create a session note about this?"
```

**Optional: Update session file**

If session file exists (`.aiknowsys/sessions/<date>-session.md`):

```markdown
## Pattern Sharing (HH:MM)

**Shared:** api-rate-limiting.md  
**From:** personal/arno-paffen/  
**To:** learned/  
**Reason:** Frequently used (12 times), solves recurring API throttling issues

**Next steps:**
- Team members pull to see pattern
- Consider adding to docs if widely applicable
```

---

### Step 5: Handle Merge (If Duplicate Detected)

**Goal:** Intelligently combine two related patterns

**Actions if user chose "Merge":**

**5.1 Analyze Both Patterns**

```markdown
Reading both patterns...

YOUR PATTERN (api-rate-limiting.md):
- Section 1: Overview
- Section 2: Exponential Backoff Algorithm
- Section 3: Implementation in Python
- Section 4: Testing Strategy
- Unique content: 80% (algorithms, Python code)

TEAM PATTERN (api-retry-strategy.md):
- Section 1: Problem Description
- Section 2: Circuit Breaker Pattern
- Section 3: Implementation in JavaScript
- Section 4: Monitoring
- Unique content: 70% (circuit breakers, JS code)

OVERLAP: 30% (problem description, general concepts)
```

**5.2 Propose Merge Structure**

```markdown
"I can merge these patterns. Here's my proposal:

COMBINED PATTERN: API Retry & Rate Limiting Strategy

Structure:
1. **Overview** (merged from both)
2. **Problem Description** (from team pattern)
3. **Rate Limiting Strategies** (from your pattern)
   - Exponential Backoff Algorithm
   - Implementation in Python
4. **Circuit Breaker Pattern** (from team pattern)
   - Implementation in JavaScript
5. **Testing Strategy** (from your pattern)
6. **Monitoring** (from team pattern)
7. **Best Practices** (combined recommendations)

This creates a comprehensive guide covering both approaches.

Options:
- **Apply merge** - Save merged pattern to learned/
- **Show preview** - Display full merged content first
- **Cancel** - Keep patterns separate after all
```

**5.3 Execute Merge (if user approves)**

```markdown
1. Combine content sections intelligently:
   - Preserve all unique content
   - Merge overlapping sections (keep best explanations)
   - Maintain code examples from both languages
   
2. Update frontmatter:
   ---
   type: combined_pattern
   created: 2025-12-01  # From original team pattern
   updated: 2026-02-03
   authors: [jane-smith, arno-paffen]
   merged_from: [api-retry-strategy.md, api-rate-limiting.md]
   tags: [api, rate-limiting, circuit-breaker, retry, backoff]
   ---

3. Save merged version:
   - Destination: .aiknowsys/learned/api-retry-rate-limiting.md
   
4. Archive originals (optional):
   - Move to .aiknowsys/learned/archive/ (if user wants history)
   - Or delete (merged content preserves everything)
```

**5.4 Confirm Merge Success**

```markdown
"✅ Patterns merged successfully!

📁 New combined pattern: .aiknowsys/learned/api-retry-rate-limiting.md
👥 Authors: jane-smith, arno-paffen
📊 Size: 320 lines (was 150 + 120)

The merged pattern includes:
- Both Python and JavaScript implementations
- Backoff algorithms AND circuit breakers
- Comprehensive testing and monitoring guidance

Original patterns archived to learned/archive/ (if you need to reference them).

Would you like me to notify jane-smith about this merge?"
```

---

### Step 6: End-of-Session Suggestion (Optional)

**Goal:** Proactively suggest sharing valuable patterns before session ends

**Trigger:** User says "done", "that's all", or session timeout approaching

**Actions:**

```markdown
1. Check `.aiknowsys/personal/<username>/` for unshared patterns

2. Analyze each pattern:
   - How many times referenced in current session?
   - How recently created?
   - File size (larger = more invested)
   - Keywords suggest importance?

3. If 2+ valuable patterns exist, suggest:
```

**Example suggestion:**

```markdown
Agent: "Before we finish, I noticed you have 3 personal patterns that could 
benefit the team:

HIGH VALUE (used today):
 • api-rate-limiting.md - Used 8 times during debugging
 • error-recovery.md - Used 12 times in error handling

RECENT (created this week):
 • database-pooling.md - Created 3 days ago, solid implementation

These seem valuable. Would you like to share any before we wrap up?"
```

**User responses:**
- "yes, all of them" → Share all 3 (check duplicates for each)
- "just the high value ones" → Share first 2
- "not right now" → Skip, don't persist suggestion
- "remind me next session" → Add to session notes for next time

---

## Error Handling & Edge Cases

### Pattern Not Found

**User:** "share the database optimization pattern"

**Agent searches personal/, doesn't find match:**

```markdown
"I couldn't find 'database optimization' in your personal patterns.

Your personal patterns:
 • api-rate-limiting.md
 • error-recovery.md
 • vue-composable-lifecycle.md

Did you mean one of these? Or would you like to create a new pattern first?"
```

---

### No Personal Patterns

**User:** "share my patterns"

**Agent checks personal/ directory, it's empty:**

```markdown
"You don't have any personal patterns yet.

Personal patterns are created using the 'learn' workflow when you document 
solutions, workarounds, or discoveries during development.

Would you like to create a pattern now? I can help you document something 
from this session."
```

---

### Learned Directory Missing

**First time sharing in new project:**

```markdown
"The .aiknowsys/learned/ directory doesn't exist yet.

This is normal for new projects. I'll create it now and share your pattern."

[Create .aiknowsys/learned/]
[Create .aiknowsys/learned/README.md if needed]
[Proceed with sharing]
```

---

### Permission Issues

**File operations fail due to permissions:**

```markdown
"❌ I couldn't write to .aiknowsys/learned/ (permission denied).

This might happen if:
- Directory is read-only
- File is locked by another process
- Insufficient permissions

Try:
1. Check file permissions: ls -la .aiknowsys/learned/
2. Run: chmod +w .aiknowsys/learned/
3. Close any editors with the file open

Then try sharing again."
```

---

## Examples

### Example 1: Simple Share (No Duplicates)

**User:** "share the API retry pattern"

**Agent:**
1. Searches personal/arno-paffen/ for "api retry"
2. Finds: `api-retry-pattern.md`
3. Checks learned/ - no duplicates found
4. Updates frontmatter (adds shared_by, shared_date)
5. Moves to learned/api-retry-pattern.md
6. Deletes from personal/

**Output:**
```markdown
✅ Pattern shared successfully!

📁 Location: .aiknowsys/learned/api-retry-pattern.md
👥 Team will see it after pulling

Suggested commit:
  git add .aiknowsys/learned/api-retry-pattern.md
  git commit -m "Add learned pattern: API Retry Strategy"
```

---

### Example 2: Duplicate Detected - Keep Separate

**User:** "share the database pooling pattern"

**Agent:**
1. Finds: `personal/arno/database-pooling.md`
2. Checks learned/
3. Found: `learned/database-connection-pool.md` (similar!)
4. Compares content:
   - Title similarity: 75%
   - Keyword overlap: 60%
   - Focus: Both about DB connections

**Asks user:**
```markdown
"Similar pattern exists: database-connection-pool.md

Both patterns focus on database connection management, but:

YOUR pattern: Focuses on PostgreSQL connection pooling with pg-pool
TEAM pattern: Focuses on MySQL connection pooling with mysql2

These are related but different implementations. Options:
1. Merge (combine PostgreSQL + MySQL examples)
2. Keep separate (different databases deserve separate guides)
3. Cancel

What would you like to do?"
```

**User:** "keep separate"

**Agent:**
```markdown
"✅ Keeping patterns separate.

Your pattern will be shared as:
  .aiknowsys/learned/database-pooling-postgresql.md

(Added 'postgresql' to distinguish from existing MySQL pattern)

Team now has both PostgreSQL and MySQL pooling guides!"
```

---

### Example 3: Merge Two Patterns

**User:** "share the error handling pattern"

**Agent detects duplicate:**
```markdown
"Found similar pattern: error-recovery-strategy.md

Both patterns cover error handling, with ~70% overlap.

Would you like to merge them?"
```

**User:** "yes, merge"

**Agent:**
1. Reads both patterns completely
2. Identifies sections:
   - Unique to your pattern: Retry logic, Logging
   - Unique to team pattern: User notifications, Rollback
   - Overlapping: Basic error catching
3. Proposes merge structure
4. User approves
5. Creates merged pattern:

```markdown
✅ Patterns merged!

📁 New pattern: .aiknowsys/learned/error-handling-comprehensive.md
👥 Authors: arno-paffen, jane-smith
📊 Combined: 250 lines (was 120 + 150)

Includes:
- Error catching fundamentals (merged)
- Retry logic with backoff (from your pattern)
- User notification strategies (from team pattern)
- Logging best practices (from your pattern)
- Transaction rollback (from team pattern)

Original patterns archived to learned/archive/
```

---

### Example 4: Bulk Share with Filtering

**User:** "what should I share?"

**Agent:**
```markdown
"You have 7 personal patterns. Let me analyze which are most valuable:

🌟 HIGH PRIORITY (share recommended):
 • api-rate-limiting.md
   - Used 12 times this week
   - Solves recurring throttling issues
   - Well-documented with examples

 • error-recovery-strategy.md
   - Used 8 times today
   - Critical for production stability
   - Clear implementation steps

⭐ MEDIUM PRIORITY (consider sharing):
 • vue-composable-lifecycle.md
   - Created yesterday, still evolving
   - Good examples but might need refinement

 • database-query-optimization.md
   - Used 3 times last month
   - Valuable but less urgent

🔍 LOW PRIORITY (probably don't share yet):
 • temp-debugging-notes.md
   - Used once, seems temporary
   - Might be session-specific

 • experiment-webgl-shaders.md
   - Experimental code, not finalized

 • wip-authentication-flow.md
   - Work in progress (has TODO markers)

Recommendation: Share the 2 high-priority patterns now, and maybe the Vue 
composable one if you've refined it.

What would you like to do?"
```

**User:** "share high priority ones"

**Agent:**
1. Shares api-rate-limiting.md (checks duplicates → none)
2. Shares error-recovery-strategy.md (checks duplicates → none)

**Output:**
```markdown
✅ Shared 2 high-priority patterns!

📁 New team patterns:
  - .aiknowsys/learned/api-rate-limiting.md
  - .aiknowsys/learned/error-recovery-strategy.md

Teammates will see these after pulling. Consider committing:
  git add .aiknowsys/learned/*.md
  git commit -m "Add 2 learned patterns: API rate limiting, Error recovery"
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to Check Duplicates

**Problem:** Agent shares pattern without checking learned/, creating duplicate

**Symptom:** Team has two nearly identical patterns with different names

**Solution:**
- **ALWAYS** run duplicate check before moving pattern
- Even if user says "definitely unique", check anyway
- False positives are better than duplicates

**Example:**
```javascript
// ❌ Wrong - Skip duplicate check
async function sharePattern(patternName) {
  moveToLearned(patternName);
}

// ✅ Correct - Always check first
async function sharePattern(patternName) {
  const duplicates = await checkDuplicates(patternName);
  if (duplicates.found) {
    askUserWhatToDo(duplicates);
  } else {
    moveToLearned(patternName);
  }
}
```

---

### Pitfall 2: Losing Data During Move

**Problem:** Delete source file before verifying write succeeded

**Symptom:** Pattern disappears from both personal/ and learned/

**Solution:**
- Write to learned/ first
- Verify file exists and content is intact
- THEN delete from personal/
- Or better: Copy instead of move (keep personal backup)

**Example:**
```javascript
// ❌ Wrong - Delete before verifying write
await fs.unlink(personalPath);
await fs.writeFile(learnedPath, content);

// ✅ Correct - Verify write, then delete
await fs.writeFile(learnedPath, content);
const written = await fs.readFile(learnedPath, 'utf-8');
if (written === content) {
  await fs.unlink(personalPath); // Safe to delete now
}
```

---

### Pitfall 3: Poor Merge Quality

**Problem:** Merge creates confusing pattern with duplicate sections

**Symptom:** Merged pattern harder to read than originals

**Solution:**
- Identify truly unique content (don't duplicate)
- Merge overlapping sections (keep better explanation)
- Organize sections logically
- Preview merge before applying

**Example:**
```markdown
❌ Wrong - Just concatenate both patterns:
# Error Handling
(Content from pattern 1)
# Error Handling
(Content from pattern 2)  # Duplicate section!

✅ Correct - Intelligent merge:
# Error Handling
(Combined best explanations from both)
## Retry Logic (from pattern 1)
## User Notifications (from pattern 2)
```

---

## Rollback Procedure

**If sharing goes wrong:**

1. **Restore from personal/ (if still exists):**
   ```bash
   # If move failed but personal copy still there
   # Just verify learned/ version
   cat .aiknowsys/learned/<pattern>.md
   ```

2. **Restore from git (if committed):**
   ```bash
   # Undo last commit
   git reset HEAD~1
   
   # Or restore specific file
   git checkout HEAD~1 -- .aiknowsys/learned/<pattern>.md
   ```

3. **Restore from backup (if kept):**
   ```bash
   # Copy back from personal backup
   cp .aiknowsys/personal/<user>/<pattern>.md .aiknowsys/learned/
   ```

**Verification after rollback:**
```bash
# Check pattern still in personal/
ls -la .aiknowsys/personal/<user>/

# Verify learned/ doesn't have broken version
cat .aiknowsys/learned/<pattern>.md
```

---

## References

**Related documentation:**
- [.aiknowsys/learned/ README](.aiknowsys/learned/README.md) - Team pattern index
- [PLAN_pattern_sharing_skill.md](../../.aiknowsys/PLAN_pattern_sharing_skill.md) - Implementation plan

**Related skills:**
- [continuous-learning](../continuous-learning/SKILL.md) - Creating patterns
- [ai-friendly-documentation](../ai-friendly-documentation/SKILL.md) - Writing discoverable patterns

**External resources:**
- YAML frontmatter syntax
- File system operations best practices
- Git workflow for shared knowledge

---

*Part of AIKnowSys multi-developer collaboration system. Enables team knowledge sharing through AI-assisted pattern distribution.*
