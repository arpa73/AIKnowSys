# Personal Learned Patterns

**Owner:** arno-paffen

This directory contains AI-discovered patterns that are **not shared with the team** (gitignored).

## Workflow

1. **AI discovers pattern** → Saves to `personal/arno-paffen/` (automatic)
2. **Review your patterns** → `npx aiknowsys list-patterns`
3. **Share with team** → `npx aiknowsys share-pattern <pattern-name>`
4. **Team benefits** → Pattern available in `.aiknowsys/learned/` after git pull

## Why Personal?

- ✅ **Prevents merge conflicts** when multiple developers work simultaneously
- ✅ **Allows experimentation** without affecting team knowledge
- ✅ **Sharing is deliberate** (acts as quality gate)
- ✅ **You control** what becomes team standard

## Commands

```bash
# List all patterns (personal + team)
npx aiknowsys list-patterns

# Share a personal pattern with team
npx aiknowsys share-pattern my-pattern

# Learn new pattern (saves to personal/ by default)
npx aiknowsys learn --extract my-pattern
```

## ⚠️ Important

Personal patterns are **NOT backed up to git**. Share valuable patterns regularly so they:
- Benefit the team
- Survive local machine changes
- Become part of project knowledge

---

*Part of AIKnowSys personal/shared pattern collaboration system.*
