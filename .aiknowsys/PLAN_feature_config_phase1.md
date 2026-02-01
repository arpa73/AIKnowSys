# Implementation Plan: Feature Config Phase 1 - Infrastructure

**Status:** 🎯 ACTIVE  
**Created:** 2026-02-01  
**Parent Plan:** [Feature Configuration System](PLAN_feature_configuration.md)  
**Goal:** Create configuration file system and utilities

---

## Overview

Phase 1 establishes the foundation for feature configuration by creating:
- Configuration utilities (`lib/config.js`)
- Config validation in check command
- Documentation in ESSENTIALS template

**This phase is purely infrastructure** - no user-facing changes to init flow yet.

---

## Implementation Steps

### 1. Create config utilities (lib/config.js)

**File:** `lib/config.js` (NEW)

**TDD:** Write tests FIRST in `test/config.test.js`

**Functions to implement:**
```javascript
export function getDefaultConfig() {
  return {
    version: "1.0",
    features: {
      agents: true,
      skills: true,
      vscodeHooks: true,
      sessionPersistence: true,
      tddEnforcement: true,
      openspec: false,
      context7: false
    },
    preferences: {
      templateType: "full",
      stackName: null
    }
  };
}

export async function loadConfig(targetDir) {
  // Read .aiknowsys.config.json
  // Return defaults if missing (backward compatibility)
  // Validate structure
}

export async function saveConfig(targetDir, config) {
  // Write .aiknowsys.config.json
  // Pretty print JSON
}

export function validateConfig(config) {
  // Check version
  // Check features object
  // Return { valid: true/false, errors: [] }
}

export function isFeatureEnabled(config, featureName) {
  // Return config.features[featureName] ?? true (default enabled)
}
```

**Why:** Centralized config management prevents duplication  
**Dependencies:** None  
**Risk:** Low - isolated new module

---

### 2. Update check command

**File:** `lib/commands/check.js`

**TDD:** Add tests to `test/check.test.js`

**Changes:**
- Import config utilities
- Add "Configuration Status" section to output
- Load config and display enabled/disabled features
- Detect mismatches (e.g., hooks disabled but files present)

**Example output:**
```
✅ Configuration Status
   • Config file: .aiknowsys.config.json ✓
   • Version: 1.0
   
   Enabled Features:
     ✅ Custom Agents
     ✅ Universal Skills
     ✅ VSCode Hooks (7 files found)
     ✅ Session Persistence
     ✅ TDD Enforcement
   
   Disabled Features:
     ❌ OpenSpec
     ❌ Context7 Integration
```

**Why:** Users need to see current configuration  
**Dependencies:** Step 1 (config.js)  
**Risk:** Low - additive change

---

### 3. Add config section to ESSENTIALS template

**File:** `templates/CODEBASE_ESSENTIALS.template.md`

**Location:** After VSCode Hooks section (around line 330)

**Content:**
```markdown
---

## 9. Configuration

AIKnowSys stores feature preferences in `.aiknowsys.config.json`:

```json
{
  "version": "1.0",
  "features": {
    "agents": true,
    "skills": true,
    "vscodeHooks": true,
    "sessionPersistence": true,
    "tddEnforcement": true,
    "openspec": false
  }
}
```

**Managing Features:**
- Enable: `npx aiknowsys enable <feature>`
- Disable: `npx aiknowsys disable <feature>`
- Check status: `npx aiknowsys check`

**Feature Descriptions:**
- `agents` - Developer + Architect custom agents
- `skills` - Universal how-to guides
- `vscodeHooks` - Session automation (14 hooks)
- `sessionPersistence` - `.aiknowsys/sessions/` tracking
- `tddEnforcement` - Git hooks for TDD compliance
- `openspec` - Spec-driven development integration

**Note:** Configuration file is optional - if missing, all features default to enabled.
```

**Why:** Document the new config system  
**Dependencies:** None  
**Risk:** Low - documentation only

---

## Testing Strategy

**Unit Tests:**
- `test/config.test.js` - All config utilities
- `test/check.test.js` - Config validation in check command

**Test Cases:**
1. loadConfig with missing file returns defaults
2. loadConfig with valid file returns parsed config
3. saveConfig creates valid JSON file
4. validateConfig catches malformed configs
5. isFeatureEnabled returns correct boolean
6. check command displays config status

**Manual Testing:**
```bash
# Test config utilities
npm test test/config.test.js

# Test check command enhancement
npx aiknowsys init --yes
npx aiknowsys check
# Verify "Configuration Status" section appears

# Test backward compatibility (no config file)
rm .aiknowsys.config.json
npx aiknowsys check
# Verify still works, shows "Config file: missing (using defaults)"
```

---

## Success Criteria

- [ ] `lib/config.js` created with all 5 functions
- [ ] Tests passing in `test/config.test.js`
- [ ] `check` command shows config status
- [ ] Tests passing in `test/check.test.js`
- [ ] ESSENTIALS template documents config file
- [ ] All existing tests still pass (no regressions)
- [ ] Backward compatibility verified (works without config file)

---

## Notes for Developer

- Use existing file utilities from `lib/utils.js` (copyFiles, etc.)
- Config file should be pretty-printed (2-space indent)
- Validation should be permissive (warn, don't fail on unknown features)
- isFeatureEnabled defaults to `true` for backward compatibility

---

**Next Phase:** [Phase 2 - Feature Prompts](PLAN_feature_config_phase2.md)
