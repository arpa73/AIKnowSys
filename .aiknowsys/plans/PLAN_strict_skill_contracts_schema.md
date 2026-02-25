---
id: "PLAN_strict_skill_contracts_schema"
title: "Strict Skill Contracts Schema"
status: "PLANNED"
author: "arno-paffen"
created: "2026-02-22"
---

# Implementation Plan: Strict Skill Contracts Schema

**Status:** 📋 PLANNED  
**Created:** 2026-02-22  
**Author:** arno-paffen

---

## 🎯 Goal

Move from human-readable Markdown skills to **Machine-Enforceable JSON Skill Contracts**. This ensures that agents cannot "overlook" invariants and that the Reviewer can programmatically validate compliance.

## Requirements

- **Schema:** Strict JSON Schema for all skill definitions.
- **Invariants:** Every skill must define a list of non-negotiable Invariants.
- **Binding:** The Mediator must bind a specific Skill Contract to every execution intent.

## Implementation Steps

### Step 1: Schema Definition
- Define the `SkillContract` JSON schema (ref: `ARCH_SPEC2.md` Section 4).
- Create a migration path to convert existing `.md` skills to the new JSON format.

### Step 2: Contract Enforcement Wrapper
- Implement a `ContractValidator` that checks proposed code changes against the `invariants` array in the active contract.
- Force all `Knowledge Event` logging to include the `skill_id`.

### Step 3: Tool Integration
- Update `find_skill_for_task` to return the strict contract schema instead of raw markdown.

## Testing & Validation

### Compliance Tests
- Attempt to submit an intent that violates a contract invariant and verify the `Reviewer` blocks it.
- Verify the `Simulator` correctly rejects malformed Skill Contract JSON.
