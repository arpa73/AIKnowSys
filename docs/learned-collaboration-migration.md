# Learned Patterns Collaboration - Migration Guide

**Version:** 0.9.0+  
**Date:** February 2026  
**Status:** Phase 1 Complete

---

## Overview

AIKnowSys now supports **personal/shared pattern split** to prevent merge conflicts in multi-developer teams.

**What changed:**
- Patterns now save to `.aiknowsys/personal/<username>/` by default (gitignored)
- Team patterns remain in `.aiknowsys/learned/` (committed)
- New commands: `list-patterns`, `share-pattern`

**Why this matters:**
- Multiple developers can learn patterns simultaneously without git conflicts
- Sharing is deliberate (acts as quality gate)
- Personal experimentation doesn't affect team

---

## Migration Steps

### For Existing Projects

**If you have existing learned patterns:**

1. **Backup existing patterns** (optional but recommended):
   ```bash
   cp -r .aiknowsys/learned .aiknowsys/learned.backup
   ```

2. **Run migration script:**
   ```bash
   npx aiknowsys migrate
   ```
   
   Or use standalone script:
   ```bash
   node scripts/migrate-learned-patterns.js
   ```

3. **Review migration results:**
   ```bash
   npx aiknowsys list-patterns
   ```

4. **Commit changes:**
   ```bash
   git add .aiknowsys/ .gitignore
   git commit -m "Migrate to personal/shared pattern split"
   ```

### For New Projects

No migration needed! Just run:
```bash
npx aiknowsys init
```

The personal/learned structure is created automatically.

---

## What the Migration Does

**Automatic changes:**
1. Creates `.aiknowsys/personal/<username>/` directory
2. Updates `.gitignore` to exclude `personal/` directory
3. Leaves existing `learned/` patterns unchanged (team patterns stay committed)
4. Creates `personal/README.md` with workflow documentation

**Manual review recommended:**
- Existing `learned/` patterns remain team-shared (no changes)
- Future AI discoveries save to `personal/` by default
- Use `share-pattern` command to move personal → team

---

## New Workflow

### Before Migration (Old Way)
```bash
# AI discovers pattern
# Saved directly to .aiknowsys/learned/ (committed)
# Problem: Multiple developers = merge conflicts
```

### After Migration (New Way)
```bash
# AI discovers pattern
# → Saves to .aiknowsys/personal/<username>/ (gitignored)

# Review your patterns
npx aiknowsys list-patterns

# Share valuable patterns with team
npx aiknowsys share-pattern my-pattern

# Team gets pattern after git pull
# ✅ No merge conflicts!
```

### Visual Workflow

```
┌─────────────────────────────────────────────────┐
│ Developer A discovers pattern                    │
│ → Saves to personal/developer-a/                 │
│ → Reviews with list-patterns                     │
│ → Shares with share-pattern                      │
│ → Commits to learned/                            │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│ Developer B pulls changes                        │
│ → Pattern now in learned/                        │
│ → AI can reference pattern                       │
│ → Team benefits from shared knowledge            │
└─────────────────────────────────────────────────┘
```

**Key Benefits:**
- 🔒 Personal patterns are gitignored (no conflicts)
- 🤝 Sharing is explicit and deliberate
- ✅ Team gets patterns only after review
- 🚀 Everyone benefits from shared knowledge

---

## Commands Reference

### List Patterns
```bash
# Show personal and team patterns
npx aiknowsys list-patterns

# Example output:
# 📚 Learned Patterns
#
# Personal (3 patterns - not shared):
#   • api-retry-pattern.md [api, retry, error...]
#   • vue-composable.md [vue, composable]
#
# Team (7 patterns - shared):
#   • database-pooling.md [database, pool]
#   • error-handling.md [error, handling]
```

### Share Pattern
```bash
# Share a personal pattern with team
npx aiknowsys share-pattern api-retry-pattern

# Moves pattern from personal/ → learned/
# Detects duplicates and similar patterns
# Shows git commands for commit
```

### Learn Command Updates
```bash
# Save to personal (default)
npx aiknowsys learn --extract my-pattern

# Save to team learned (override)
npx aiknowsys learn --extract my-pattern --shared
```

---

## Troubleshooting

### "No git username found"

**Problem:** Commands need username to locate personal patterns.

**Solution:**
```bash
# Set git username
git config user.name "Your Name"

# Or globally
git config --global user.name "Your Name"

# Verify
git config user.name
```

### "Pattern already exists in learned/"

**Problem:** Trying to share a pattern that's already in team directory.

**Solution:**
```bash
# List patterns to see what's already shared
npx aiknowsys list-patterns

# Choose different name or merge manually
```

### "Personal patterns not showing"

**Problem:** Patterns exist but not displayed.

**Solution:**
```bash
# Check directory exists
ls -la .aiknowsys/personal/$(git config user.name | tr '[:upper:]' '[:lower:]' | tr ' ' '-')/

# Verify gitignore
cat .gitignore | grep personal

# Re-run init to fix structure
npx aiknowsys init
```

---

## Rollback (If Needed)

**To revert to old behavior:**

1. **Remove personal directory:**
   ```bash
   rm -rf .aiknowsys/personal
   ```

2. **Remove gitignore entry:**
   ```bash
   # Edit .gitignore, remove line:
   # .aiknowsys/personal/
   ```

3. **Use --shared flag for all learning:**
   ```bash
   npx aiknowsys learn --extract pattern --shared
   ```

**Note:** This removes merge conflict protection. Only recommended for single-developer projects.

---

## FAQ

### Q: What happens to existing learned/ patterns?

**A:** They stay exactly where they are (committed, team-shared). No changes to existing patterns.

### Q: Can I still save patterns directly to learned/?

**A:** Yes! Use the `--shared` flag:
```bash
npx aiknowsys learn --extract pattern --shared
```

### Q: Are personal patterns backed up?

**A:** No, they're gitignored. Share valuable patterns regularly so they're committed and backed up.

### Q: Can multiple developers have the same personal pattern?

**A:** Yes! Each developer has their own `personal/<username>/` directory. When sharing, duplicate detection helps avoid redundancy.

### Q: What if I'm the only developer?

**A:** You can still use personal patterns for experimentation, but the merge conflict benefit doesn't apply. Consider using `--shared` flag for immediate team sharing.

---

## See Also

- [CODEBASE_ESSENTIALS.md](../CODEBASE_ESSENTIALS.md) - "Learned Patterns Collaboration" section
- [AGENTS.md](../AGENTS.md) - "Continuous Learning" section
- [.aiknowsys/personal/README.md](../.aiknowsys/personal/README.md) - Personal patterns workflow

---

*Migration guide for AIKnowSys v0.9.0+ personal/shared pattern split feature.*
