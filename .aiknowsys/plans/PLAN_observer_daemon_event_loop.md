---
id: "PLAN_observer_daemon_event_loop"
title: "Observer Daemon & Event Loop"
status: "PLANNED"
author: "arno-paffen"
created: "2026-02-22"
---

# Implementation Plan: Observer Daemon & Event Loop

**Status:** 📋 PLANNED  
**Created:** 2026-02-22  
**Author:** arno-paffen

---

## 🎯 Goal

Transition AIKnowSys from a passive request-response system to an **Active Hive** by implementing a background daemon that monitors the event store and orchestrates autonomous recovery loops.

## Requirements

- **Persistence:** A background process (daemon) that runs independently of the MCP server.
- **Event Monitoring:** Real-time tailing of the `knowledge_events` table (SQLite).
- **Automation:** Automatic re-triggering of agent processes upon `REVIEW_FAILED` events without manual user input.

## Implementation Steps

### Step 1: Daemon Core
- Implement a persistent Node.js service using `pm2` or a simple systemd unit.
- Create an `EventTailer` that polls or uses SQLite triggers/WAL mode for low-latency event detection.

### Step 2: Logic Loop Orchestration
- Implement the "Failure Handling" logic from ARCH_SPEC2:
  - Detect `REVIEW_FAILED`.
  - Extract the `Review_ID` and violation details.
  - Automatically re-spawn the Builder agent with the correction context.

### Step 3: Escalation Logic
- Implement a retry counter (max 3).
- Emit a `HUMAN_INTERVENTION_REQUIRED` event and notify the user when retries are exhausted.

## Testing & Validation

### Loop Verification
- Log a manual `REVIEW_FAILED` event in the DB and verify the daemon automatically triggers a response.
- Verify the daemon correctly escalates to the user after 3 simulated failures.
