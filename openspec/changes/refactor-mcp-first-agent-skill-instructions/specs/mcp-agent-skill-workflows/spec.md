## ADDED Requirements

### Requirement: MCP-First Agent Workflow Instructions
Agent instruction documents SHALL define MCP query/mutation tools as the default mechanism for context retrieval, mutation, and workflow state transitions.

#### Scenario: Agent instructions define MCP as default path
- **WHEN** a developer reads an agent instruction file
- **THEN** the document states MCP tools as the primary method for querying and mutating plan/session/pattern context
- **AND** direct filesystem instructions are not presented as the default path

#### Scenario: Fallback guidance is explicit and bounded
- **WHEN** MCP is unavailable in the runtime environment
- **THEN** the instruction includes a clearly marked fallback section
- **AND** fallback guidance is limited to necessary CLI/file operations only

### Requirement: Cross-Surface Role Workflow Consistency
All role workflow entry points SHALL express the same MCP-first default behavior.

#### Scenario: Antigravity workflows align with agent rules
- **WHEN** `.agents/workflows/*.md` defines planner/developer/architect workflows
- **THEN** those workflows specify MCP-first query/mutation behavior
- **AND** they do not prescribe filesystem-first operations as defaults

#### Scenario: Codex role skills align with repository role workflows
- **WHEN** Codex role skills in `~/.codex/skills/*agent*` are used
- **THEN** they reflect the same MCP-first defaults as repository agent/skill instructions
- **AND** fallback guidance matches repository policy boundaries

### Requirement: MCP-First Skill Guidance
Skill documentation SHALL provide MCP-first examples for context query and mutation workflows.

#### Scenario: Skills use MCP examples for context operations
- **WHEN** a user reads a skill for context operations
- **THEN** MCP examples appear as the primary guidance for querying plans/sessions/patterns
- **AND** legacy filesystem edits are either removed or moved to fallback sections

#### Scenario: Skills avoid contradictory workflow instructions
- **WHEN** multiple skills reference the same workflow category
- **THEN** they consistently describe MCP-first behavior
- **AND** they do not conflict on default mechanism (MCP vs filesystem)

### Requirement: Template and Source Instruction Parity
Template instruction files SHALL remain consistent with their non-template source equivalents for MCP-first workflow requirements.

#### Scenario: Deliverables validation enforces parity
- **WHEN** agent/skill source instructions are updated
- **THEN** corresponding template instructions are updated in the same change
- **AND** deliverables validation passes before completion
