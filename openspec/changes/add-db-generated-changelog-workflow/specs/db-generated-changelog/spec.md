## ADDED Requirements

### Requirement: DB-Driven Changelog Generation
The system SHALL generate changelog output from SQLite-backed project context without requiring manual changelog authoring.

#### Scenario: Generate milestone changelog from database
- **WHEN** a user invokes changelog generation for a project
- **THEN** the output is derived from SQLite sessions/plans/events
- **AND** no manual edits to `CODEBASE_CHANGELOG.md` are required to produce current output

#### Scenario: Handle missing or empty milestone data gracefully
- **WHEN** no qualifying milestone entries exist in the selected range
- **THEN** generation completes successfully with an explicit empty-state message
- **AND** does not fail with a stack trace

### Requirement: Milestone-Only Inclusion Policy
The generated changelog SHALL include only milestone-grade entries by policy.

#### Scenario: Include milestone-grade changes
- **WHEN** entries represent release, breaking change, major architecture change, or critical security fix
- **THEN** they are included in generated changelog output

#### Scenario: Exclude routine daily work
- **WHEN** entries represent routine feature progress, bugfix churn, or ordinary session notes
- **THEN** they are excluded from milestone changelog output by default

### Requirement: Thin CLI with Reusable Core
A CLI command SHALL expose the generation workflow while reusing a core generator suitable for future UI/API surfaces.

#### Scenario: CLI uses core generator
- **WHEN** the CLI command is executed
- **THEN** it delegates to shared core generation logic
- **AND** command-specific code is limited to argument parsing, IO, and formatting concerns

#### Scenario: Future surface reuse is preserved
- **WHEN** a future web interface is implemented
- **THEN** it can reuse the same core generation function without duplicating milestone extraction logic

### Requirement: Legacy Workflow Compatibility During Transition
Legacy changelog-related artifacts SHALL remain operable during transition while DB-generated output becomes the default workflow.

#### Scenario: Legacy artifact workflows remain available
- **WHEN** users still rely on legacy changelog/archive scripts
- **THEN** those scripts continue to function for existing markdown artifacts
- **AND** guidance clearly marks them as compatibility workflows, not primary source-of-truth
