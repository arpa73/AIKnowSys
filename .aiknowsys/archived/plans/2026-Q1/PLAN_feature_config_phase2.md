# Implementation Plan: Feature Config Phase 2 - User Prompts

**Status:** 📋 PLANNED  
**Created:** 2026-02-01  
**Parent Plan:** [Feature Configuration System](PLAN_feature_configuration.md)  
**Goal:** Add interactive prompts for feature selection during init

---

## Overview

Phase 2 adds user choice to the init workflow:
- Feature preference prompts
- Integration into manual setup mode
- Config file generation during init

**Prerequisites:** Phase 1 complete (config utilities exist)

---

## Implementation Steps (3 total)

### 4. Add feature preferences prompts

**File:** `lib/commands/init/prompts.js`

**TDD:** Write tests in `test/init-prompts.test.js` (NEW file)

**Create:** `getFeaturePreferences()` function

**Prompt groups:**
- Core Features (agents, skills) - default enabled
- Workflow Automation (VSCode hooks, session persistence) - default enabled  
- Quality Enforcement (TDD enforcement) - default enabled
- Advanced Tools (OpenSpec, Context7) - default disabled

### 5. Integrate prompts into init flow

**File:** `lib/commands/init.js`

**Changes:**
- Call `getFeaturePreferences()` in manual mode
- Add to answers object
- Pass to subsequent setup functions

### 6. Generate config file during init

**File:** `lib/commands/init.js`

**Changes:**
- After file generation, call `saveConfig()` with user answers
- Update success message to show enabled features

---

**Previous Phase:** [Phase 1 - Infrastructure](PLAN_feature_config_phase1.md)  
**Next Phase:** [Phase 3 - Conditional Installation](PLAN_feature_config_phase3.md)
