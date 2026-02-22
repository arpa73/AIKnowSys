## Context
Agent and skill instructions currently contain mixed paradigms:
- MCP-first query/mutation guidance
- legacy direct file operations and path-specific edits

This inconsistency causes workflow ambiguity and undermines database-backed context operations.

## Goals / Non-Goals
- Goals:
  - Standardize instructions around MCP-first operations
  - Retain minimal fallback path for MCP-unavailable scenarios
  - Keep templates and non-template sources synchronized
  - Keep Antigravity workflows and Codex role skills aligned with the same MCP-first behavior
- Non-Goals:
  - Replacing CLI runtime behavior
  - Removing all CLI docs from the project

## Decisions
- Decision: MCP tools are the normative workflow for agent and skill instructions.
  - Rationale: Structured validation, performance, consistency, and reduced context ambiguity.
- Decision: Filesystem/CLI guidance remains only as explicit fallback sections.
  - Rationale: Operational resilience when MCP is unavailable.
- Decision: Template parity is a release gate.
  - Rationale: Deliverables consistency invariant.
- Decision: Cross-surface parity includes Antigravity workflow files and Codex local role skills.
  - Rationale: Role behavior is consumed through multiple entry points; drift creates inconsistent execution.

## Risks / Trade-offs
- Risk: Overly strict MCP wording may reduce usability in constrained environments.
  - Mitigation: Include concise fallback instructions in each migrated guide.
- Risk: Migration incompleteness leaves contradictory guidance.
  - Mitigation: Repository-wide grep checklist and explicit sign-off criteria.
- Risk: Template/source drift.
  - Mitigation: `npx aiknowsys validate-deliverables` required.

## Migration Plan
1. Update agent docs and templates first (highest behavior impact).
2. Update `.agents/workflows/*` to match MCP-first agent semantics.
3. Update core skills (`context-query`, `context-mutation`, `pattern-sharing`) and templates.
4. Update Codex local role skills in `~/.codex/skills/*agent*`.
5. Update remaining affected skill docs and supporting usage references.
6. Run validation suite and fix findings.

## Open Questions
- Should any role-specific docs keep stronger CLI fallback than others?
- Should we codify a single MCP-unavailable fallback snippet to reuse across all skills?
