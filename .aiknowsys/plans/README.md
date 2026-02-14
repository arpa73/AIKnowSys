# Multi-Developer Plan Management

This directory contains per-developer plan pointers for team collaboration.

## How It Works

**File Pattern:** `active-<username>.md`

Each developer has their own plan pointer file that tracks:
- What they're currently working on
- Link to full implementation plan (PLAN_*.md)
- Status and last update timestamp

## Workflow

1. **Solo Developer:**
   - Single file: `active-yourname.md`
   - Points to your current PLAN_*.md

2. **Team:**
   - Multiple files: `active-alice.md`, `active-bob.md`, etc.
   - Each points to respective developer's current plan
   - `CURRENT_PLAN.md` (at root) is auto-generated team index

## Commands

```bash
# Regenerate team index
npx aiknowsys sync-plans

# View team overview
cat ../.aiknowsys/CURRENT_PLAN.md
```

## Files

- `active-<username>.md` - Plan pointer (committed)
- `../CURRENT_PLAN.md` - Auto-generated team index (committed)
- `../PLAN_*.md` - Implementation plans (committed)

---

*Part of AIKnowSys multi-developer collaboration.*
