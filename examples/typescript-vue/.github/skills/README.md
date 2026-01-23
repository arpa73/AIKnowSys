# TypeScript/Vue Example Skills

This directory contains Vue 3 + TypeScript specific skills for the knowledge system.

## Skills Included

### 1. component-development

**When to use:** Creating new Vue components

**Key steps:**
1. Choose component type (base/feature/view)
2. Define TypeScript interfaces for props/emits
3. Use Composition API with `<script setup>`
4. Implement reactive logic with composables
5. Write component tests
6. Add to Storybook (if applicable)

### 2. state-management

**When to use:** Adding Pinia stores or managing global state

**Key steps:**
1. Create store in `stores/` directory
2. Define state, getters, actions
3. Use Composition API syntax
4. Add TypeScript types
5. Test store logic in isolation
6. Integrate with components

### 3. api-integration

**When to use:** Connecting to backend APIs

**Key steps:**
1. Define TypeScript types for API responses
2. Create composable with typed API calls
3. Handle loading/error states
4. Add error handling and retries
5. Mock API calls in tests
6. Update API client interceptors if needed

## How to Use

When the AI agent detects a Vue/TypeScript task (component work, API integration, store changes), it should:

1. Read the relevant skill from `.github/skills/`
2. Follow the step-by-step workflow
3. Validate with `npm run type-check` and `npm run test:run`
4. Update CODEBASE_CHANGELOG.md

## Example Usage

```markdown
User: "Add a user profile component with avatar upload"

Agent:
1. Reads @/.github/skills/component-development/SKILL.md
2. Creates ProfileCard.vue with typed props
3. Creates useFileUpload composable for avatar logic
4. Adds loading states and error handling
5. Writes component tests (mount, interactions, emits)
6. Runs type-check + tests to validate
7. Updates changelog
```

---

*These skills are Vue/TypeScript-specific and build on the universal skills from the template.*
