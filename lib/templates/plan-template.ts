/**
 * Plan template generator with YAML frontmatter
 * Phase B Mini - Context Query Completion
 */

import { detectUsername } from '../utils/git-utils.js';
import { normalizePlanId } from '../utils/plan-utils.js';

export interface PlanMetadata {
  id?: string;
  title: string;
  status?: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | 'CANCELLED';
  author?: string;
  created?: string;
  topics?: string[];
}

/**
 * Generate plan file content with YAML frontmatter
 */
export function generatePlanTemplate(metadata: PlanMetadata): string {
  const {
    id = normalizePlanId(metadata.title),
    title,
    status = 'PLANNED',
    author = detectUsername(),
    created = new Date().toISOString().split('T')[0],
    topics = []
  } = metadata;

  // Build YAML frontmatter
  let frontmatter = `---
id: ${id}
title: "${title}"
status: ${status}
author: ${author}
created: "${created}"`;

  if (topics.length > 0) {
    frontmatter += `\ntopics: [${topics.join(', ')}]`;
  }

  frontmatter += '\n---';

  return `${frontmatter}

# Implementation Plan: ${title}

**Status:** 📋 ${status}  
**Created:** ${created}  
**Author:** ${author}

---

## 🎯 Goal

[Describe the objective of this plan]

## Requirements

[List functional and non-functional requirements]

## Implementation Steps

### Step 1: [Step Name]
**Time:** [Estimate]  
**Files:** [Files to modify/create]

**Action:** [What to do]

### Step 2: [Step Name]
**Time:** [Estimate]  
**Files:** [Files to modify/create]

**Action:** [What to do]

## Testing & Validation

[How to verify the work is complete]

## Risks

[Potential issues and mitigation strategies]
`;
}
