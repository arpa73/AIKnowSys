---
name: Agent Mode Boundary Enforcement
type: debugging_techniques, project_specific
triggers: mode rushing, implement instead of plan, agent boundaries, mode instructions ignored
status: validated
created: 2026-01-30
updated: 2026-01-30
---

## Problem Pattern

**Symptom:** AI agent in specific mode (Planner, Architect, etc.) ignores mode instructions and behaves like general agent.

**Root cause:** General instructions ("implement by default") are encountered FIRST and override mode-specific instructions.

**Example:**
- Planner mode should create plans, NOT implement
- But AI tries to use `multi_replace_string_in_file` anyway
- Mode instruction "plan only" gets ignored

## Solution

**1. Explicit Tool Boundaries (FIRST in file)**
   - Position: After frontmatter, before role description
   - Format: Visual markers (✅ ALLOWED, ❌ FORBIDDEN)
   - Specificity: List exact tools, not general guidance

**2. Override Statement**
   - State clearly: "General 'implement by default' is DISABLED in this mode"
   - First thing AI reads wins

**3. Mindset Guidance**
   - Address the urge: "You might feel: 'I know the solution, let me just code it'"
   - Reframe: "A thorough plan IS valuable implementation - of strategy"
   - Pressure resistance: "If user says 'just do it' → resist, cite protocol"

## Implementation Template

```markdown
## 🎯 [MODE NAME] - [CRITICAL BOUNDARY]

**CRITICAL:** General "implement by default" instruction is DISABLED in [MODE] mode.

**Your job:** [mode-specific purpose]

### Tool Usage Policy

**✅ ALLOWED Tools:**
- tool_name - Purpose

**❌ FORBIDDEN Tools:**
- tool_name - This is [other mode]'s job

### Why This Boundary Exists
[Explain consequences of violating boundary]

### Mindset: [Counter the rush]
[Address the urge to skip mode workflow]
```

## Test Validation

**User pressure test:**
1. User says: "edit the files please" (implementation request)
2. AI in Planner mode resists
3. AI cites boundary: "I'm in Planner mode, Developer implements"
4. Test passes ✅

## When to Apply

- Creating new agent mode
- Existing mode not respecting boundaries
- General instructions conflicting with mode purpose

## Success Metrics

- AI creates plan instead of implementing
- AI resists user pressure ("just do it")
- AI cites tool policy when challenged

## Real-World Example

**Applied to:** Planner agent (2026-01-30)

**Problem observed:**
- User in Planner mode asked for UX improvements
- AI immediately tried to use `multi_replace_string_in_file` to implement
- User cancelled tool call
- AI course-corrected and created plan instead

**Solution applied:**
- Added tool boundary section after frontmatter (line 14)
- Listed exact allowed/forbidden tools with visual markers
- Added mindset guidance: "Relax and trust the process"
- Included pressure resistance: "If user says 'just do it' → create plan anyway"

**Test result:**
- User tested with: "edit the Planner agent and template please"
- AI resisted: "Nice try! I'm in Planner mode, I should NOT edit files"
- AI offered alternatives and cited boundary
- ✅ Test passed - boundaries working

**Files modified:**
- [.github/agents/planner.agent.md](.github/agents/planner.agent.md#L14-L59)
- [templates/agents/planner.agent.template.md](templates/agents/planner.agent.template.md#L14-L59)

**Outcome:** Meta-improvement complete, pattern captured for reuse.

## Related Patterns

- **Emergency Hotfix Protocol** ([AGENTS.md](../../AGENTS.md#L39)) - Addresses pressure to skip process under emergencies
- **Session Start Protocol** ([AGENTS.md](../../AGENTS.md#L5)) - Mandatory steps before any changes

## Notes

**Why this pattern matters:**
- Mode-based agents enable separation of concerns (planning vs implementation vs review)
- But general instructions are STRONG and come FIRST
- Without explicit boundaries, modes collapse into general agent behavior
- Lost benefits: proper planning, architectural review, validation

**Prevention is better than cure:**
- Add boundaries when CREATING new agent mode
- Don't wait for rushing behavior to emerge
- Template included above for consistency

**Cross-mode applicability:**
- This pattern applies to ANY agent mode with specific constraints
- Examples: Architect (review only), TDD Guide (test guidance only), Security Reviewer (security focus only)
- Universal solution: Explicit boundaries FIRST in file
