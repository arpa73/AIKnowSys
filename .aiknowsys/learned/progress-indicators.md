# Learned Skill: Progress Indicators for Long Operations

**Pattern Type:** project_specific  
**Created:** January 29, 2026  
**Discovered During:** Sprint 1 Task 1.3 - Progress Indicators implementation  
**Trigger Words:** "progress indicator", "spinner", "loading", "long operation", "file scanning", "multi-step progress"

## When to Use

Use when implementing commands that:
- Process many files (scan, migrate, etc.)
- Perform multiple sequential steps (audit checks, installation phases)
- Take more than 2-3 seconds to complete
- Would benefit from user feedback during execution

## Pattern

We've established three distinct progress indicator patterns used across scan, audit, and migrate commands:

### Pattern 1: File Operations - Update Every N Items

**Use when:** Processing collections of files or items

```javascript
const spinner = silent ? null : ora('Processing files...').start();
let filesProcessed = 0;

for (const file of files) {
  // Process file...
  filesProcessed++;
  
  // Update every 50 items (not every item - performance)
  if (spinner && filesProcessed % 50 === 0) {
    spinner.text = `Processing... (${filesProcessed} files)`;
  }
}

if (spinner) spinner.succeed('Processing complete');
```

**Example:** [lib/commands/scan.js](../../lib/commands/scan.js#L297-L333)

**Key principles:**
- Update periodically (every 50 items), not on every iteration
- Show count to give users a sense of progress
- Performance-conscious (avoid excessive terminal updates)

### Pattern 2: Multi-Step Checks - Show Step Count

**Use when:** Running multiple independent checks or validations

```javascript
const spinner = silent ? null : ora('Starting checks...').start();

// Check 1
if (spinner) {
  spinner.text = 'Check 1/5: Validating structure...';
} else {
  log.white('Validating structure...');
}
// ... check logic ...
log.log('  ✓ Structure valid');

// Check 2
if (spinner) {
  spinner.text = 'Check 2/5: Analyzing patterns...';
} else {
  log.white('Analyzing patterns...');
}
// ... check logic ...
log.log('  ✓ Patterns valid');

// ... more checks ...

if (spinner) spinner.succeed('All checks complete');
```

**Example:** [lib/commands/audit.js](../../lib/commands/audit.js#L40-L280)

**Key principles:**
- Conditional output: spinner shows progress OR log shows section heading
- Prevents duplication (not both spinner AND log for same message)
- Results always logged (users see outcomes)
- Silent mode gets section headings instead of spinner

### Pattern 3: Sequential Phases - Reuse Spinner

**Use when:** Executing linear workflow with distinct phases

```javascript
// Create single spinner for entire workflow
const spinner = ora('Phase 1: Initializing...').start();
// ... work ...
spinner.succeed('Phase 1 complete');

// Reuse same spinner for next phase
spinner.start('Phase 2: Processing...');
// ... work ...
spinner.succeed('Phase 2 complete');

spinner.start('Phase 3: Finalizing...');
// ... work ...
spinner.succeed('Phase 3 complete');
```

**Example:** [lib/commands/migrate.js](../../lib/commands/migrate.js#L47-L143)

**Key principles:**
- One spinner instance for linear workflows (reduces complexity)
- Clear phase transitions (succeed/start pattern)
- Appropriate for sequential operations (not parallel)
- Document the pattern with comment explaining reuse

## Key Principles (Universal)

1. **Respect silent mode:** `spinner = silent ? null : ora(...)`
   - Tests need silent mode to avoid console pollution
   - Programmatic usage needs silent mode
   - Always check `if (spinner)` before operations

2. **Update periodically, not constantly:**
   - File operations: Every 50-100 items
   - Avoids performance overhead from terminal updates
   - Still provides meaningful progress feedback

3. **Conditional output pattern:**
   - Spinner shows progress during work
   - Log shows results after work
   - NOT both for the same message (causes duplication)

4. **Always clear spinner state:**
   - Call `succeed()`, `fail()`, or `info()` when done
   - Prevents orphaned spinners in terminal
   - Provides clear completion signal

5. **Reuse when appropriate:**
   - Linear workflows: One spinner reused across phases
   - Parallel/independent: Separate spinners per operation
   - Document pattern if unconventional

## Anti-Patterns (Avoid)

❌ **Updating on every iteration:**
```javascript
// BAD - Performance issue with thousands of files
for (const file of files) {
  spinner.text = `Processing ${file}...`;  // Too frequent!
}
```

❌ **Showing both spinner AND log:**
```javascript
// BAD - Visual duplication
spinner.text = 'Checking...';
log.white('Checking...');  // User sees both!
```

❌ **Forgetting silent mode:**
```javascript
// BAD - Tests will show spinner output
const spinner = ora('Working...').start();  // Always created!
```

❌ **Not clearing spinner:**
```javascript
// BAD - Spinner left spinning
spinner.start('Working...');
// ... work ...
// Missing: spinner.succeed() or spinner.fail()
```

## Related

- Core Pattern: [Logger Utility Pattern](../../CODEBASE_ESSENTIALS.md#logger-utility-pattern) - Silent mode support
- Core Pattern: [CLI Command Structure](../../CODEBASE_ESSENTIALS.md#cli-command-structure) - Spinner integration
- Implementation: [lib/commands/scan.js](../../lib/commands/scan.js) - Pattern 1 example
- Implementation: [lib/commands/audit.js](../../lib/commands/audit.js) - Pattern 2 example
- Implementation: [lib/commands/migrate.js](../../lib/commands/migrate.js) - Pattern 3 example

## Discovery Notes

**Session:** Sprint 1 Task 1.3 (January 29, 2026)

**Evolution:**
1. Initial implementation: Added spinners to all three commands
2. Architect review: Identified duplication issue (spinner + log)
3. Refactoring: Established conditional output pattern
4. Documentation: Patterns extracted and formalized

**Why this became a learned skill:**
- Project-specific convention (not universal CLI pattern)
- Emerged from real implementation (not planned upfront)
- Three distinct patterns discovered through practice
- Helps keep CODEBASE_ESSENTIALS.md focused on invariants

**Impact:**
- Better UX on large codebases (real-time feedback)
- Professional feel (polished progress indicators)
- Consistent pattern across commands
- Performance-conscious design (periodic updates)
