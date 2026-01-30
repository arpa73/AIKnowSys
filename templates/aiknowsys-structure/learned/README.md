# Learned Skills Directory

This directory contains project-specific patterns and skills discovered during development.

## Purpose

As you work with AI assistants on your project, you'll discover:
- Solutions to recurring problems
- Project-specific conventions
- Workarounds for framework quirks
- Debugging techniques that work
- Patterns that emerge organically

Instead of re-explaining these every session, save them here as learned skills.

## Pattern Types

| Pattern Type | Description | Example |
|--------------|-------------|---------|
| **error_resolution** | How specific errors were resolved | "TS2345: Fix by adding explicit type annotation" |
| **user_corrections** | Patterns from correcting AI mistakes | "Always use composables, not mixins in Vue 3" |
| **workarounds** | Solutions to library/framework issues | "Next.js 14 fetch cache workaround" |
| **debugging_techniques** | Effective debugging approaches | "Check Django query count with debug_toolbar" |
| **project_specific** | Project conventions and standards | "Use Pydantic models for all API responses" |

## Creating Learned Skills

Use the skill-creator template or follow this format:

```markdown
# Skill: Pattern Name

**Pattern Type:** error_resolution  
**Created:** 2026-01-25  
**Trigger Words:** "typescript error", "type annotation"

## When to Use

Use this skill when encountering TypeScript error TS2345 with function arguments.

## Problem

TypeScript can't infer types for callback parameters in certain contexts.

## Solution

Add explicit type annotations to callback parameters:

\```typescript
// ❌ Error: Argument of type '(item) => void' is not assignable
items.forEach(item => console.log(item.name));

// ✅ Fixed: Explicit type annotation
items.forEach((item: Item) => console.log(item.name));
\```

## Related

- TypeScript strict mode configuration
- Type inference limitations in callbacks
```

## Example: Emergency Hotfix Workflow

For a real-world example of a learned skill, see the aiknowsys repository's
`.aiknowsys/learned/emergency-hotfix-workflow.md` which captures:

- Pattern discovered during production incident
- Why rushing under pressure creates MORE emergencies
- Correct workflow that seems slow but prevents bigger incidents
- Red flags to watch for when feeling pressure
- Success metrics for proper emergency response

**Key lesson:** Emergency ≠ skip process. Work faster WITHIN process, not around it.

## Workflow

1. **Encounter Pattern** - Notice a recurring issue or solution
2. **Document It** - Create learned skill using format above
3. **Add Triggers** - Include keywords for easy discovery
4. **Reuse It** - AI agents can reference in future sessions

## Benefits

- **Self-Improving System** - Gets smarter over time
- **Project-Specific Knowledge** - Captures your context
- **Reduced Repetition** - Don't re-explain patterns
- **Team Knowledge** - Share discoveries across team

---

*Part of the aiknowsys Knowledge System - Continuous learning for AI-assisted development*
