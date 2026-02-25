---
id: "PLAN_agentic_hive_master_roadmap_arch_spec2_pivot"
title: "Agentic Hive Master Roadmap (ARCH_SPEC2 Pivot)"
status: "PLANNED"
author: "arno-paffen"
created: "2026-02-22"
---

# Implementation Plan: Agentic Hive Master Roadmap (ARCH_SPEC2 Pivot)

**Status:** 📋 PLANNED  
**Created:** 2026-02-22  
**Author:** arno-paffen

---

## 🎯 Goal

Transition the AIKnowSys ecosystem from a **Passive Knowledge Retrieval System** into an **Active, Sovereign Multi-Agent Firewall** (Agentic Hive Architecture). This pivot addresses the severe gaps identified in the audit by establishing a local runtime environment that polices external agents and enforces strictly defined Skill Contracts.

## Key Audit Gaps Addressed
- **Active Runtime:** Moving from passive MCP tools to a persistent background daemon.
- **Firewall Isolation:** Stripping direct root access from external agents and replacing it with "Intent Submission".
- **Closed-Loop Automation:** Transitioning from manual user intervention to automated Observer retries for `REVIEW_FAILED` events.
- **Local Sovereignty:** Orchestrating core logic through local Phi-3 inference.

## Requirements

- **Sovereignty:** No direct DB/API access for external agents (Zero Schema Exposure).
- **Mediation:** All execution must pass through a local Mediator using "Intent Aliases".
- **Governance:** Explicit HITL gates for Plan Approval and Logic Review.
- **Resilience:** Automated failure detection (Observer) and retry loops based on `REVIEW_FAILED` events.
- **Optimization:** Distillation of primary reasoning to local models (Phi-3).

## Implementation Steps

### Phase 1: The Local Daemon (Mediator/Observer)
**Action:**
- Establish a persistent background service (Node.js/Rust) to orchestrate agent processes.
- Implement an Event Listener that monitors the SQLite `knowledge_events` table in real-time.
- Create core `Mediator` class with exclusive credentials to DB/API layers.

### Phase 2: Intent-Based Tooling (The Firewall)
**Action:**
- Deprecate direct filesystem and shell tools within the MCP server.
- Implement `submit_intent` and `request_review` tools as the primary interaction layer for external agents.
- Enforce **Zero Schema Exposure**: Strip all table and column names from external builder contexts.

### Phase 3: The Sovereign Reviewer
**Action:**
- Port the logic from `Reviewer (Quality Assurance)` to audit proposed changes against the Dynamic Invariant Matrix.
- Implement logic to block `Mediator` execution until a `REVIEW_PASSED` event is logged and human approval is received at Gate 2.

### Phase 4: Automated Failure Recovery (The Loop)
**Action:**
- Implement the `Observer` loop: `REVIEW_FAILED` event → Fetch Review context → Auto-ping Builder.
- Implement automated escalation to `HUMAN_INTERVENTION` after 3 failed attempts.

### Phase 5: Local Inference Bridge (Phi-3)
**Action:**
- Integrate local inference (e.g., via `ollama`) to run the Mediator logic.
- Port final execution "intent distillation" from GPT-4.1 to a local Phi-3 model to eliminate external dependencies for core business logic.

## Testing & Validation

### Phase-Gate Validation
- Each phase must pass a specialized `Architect Review` session before moving to the next.
- Verify Mediator isolation: ensure no external calls can bypass the intent alias layer.

### Manual Verification
- Execute a sample feature request (e.g., "Add a field to X") and verify both HITL gates trigger correctly.
- Simulate a code failure and verify the Observer triggers an autonomous retry loop.
