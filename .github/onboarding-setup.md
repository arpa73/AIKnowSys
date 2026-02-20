# AIKnowSys Onboarding Setup (AI-Native)

Use this guide to onboard projects conversationally without `init`, `scan`, or `migrate` commands.

## Goal

Set up AIKnowSys by conversation, using sensible defaults and MCP tools as source of truth.

## 1) Detect Project Type

Inspect common manifest files:

- `package.json` → Next.js, React, Vue, Express, Nest
- `pyproject.toml` or `requirements.txt` → FastAPI, Django, Flask
- `Cargo.toml` → Rust (Axum, Actix)
- `go.mod` → Go projects
- `terraform/*.tf`, `terragrunt.hcl` → Terraform/IaC
- `ansible.cfg` or `playbooks/*.yml` → Ansible
- `Chart.yaml` / `kustomization.yaml` → Kubernetes/Helm/Kustomize
- `docker-compose.yml` → Docker Compose stacks

If detection is unclear, ask the user one direct question and proceed.

## 2) Load Runtime Context via MCP

Always start with:

1. `mcp_aiknowsys_get_critical_invariants()`
2. `mcp_aiknowsys_get_active_plans()`
3. `mcp_aiknowsys_get_recent_sessions({ days: 7 })`

For validation commands, call `mcp_aiknowsys_get_validation_matrix()`.

## 3) Create/Update Core Files

Create only what is needed:

- `AGENTS.md`
- `.aiknowsys/` storage structure (database-first)
- optional `.aiknowsys.config` if project uses feature flags

Do not create stack-specific ESSENTIALS templates.

## 4) Use Context7 for Current Framework Guidance

Before giving framework-specific implementation instructions:

- Resolve library id via `mcp_context7_resolve-library-id`
- Query docs via `mcp_context7_query-docs`

Fallback: if docs are unavailable, use conservative generic defaults and ask one clarifying question.

## 5) Conversational Customization

Offer minimal choices:

- validation commands
- project-specific invariants
- preferred workflows (TDD strictness, review cadence)

If user says “use defaults”, proceed immediately and start implementation.

## 6) Learning Mode

As work progresses:

- append meaningful progress into session context
- capture reusable patterns in learned patterns storage
- keep changelog entries only for milestones

## Example Stack References (guidance only)

### Web App
- Next.js + TypeScript + Tailwind
- Vue + Vite + Pinia
- SvelteKit + TypeScript
- React + Vite

### API/Backend
- Express + TypeScript
- FastAPI + Pydantic
- Django REST Framework
- Axum + Tokio

### DevOps / IaC
- Terraform (AWS/GCP/Azure)
- Ansible
- Kubernetes (Helm/Kustomize)
- Docker Compose

## Example Conversation

Human: “Initialize AIKnowSys for this FastAPI service.”

AI:
1. Detects `pyproject.toml` + FastAPI dependencies
2. Loads MCP invariants and recent context
3. Creates/updates `AGENTS.md` and database-first project context
4. Queries Context7 for latest FastAPI patterns
5. Confirms setup: “Setup complete. Build auth endpoints next?”

## Success Criteria

- No dependency on `init`, `scan`, `migrate`
- Setup completed through conversation
- MCP context loaded before implementation
- Validation matrix used before completion claims
