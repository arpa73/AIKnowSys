# Enhancement: ESSENTIALS Validation for End Users

**Status:** 💡 IDEA - For Planner Review  
**Priority:** Medium (UX improvement, not critical)  
**Effort:** ~30-45 minutes (TDD implementation)

---

## Problem Statement

Current `validate-deliverables --type stacks` scans `templates/stacks/` which is only valuable to **aiknowsys maintainers** (us), not end users.

**Why this matters:**
- Users install aiknowsys → generate CODEBASE_ESSENTIALS.md from template
- They never touch `templates/stacks/` again
- Their ESSENTIALS evolves with their project
- Validating templates gives users **zero value**

## Proposed Solution

Add `--type essentials` option to scan user's actual `CODEBASE_ESSENTIALS.md`:

```bash
# For end users (NEW - primary use case)
validate-deliverables --type essentials
# Scans CODEBASE_ESSENTIALS.md
# Reports: "Your Next.js patterns are outdated (using getServerSideProps)"

# Existing behavior
validate-deliverables --type skills      # Scans .github/skills/
validate-deliverables --type stacks      # Scans templates/stacks/ (internal)

# Better default (NEW)
validate-deliverables
# Scans: skills + essentials (not stacks)
```

## Benefits

✅ **Actually useful to end users** - validates their active documentation  
✅ **Non-breaking** - keeps `--type stacks` for internal use  
✅ **Better default** - skills + essentials more valuable than skills + stacks  
✅ **Same validation engine** - reuses library detection and Context7 queries  
✅ **Actionable insights** - "Your Django ORM patterns are pre-4.0 async syntax"

## Implementation Checklist

**TDD Workflow (RED-GREEN-REFACTOR):**

- [ ] **RED Phase**: Write 5 new tests in `test/validate-deliverables.test.js`
  - [ ] Test: Scan ESSENTIALS file
  - [ ] Test: Detect tech stack from ESSENTIALS (Section 1: Technology Snapshot)
  - [ ] Test: Validate patterns against current library docs
  - [ ] Test: Default scans skills + essentials (not stacks)
  - [ ] Test: `--type stacks` still works (internal use case)

- [ ] **GREEN Phase**: Implement functionality
  - [ ] Add `essentials` to type choices in flags
  - [ ] Add `scanEssentials()` function (parse CODEBASE_ESSENTIALS.md)
  - [ ] Extract tech stack from "Technology Snapshot" section
  - [ ] Change default from `['skills', 'stacks']` to `['skills', 'essentials']`
  - [ ] Update validation logic to handle ESSENTIALS patterns

- [ ] **REFACTOR Phase**: Polish
  - [ ] Extract common parsing logic (DRY)
  - [ ] Add clear error messages ("ESSENTIALS not found at expected path")
  - [ ] Update output formatting (distinguish skills vs essentials results)

- [ ] **Documentation**:
  - [ ] Update README.md usage examples
  - [ ] Mark `--type stacks` as "For aiknowsys maintainers (internal)"
  - [ ] Add ESSENTIALS validation use case
  - [ ] Update CHANGELOG.md

- [ ] **Validation**:
  - [ ] All tests passing (66+ tests expected)
  - [ ] Linting clean
  - [ ] End-to-end manual testing
  - [ ] Architect review

## Technical Notes

**ESSENTIALS Scanning Strategy:**
```javascript
// Parse Section 1: Technology Snapshot table
const scanEssentials = async (projectRoot) => {
  const essentialsPath = path.join(projectRoot, 'CODEBASE_ESSENTIALS.md');
  const content = await fs.readFile(essentialsPath, 'utf-8');
  
  // Extract tech stack from table
  const techStackSection = extractSection(content, '## 1. Technology Snapshot');
  const libraries = parseTechnologyTable(techStackSection);
  
  // Validate each technology mentioned
  return validateLibraries(libraries);
};
```

**Backward Compatibility:**
- Keep `--type stacks` functional (internal tool for us)
- Document as "aiknowsys maintainers only" in README
- Change default behavior (non-breaking for users who don't specify type)

## User Value Proposition

**Before:**
```bash
$ validate-deliverables
Scanning skills... 13 found
Scanning stacks... 8 found (templates - not relevant to your project)
```

**After:**
```bash
$ validate-deliverables
Scanning skills... 13 found
Scanning ESSENTIALS... ⚠️ 3 outdated patterns detected!

Outdated Patterns:
  • Next.js getServerSideProps (deprecated in v13+)
    Suggestion: Use Server Components or Route Handlers
  • React Class Components in examples
    Suggestion: Update to functional components with hooks
```

## Questions for Planner

1. **Versioning**: Is this v0.1.1 (patch) or v0.2.0 (minor feature)?
2. **Breaking change?**: Default behavior changes (skills+stacks → skills+essentials)
   - Probably minor version bump (v0.2.0)
3. **Phase 7 or separate feature?**: Add to current plan or new plan?
4. **Priority**: Ship with v0.1.0 or defer to next release?

## Related Files

- `lib/validate-deliverables.js` - Core implementation (~50 lines added)
- `test/validate-deliverables.test.js` - Add 5 new tests
- `README.md` - Update usage examples
- `CHANGELOG.md` - Document enhancement

---

**Status:** Ready for Planner to create implementation plan or defer to roadmap.

**Estimated Effort:** 30-45 minutes (TDD workflow, tests first)

**Value:** Medium-High (significantly improves end-user UX)
