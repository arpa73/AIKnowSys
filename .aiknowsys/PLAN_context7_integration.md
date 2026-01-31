# Implementation Plan: Context7 MCP Integration

**Status:** 📋 PLANNED  
**Created:** 2026-01-31  
**Goal:** Optional Context7 MCP integration for current documentation and API accuracy

---

## Overview

Integrate Context7 MCP to provide up-to-date, version-specific documentation during:
- Research and planning workflows
- Skill creation and validation
- Tech stack template generation
- Documentation updates

**What is Context7:**
- MCP (Model Context Protocol) server that fetches current library docs
- Prevents hallucinated APIs and outdated code examples
- Version-specific documentation (e.g., Next.js 14 vs 15)
- 44k+ GitHub stars, MIT licensed, community-driven
- Works with Cursor, Claude Code, and other MCP clients

**Why integrate:**
- ✅ Keeps skills current with latest APIs
- ✅ Prevents outdated patterns in learned skills
- ✅ Accurate tech stack scaffolding
- ✅ Validates documentation against current library versions
- ✅ Enhances Planner agent with real-time API knowledge

**Integration philosophy:**
- 100% optional (like VSCode hooks)
- Graceful degradation if unavailable
- No hard dependencies on external services
- Document-first approach (users can adopt immediately)

---

## Architecture Changes

### New Files to Create

**Documentation:**
- `docs/context7-integration.md` - Complete integration guide
- `docs/advanced-workflows.md` - Add Context7 section (if not exists)

**Skills:**
- `.github/skills/context7-usage/SKILL.md` - Best practices for using Context7
- `.github/skills/skill-validation/SKILL.md` - How to validate skills with Context7

**Optional CLI Enhancement (Future):**
- `lib/context7/` - Context7 integration utilities (if we add CLI support)
- `lib/commands/init/context7.js` - Optional Context7-powered scaffolding

---

## Implementation Steps

### Phase 1: Documentation & User Adoption (Quick Win)

#### Step 1: Create Context7 Integration Guide
**File:** `docs/context7-integration.md`

**Content outline:**
1. **What is Context7** - Brief overview
2. **Why use with AIKnowSys** - Use cases (planning, skills, templates)
3. **Installation** - How to install MCP in Cursor/Claude Code
4. **Configuration** - Recommended rules for auto-invocation
5. **Workflows:**
   - Using with Planner agent
   - Validating learned skills
   - Generating current tech stack templates
   - Keeping documentation up-to-date
6. **Best Practices** - When to use, when to skip
7. **Troubleshooting** - Common issues

**Why:** Users can adopt immediately without code changes

---

#### Step 2: Create Context7 Usage Skill
**File:** `.github/skills/context7-usage/SKILL.md`

**Trigger words:** `context7`, `current docs`, `latest API`, `version-specific`

**Content:**
- When to invoke Context7 (library/API questions)
- How to specify library IDs (e.g., `/vercel/next.js`)
- How to request specific versions
- Best practices for combining with aiknowsys workflows

**Why:** AI agents know when and how to use Context7 in aiknowsys projects

---

#### Step 3: Create Skill Validation Skill
**File:** `.github/skills/skill-validation/SKILL.md`

**Trigger words:** `validate skill`, `check skill accuracy`, `outdated API`

**Workflow:**
1. Review learned skill content
2. Identify library/framework references
3. Query Context7 for current documentation
4. Compare skill content with current APIs
5. Suggest updates if drift detected
6. Flag deprecated patterns

**Why:** Ensures learned skills stay current over time

---

#### Step 4: Update SETUP_GUIDE.md
**Section:** "Advanced Integrations" or "Optional Enhancements"

**Content to add:**
```markdown
### Context7 MCP (Optional)

**What:** Up-to-date library documentation for AI coding assistants

**Benefits:**
- Prevents outdated code in generated skills and templates
- Version-specific API accuracy
- Current best practices for scaffolding

**Setup:**
1. Install Context7 MCP: [Installation Guide](https://context7.com/docs/installation)
2. Configure auto-invocation rules: See [docs/context7-integration.md](docs/context7-integration.md)
3. Use with Planner for tech stack planning
4. Validate skills: `@context7 check if this skill references current APIs`

**See:** [Full Context7 Integration Guide](docs/context7-integration.md)
```

**Why:** Discoverable from main setup documentation

---

### Phase 2: CLI Integration (Optional Enhancement)

#### Step 5: Add --validate-context7 flag to learn command
**File:** `lib/commands/learn.js`

**New option:**
```javascript
// In extractPattern() and autoCreateSkills()
if (options.validateContext7) {
  // Check if pattern mentions a library
  // Query Context7 for current docs
  // Compare and warn if outdated
  // Suggest updated content
}
```

**CLI usage:**
```bash
node bin/cli.js learn extract "nextjs middleware" --validate-context7
# Output: ⚠️  Pattern references Next.js 12 middleware (outdated)
#         Current version: Next.js 15 (updated API)
#         Suggested: Update skill with current middleware API
```

**Why:** Automated validation during skill creation

---

#### Step 6: Add --with-context7 flag to init command
**File:** `lib/commands/init/index.js`

**New workflow:**
```javascript
if (answers.useContext7) {
  log.info('📚 Querying Context7 for current patterns...');
  
  // Query Context7 for selected stack
  const currentDocs = await queryContext7(answers.stack);
  
  // Enhance CODEBASE_ESSENTIALS with current conventions
  // Update tech stack examples with latest APIs
  // Generate skills from current best practices
}
```

**CLI usage:**
```bash
node bin/cli.js init
# Prompt: "Use Context7 for current docs? (Y/n)"
# If yes: Scaffold with latest framework conventions
```

**Why:** Generated templates match current framework versions

---

#### Step 7: Create Context7 utility module
**File:** `lib/context7/index.js`

**Functions:**
```javascript
// Query Context7 MCP (if available)
export async function queryContext7(libraryId, query) { }

// Check if Context7 is available
export async function isContext7Available() { }

// Extract library references from text
export function extractLibraryReferences(content) { }

// Compare skill content with current docs
export async function validateSkillContent(skillContent, libraryRefs) { }
```

**Error handling:**
- Graceful degradation if MCP not installed
- Timeout handling (2-3 seconds max)
- Cache responses to avoid rate limits
- Clear messaging when unavailable

**Why:** Reusable utilities for all Context7 features

---

#### Step 8: Add Context7 to VSCode hook (sessionStart)
**File:** `templates/hooks/session-start.js`

**Enhancement:**
```javascript
// Check if Context7 MCP is configured
const hasContext7 = await checkMCPServer('context7');

if (hasContext7) {
  console.log('[Hook] ✅ Context7 MCP detected');
  console.log('[Hook] 💡 Use "use context7" for current docs');
} else {
  console.log('[Hook] ℹ️  Context7 MCP not configured (optional)');
  console.log('[Hook] 📖 See: docs/context7-integration.md');
}
```

**Why:** Awareness reminder at session start

---

### Phase 3: Advanced Features (Future)

#### Step 9: Auto-refresh tech stack examples
**Cron/scheduled task:**
- Monthly check of `examples/` against Context7
- Detect API drift in example projects
- Generate PR with updates
- Tag for review

**Why:** Keep example templates perpetually current

---

#### Step 10: Skill health check command
**New command:** `node bin/cli.js check-skills --context7`

**Workflow:**
1. Scan all learned skills
2. Extract library references
3. Query Context7 for current APIs
4. Report outdated skills
5. Optionally auto-update with approval

**Output:**
```bash
🔍 Scanning learned skills...
  
✅ 15 skills up-to-date
⚠️  3 skills need updates:
  - nextjs-middleware.md (references v12, current v15)
  - supabase-auth.md (uses deprecated method)
  - vitest-config.md (missing new options)

Update skills? (Y/n)
```

**Why:** Proactive maintenance of skill library

---

## Testing Strategy

### Phase 1 (Documentation)
- ✅ Manual testing: Verify docs are clear and accurate
- ✅ User validation: Test installation steps
- ✅ Integration test: Follow guide end-to-end

### Phase 2 (CLI Integration)
**Unit tests:**
- `test/context7.test.js` - Test Context7 utilities
- Mock MCP responses (no external dependencies in tests)
- Test graceful degradation when unavailable
- Test timeout handling

**Integration tests:**
- Test `learn` command with `--validate-context7`
- Test `init` command with `--with-context7`
- Test error cases (MCP down, rate limits)

**Manual validation:**
- Install Context7 MCP locally
- Run commands with real MCP server
- Verify accuracy of validation suggestions

### Phase 3 (Advanced)
- Test scheduled checks (if implemented)
- Test skill health command
- Validate PR generation (if automated)

---

## Risks & Mitigations

### Risk 1: Context7 Service Downtime
**Impact:** Commands fail if dependent on Context7  
**Likelihood:** Low (well-maintained service)  
**Mitigation:**
- Always optional flags (graceful degradation)
- Timeout after 2-3 seconds
- Clear error messages
- Cache previous responses

### Risk 2: Rate Limits
**Impact:** Frequent queries hit free tier limits  
**Likelihood:** Medium (depends on usage)  
**Mitigation:**
- Document API key recommendation
- Cache responses locally
- Throttle queries (max 1/minute per library)
- Show clear upgrade path in docs

### Risk 3: Library Coverage Gaps
**Impact:** Some libraries not in Context7 registry  
**Likelihood:** Medium (community-driven)  
**Mitigation:**
- Fallback to manual documentation
- Document how to submit libraries
- Don't block workflows if library missing

### Risk 4: API Changes in Context7
**Impact:** Our integration breaks if MCP API changes  
**Likelihood:** Low (stable MCP protocol)  
**Mitigation:**
- Pin Context7 MCP version in docs
- Monitor Context7 releases
- Version compatibility notes in docs

---

## Success Criteria

### Phase 1 (Documentation)
- [ ] Context7 integration guide published
- [ ] 2 skills created (usage + validation)
- [ ] SETUP_GUIDE.md updated
- [ ] User can install and use Context7 with aiknowsys
- [ ] No code changes required (pure documentation)

### Phase 2 (CLI Integration)
- [ ] `--validate-context7` flag works in `learn` command
- [ ] `--with-context7` flag works in `init` command
- [ ] Context7 utilities module tested (80%+ coverage)
- [ ] Graceful degradation verified
- [ ] All tests passing (410+ tests)
- [ ] Documentation updated with CLI examples

### Phase 3 (Advanced)
- [ ] Skill health check command implemented
- [ ] Auto-refresh mechanism working
- [ ] Example projects stay current
- [ ] Zero manual maintenance needed

---

## Dependencies

**External:**
- Context7 MCP server (user installs separately)
- MCP-compatible AI client (Cursor, Claude Code, etc.)
- Optional: Context7 API key (for higher rate limits)

**Internal:**
- Phase 1: None (pure documentation)
- Phase 2: Existing `lib/commands/` infrastructure
- Phase 3: Git automation, cron/scheduled tasks

---

## Timeline Estimate

**Phase 1 (Documentation):**
- 2-3 hours work
- Ready for immediate user adoption
- No testing overhead (just docs)

**Phase 2 (CLI Integration):**
- 6-8 hours development
- 4-6 hours testing
- Documentation updates
- Total: ~12-14 hours

**Phase 3 (Advanced):**
- 8-10 hours development
- 4-6 hours testing
- Automation setup
- Total: ~12-16 hours

**Total estimated effort: 26-33 hours (across all phases)**

---

## Notes for Developer

**Integration Philosophy:**
- Start with Phase 1 (documentation) - zero code, immediate value
- Phase 2 only if users request CLI integration
- Phase 3 is future enhancement (not urgent)

**Key Design Decisions:**
1. **Optional by default** - Never required for core functionality
2. **Graceful degradation** - Works without Context7 installed
3. **No hard dependencies** - Don't break if service unavailable
4. **Cache-friendly** - Minimize API calls for rate limits
5. **User-first** - Document before building CLI features

**Testing Notes:**
- Mock Context7 responses in unit tests
- Don't require MCP installed for CI/CD
- Test timeout handling thoroughly
- Verify all error paths

**Documentation Standards:**
- Clear installation steps
- Real examples (not abstract)
- Troubleshooting section mandatory
- Link to official Context7 docs

---

## Related Plans

- [VSCode Hooks Phase 5](PLAN_vscode_hooks_phase5.md) - Learning system (could validate with Context7)
- [VSCode Hooks Phase 8](PLAN_vscode_hooks_phase8.md) - Advanced intelligence (doc sync)

---

*Part of AIKnowSys strategic integrations. Context7 enhances accuracy but is never required.*
