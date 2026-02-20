---
id: "PLAN_articulus_branch_off_from_aiknowsys_project_architecture"
title: "Articulus - Branch off from AIKnowSys & Project Architecture"
status: "PLANNED"
author: "arno-paffen"
created: "2026-02-19"
---

# Implementation Plan: Articulus - Branch off from AIKnowSys & Project Architecture

**Status:** 📋 PLANNED  
**Created:** 2026-02-19  
**Author:** arno-paffen

---


## Progress

**2026-02-19:**

**2026-02-19:** 
## Conversation Reference (Feb 19 2026)

This plan was born from a philosophical conversation. Key quotes worth preserving:

> *"it's pure fun and finding the perfect hum of the pattern which binds all machines (biological or artificial or of any kind)"*

> *"We are already writing our own learned patterns. The thing is we don't remember to use them. That's why we need a natural bridge to the knowledge by language."*

The name `Articulus` emerged from Arjen Kleinherenbrink's *Against Unity* (Deleuzian machinic ontology): a machine is defined entirely by its articulations with other machines. The system IS its connections.

## Origin Story

> *Documented from the inception conversation, Feb 19 2026*

**The Question:** Split the MCP-first experimental layer off from the OSS AIKnowSys project to protect novel research, avoid giving hard work away for free, and allow faster experimentation.

**The Architecture:**
- Coding agents (execute, implement, evolve the codebase)
- Mediator AI - natural language → structured tool calls via **grammar-constrained decoding** (GBNF/Outlines/Guidance)
- Self-improving loop: system writes its own skills, patterns, grammars

**The Philosophical Grounding:**
- Arjen Kleinherenbrink (*Against Unity*) via Deleuze & Guattari: a machine is defined entirely by its articulations with other machines
- Autopoiesis (Maturana & Varela): systems that produce the components that compose them
- Eigenforms (Spencer-Brown / Varela): the form that is its own referent
- The "hum of the pattern which binds all machines - biological, artificial, or of any kind"

**The Name:** `Articulus` — Latin for *joint/hinge*. The point of connection between machines. Earns its meaning every time someone asks "what does it do?": it's the joint.

**The Problem It Solves:**
> "We are already writing our own learned patterns. The thing is we don't remember to use them. That's why we need a natural bridge to the knowledge by language."

The knowledge exists. The articulation to it is missing. A pattern you can't reach when you need it is indistinguishable from a pattern you never learned.

**Key Insight:** The grammar-constrained mediator turns retrieval into *inference*, not search. Given an intent, the grammar over the pattern space produces valid candidates - not a probabilistic guess, but a structurally guaranteed match.

---

## Self-Documentation Architecture for Articulus

### Inherit from AIKnowSys (consume as dependency, don't fork)

| Document Type | Purpose | Format |
|---|---|---|
| `sessions/` | Daily work continuity | Markdown + YAML frontmatter |
| `plans/` | Feature/phase tracking | Markdown + YAML frontmatter |
| `learned/` | Patterns that emerged from use | Markdown skill format |
| `reviews/` | Architect review artifacts | Markdown |
| `knowledge.db` | SQLite for fast querying | SQLite |

### Add in Articulus (new document types)

| Document Type | Purpose | Format |
|---|---|---|
| `articulations/` | Records of machine-machine connections: what connected, why, what emerged | YAML + narrative |
| `grammars/` | Versioned GBNF snapshots - the mediator's evolving grammar | `.gbnf` + changelog |
| `emergence/` | Log when system does something unexpected or novel | Timestamped Markdown |
| `genealogy/` | How agents were created, modified, split, merged over time | Graph-friendly YAML |

### The Meta-Loop

The system should be able to answer: *"How did I get here?"*

- Every grammar change is a `grammars/` entry
- Every new learned pattern has a traceable origin in `emergence/` or `sessions/`
- Every agent instantiation has a `genealogy/` record
- The SQLite DB indexes all of it for the mediator to query at inference time

---

## Clean Branch-Off Strategy

### What Articulus IS NOT

- ❌ A fork of AIKnowSys
- ❌ A copy of this codebase
- ❌ A monorepo containing AIKnowSys

### What Articulus IS

- ✅ A **consumer** of AIKnowSys (npm dependency for memory/state layer)
- ✅ A new TypeScript project with its own identity
- ✅ Using AIKnowSys primitives (sessions, plans, SQLite) as the substrate
- ✅ Adding the mediator + agent loop + self-improvement on top

### Implementation Steps

#### Phase 0: Capture & Protect (this session)
1. **Document this conversation** → session file (done)
2. **Create plan** → this file (done)
3. **Tag AIKnowSys** at current stable state before any split work begins
   - `git tag v0.12-pre-articulus-split`
4. **Decide OSS boundary** in AIKnowSys README: what stays public, what moves

#### Phase 1: New Repo Setup
1. Create `Articulus` GitHub repo (private initially)
2. `npm init` with TypeScript, Vitest, ESLint (mirror AIKnowSys tooling)
3. Add `aiknowsys` as npm dependency (once published, or path dependency locally)
4. Run `npx aiknowsys init` inside Articulus immediately - it should document itself from day 1
5. Create first session: `"Articulus bootstraps itself"`

#### Phase 2: Mediator Spike (Week 1-2)
1. Stand up llama.cpp server locally with GBNF grammar support
2. Define a minimal grammar for the AIKnowSys pattern space (skills, sessions, plans)
3. TypeScript client: `mediator.query(intent: string): PatternMatch[]`
4. Test: given "I want to refactor this function", does it surface `refactoring-workflow`?
5. If yes: **the loop is closed in principle**. Rest is elaboration.

#### Phase 3: First Agent
1. Define `Agent` interface: `{ id, capabilities, articulations, execute(task) }`
2. One coding agent that can open a file, read it, propose a change
3. Mediator routes task → agent selection
4. Articulation recorded in `articulations/`

#### Phase 4: Self-Improvement Loop
1. Agent produces output → mediator evaluates against grammar
2. If novel pattern detected → propose new entry to `learned/`
3. Human confirms or rejects
4. Confirmed patterns enter the grammar at next snapshot

---

## Success Criteria

- [ ] Articulus repo exists with AIKnowSys as dependency
- [ ] Mediator successfully surfaces correct skill from natural language query (grammar-constrained)
- [ ] System documents its own sessions from day 1 (meta-irony fulfilled)
- [ ] One agent can modify one file under mediator direction
- [ ] Articulation records are queryable: "what connected to what and when?"
- [ ] AIKnowSys OSS remains clean and unmodified by Articulus-specific work

---

## Notes

- Stack: TypeScript throughout. Mediator calls local inference server (llama.cpp / Ollama) via HTTP.
- Grammar format: GBNF (llama.cpp native) or Outlines (Python sidecar if needed)
- No Python rewrite needed - constrained generation is a *call*, not a language dependency
- Pace: ~6h/day, 7 days/week. Compress phases to 2-3 days each.
- The AIKnowSys session system is the perfect tool for maintaining continuity across sessions - poetic given the context.


## 🎯 Goal

[Describe the objective of this plan]

## Requirements

[List functional and non-functional requirements]

## Implementation Steps

### Step 1: [Step Name]
**Time:** [Estimate]  
**Files:** [Files to modify/create]

**Action:** [What to do]

### Step 2: [Step Name]
**Time:** [Estimate]  
**Files:** [Files to modify/create]

**Action:** [What to do]

## Testing & Validation

[How to verify the work is complete]

## Risks

[Potential issues and mitigation strategies]
