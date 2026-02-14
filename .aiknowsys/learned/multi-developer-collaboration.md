# Multi-Developer Collaboration Pattern

## Trigger Words
multi-dev, concurrent developers, team collaboration, plan conflicts, merge conflicts on CURRENT_PLAN

## Problem
Multiple developers + AI agents working on same branch:
- CURRENT_PLAN.md → merge conflicts (single file, multiple editors)
- PENDING_REVIEW.md → overwrites (architect writes for all)

## Solution
Per-developer plan and review files:

**Structure:**
```
.aiknowsys/
├── plans/                    # Committed (team sees all)
│   ├── active-alice.md       # Alice's active plan pointer
│   ├── active-bob.md         # Bob's active plan pointer
│   └── active-charlie.md     # Charlie's active plan pointer
├── reviews/                  # Gitignored (private feedback)
│   ├── PENDING_alice.md      # Alice's review
│   ├── PENDING_bob.md        # Bob's review
│   └── PENDING_charlie.md    # Charlie's review
└── CURRENT_PLAN.md           # Auto-generated team index
```

**Workflow:**
1. Developer updates their `plans/active-<username>.md`
2. Run `npx aiknowsys sync-plans` to regenerate team index
3. Architect writes review to `reviews/PENDING_<username>.md`
4. No merge conflicts, clear ownership

**Auto-Detection:**
- Checks if `plans/` directory exists
- If YES → multi-dev mode
- If NO → single-dev mode (legacy CURRENT_PLAN.md)

**Migration:**
```bash
npx aiknowsys migrate-patterns
```

## Benefits
- ✅ No merge conflicts (each dev has own file)
- ✅ Clear ownership (who's working on what)
- ✅ Team visibility (sync-plans aggregates)
- ✅ Per-dev reviews (architect feedback isolated)
- ✅ Backwards compatible (single-dev still works)

## Commands
- `npx aiknowsys sync-plans` - Regenerate team index
- `npx aiknowsys migrate-patterns` - Enable multi-dev mode

## Related
- Plan Management Pattern (CODEBASE_ESSENTIALS.md)
- Architect Review Workflow (.github/agents/architect.agent.md)
