# Learned Pattern: Update Command Overwrites AGENTS.md Customizations

**Pattern Type:** user_corrections  
**Created:** 2026-01-25  
**Trigger Words:** "update command", "AGENTS.md lost", "customizations overwritten", "placeholders returned"

## When to Use

Use this pattern when running `aiknowsys update` or advising users about update behavior.

## Problem

The update command preserves `CODEBASE_ESSENTIALS.md` (correctly, as it's project-specific) but **overwrites AGENTS.md** with the latest template. This loses customizations like:
- Filled validation matrix (project-specific commands)
- Filled skill mapping table (actual skills with trigger words)

## Discovery Context

During v0.4.0 dogfooding, we ran `aiknowsys update` from 0.1.0 → 0.4.0. After update:
- AGENTS.md had `{{SKILL_MAPPING}}` placeholder instead of filled table
- Validation matrix was replaced with reference to ESSENTIALS
- AGENTS.md.backup contained the original customizations

## Solution

**Before running update:**
1. Review AGENTS.md for customizations (validation matrix, skill mapping)
2. Note any filled-in placeholders

**After running update:**
1. Compare AGENTS.md with AGENTS.md.backup
2. Restore customized sections:
   - Validation matrix (if you want inline copy)
   - Skill mapping table
3. Run `aiknowsys check` to verify no placeholders remain

**Code example:**
```bash
# Before update
git diff AGENTS.md.backup AGENTS.md

# Restore specific sections
# (manually or using multi_replace_string_in_file)

# Verify
npx aiknowsys check
```

## Improvement Ideas

**For check command:**
- Detect placeholders in AGENTS.md (not just ESSENTIALS)
- Warn about `{{SKILL_MAPPING}}`, `{{VALIDATION_MATRIX}}`
- Suggest restoring from .backup file

**For update command:**
- Warn before overwriting AGENTS.md
- Offer selective merge (preserve customizations)
- Better diff display of what changed

**For documentation:**
- Add note in update command output
- Document expected behavior in README

## Related

- Update command documentation: lib/commands/update.js
- Check command validation: lib/commands/check.js
- AGENTS.template.md placeholders

---

*Discovered during v0.4.0 dogfooding - first session using session persistence! 🎉*
