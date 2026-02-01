# Implementation Plan: Document Custom Agent Model/Tool Customization

**Status:** ✅ COMPLETE  
**Created:** 2026-02-01  
**Completed:** 2026-02-01  
**Goal:** Add clear documentation for customizing custom agents’ `model` and `tools` fields (and related frontmatter) without breaking the workflow or creating mismatched examples.

## Background
We already document how to customize agent *instructions* (review criteria / coding standards), but we do not clearly document how to tweak the YAML frontmatter fields like:
- `model:` (which model the agent uses)
- `tools:` (capabilities granted to the agent)

We also have a minor doc inconsistency: some docs reference `.github/agents/README.md`, but the installed doc is `.github/agents/USAGE.txt` (by design, to avoid VS Code treating a `.md` file as an agent).

## Requirements
- Explain where to edit agents in an installed project (`.github/agents/*.agent.md`).
- Explain where to edit the *defaults* in this repo (`templates/agents/*.agent.template.md`).
- Document `model` and `tools` with:
  - practical examples that match this repo’s templates
  - guardrails (keep minimal tool permissions; tradeoffs)
  - troubleshooting for “can’t read essentials / can’t write review file” failures
- Fix references pointing to a non-existent `.github/agents/README.md` where appropriate, switching them to `.github/agents/USAGE.txt`.

## Proposed Documentation Changes

### 1) Update installed agent usage doc
**File:** `templates/agents/USAGE.txt`

**Add section:** “Customizing `model` and `tools`” under **Configuration**.

**Content to include:**
- **`model`**
  - What it does (selects model for that agent)
  - Recommendation: keep consistent across the workflow unless you have a reason
  - Note: host environments may ignore/override this setting
- **`tools`**
  - What it does (capabilities boundary)
  - Recommendation: least privilege
  - Recommended defaults matching templates:
    - Developer: `['search', 'edit/editFiles', 'edit/createFile']`
    - SeniorArchitect: `['search', 'edit/editFiles', 'edit/createFile']` (needs edit tools to write `.aiknowsys/PENDING_REVIEW.md` and update sessions)
    - Planner: keep broader set only if you want planning automation (matches template)
  - Tradeoffs: if you remove edit tools from Architect, it can’t write the review artifact; if you remove `search`, it can’t read essentials.
- **Examples** showing the frontmatter snippet exactly as used in this repo (YAML list format).

### 2) Update the customization guide
**File:** `docs/customization-guide.md`

**Update section:** “### 4. Custom Agents”

**Add a subsection:** “Frontmatter fields: model and tools (advanced)”

**Clarify:**
- In *your project*, edit `.github/agents/developer.agent.md` / `architect.agent.md` / `planner.agent.md`.
- In *this template repo*, edit `templates/agents/*.agent.template.md` to change what gets installed by `install-agents` / `init`.

**Add a short table**:
- Field: `name`, `description`, `argument-hint`, `tools`, `model`, `handoffs`
- What it controls
- Common pitfalls

### 3) Update top-level README pointers
**File:** `README.md`

**Add 2-3 bullets** near the “Customize Agent Review Criteria” section:
- Mention `model` and `tools` customization.
- Link to the customization guide section.

### 4) Fix incorrect doc references
**Files to search/update:**
- `templates/AGENTS.template.md` (currently points to `.github/agents/README.md`)
- `docs/copilot-memory-comparison.md` (same)
- Any other docs referencing `.github/agents/README.md`

**Replace with:** `.github/agents/USAGE.txt`

## Testing / Validation
Docs-only changes still require basic validation to avoid regressions:
- `npm test`
- `node bin/cli.js --help`
- Quick manual spot-check: `npx aiknowsys init` output includes correct “See …USAGE.txt” pointer (if we change that line).

## Risks & Mitigations
- **Risk:** Tool names differ across hosts/versions.
  - **Mitigation:** Phrase guidance as “for VS Code Copilot custom agents”, keep examples aligned with the repo’s shipped templates, and link to official VS Code custom agent docs.
- **Risk:** Confusion between editing template vs installed project.
  - **Mitigation:** Add explicit “Where to edit” callout (installed vs template).

## Success Criteria
- [ ] `templates/agents/USAGE.txt` explicitly documents `model` + `tools` with correct examples.
- [ ] `docs/customization-guide.md` includes clear “advanced” section for model/tools.
- [ ] `README.md` points users to the right doc.
- [ ] No docs reference `.github/agents/README.md` unless that file is actually installed.
- [ ] Validation commands pass.

## Notes for Developer
- Keep examples consistent with the actual template frontmatter in `templates/agents/*.agent.template.md`.
- Avoid adding a `.md` doc into `.github/agents/` unless we confirm it doesn’t pollute the agent picker (existing design prefers `USAGE.txt`).
