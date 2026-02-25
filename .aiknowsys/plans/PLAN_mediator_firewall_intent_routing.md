---
id: "PLAN_mediator_firewall_intent_routing"
title: "Mediator Firewall & Intent Routing"
status: "PLANNED"
author: "arno-paffen"
created: "2026-02-22"
---

# Implementation Plan: Mediator Firewall & Intent Routing

**Status:** 📋 PLANNED  
**Created:** 2026-02-22  
**Author:** arno-paffen

---

## 🎯 Goal

Implement the "Firewall" layer that separates external creative agents from sovereign system resources. This plan focuses on restricting tool access and routing all modification requests through a central Mediator.

## Requirements

- **Isolation:** External agents (Builders) must have NO direct access to `run_command`, `write_to_file`, or raw SQL.
- **Protocol:** Interaction must use "Intent Aliases" (e.g., `submit_intent`).
- **Schema Protection:** Zero exposure of SQLite table schemas or sensitive file paths to external contexts.

## Implementation Steps

### Step 1: Intent Registry
- Create an `IntentRegistry` defining all allowed operations (e.g., `CREATE_SESSION`, `UPDATE_PLAN`, `ADD_SKILL`).
- Map these intents to specific `Mediator` methods.

### Step 2: MCP Tool Deprecation
- Refactor the current MCP server to remove/hide "destructive" tools from external agents.
- Replace them with a single `submit_intent_gate` tool.

### Step 3: Zero Schema Exposure (ZSE)
- Implement a filtering layer for the `query_` tools that strips schema metadata.
- Ensure only intentional data is returned to the creative tier.

## Testing & Validation

### Security Audit
- Attempt to execute a direct `write_to_file` call from an external agent and verify it is blocked.
- Verify the builder agent cannot see the SQLite schema via standard introspection.

### Manual Verification
- Submit a "Plan Update" intent and verify the Mediator executes it correctly.
