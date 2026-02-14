---
name: template-maintenance
description: Workflow for maintaining AIKnowSys deliverable templates
triggers: ["update templates", "fix template contamination", "migrate templates", "template format change"]
category: maintainer
version: 1.0.0
---

# Template Maintenance Workflow

**Use when:** Fixing template contamination, migrating format, adding stacks, updating patterns

## Detection Phase

### Check for Contamination

```bash
# Check for project-specific references
grep -r "aiknowsys" templates/
grep -r "bin/cli" templates/
grep -r "npx aiknowsys" templates/

# Check file sizes (should be <250 base, <400 stacks)
wc -l templates/CODEBASE_ESSENTIALS.template.md
for stack in templates/stacks/*/CODEBASE_ESSENTIALS.md; do
  echo "$stack: $(wc -l < $stack) lines"
done
```

### Success Criteria
- Base template: 150-250 lines
- Stack templates: <400 lines each
- Zero project-specific references
- All {{PLACEHOLDERS}} used correctly

## Planning Phase

Create implementation plan in `.aiknowsys/PLAN_*.md`:
- Document current state vs target
- Estimate time required
- Define success criteria
- Document rollback procedure
- Get user approval

**Example:** [.aiknowsys/PLAN_template_fixes_v0.10.0.md](../.aiknowsys/PLAN_template_fixes_v0.10.0.md)

## Testing Phase (TDD REQUIRED)

**RED:** Write failing tests FIRST
```typescript
// test/templates/base-template.test.ts
describe('Base Template', () => {
  test('should contain NO aiknowsys references', () => {
    const template = readFileSync('templates/CODEBASE_ESSENTIALS.template.md');
    expect(template.toLowerCase()).not.toMatch(/aiknowsys/);
  });
});
```

Tests should FAIL initially (RED phase).

## Execution Phase

### For Format Migration
```bash
# Use migrate-essentials command
cd templates/stacks/<stack-name>
node ../../../bin/cli.js migrate-essentials --dry-run  # Preview
node ../../../bin/cli.js migrate-essentials            # Execute
```

### For Contamination Fixes
- Manual editing with {{PLACEHOLDERS}}
- Replace hardcoded values with variables
- Remove project-specific content

### For New Stack Addition
```bash
# Copy similar stack as template
cp -r templates/stacks/nextjs-api templates/stacks/new-stack
# Customize for new framework
```

## Validation Phase

```bash
# Run template tests (GREEN phase)
npm test test/templates/

# Run deliverable validation
npx aiknowsys validate-deliverables

# Verify zero contamination
grep -r "aiknowsys" templates/  # Should be empty

# Check file sizes
wc -l templates/CODEBASE_ESSENTIALS.template.md  # 150-250
wc -l templates/stacks/*/CODEBASE_ESSENTIALS.md  # <400 each
```

## Documentation Phase

Before release:
- [ ] Update migration guide (`docs/migration-guide.md`)
- [ ] Update release notes (breaking changes section)
- [ ] Test migration on sample project
- [ ] Document rollback procedure

## Success Criteria Checklist

- [ ] Base template: 150-250 lines
- [ ] Stack templates: <400 lines each
- [ ] Zero project-specific references
- [ ] All {{PLACEHOLDERS}} validated
- [ ] Template tests passing
- [ ] `validate-deliverables` passing
- [ ] Backups created (.pre-v0.10.backup)
- [ ] Migration guide written
- [ ] Sample migration tested

## Rollback Procedure

```bash
# Templates have automatic backups
ls templates/**/*.pre-v0.10.backup

# Restore individual stack
mv templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md.pre-v0.10.backup \
   templates/stacks/nextjs-api/CODEBASE_ESSENTIALS.md

# Or restore from git
git checkout HEAD -- templates/
```

---

**Reference Example:** [template-fixes-v0.10.0-COMPLETE.md](../reviews/template-fixes-v0.10.0-COMPLETE.md)
