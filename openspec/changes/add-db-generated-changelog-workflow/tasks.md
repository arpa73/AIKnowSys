## 1. Scope & Validation Setup
- [x] 1.1 Confirm milestone extraction policy (release, breaking, architecture, critical security)
- [x] 1.2 Validate proposal: `openspec validate add-db-generated-changelog-workflow --strict`

## 2. Core Generation Capability
- [x] 2.1 Implement pure core generator (SQLite -> milestone model -> markdown)
- [x] 2.2 Implement deterministic ordering/grouping and empty-state behavior
- [x] 2.3 Add milestone classifier with explicit inclusion/exclusion rules

## 3. Thin CLI Adapter
- [x] 3.1 Add CLI command wrapper for changelog generation
- [x] 3.2 Support non-interactive options (`--from`, `--to`, `--limit`, `--output`, `--dry-run`)
- [x] 3.3 Ensure graceful failures when DB or project context is missing

## 4. Legacy Workflow Cleanup
- [x] 4.1 Update docs to make DB-generated changelog the default workflow
- [x] 4.2 Keep legacy markdown/archive behavior documented as compatibility path
- [x] 4.3 Remove contradictory guidance that implies manual changelog is primary source

## 5. TDD & Validation
- [x] 5.1 RED: add failing tests for classifier, rendering, and command behavior
- [x] 5.2 GREEN: implement minimum code to satisfy tests
- [x] 5.3 REFACTOR: isolate classifier/renderer boundaries and simplify command adapter
- [x] 5.4 Run validation: `npm test`, `npm run lint`, and deliverables validation when templates/docs change

## 6. Completion
- [x] 6.1 Capture evidence in session/plan notes
- [x] 6.2 Request architect review before completion
