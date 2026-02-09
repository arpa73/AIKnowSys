# Implementation Plan: Deliverables Clarity Architecture

**Status:** 📋 PLANNED  
**Created:** 2026-02-03  
**Goal:** Prevent AI agent confusion between maintainer-only and user-deliverable content

## Problem Statement

AI agents confuse maintainer-only content with user deliverables:
- `deliverable-review` skill deleted thinking it should be in templates
- `.git-hooks/README.md` vs `templates/git-hooks/README.md` confusion

**Root Cause:** AI didn't know certain files were maintainer-only.

## Solution: Option E (Documentation + Frontmatter Flag)

**Principle:** Fix documentation, not architecture. The simplest solution that works.

### What We'll Do

1. Add `maintainer: true` frontmatter to maintainer-only skills
2. Add 2 lines to ESSENTIALS explaining the convention
3. Add validation check to catch boundary violations
4. Done (~30 minutes)

### Why NOT More Complex Solutions

| Rejected Option | Why |
|-----------------|-----|
| Config file (Option D) | Requires reading separate file, adds indirection |
| Directory restructure (Option B) | Adds build step, generated file footguns, over-engineered |
| Overlay architecture | Not actual dogfooding, MORE rules for AI to follow |

**The problem is documentation, not architecture.**

## Implementation

### Step 1: Add Frontmatter Flag (5 min)

**Update `.github/skills/deliverable-review/SKILL.md`:**
```yaml
---
name: deliverable-review
maintainer: true  # ← Signals this is not for distribution
description: Review AIKnowSys deliverables using Context7 MCP...
---
```

**Update `.github/skills/_skill-template/SKILL.md`:**
```yaml
---
name: _skill-template
maintainer: true
description: Template for creating new skills...
---
```

### Step 2: Document in ESSENTIALS (5 min)

**Add to CODEBASE_ESSENTIALS.md (in Project Structure section):**
```markdown
### Maintainer vs User Content

Skills with `maintainer: true` in frontmatter are for AIKnowSys development only.
They stay in `.github/skills/` but are NOT synced to `templates/skills/`.

**User skills (9):** Distributed via `npx aiknowsys init`
**Maintainer skills (2):** `deliverable-review`, `_skill-template`
```

### Step 3: Add Validation Check (15 min)

**Update `lib/commands/validate-deliverables.js`:**
```javascript
// Check: maintainer skills should NOT be in templates
async function checkMaintainerSkillBoundary(errors, warnings) {
  const githubSkillsDir = '.github/skills';
  const templateSkillsDir = 'templates/skills';
  
  if (!fs.existsSync(githubSkillsDir)) return;
  
  const skills = fs.readdirSync(githubSkillsDir)
    .filter(s => fs.statSync(path.join(githubSkillsDir, s)).isDirectory());
  
  for (const skill of skills) {
    const skillPath = path.join(githubSkillsDir, skill, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    
    const content = fs.readFileSync(skillPath, 'utf-8');
    const isMaintainer = /^maintainer:\s*true/m.test(content);
    
    if (isMaintainer && fs.existsSync(path.join(templateSkillsDir, skill))) {
      errors.push(`Maintainer skill "${skill}" should not be in templates/skills/`);
    }
  }
}
```

### Step 4: Update AGENTS.md (5 min)

**Add brief note:**
```markdown
## Maintainer Content

Skills with `maintainer: true` frontmatter are for AIKnowSys development only.
Don't sync them to `templates/skills/` or include in AVAILABLE_SKILLS.

Current maintainer skills: `deliverable-review`, `_skill-template`
```

## Implementation Steps

| Step | Description | Est. Time |
|------|-------------|-----------|
| 1 | Add `maintainer: true` to 2 skill files | 5 min |
| 2 | Add scope note to ESSENTIALS | 5 min |
| 3 | Add validation check | 15 min |
| 4 | Update AGENTS.md | 5 min |

**Total:** ~30 minutes

## Success Criteria

- [ ] `deliverable-review` has `maintainer: true` in frontmatter
- [ ] `_skill-template` has `maintainer: true` in frontmatter
- [ ] ESSENTIALS explains maintainer vs user content
- [ ] `validate-deliverables` catches boundary violations
- [ ] AI agents understand not to sync maintainer skills

## Test Cases

```bash
# Should pass - maintainer skills not in templates
npx aiknowsys validate-deliverables

# Should fail if someone adds deliverable-review to templates
cp -r .github/skills/deliverable-review templates/skills/
npx aiknowsys validate-deliverables  # Should error
rm -rf templates/skills/deliverable-review
```

## Lessons Learned

**Over-engineering sequence in this session:**
1. Option A: Config file (added indirection)
2. Option B: Directory restructure (breaking change)
3. Option C: Naming conventions (relies on discipline)
4. Option D: Hybrid config + convention (still complex)
5. → Never presented simplest option first!

**Better approach:** Start with "what's the minimum fix for the actual problem?"

The problem was: "AI didn't know file was maintainer-only"
The fix is: Tell it. In the file. With one line of frontmatter.

---

*Sometimes the best architecture change is no architecture change.*

### Core Principle
