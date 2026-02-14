# Skill Template

This is a blank skill template. Use it to create new skills for your project.

## How to Use

1. Copy this directory:
   ```bash
   cp -r .github/skills/_skill-template .github/skills/your-skill-name
   ```

2. Edit `SKILL.md` and replace all `{{PLACEHOLDERS}}`

3. Add examples and real code from your project

4. Update `AGENTS.md` to map trigger words to your skill

5. Test the workflow

## Skill Structure

Every skill should have:

- **When to Use** - Trigger words and use cases
- **Prerequisites** - What's needed before starting
- **Step-by-Step Workflow** - Clear, actionable steps
- **Validation** - How to verify it worked
- **Common Pitfalls** - Known issues and solutions
- **Examples** - Real scenarios from your project
- **Rollback Procedure** - How to undo if needed

## Examples of Good Skills

See the universal skills for examples:
- `dependency-updates/` - Safe upgrade workflow
- `documentation-management/` - Changelog archiving
- `code-refactoring/` - Test-driven refactoring

## Tips

- Keep steps clear and atomic
- Include validation after each major step
- Use real code examples, not pseudocode
- Document common mistakes you've encountered
- Test the skill by following it yourself

---

*Part of the Knowledge System Template*
