# Shadow Artifact Prevention

## Problem
Generated build artifacts (`.js`, `.d.ts`, `.map`) were tracked in `lib/`, allowing stale compiled files to shadow TypeScript source during tests.

## Symptoms
- Source edits appear ignored in some test runs
- Inconsistent local vs CI behavior
- Merge conflicts on generated files
- Hidden bugs only surface after artifact cleanup

## Root Cause
`lib/*.js` and typing/map siblings coexisted next to `lib/*.ts`, so runtime imports could resolve stale generated files instead of source-truth TypeScript paths.

## Solution

### 1) Add Guard Test
Use [test/no-shadow-build-artifacts.test.ts](../../test/no-shadow-build-artifacts.test.ts) to assert:
- No tracked shadow artifacts via `git ls-files`
- No on-disk `.js`, `.js.map`, `.d.ts`, `.d.ts.map` siblings for `lib/**/*.ts`

### 2) Cleanup Tracked Artifacts
Remove tracked generated files from `lib/` and keep build outputs in `dist/`.

### 3) Keep Build Boundary Clear
- `lib/` = source only
- `dist/` = compiled output

## Lessons Learned
- Shadow artifacts can mask bugs for long periods
- Cleanup may expose hidden parsing/selection assumptions
- A small hygiene test provides long-term prevention with minimal maintenance

## Related
- Commit: `e3fb1fb`
- Guard test: [test/no-shadow-build-artifacts.test.ts](../../test/no-shadow-build-artifacts.test.ts)
