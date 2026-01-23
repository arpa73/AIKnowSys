# {{SKILL_NAME}}

## When to Use This Skill

**Trigger words:**
- {{TRIGGER_WORD_1}}
- {{TRIGGER_WORD_2}}
- {{TRIGGER_WORD_3}}

**Use this skill when:**
- {{USE_CASE_1}}
- {{USE_CASE_2}}
- {{USE_CASE_3}}

---

## Prerequisites

**Before starting, ensure:**
- [ ] {{PREREQUISITE_1}}
- [ ] {{PREREQUISITE_2}}
- [ ] {{PREREQUISITE_3}}

**Required knowledge:**
- {{KNOWLEDGE_1}}
- {{KNOWLEDGE_2}}

**Required tools:**
- {{TOOL_1}}
- {{TOOL_2}}

---

## Step-by-Step Workflow

### Step 1: {{STEP_1_TITLE}}

**Goal:** {{STEP_1_GOAL}}

**Actions:**
1. {{STEP_1_ACTION_1}}
2. {{STEP_1_ACTION_2}}
3. {{STEP_1_ACTION_3}}

**Example:**
```{{LANGUAGE}}
{{STEP_1_EXAMPLE}}
```

**Validation:**
```bash
{{STEP_1_VALIDATION_CMD}}
```

**Expected output:** {{STEP_1_EXPECTED_OUTPUT}}

---

### Step 2: {{STEP_2_TITLE}}

**Goal:** {{STEP_2_GOAL}}

**Actions:**
1. {{STEP_2_ACTION_1}}
2. {{STEP_2_ACTION_2}}

**Example:**
```{{LANGUAGE}}
{{STEP_2_EXAMPLE}}
```

---

### Step 3: {{STEP_3_TITLE}}

**Goal:** {{STEP_3_GOAL}}

**Actions:**
1. {{STEP_3_ACTION_1}}
2. {{STEP_3_ACTION_2}}

---

## Final Validation

**Run these commands to verify everything works:**

```bash
{{FINAL_VALIDATION_CMD_1}}
{{FINAL_VALIDATION_CMD_2}}
{{FINAL_VALIDATION_CMD_3}}
```

**Expected results:**
- ✅ {{EXPECTED_RESULT_1}}
- ✅ {{EXPECTED_RESULT_2}}
- ✅ {{EXPECTED_RESULT_3}}

---

## Common Pitfalls

### Pitfall 1: {{PITFALL_1_NAME}}

**Problem:** {{PITFALL_1_DESCRIPTION}}

**Symptom:** {{PITFALL_1_SYMPTOM}}

**Solution:** {{PITFALL_1_SOLUTION}}

**Example:**
```{{LANGUAGE}}
// ❌ Wrong
{{PITFALL_1_WRONG_EXAMPLE}}

// ✅ Correct
{{PITFALL_1_CORRECT_EXAMPLE}}
```

---

### Pitfall 2: {{PITFALL_2_NAME}}

**Problem:** {{PITFALL_2_DESCRIPTION}}

**Solution:** {{PITFALL_2_SOLUTION}}

---

## Rollback Procedure

**If something goes wrong:**

1. {{ROLLBACK_STEP_1}}
2. {{ROLLBACK_STEP_2}}
3. {{ROLLBACK_STEP_3}}

**Verification:**
```bash
{{ROLLBACK_VERIFICATION_CMD}}
```

---

## Examples

### Example 1: {{EXAMPLE_1_TITLE}}

**Scenario:** {{EXAMPLE_1_SCENARIO}}

**Steps taken:**
1. {{EXAMPLE_1_STEP_1}}
2. {{EXAMPLE_1_STEP_2}}
3. {{EXAMPLE_1_STEP_3}}

**Result:** {{EXAMPLE_1_RESULT}}

**Code:**
```{{LANGUAGE}}
{{EXAMPLE_1_CODE}}
```

---

### Example 2: {{EXAMPLE_2_TITLE}}

**Scenario:** {{EXAMPLE_2_SCENARIO}}

**Outcome:** {{EXAMPLE_2_OUTCOME}}

---

## References

**Related documentation:**
- [{{RELATED_DOC_1}}]({{RELATED_DOC_1_LINK}})
- [{{RELATED_DOC_2}}]({{RELATED_DOC_2_LINK}})

**Related skills:**
- [{{RELATED_SKILL_1}}](../{{RELATED_SKILL_1}}/SKILL.md)
- [{{RELATED_SKILL_2}}](../{{RELATED_SKILL_2}}/SKILL.md)

**External resources:**
- {{EXTERNAL_RESOURCE_1}}
- {{EXTERNAL_RESOURCE_2}}

---

## Customization Instructions

**To create a skill from this template:**

1. **Copy this directory:**
   ```bash
   cp -r .github/skills/_skill-template .github/skills/your-skill-name
   ```

2. **Replace all {{PLACEHOLDERS}}** with actual content:
   - `{{SKILL_NAME}}` - Name of your skill
   - `{{TRIGGER_WORD_*}}` - Words that should trigger this skill
   - `{{STEP_*_TITLE}}` - Step names
   - `{{*_EXAMPLE}}` - Real code examples
   - `{{*_CMD}}` - Actual commands to run
   - etc.

3. **Remove/add steps** as needed for your workflow

4. **Fill in examples** with real scenarios from your project

5. **Test the workflow** by following the steps yourself

6. **Update AGENTS.md** to map trigger words to this skill

7. **Delete this "Customization Instructions" section**

---

*Part of the Knowledge System Template. See [README](../../README.md) for full documentation.*
