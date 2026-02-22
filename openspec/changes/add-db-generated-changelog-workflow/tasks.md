## 1. Scope & Validation Setup
- [ ] 1.1 Confirm milestone extraction policy (release, breaking, architecture, critical security)
- [ ] 1.2 Validate proposal: `openspec validate add-db-generated-changelog-workflow --strict`

## 2. Core Generation Capability
- [ ] 2.1 Implement pure core generator (SQLite -> milestone model -> markdown)
- [ ] 2.2 Implement deterministic ordering/grouping and empty-state behavior
- [ ] 2.3 Add milestone classifier with explicit inclusion/exclusion rules

## 3. Thin CLI Adapter
- [ ] 3.1 Add CLI command wrapper for changelog generation
- [ ] 3.2 Support non-interactive options (`--from`, `--to`, `--limit`, `--output`, `--dry-run`)
- [ ] 3.3 Ensure graceful failures when DB or project context is missing

## 4. Legacy Workflow Cleanup
- [ ] 4.1 Update docs to make DB-generated changelog the default workflow
- [ ] 4.2 Keep legacy markdown/archive behavior documented as compatibility path
- [ ] 4.3 Remove contradictory guidance that implies manual changelog is primary source

## 5. TDD & Validation
- [ ] 5.1 RED: add failing tests for classifier, rendering, and command behavior
- [ ] 5.2 GREEN: implement minimum code to satisfy tests
- [ ] 5.3 REFACTOR: isolate classifier/renderer boundaries and simplify command adapter
- [ ] 5.4 Run validation: `npm test`, `npm run lint`, and deliverables validation when templates/docs change

## 6. Completion
- [ ] 6.1 Capture evidence in session/plan notes
- [ ] 6.2 Request architect review before completion
