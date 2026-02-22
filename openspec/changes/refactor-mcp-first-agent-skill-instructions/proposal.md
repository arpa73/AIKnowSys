# Change: Refactor Agent and Skill Instructions to MCP-First Workflow

## Why
Current agent and skill instructions mix MCP-first guidance with filesystem and direct file-edit workflows. This creates inconsistent behavior, increases context drift, and weakens the database-first operating model.

## What Changes
- Update agent instruction files to require MCP query/mutation tools as the default path.
- Update skill documentation to use MCP-first examples for context retrieval and mutation.
- Update Antigravity workflow docs in `.agents/workflows/*.md` to align with MCP-first execution rules.
- Update Codex role skills in `~/.codex/skills/{developer-agent-workflow,architect-agent-review,planner-agent-workflow}/SKILL.md` to align with MCP-first rules.
- Keep concise CLI/file fallback guidance only for MCP-unavailable scenarios.
- Align `.github/*` sources and `templates/*` deliverables to avoid drift.

## Impact
- Affected specs: `mcp-agent-skill-workflows` (new capability)
- Affected code/docs:
  - `.github/agents/*.agent.md`
  - `templates/agents/*.agent.template.md`
  - `.agents/workflows/*.md`
  - `.github/skills/**/SKILL.md`
  - `templates/skills/**/SKILL.md`
  - `~/.codex/skills/{developer-agent-workflow,architect-agent-review,planner-agent-workflow}/SKILL.md` (operational environment artifact)
  - `.github/agents/USAGE.txt`, `.github/skills/README.md`, `templates/AGENTS.template.md` references
- Breaking change: No runtime API break expected; instruction behavior and authoring standards change.
