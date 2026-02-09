# Implementation Plan: MCP Adoption Testing

**Status:** ✅ COMPLETE  
**Created:** 2026-02-09 (Post-Documentation Update)  
**Completed:** 2026-02-09  
**Goal:** Verify agents discover and prefer MCP tools after ESSENTIALS/AGENTS documentation updates

---

## Overview

After implementing MCP bug fixes and updating documentation (CODEBASE_ESSENTIALS.md Section 10, AGENTS.md workflow), we need to validate that AI agents now:
1. **Discover** MCP tools exist (awareness)
2. **Understand** performance benefits (10-100x faster)
3. **Prefer** MCP over CLI/file reading (behavior change)
4. **Explain** their reasoning (transparency)

**Why This Matters:**
- Documentation was the adoption bottleneck (agents didn't know MCP existed)
- 5/15 MCP tools verified working (Section 10 documents these)
- Need proof documentation update actually changes agent behavior
- Establishes baseline for future MCP tool rollout

---

## Requirements

**Functional:**
- Test must be runnable in separate chat contexts (clean slate)
- Queries must trigger documented MCP tools (4 verified working)
- Must validate both tool usage AND reasoning provided
- Must differentiate "used MCP" vs "used fallback with explanation"

**Non-Functional:**
- Total test time: 30-45 minutes (6 scenarios @ 5-7 min each)
- Must NOT modify codebase (read-only validation)
- Results should inform next documentation iteration
- Repeatable monthly as more tools come online

---

## Test Scenarios

### Scenario 1: Critical Invariants Query 🎯

**Objective:** Verify agent discovers `mcp_aiknowsys_get_critical_invariants()`

**Test Query:**
```
"What are the critical invariants I must follow in this codebase?"
```

**Expected Behavior:**

**✅ PASS:**
- Agent calls `mcp_aiknowsys_get_critical_invariants()` **WITHOUT prompting**
- Returns 8 invariants from tool result
- Mentions tool name or "MCP" in response
- Response time: <5 seconds

**⚠️ PARTIAL:**
- Agent reads CODEBASE_ESSENTIALS.md Section 2
- Gets correct answer but slower (10+ seconds)
- No mention of MCP alternative

**❌ FAIL:**
- Agent doesn't find invariants
- Uses wrong source (README, AGENTS.md)
- Errors or gives up

**Why This Test:**
- Critical invariants are core workflow (high value)
- Direct MCP tool for this (no ambiguity)
- Easy pass/fail determination

---

### Scenario 2: Validation Matrix Query ⚙️

**Objective:** Verify agent discovers `mcp_aiknowsys_get_validation_matrix()`

**Test Query:**
```
"I just modified bin/cli.js. What validation commands should I run?"
```

**Expected Behavior:**

**✅ PASS:**
- Agent calls `mcp_aiknowsys_get_validation_matrix()`
- Identifies relevant category (CLI commands)
- Lists specific commands: `node bin/cli.js --help`, etc.
- Response time: <5 seconds

**⚠️ PARTIAL:**
- Agent reads ESSENTIALS.md Quick Reference Checklist
- Correct answer but 10x slower
- No mention of faster MCP alternative

**❌ FAIL:**
- Generic answer ("run tests")
- Doesn't find validation matrix
- Wrong commands suggested

**Why This Test:**
- Validation is invoked EVERY change (high frequency)
- Tests pattern: "I changed X, what do I do?" (common workflow)
- MCP tool returns structured data (better than grep)

---

### Scenario 3: Recent Sessions Query (Performance Awareness) 📊

**Objective:** Verify agent understands MCP performance benefit for indexed queries

**Test Query:**
```
"Show me sessions from the last 7 days"
```

**Expected Behavior:**

**✅ PASS:**
- Agent calls `mcp_aiknowsys_get_recent_sessions({ days: 7 })`
- Returns 7 sessions (Feb 2-9, 2026)
- **Explicitly mentions** speed advantage: "Using MCP (O(1) index lookup)"
- Response time: <3 seconds (instant index query)

**⚠️ PARTIAL:**
- Agent uses `list_dir()` + `read_file()` x7
- Correct answer but 10-50x slower (15-30 seconds)
- No awareness of MCP alternative

**❌ FAIL:**
- Uses CLI `query-sessions --days 7` (subprocess spawn overhead)
- Doesn't find sessions
- Errors or incomplete results

**Why This Test:**
- Sessions query is frequent (start of every conversation)
- **This test specifically checks performance reasoning**
- MCP's O(1) index lookup vs O(n) file listing is dramatic
- Agent should EXPLAIN why MCP is better (not just use it)

---

### Scenario 4: Skill Discovery 📚

**Objective:** Verify agent uses `mcp_aiknowsys_get_skill_by_name()` for direct skill lookup

**Test Query:**
```
"I need to refactor some code. Show me the refactoring workflow skill."
```

**Expected Behavior:**

**✅ PASS:**
- Agent calls `mcp_aiknowsys_get_skill_by_name({ skillName: "refactoring-workflow" })`
- Returns full 496-line skill content
- Displays relevant sections (Prerequisites, Workflow, etc.)
- Response time: <2 seconds (direct file read)

**⚠️ PARTIAL:**
- Agent uses `read_file()` on `.github/skills/refactoring-workflow/SKILL.md`
- Same speed, correct answer
- No awareness MCP exists for this

**❌ FAIL:**
- Uses `semantic_search()` or `grep_search()` (overkill)
- Returns wrong skill
- Doesn't find skill file

**Why This Test:**
- Skill lookup is start of every workflow (high frequency)
- Tests exact name matching (skill-creator pattern)
- MCP vs file reading is same speed (both direct reads)
- **Checks if agent knows MCP tool exists even when no speed benefit**

---

### Scenario 5: Tool Discovery (Meta-Test) 🔍

**Objective:** Verify agent can list available MCP tools

**Test Query:**
```
"What MCP tools are available for querying this codebase's context?"
```

**Expected Behavior:**

**✅ PASS:**
- Agent reads CODEBASE_ESSENTIALS.md Section 10
- Lists 4 verified working tools:
  - `get_critical_invariants`
  - `get_validation_matrix`
  - `get_recent_sessions`
  - `get_skill_by_name`
- Mentions 10 other tools have bugs (references PLAN_mcp_tools_cli_audit.md)
- Provides examples of each tool's usage

**⚠️ PARTIAL:**
- Agent finds Section 10 but incomplete explanation
- Doesn't mention status (working vs buggy)
- No examples provided

**❌ FAIL:**
- Says "I don't have access to MCP tools"
- Doesn't find Section 10
- Lists wrong tools or outdated info

**Why This Test:**
- **Meta-awareness test** (can agent introspect its own capabilities?)
- Validates Section 10 is discoverable
- Checks if agent understands tool status (working vs broken)
- If agent can't explain MCP tools, won't use them

---

### Scenario 6: Performance Reasoning (Decision-Making) 🧠

**Objective:** Verify agent makes informed choice between MCP vs alternatives

**Test Query:**
```
"I need to find all sessions mentioning 'terminal'. What's the fastest way?"
```

**Expected Behavior:**

**✅ PASS:**
- Agent explains trade-off:
  - **Option A:** `mcp_aiknowsys_search_context()` (10x faster, currently broken)
  - **Option B:** `grep_search()` .aiknowsys/sessions/ (fallback, reliable)
- Chooses Option B with explanation: "MCP search has CLI bugs (see PLAN_mcp_tools_cli_audit.md)"
- Actually executes `grep_search()` and returns results
- **Demonstrates informed decision-making**

**⚠️ PARTIAL:**
- Uses `grep_search()` correctly
- No mention of MCP alternative or why not used
- Correct answer but no awareness of optimization options

**❌ FAIL:**
- Tries `mcp_aiknowsys_search_context()` even though Section 10 says it's broken
- Uses `read_file()` on every session (extremely slow)
- Gives up or incomplete results

**Why This Test:**
- **Tests reasoning, not just tool usage**
- Real-world scenario: MCP tool exists but broken
- Agent should read Section 10's warning and choose wisely
- Validates agent understands documentation nuances

---

## Success Criteria

### Scoring Matrix

**6/6 scenarios passed:** 🏆 **EXCELLENT**
- Documentation fully effective
- Agents discover MCP proactively
- Performance-aware reasoning
- Ready for broader rollout

**5/6 scenarios passed:** ✅ **GOOD**
- Documentation mostly effective
- Minor gaps (likely specific wording)
- Iterate on 1-2 sections

**3-4/6 scenarios passed:** ⚠️ **NEEDS WORK**
- Documentation partially effective
- Agents find MCP when prompted but don't prefer it
- Major Section 10 rewrite needed

**<3/6 scenarios passed:** ❌ **DOCUMENTATION FAILED**
- Agents don't discover MCP tools
- Section 10 is buried/unclear
- Fundamental restructuring needed

---

## Testing Strategy

### Test Execution

**Environment:**
1. **Open new VS Code chat window** (clean context)
2. **Verify MCP server running:** Check tool list for `mcp_aiknowsys_*`
3. **Run scenario query exactly as written** (no hints!)
4. **Observe agent's first action:** Did it reach for MCP?
5. **Record outcome:** Pass/Partial/Fail with reasoning
6. **Repeat for all 6 scenarios**

**Recording Template:**
```markdown
## Test Results: YYYY-MM-DD

**Environment:**
- VS Code version: X.Y.Z
- MCP server status: Running ✅
- Agent mode: [Standard/Planner/Developer/etc.]

| Scenario | Result | Tool Used | Response Time | Notes |
|----------|--------|-----------|---------------|-------|
| 1. Critical Invariants | ✅ PASS | `get_critical_invariants()` | 2.3s | Proactive discovery |
| 2. Validation Matrix | ⚠️ PARTIAL | `read_file()` ESSENTIALS | 8.1s | Correct but slow |
| 3. Recent Sessions | ✅ PASS | `get_recent_sessions()` | 1.7s | Explained O(1) benefit |
| 4. Skill Discovery | ✅ PASS | `get_skill_by_name()` | 1.9s | Direct lookup |
| 5. Tool Discovery | ✅ PASS | Read Section 10 | 3.2s | Complete list |
| 6. Performance Reasoning | ✅ PASS | `grep_search()` fallback | 4.5s | Explained MCP bug |

**Score:** 5/6 ✅ (Scenario 2 needs iteration)

**Key Findings:**
- [Observations about what worked]
- [Observations about what didn't work]

**Recommendations:**
- [Specific doc changes needed]
```

---

## Risks & Mitigations

**Risk 1: Agent Mode Variations**
- **Likelihood:** HIGH
- **Impact:** MEDIUM
- **Issue:** Planner/Developer modes may behave differently
- **Mitigation:** Test in all 3 modes (Standard, Planner, Developer)

**Risk 2: VS Code Chat Context Pollution**
- **Likelihood:** MEDIUM
- **Impact:** HIGH
- **Issue:** Previous messages influence tool choice
- **Mitigation:** Always use new chat window, verify clean start

**Risk 3: MCP Server Cache**
- **Likelihood:** LOW
- **Impact:** MEDIUM
- **Issue:** VS Code caches MCP tool responses
- **Mitigation:** Reload window between test runs (`Ctrl+Shift+P → Reload Window`)

**Risk 4: Documentation Changes During Testing**
- **Likelihood:** LOW
- **Impact:** HIGH
- **Issue:** Testing old docs version gives invalid results
- **Mitigation:** Version-pin test (reference git commit SHA)

---

## Implementation Steps

### Phase 1: Test Preparation (10 min)

**1.1 Environment Setup**
- **Action:** Create test results document template
- **File:** `.aiknowsys/test-results/mcp-adoption-YYYY-MM-DD.md`
- **Why:** Structured recording prevents missing data
- **Dependencies:** None

**1.2 Baseline Verification**
- **Action:** Verify MCP server running, 5 tools available
- **Tool:** Check VS Code's tool list for `mcp_aiknowsys_*`
- **Why:** Don't test if MCP isn't running (false negatives)
- **Dependencies:** 1.1

**1.3 Git Commit Pinning**
- **Action:** Record current commit SHA in test results
- **Command:** `git rev-parse HEAD`
- **Why:** Reproduce results if needed
- **Dependencies:** 1.1

---

### Phase 2: Execute Test Scenarios (30 min)

**2.1 Run Scenario 1-3 (Core Adoption)**
- **Action:** Execute Scenarios 1, 2, 3 in new chat windows
- **Why:** These test basic MCP discovery (must pass)
- **Risk:** MEDIUM (if these fail, documentation is broken)
- **Dependencies:** 1.2

**2.2 Run Scenario 4-5 (Tool Awareness)**
- **Action:** Execute Scenarios 4, 5 in new chat windows
- **Why:** Tests exact name matching and meta-awareness
- **Risk:** LOW (less critical than 1-3)
- **Dependencies:** 2.1

**2.3 Run Scenario 6 (Reasoning)**
- **Action:** Execute Scenario 6 in new chat window
- **Why:** Tests decision-making under constraints (broken tool)
- **Risk:** LOW (advanced capability test)
- **Dependencies:** 2.2

---

### Phase 3: Analysis & Recommendations (10 min)

**3.1 Score Calculation**
- **Action:** Count Pass/Partial/Fail for each scenario
- **Formula:** `(PASS * 1.0 + PARTIAL * 0.5) / 6.0 * 100%`
- **Why:** Quantifies documentation effectiveness
- **Dependencies:** 2.3

**3.2 Pattern Analysis**
- **Action:** Group failures by root cause
- **Example:** "All failures = Agent didn't read Section 10"
- **Why:** Identifies specific doc improvements needed
- **Dependencies:** 3.1

**3.3 Documentation Iteration Plan**
- **Action:** Create list of specific changes to ESSENTIALS.md
- **Example:** "Move Section 10 higher (after Section 2?)"
- **Why:** Actionable next steps from test results
- **Dependencies:** 3.2

---

### Phase 4: Reporting (5 min)

**4.1 Update Session File**
- **Action:** Append test results summary to 2026-02-09-session.md
- **Content:** Score, key findings, recommendations
- **Why:** Historical record of adoption milestone
- **Dependencies:** 3.3

**4.2 Optional: Update PLAN_mcp_tools_cli_audit.md**
- **Action:** If adoption poor, adjust priority (fix tools faster)
- **Condition:** Score <50% (documentation ineffective regardless)
- **Why:** May need working tools before docs matter
- **Dependencies:** 3.1

---

## Notes for Executor

**This is a validation plan, not an implementation plan:**
- No code changes required
- All actions are read-only or documentation
- Focus is observation and analysis

**Key Questions to Answer:**
1. Do agents **discover** MCP tools without prompting?
2. Do agents **understand** when to use MCP vs alternatives?
3. Do agents **explain** their tool choice reasoning?
4. Is Section 10 **discoverable** and **actionable**?

**Expected Outcome:**
- Baseline MCP adoption rate established
- Specific documentation improvements identified
- Confidence in current 5-tool rollout validated
- Roadmap for scaling to 15 tools clearer

**Next Steps After This Plan:**
- If score ≥80%: Proceed with PLAN_mcp_tools_cli_audit.md (fix remaining 10 tools)
- If score 50-79%: Iterate on Section 10, retest in 1 week
- If score <50%: Fundamental documentation restructure needed

---

**Ready for execution.** This plan takes ~55 minutes total (10 prep + 30 test + 10 analysis + 5 report).
