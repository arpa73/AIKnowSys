## 1. OpenSpec and Scope Setup
- [ ] 1.1 Confirm scope boundaries and fallback policy (MCP default, CLI/file fallback only)
- [ ] 1.2 Validate this proposal with `openspec validate refactor-mcp-first-agent-skill-instructions --strict`

## 2. Agent Instruction Migration
- [ ] 2.1 Update `.github/agents/developer.agent.md` to MCP-first context/mutation/review flow
- [ ] 2.2 Update `.github/agents/architect.agent.md` to MCP-first compliance/review persistence flow
- [ ] 2.3 Update `.github/agents/planner.agent.md` to MCP-first planning/context flow
- [ ] 2.4 Mirror equivalent updates in `templates/agents/*.agent.template.md`
- [ ] 2.5 Update `.agents/workflows/{plan-feature,develop-feature,architect-review}.md` to MCP-first language and handoff expectations
- [ ] 2.6 Remove contradictory filesystem-first directives from agent usage docs

## 3. Skill Migration
- [ ] 3.1 Migrate `.github/skills/context-query/SKILL.md` to MCP-first examples and decision tree
- [ ] 3.2 Migrate `.github/skills/context-mutation/SKILL.md` to MCP mutation tool-first examples
- [ ] 3.3 Migrate `.github/skills/pattern-sharing/SKILL.md` to MCP pattern creation flow
- [ ] 3.4 Migrate other affected skills that prescribe direct `.aiknowsys/*` edits
- [ ] 3.5 Mirror equivalent updates in `templates/skills/**/SKILL.md`
- [ ] 3.6 Update Codex role skills in `~/.codex/skills/{developer-agent-workflow,architect-agent-review,planner-agent-workflow}/SKILL.md`

## 4. Consistency and Validation
- [ ] 4.1 Run repository grep checks for deprecated filesystem-first guidance in active agent/skill docs
- [ ] 4.2 Run `node bin/cli.js --help`
- [ ] 4.3 Run targeted command help checks for touched CLI documentation references
- [ ] 4.4 Run `npx aiknowsys validate-deliverables`
- [ ] 4.5 Verify Codex role skills in `~/.codex/skills` reflect the same MCP-first rules as repo sources
- [ ] 4.6 Resolve all validation issues and re-run until green

## 5. Review and Completion
- [ ] 5.1 Ensure success criteria are evidenced in plan/session notes
- [ ] 5.2 Request architect review before marking plan complete
