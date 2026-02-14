# Implementation Plan: UX Improvements (Clipboard + TDD Visibility)

**Status:** ✅ COMPLETE  
**Created:** 2026-01-30  
**Completed:** 2026-02-01  
**Source:** Real-world testing feedback (styleguide project)  
**Goal:** Make AI prompt easy to use and show TDD status during init

## Overview

User tested `aiknowsys init --yes` on a styleguide project and found two UX issues:
1. **AI prompt is hard to copy** - 50+ lines of terminal text, manual selection error-prone
2. **TDD enforcement happens silently** - User doesn't know it's enabled

This plan adds clipboard auto-copy and visible TDD confirmation.

## Requirements

**Functional:**
- Auto-copy AI prompt to clipboard when displayed
- Show TDD status when using --yes flag
- Graceful fallback when clipboard unavailable (WSL, headless, etc.)

**Non-functional:**
- No breaking changes to existing API
- Cross-platform compatibility (macOS, Linux, Windows)
- Silent mode still works (_silent flag)

## Architecture Changes

| File | Change | Reason |
|------|--------|--------|
| [package.json](package.json#L47) | Add `clipboardy@^4.0.0` | Enable clipboard support |
| [lib/utils.js](lib/utils.js#L221) | Make `displayAIPrompt()` async | Await clipboard write |
| [lib/commands/init/display.js](lib/commands/init/display.js#L86) | Make `displayAIBootstrapPrompt()` async | Call async displayAIPrompt |
| [lib/commands/init.js](lib/commands/init.js#L372) | Add TDD status output | User visibility |

## Implementation Steps

### Phase 1: Dependencies & Utils (Foundation)

#### 1. Add Clipboardy Dependency
**File:** `package.json`  
**Action:** Add `"clipboardy": "^4.0.0"` to dependencies  
**Why:** Enable cross-platform clipboard support  
**Risk:** Low - 4KB package, well-maintained  
**TDD:** Not applicable (dependency)

#### 2. Update displayAIPrompt to Use Clipboard
**File:** `lib/utils.js` line 221  
**Action:**
```javascript
export async function displayAIPrompt(log, promptLines) {
  const promptText = promptLines.join('\n');
  
  // Try to copy to clipboard
  let copiedToClipboard = false;
  try {
    const clipboardy = await import('clipboardy');
    await clipboardy.default.write(promptText);
    copiedToClipboard = true;
  } catch (err) {
    // Clipboard not available - that's ok
  }
  
  log.blank();
  log.log('\x1b[33m\x1b[1m🤖 AI Assistant Prompt:\x1b[0m');
  if (copiedToClipboard) {
    log.success('   ✅ Copied to clipboard! Just paste into your AI assistant.');
  } else {
    log.dim('   Copy this prompt to your AI assistant to complete setup:');
  }
  log.blank();
  
  for (const line of promptLines) {
    log.cyan(`   ${line}`);
  }
  
  log.blank();
}
```
**Why:** Auto-copy improves UX, fallback ensures it works everywhere  
**Dependencies:** Requires step 1  
**Risk:** Low - graceful fallback  
**TDD:** Manual test (clipboard is OS API)

### Phase 2: Display Module Updates (Plumbing)

#### 3. Make displayAIBootstrapPrompt Async
**File:** `lib/commands/init/display.js` line 86  
**Action:** `export async function displayAIBootstrapPrompt(...)`  
**Why:** Needs to await displayAIPrompt  
**Dependencies:** Requires step 2  
**Risk:** Low - signature change  
**TDD:** Not required (refactor)

#### 4. Await displayAIPrompt Call
**File:** `lib/commands/init/display.js` (inside displayAIBootstrapPrompt)  
**Action:** `await displayAIPrompt(log, promptLines);`  
**Why:** displayAIPrompt is now async  
**Dependencies:** Requires step 3  
**Risk:** Low - straightforward  
**TDD:** Not required (refactor)

### Phase 3: TDD Visibility (User-Facing)

#### 5. Add TDD Status to --yes Output
**File:** `lib/commands/init.js` line 372  
**Action:**
```javascript
log.dim('Using AI-guided mode with defaults (--yes flag)');
log.dim('   • TDD enforcement: Enabled');
log.dim('   • Session persistence: Enabled');
log.blank();
```
**Why:** User needs to know what's being set up  
**Dependencies:** None  
**Risk:** Low - display only  
**TDD:** Not required (UI)

### Phase 4: Wire It All Together (Integration)

#### 6. Update Init Command Callers
**File:** `lib/commands/init.js`  
**Action:** Find all `displayAIBootstrapPrompt()` calls and add `await`  
**Why:** Function is now async  
**Dependencies:** Requires step 3  
**Risk:** Low  
**TDD:** Existing tests should pass

## Testing Strategy

**Manual Testing Required:**

1. **Clipboard Success Case:**
   ```bash
   npm install            # Install clipboardy
   cd /tmp && mkdir test-init && cd test-init
   aiknowsys init --yes
   # Verify: "✅ Copied to clipboard!" message
   # Verify: Can paste in editor
   # Verify: TDD status shown
   ```

2. **Clipboard Failure Case:**
   ```bash
   # Test in WSL/headless/Docker
   aiknowsys init --yes
   # Verify: Fallback message shown
   # Verify: Prompt still displayed
   # Verify: No crash
   ```

3. **Existing Test Suite:**
   ```bash
   npm test               # All tests must pass
   npm run lint           # No new lint errors
   ```

**Test Coverage:**
- Unit tests: Not practical for clipboard (OS API)
- Integration tests: init.test.js should still pass
- Manual validation: Required for clipboard UX

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Clipboardy fails in some environments | Medium | Low | Try-catch + graceful fallback |
| Async changes break tests | Medium | Medium | Run full test suite |
| Large prompts exceed clipboard limits | Low | Low | Try-catch handles automatically |

## Success Criteria

- [ ] `npm install` succeeds with clipboardy
- [ ] AI prompt auto-copied to clipboard
- [ ] Success message when copied
- [ ] Fallback message when clipboard unavailable
- [ ] TDD status visible in --yes output
- [ ] All existing tests pass (286/287)
- [ ] Manual testing confirms clipboard works
- [ ] CHANGELOG updated

## Notes for Developer

**Important:**
- Use dynamic `import('clipboardy')` not static import (ESM compatibility)
- Clipboardy may not work in Docker/CI - expected, fallback handles it
- Don't fail if clipboard write fails - degraded UX, not error
- Keep displaying prompt text even if copied (backup for user)

**Edge Cases:**
- Empty clipboard before write
- Very long prompts (2-5KB, should work)
- Non-interactive mode - silent flag

**Future Enhancement:**
- Skip clipboard in silent mode?
- Add --no-clipboard flag if issues arise
- Log clipboard failures in debug mode

---

**Status:** Ready for Developer Implementation  
**Next:** Hand off to @Developer with this plan

