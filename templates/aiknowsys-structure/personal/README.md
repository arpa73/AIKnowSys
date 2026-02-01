# Personal Patterns Directory

**Purpose:** Your personal learned patterns (not shared with team automatically).

---

## How Personal Patterns Work

### Discovery Workflow

```
1. AI discovers pattern → Saves to .aiknowsys/personal/{{USERNAME}}/
2. You review patterns → npx aiknowsys list-patterns
3. You share valuable ones → npx aiknowsys share-pattern <name>
4. Team benefits → Pattern moves to .aiknowsys/learned/ (committed)
```

### Why Personal Patterns?

**Problem:** Multiple developers discovering similar patterns creates merge conflicts in `.aiknowsys/learned/`

**Solution:** Personal patterns are **gitignored** by default
- ✅ No merge conflicts
- ✅ Experimentation without team noise
- ✅ Deliberate sharing after review
- ✅ You control what becomes team knowledge

---

## Personal vs Learned

| Personal Patterns | Learned Patterns |
|-------------------|------------------|
| `.aiknowsys/personal/{{USERNAME}}/` | `.aiknowsys/learned/` |
| 🚫 Gitignored (not committed) | ✅ Committed to git |
| Your discoveries | Team-validated knowledge |
| Experimental/unproven | Proven and reviewed |
| Share when ready | Immediately visible to team |

---

## Commands

### Create Personal Pattern

```bash
# Default behavior - saves to personal/
npx aiknowsys learn
```

The AI will create patterns here automatically when discovering project-specific knowledge.

### List Your Patterns

```bash
npx aiknowsys list-patterns
```

Shows:
- Your personal patterns (not shared)
- Team patterns (already in learned/)
- Suggestions for what to share

### Share with Team

```bash
npx aiknowsys share-pattern <pattern-name>
```

Moves pattern from `personal/` → `learned/` with:
- Duplicate detection
- Merge options if similar pattern exists
- Optional git commit

---

## ⚠️ Important: Personal Patterns Are NOT Backed Up

**Because this directory is gitignored:**
- ❌ Patterns are NOT in git history
- ❌ Patterns are NOT in cloud backups
- ❌ Patterns are local to YOUR machine only

**To prevent loss:**
1. Review patterns regularly (`npx aiknowsys list-patterns`)
2. Share valuable patterns (`npx aiknowsys share-pattern <name>`)
3. Shared patterns are backed up (committed to git)

**Think of personal/ as a "drafts" folder** - move important work to learned/ (published).

---

## File Format

Personal patterns use the same format as learned patterns:

```markdown
# Pattern Title

**Trigger Words:** keyword1, keyword2, specific-error-message

**When to Use:**
[Brief description of when this pattern applies]

**How to Apply:**
1. Step-by-step instructions
2. With code examples
3. And explanations

**Example:**
\`\`\`language
// Code example
\`\`\`

**Why This Works:**
[Explanation of the underlying principle]

**Related Patterns:**
- other-pattern.md
- another-pattern.md
```

---

## FAQ

**Q: Why can't I see teammate patterns in personal/?**  
A: Each developer has their own `personal/<username>/` directory. Personal patterns are local until shared.

**Q: How do I see what my teammates are working on?**  
A: Check `.aiknowsys/learned/` - that's where shared patterns live.

**Q: Can I share someone else's pattern?**  
A: No, you can only share patterns from your own `personal/<username>/` directory.

**Q: What happens if I delete a personal pattern?**  
A: It's gone permanently (gitignored = no backup). Only share if you want to keep it.

**Q: Can I force patterns to learned/ directly?**  
A: Yes, use `npx aiknowsys learn --shared` (legacy behavior, not recommended in multi-dev teams).

---

*Part of AIKnowSys multi-developer collaboration system - prevents merge conflicts while maintaining team knowledge sharing.*
