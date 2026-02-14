# Code Review Workflow

This directory contains per-developer code review feedback (gitignored).

## How It Works

**File Pattern:** `PENDING_<username>.md`

When an architect reviews code, the feedback is written to:
- `PENDING_<username>.md` (for that specific developer)

This keeps reviews:
- ✅ Scoped to individual developers
- ✅ Gitignored (ephemeral, not committed)
- ✅ Cleaned up after addressing issues

## Workflow

1. **Developer** implements feature
2. **Developer** requests review: `@SeniorArchitect please review...`
3. **Architect** writes review to `reviews/PENDING_<username>.md`
4. **Developer** addresses issues
5. **Developer** deletes review file once complete

## Commands

```bash
# Check for pending reviews
ls .aiknowsys/reviews/

# Read your pending review
cat .aiknowsys/reviews/PENDING_yourname.md

# Delete after addressing (manual)
rm .aiknowsys/reviews/PENDING_yourname.md
```

## Files

- `PENDING_<username>.md` - Review feedback (gitignored)
- Should be deleted after addressing issues

---

*Part of AIKnowSys multi-developer collaboration.*
