---
name: frontend-component-refactoring
description: Refactor frontend Vue components following KISS and DRY principles. Use when reviewing HTML/CSS duplication, inconsistent UX patterns, or organizing component architecture. Introduces component categorization (Base/Public/Admin), theme separation, and design system consistency. Addresses code maintenance, reusability, and UX consistency issues in Vue/Tailwind frontend.
---

# Frontend Component Refactoring - KISS & DRY Principles

Systematic guide for refactoring Vue.js frontend components to eliminate duplication, improve maintainability, and establish consistent UX patterns through proper component architecture and theme separation.

## When to Use This Skill

**Trigger phrases:**
- "Refactor frontend components"
- "Too much HTML/CSS duplication"
- "Inconsistent UI/UX across pages"
- "Create more Vue components"
- "Organize component structure"
- "Separate public and admin themes"
- "Apply KISS/DRY principles to frontend"
- "Design system consistency"

**Use when you notice:**
- Repeated HTML/CSS patterns across multiple files
- Inconsistent styling for similar elements (buttons, cards, forms)
- Copy-pasted component code
- Mixing public and admin UI patterns
- Hard-coded colors/spacing instead of theme variables
- Large monolithic components (>300 lines)
- Difficult to maintain consistent UX changes

## Core Principles

### 1. KISS (Keep It Simple, Stupid)
- Components should do ONE thing well
- Avoid over-engineering with unnecessary abstraction
- Simple, readable code over clever code
- Clear naming that explains purpose

### 2. DRY (Don't Repeat Yourself)
- Extract repeated HTML patterns into components
- Use composables for shared logic
- Centralize theme values (colors, spacing, typography)
- Shared utilities for common operations

### 3. Component Hierarchy
```
frontend/src/components/
├── base/          # Universal components (buttons, inputs, cards)
├── public/        # Public-facing website components
├── admin/         # Admin panel components
└── shared/        # Components used in both contexts (deprecated - migrate to base/)
```

---

## Component Categorization Strategy

### Base Components (`components/base/`)

**Purpose:** Universal, context-agnostic building blocks

**Examples:**
- `BaseButton.vue` - All button variants
- `BaseCard.vue` - Card container with optional header/footer
- `BaseInput.vue` - Text input with validation display
- `BaseModal.vue` - Modal dialog wrapper
- `BaseTable.vue` - Data table with sorting/pagination
- `BaseIcon.vue` - Icon wrapper (Font Awesome, etc.)
- `BaseBadge.vue` - Status badges and labels
- `BaseSpinner.vue` - Loading indicators

**Characteristics:**
- No hardcoded business logic
- Highly configurable via props
- Emit events for parent handling
- Theme-aware (use CSS variables)
- Comprehensive prop validation

**Example Base Component:**
```vue
<!-- components/base/BaseButton.vue -->
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--full-width': fullWidth }
    ]"
    :disabled="disabled || loading"
    @click="emit('click', $event)"
  >
    <BaseSpinner v-if="loading" :size="size" />
    <slot v-else />
  </button>
</template>

<style scoped>
.base-button {
  /* Use CSS variables for theming */
  font-family: var(--font-family-base);
  border-radius: var(--border-radius-md);
  transition: var(--transition-base);
}

.base-button--primary {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.base-button--secondary {
  background: var(--color-secondary);
  color: var(--color-secondary-contrast);
}

/* ... more variants */
</style>
```

### Public Components (`components/public/`)

**Purpose:** Public website-specific compositions

**Examples:**
- `PublicNav.vue` - Public site navigation
- `PublicHero.vue` - Hero section with animations
- `PublicFooter.vue` - Public site footer
- `BlogCard.vue` - Blog article card (uses BaseCard)
- `JewelryCard.vue` - Jewelry article card (uses BaseCard)
- `ContactForm.vue` - Public contact form (uses BaseInput)
- `NewsletterSignup.vue` - Newsletter subscription (uses BaseInput)

**Characteristics:**
- Compose base components
- Public-facing branding/styling
- SEO-optimized
- Responsive design focused
- Marketing-oriented UX

### Admin Components (`components/admin/`)

**Purpose:** Admin panel-specific components

**Examples:**
- `AdminNav.vue` - Admin navigation with auth state
- `AdminSidebar.vue` - Admin panel sidebar
- `AdminDataTable.vue` - CRUD data table (uses BaseTable)
- `AdminImageUpload.vue` - Image upload with preview (uses base components)
- `AdminFormField.vue` - Form field with validation (uses BaseInput)
- `AdminStats.vue` - Dashboard statistics widgets

**Characteristics:**
- Compose base components
- Dense information display
- Efficiency-focused UX
- Advanced filtering/sorting
- Bulk operations support

---

## Theme Separation

### Public Theme (`public-theme.css`)

```css
/* frontend/src/styles/themes/public-theme.css */
:root {
  /* Brand colors */
  --color-primary: #8B7355;        /* Warm gold */
  --color-primary-contrast: #FFFFFF;
  --color-secondary: #2C2C2C;      /* Deep charcoal */
  --color-accent: #D4AF37;         /* Bright gold accent */
  
  /* Typography */
  --font-family-heading: 'Playfair Display', serif;
  --font-family-base: 'Inter', sans-serif;
  --font-size-base: 1rem;
  --line-height-base: 1.6;
  
  /* Spacing (generous for readability) */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2.5rem;
  --spacing-xl: 4rem;
  
  /* Layout */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 16px;
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  /* Animations */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;
}

/* Public-specific utility classes */
.public-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.public-heading {
  font-family: var(--font-family-heading);
  color: var(--color-secondary);
}
```

### Admin Theme (`admin-theme.css`)

```css
/* frontend/src/styles/themes/admin-theme.css */
:root {
  /* Admin colors (professional, neutral) */
  --color-primary: #3B82F6;        /* Blue primary */
  --color-primary-contrast: #FFFFFF;
  --color-secondary: #64748B;      /* Slate gray */
  --color-success: #10B981;        /* Green */
  --color-warning: #F59E0B;        /* Amber */
  --color-danger: #EF4444;         /* Red */
  
  /* Typography (optimized for density) */
  --font-family-heading: 'Inter', sans-serif;
  --font-family-base: 'Inter', sans-serif;
  --font-size-base: 0.875rem;      /* Smaller for density */
  --line-height-base: 1.5;
  
  /* Spacing (tighter for information density) */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Layout (professional) */
  --border-radius-sm: 4px;
  --border-radius-md: 6px;
  --border-radius-lg: 8px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Admin-specific utility classes */
.admin-container {
  max-width: 1600px;               /* Wider for data tables */
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.admin-heading {
  font-family: var(--font-family-heading);
  color: var(--color-secondary);
  font-weight: 600;
}
```

---

## Refactoring Workflow

### Step 1: Audit Current Components

**Goal:** Identify duplication and inconsistencies

```bash
# Find repeated HTML patterns
cd frontend/src
grep -r "class=\"btn " views/ components/ | wc -l
grep -r "class=\"card " views/ components/ | wc -l

# Find large files (candidates for splitting)
find views components -name "*.vue" -exec wc -l {} + | sort -rn | head -20

# Find inline styles (should use classes)
grep -r "style=\"" views/ components/
```

**Create audit document:**
```markdown
# Frontend Component Audit

## Duplication Found
- Button styles: 23 instances across 12 files
- Card layouts: 15 instances across 8 files
- Form inputs: 34 instances across 15 files

## Large Components
- BlogView.vue: 452 lines → split into BlogList + BlogFilters
- AdminArticleForm.vue: 389 lines → extract form fields

## Inconsistencies
- Button colors: #8B7355, #8b7355, rgb(139, 115, 85)
- Spacing: mix of px, rem, and Tailwind classes
```

### Step 2: Create Base Components

**Priority order:**
1. **BaseButton** - Most frequently used
2. **BaseCard** - Common layout element
3. **BaseInput** - Form consistency
4. **BaseModal** - Dialog consistency
5. **BaseTable** - Data display

**Template for Base Component:**
```vue
<script setup lang="ts">
// 1. Define strict TypeScript interfaces
interface Props {
  // Required props
  // Optional props with defaults
}

// 2. Use withDefaults for default values
const props = withDefaults(defineProps<Props>(), {
  // defaults
})

// 3. Define typed emits
const emit = defineEmits<{
  eventName: [payload: Type]
}>()

// 4. Minimal logic - delegate to parent
</script>

<template>
  <!-- 5. Use CSS variables for all theming -->
  <!-- 6. Provide slots for flexibility -->
  <!-- 7. Emit events, don't handle business logic -->
</template>

<style scoped>
/* 8. Use CSS custom properties */
/* 9. No hardcoded colors/sizes */
/* 10. BEM naming: .base-component__element--modifier */
</style>
```

### Step 3: Extract Theme Variables

**Create theme files:**
```bash
mkdir -p frontend/src/styles/themes
touch frontend/src/styles/themes/public-theme.css
touch frontend/src/styles/themes/admin-theme.css
touch frontend/src/styles/themes/variables.css  # Shared variables
```

**Migration process:**
```vue
<!-- BEFORE: Hardcoded values -->
<button class="bg-[#8B7355] hover:bg-[#6D5A44] px-4 py-2 rounded-md">
  Click me
</button>

<!-- AFTER: Theme variables + Base component -->
<BaseButton variant="primary" size="md" @click="handleClick">
  Click me
</BaseButton>

<!-- CSS -->
<style scoped>
/* BEFORE */
.custom-button {
  background: #8B7355;
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

/* AFTER */
.custom-button {
  background: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
}
</style>
```

### Step 4: Refactor Views to Use Base Components

**Example refactoring:**
```vue
<!-- BEFORE: BlogView.vue (452 lines) -->
<template>
  <div class="container mx-auto px-4">
    <!-- Repeated card structure -->
    <div v-for="article in articles" class="bg-white rounded-lg shadow-md p-6 mb-4">
      <h2 class="text-2xl font-bold mb-2">{{ article.title }}</h2>
      <p class="text-gray-600">{{ article.excerpt }}</p>
      <button class="bg-blue-500 text-white px-4 py-2 rounded">Read More</button>
    </div>
  </div>
</template>

<!-- AFTER: BlogView.vue using components -->
<template>
  <div class="public-container">
    <BlogCard
      v-for="article in articles"
      :key="article.id"
      :article="article"
      @read-more="navigateToArticle"
    />
  </div>
</template>

<!-- NEW: BlogCard.vue component -->
<script setup lang="ts">
interface Props {
  article: BlogArticle
}

const props = defineProps<Props>()
const emit = defineEmits<{
  readMore: [articleId: number]
}>()
</script>

<template>
  <BaseCard>
    <template #header>
      <h2 class="public-heading">{{ article.title }}</h2>
    </template>
    
    <p class="text-secondary">{{ article.excerpt }}</p>
    
    <template #footer>
      <BaseButton variant="primary" @click="emit('readMore', article.id)">
        Read More
      </BaseButton>
    </template>
  </BaseCard>
</template>
```

### Step 5: Apply Theme to Routes

**Route-level theme switching:**
```typescript
// frontend/src/router/index.ts
const routes = [
  {
    path: '/',
    component: PublicLayout,
    meta: { theme: 'public' },
    children: [
      { path: '', component: HomeView },
      { path: 'blog', component: BlogView },
      // ... public routes
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { theme: 'admin', requiresAuth: true },
    children: [
      { path: '', component: AdminDashboard },
      { path: 'articles', component: AdminArticles },
      // ... admin routes
    ]
  }
]

// Apply theme via router guard
router.beforeEach((to, from, next) => {
  const theme = to.meta.theme || 'public'
  document.documentElement.setAttribute('data-theme', theme)
  next()
})
```

**Theme CSS organization:**
```css
/* frontend/src/styles/main.css */
@import './themes/variables.css';      /* Shared */
@import './themes/public-theme.css';   /* Public overrides */
@import './themes/admin-theme.css';    /* Admin overrides */

/* Theme switching */
[data-theme="public"] {
  /* Public theme active */
}

[data-theme="admin"] {
  /* Admin theme active */
}
```

---

## Refactoring Patterns

### Pattern 1: Extract Repeated HTML

**BEFORE: Duplication**
```vue
<!-- views/BlogView.vue -->
<div class="bg-white rounded-lg shadow p-6">
  <h2 class="text-xl font-bold">{{ article.title }}</h2>
  <p>{{ article.content }}</p>
</div>

<!-- views/ArticleView.vue -->
<div class="bg-white rounded-lg shadow p-6">
  <h2 class="text-xl font-bold">{{ article.title }}</h2>
  <p>{{ article.description }}</p>
</div>
```

**AFTER: Base Component**
```vue
<!-- components/base/BaseCard.vue -->
<template>
  <div class="base-card">
    <slot />
  </div>
</template>

<style scoped>
.base-card {
  background: var(--color-surface);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
}
</style>

<!-- Usage -->
<BaseCard>
  <h2 class="heading">{{ article.title }}</h2>
  <p>{{ article.content }}</p>
</BaseCard>
```

### Pattern 2: Extract Complex Logic

**BEFORE: Logic in Template**
```vue
<template>
  <div>
    <button
      :class="{
        'bg-blue-500': !loading && !disabled,
        'bg-gray-400': loading || disabled,
        'cursor-not-allowed': loading || disabled,
        'hover:bg-blue-600': !loading && !disabled
      }"
      :disabled="loading || disabled"
      @click="handleClick"
    >
      <span v-if="loading">Loading...</span>
      <span v-else>{{ label }}</span>
    </button>
  </div>
</template>
```

**AFTER: Component + Computed**
```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  variant: 'primary'
})

const isDisabled = computed(() => props.loading || props.disabled)

const buttonClasses = computed(() => [
  'base-button',
  `base-button--${props.variant}`,
  { 'base-button--disabled': isDisabled.value }
])
</script>

<template>
  <button
    :class="buttonClasses"
    :disabled="isDisabled"
    @click="$emit('click')"
  >
    <slot v-if="!loading" />
    <BaseSpinner v-else />
  </button>
</template>
```

### Pattern 3: Centralize Colors/Spacing

**BEFORE: Scattered Values**
```vue
<style scoped>
/* BlogCard.vue */
.card { padding: 24px; color: #8B7355; }

/* ArticleCard.vue */
.card { padding: 1.5rem; color: rgb(139, 115, 85); }

/* ContactCard.vue */
.card { padding: 20px; color: #8b7355; }
</style>
```

**AFTER: CSS Variables**
```css
/* styles/themes/variables.css */
:root {
  --spacing-lg: 1.5rem;  /* 24px */
  --color-primary: #8B7355;
}

/* All components */
<style scoped>
.card {
  padding: var(--spacing-lg);
  color: var(--color-primary);
}
</style>
```

---

## Component Organization

### Directory Structure

```
frontend/src/components/
├── base/                      # Universal building blocks
│   ├── BaseButton.vue
│   ├── BaseCard.vue
│   ├── BaseInput.vue
│   ├── BaseModal.vue
│   ├── BaseTable.vue
│   ├── BaseSpinner.vue
│   ├── BaseBadge.vue
│   └── BaseIcon.vue
│
├── public/                    # Public website components
│   ├── layout/
│   │   ├── PublicNav.vue
│   │   ├── PublicFooter.vue
│   │   └── PublicHero.vue
│   ├── blog/
│   │   ├── BlogCard.vue
│   │   ├── BlogList.vue
│   │   └── BlogFilters.vue
│   ├── jewelry/
│   │   ├── JewelryCard.vue
│   │   ├── JewelryGallery.vue
│   │   └── JewelryFilters.vue
│   └── forms/
│       ├── ContactForm.vue
│       └── NewsletterSignup.vue
│
├── admin/                     # Admin panel components
│   ├── layout/
│   │   ├── AdminNav.vue
│   │   ├── AdminSidebar.vue
│   │   └── AdminBreadcrumb.vue
│   ├── tables/
│   │   ├── AdminDataTable.vue
│   │   └── AdminPagination.vue
│   ├── forms/
│   │   ├── AdminFormField.vue
│   │   ├── AdminImageUpload.vue
│   │   └── AdminWYSIWYG.vue
│   └── widgets/
│       ├── AdminStats.vue
│       └── AdminChart.vue
│
└── shared/                    # Deprecated - migrate to base/
    └── README.md              # "Migrate to base/ or public/admin/"
```

### Naming Conventions

**Base components:** `Base{Noun}.vue`
- BaseButton, BaseCard, BaseInput

**Public components:** `{Feature}{Noun}.vue`
- BlogCard, JewelryGallery, ContactForm

**Admin components:** `Admin{Feature}{Noun}.vue`
- AdminDataTable, AdminFormField, AdminStats

**Layout components:** `{Context}Layout.vue`
- PublicLayout, AdminLayout

---

## Testing Strategy

### Component Tests

**Base components need comprehensive tests:**
```typescript
// tests/unit/BaseButton.spec.ts
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/base/BaseButton.vue'

describe('BaseButton', () => {
  it('renders slot content', () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'Click me' }
    })
    expect(wrapper.text()).toBe('Click me')
  })

  it('emits click event', async () => {
    const wrapper = mount(BaseButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('shows loading spinner', () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true }
    })
    expect(wrapper.findComponent({ name: 'BaseSpinner' }).exists()).toBe(true)
  })

  it('disables when disabled prop is true', () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true }
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('applies variant classes', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'primary' }
    })
    expect(wrapper.classes()).toContain('base-button--primary')
  })
})
```

---

## Creating a Migration Plan

**The skill provides the methodology. You create a project-specific plan.**

### Step 1: Audit Current State

**Duplication Assessment:**
```bash
# Find duplicate button HTML
grep -r "class=.*btn" frontend/src/views/

# Find hardcoded colors
grep -r "bg-\|text-\|border-" frontend/src/views/ | wc -l

# Find duplicate card structures
grep -r "<div class=.*card" frontend/src/views/
```

**Document findings:**
- How many duplicate buttons/cards/inputs?
- How many hardcoded Tailwind classes?
- Which views have the most duplication?

### Step 2: Prioritize Components

**High Priority (Extract First):**
- Components used >5 times
- Components with accessibility issues
- Components with UX inconsistencies

**Medium Priority:**
- Components used 2-4 times
- Components with complex logic
- Components that will grow

**Low Priority:**
- One-off components (<100 lines)
- Components that may change soon

### Step 3: Create Phased Checklist

**Template Structure:**
```markdown
## Phase 1: Foundation (Week 1)
- [ ] Create theme files (public-theme.css, admin-theme.css)
- [ ] Create base component directory
- [ ] Build [list your base components]
- [ ] Write tests for base components

## Phase 2: [Your Domain] Components (Week 2)
- [ ] Create [YourDomain]Layout with theme
- [ ] Extract [Component1] from [View1]
- [ ] Extract [Component2] from [View2]
- [ ] Refactor [domain] views to use components
- [ ] Test [domain] routes

## Phase 3: [Another Domain] Components (Week 3)
- [ ] Similar structure...

## Phase 4: Cleanup (Week 4)
- [ ] Remove duplicate HTML/CSS
- [ ] Replace hardcoded values with CSS variables
- [ ] Document component architecture
- [ ] Update CODEBASE_ESSENTIALS.md
```

### Step 4: Estimate Timeline

**Complexity factors:**
- Number of components to extract
- Team size and experience
- Existing test coverage
- Design system maturity

**Typical timeline:** 4-6 weeks for medium-sized project

### Step 5: Track Progress

Create a tracking document (example in `docs/planning/frontend-component-migration-plan.md`) with:
- [ ] Checklist items
- [ ] Success metrics (before/after)
- [ ] Rollback plan
- [ ] Timeline with dates

**Update checklist as you go** - check off items immediately after validation passes.

---

## Best Practices

### DO ✅

1. **Use TypeScript** for all component props/emits
2. **Provide defaults** for optional props
3. **Use CSS variables** for all theming
4. **Emit events** rather than handling business logic
5. **Use slots** for flexible composition
6. **Write tests** for base components
7. **Document props** with JSDoc comments
8. **Follow BEM naming** for CSS classes
9. **Keep components focused** (single responsibility)
10. **Use Composition API** (`<script setup>`)

### DON'T ❌

1. **Don't hardcode colors/spacing** - use CSS variables
2. **Don't mix business logic** in base components
3. **Don't create components** for one-time use (unless >100 lines)
4. **Don't use inline styles** - use classes
5. **Don't bypass props** with $parent or direct DOM manipulation
6. **Don't use any type** - define proper interfaces
7. **Don't skip validation** for props
8. **Don't create deep nesting** (max 3 levels)
9. **Don't ignore accessibility** (ARIA labels, keyboard nav)
10. **Don't forget responsive** design (mobile-first)

---

## Resources

- **Vue 3 Docs:** https://vuejs.org/guide/components/
- **Component Design Patterns:** https://www.patterns.dev/posts/presentational-container-pattern/
- **CSS Variables Guide:** https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **BEM Naming:** http://getbem.com/naming/
- **Tailwind + CSS Variables:** https://tailwindcss.com/docs/customizing-colors#using-css-variables

**Internal References:**
- [CODEBASE_ESSENTIALS.md](../../../CODEBASE_ESSENTIALS.md) - Component patterns
- [code-refactoring skill](../code-refactoring/SKILL.md) - Safe refactoring workflow
- [developer-checklist skill](../developer-checklist/SKILL.md) - Testing requirements

**Example Migration Plan:**
- [docs/planning/frontend-component-migration-plan.md](../../../docs/planning/frontend-component-migration-plan.md) - gnwebsite-specific implementation

---

## Success Criteria

**Completed when:**
- [ ] Zero duplicate button/card/input HTML across views
- [ ] All colors/spacing use CSS variables
- [ ] Public and admin routes use separate themes
- [ ] Components organized into base/public/admin
- [ ] All base components have >80% test coverage
- [ ] UX changes can be made in ONE place (theme file)
- [ ] New features reuse existing components
- [ ] CODEBASE_ESSENTIALS.md documents component architecture

**Metrics to track:**
- Lines of duplicate HTML/CSS (before/after)
- Number of hardcoded color values (target: 0)
- Component reuse percentage
- Test coverage for base components
- Time to implement new UX features (should decrease)
