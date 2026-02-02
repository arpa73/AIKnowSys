# Implementation Plan: VSCode Hooks Phase 5 (Context & Learning)

**Status:** 📋 PLANNED  
**Created:** 2026-01-31  
**Goal:** Enhanced context preservation and automatic pattern learning

---

## Overview

Make the system learn from experience and preserve context better between sessions. Auto-extract learned skills from repeated patterns and provide richer session summaries.

**What we're building:**
1. **Enhanced session summaries** - Auto-generate rich context at sessionEnd
2. **Error pattern learning** - Detect repeated errors and create learned skills
3. **Pattern extraction assistant** - Recommend when to document patterns
4. **Conversation insights** - Analyze session for key decisions and learnings

**Why it matters:**
- Better session continuity (AI picks up where it left off)
- System gets smarter over time (learns from mistakes)
- Institutional knowledge captured automatically
- Reduces repeated explanations and errors

---

## Requirements

### Functional Requirements
- ✅ Auto-generate session summaries with file changes, decisions, next steps
- ✅ Detect repeated error patterns (same error fixed >2 times)
- ✅ Auto-create learned skill files from detected patterns
- ✅ Recommend pattern extraction based on conversation analysis
- ✅ Track pattern frequency and recency
- ✅ Link errors to documentation and skills
- ✅ Non-blocking (suggestions only)

### Non-Functional Requirements
- Zero external dependencies (Node.js built-ins only)
- Fast execution (<3 seconds for sessionEnd, <2s for others)
- Comprehensive test coverage (30+ tests)
- Privacy-conscious (no external API calls)
- Configurable pattern thresholds

---

## Implementation Steps (15 Steps)

### Step 1: Write context preservation tests (TDD RED)
**File:** `test/context-learning.test.js`

Test auto-summary generation, pattern detection, skill extraction

---

### Step 2: Implement session summarizer
**File:** `lib/context/session-summarizer.js`

Auto-generate rich session summaries:
```javascript
export async function generateSessionSummary(conversationData) {
  return {
    filesModified: extractFileChanges(conversationData),
    commandsRun: extractCommands(conversationData),
    decisionsNoted: extractDecisions(conversationData),
    patternsDiscovered: extractPatterns(conversationData),
    nextSteps: inferNextSteps(conversationData),
    duration: calculateSessionDuration(conversationData)
  };
}
```

---

### Step 3: Implement error pattern detector
**File:** `lib/context/pattern-detector.js`

Detect repeated error patterns:
```javascript
export async function detectPatterns(targetDir) {
  const sessionHistory = await loadRecentSessions(targetDir, 30); // Last 30 days
  const errorPatterns = extractErrorPatterns(sessionHistory);
  
  // Find patterns that repeat >2 times
  const repeatedPatterns = errorPatterns.filter(p => p.frequency >= 3);
  
  return repeatedPatterns.map(pattern => ({
    error: pattern.error,
    frequency: pattern.frequency,
    lastSeen: pattern.lastSeen,
    resolution: pattern.commonResolution,
    shouldDocument: pattern.frequency >= 3
  }));
}
```

---

### Step 4: Implement learned skill creator
**File:** `lib/context/skill-creator.js`

Auto-create learned skills from patterns:
```javascript
export async function createLearnedSkill(pattern, targetDir) {
  const skillPath = path.join(
    targetDir, 
    '.aiknowsys', 
    'learned', 
    `${slugify(pattern.error)}.md`
  );
  
  const skillContent = generateSkillTemplate({
    name: pattern.error,
    description: `Pattern discovered from ${pattern.frequency} occurrences`,
    triggerWords: pattern.keywords,
    resolution: pattern.resolution,
    examples: pattern.examples,
    relatedSkills: pattern.relatedSkills
  });
  
  await fs.writeFile(skillPath, skillContent, 'utf-8');
  return skillPath;
}
```

---

### Step 5: Update session-end hook
**File:** `templates/hooks/session-end.js` → `.cjs`

Enhanced with auto-summary:
```javascript
// Generate rich summary
const summary = await generateSessionSummary(hookData);

// Detect patterns
const patterns = await detectPatterns('.');

// Update session file
const sessionContent = `
# Session: ${summary.title}

## Auto-Generated Summary
- **Files modified:** ${summary.filesModified.length}
- **Commands run:** ${summary.commandsRun.join(', ')}
- **Duration:** ${summary.duration}

## Key Decisions
${summary.decisionsNoted.map(d => `- ${d}`).join('\n')}

## Patterns Discovered
${patterns.map(p => `- ${p.error} (seen ${p.frequency} times)`).join('\n')}

## Next Steps
${summary.nextSteps.map(s => `- [ ] ${s}`).join('\n')}
`;

await appendToSessionFile(sessionPath, sessionContent);
```

---

### Step 6: Create pattern-learning hook
**File:** `templates/hooks/pattern-learning.cjs`

Stop hook that learns from errors:
```javascript
// Detect if error was fixed in this session
const errorResolved = detectErrorResolution(data);

if (errorResolved) {
  // Check pattern history
  const pattern = await findPattern(errorResolved.error);
  
  if (pattern && pattern.frequency >= 2 && !pattern.documented) {
    console.error('[Hook] 💡 Learning Opportunity');
    console.error(`[Hook] Error "${pattern.error}" fixed ${pattern.frequency} times`);
    console.error('[Hook] Recommend creating learned skill');
    console.error('[Hook] Run: node bin/cli.js learn extract --pattern "' + pattern.error + '"');
  }
}
```

---

### Step 7: Create learn command
**File:** `lib/commands/learn.js`

Manage pattern learning:
```bash
# Extract pattern to learned skill
aiknowsys learn extract --pattern "chalk import error"

# List detected patterns
aiknowsys learn list

# Auto-create skills for all high-frequency patterns
aiknowsys learn auto --threshold 3
```

---

### Step 8: Pattern tracking database
**File:** `.aiknowsys/pattern-history.json`

Track pattern frequency:
```json
{
  "patterns": [
    {
      "id": "chalk-import-error",
      "error": "Cannot find module 'chalk'",
      "frequency": 3,
      "firstSeen": "2026-01-15",
      "lastSeen": "2026-01-30",
      "documented": false,
      "resolutions": [
        "Use dynamic import: await import('chalk')",
        "Add to package.json as ESM"
      ]
    }
  ]
}
```

---

### Steps 9-15: Integration, testing, documentation

Similar structure to previous phases.

---

## Success Criteria

- [ ] Session summaries auto-generated with 90%+ accuracy
- [ ] Error patterns detected after 2-3 occurrences
- [ ] Learned skills created with proper format
- [ ] Pattern tracking persists across sessions
- [ ] learn command extracts patterns on demand
- [ ] 415+ tests passing (30+ new Phase 5 tests)

---

## Notes

**Intelligence Evolution:**
Session 1: Error fixed manually
Session 2: Same error, AI notices but no action
Session 3: Same error, system suggests documenting
Session 4+: AI reads learned skill automatically

**The system teaches itself over time.**
