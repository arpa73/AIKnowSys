# Change: Add DB-Generated Changelog Workflow

## Why
`CODEBASE_CHANGELOG.md` is currently a manual/human-maintained artifact and is not indexed in SQLite. This creates duplicate maintenance work and drift from the DB-first source of truth.

## What Changes
- Add a DB-driven changelog generation capability (sessions/plans/events -> milestone markdown).
- Add a thin CLI adapter for immediate human/CI usage.
- Keep core generation logic reusable for future web UI.
- Shift workflow guidance from manual changelog maintenance to on-demand generation.
- Keep compatibility behavior for legacy changelog artifacts during transition.

## Impact
- Affected specs: `db-generated-changelog` (new capability)
- Affected code/docs (planned):
  - `lib/core/*` (changelog generation/classification)
  - `lib/commands/*` + CLI registration (thin command)
  - workflow docs referencing changelog maintenance
  - optional compatibility notes around `scripts/archive-changelog.js`
- Breaking change: No runtime API break intended; workflow default changes from manual-edit to DB-generated.
