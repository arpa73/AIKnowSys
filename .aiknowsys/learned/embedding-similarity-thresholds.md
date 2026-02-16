---
category: project_specific
tags: [embeddings, semantic-search, thresholds, all-MiniLM-L6-v2]
created: 2026-02-16
updated: 2026-02-16
trigger_words: [semantic search, cosine similarity, embedding threshold, similarity score, all-MiniLM]
---

# Embedding Similarity Thresholds

**Pattern Type:** Project-specific discovery  
**Discovered:** Phase 2.5 implementation (Feb 16, 2026)  
**Applies To:** Semantic search with all-MiniLM-L6-v2 embeddings

## Problem

Implementing semantic search with default threshold of 0.5 resulted in zero results for semantically similar queries.

**Initial Assumption (WRONG):**
- Default threshold: 0.5
- Reasoning: "Similar" means 50% match or higher
- Expected range: 0.0-0.5 (dissimilar) vs 0.5-1.0 (similar)

**Reality:**
Tests failed with `expect(results.length).toBeGreaterThan(0)` - got 0 results

## Root Cause

**Normalized embeddings don't behave like percentage similarity!**

- all-MiniLM-L6-v2 produces 384-dimensional normalized vectors (L2 norm = 1.0)
- Typical cosine similarity scores: **0.2-0.8** (not 0.5-1.0)
- "Very similar" content: 0.5-0.7
- "Somewhat related" content: 0.3-0.5
- "Unrelated" content: 0.1-0.3

## Evidence

**Test Case:** Phase 2.5 semantic search integration test

```typescript
// Query: "user authentication and login"
// Events:
//   - "Implemented JWT authentication for API" (very similar)
//   - "Added user login with password hashing" (very similar)
//   - "Fixed database connection pool leak" (unrelated)

// With threshold 0.5: ❌ 0 results (auth events scored 0.35-0.45)
// With threshold 0.3: ✅ 2 results (auth events ranked higher than DB event)
```

**Empirical Scores (Feb 2026):**
- Identical text: ~0.95-1.0
- Very similar (same topic): ~0.5-0.7
- Somewhat related: ~0.3-0.5
- Different topics: ~0.1-0.3
- Completely unrelated: ~0.0-0.2

## Solution

**Default threshold: 0.3** (not 0.5)

**Rationale:**
- Includes "somewhat related" results (good recall)
- Balance: Not too loose (0.2 = noise) or too strict (0.5 = miss relevant results)
- User can tune threshold for their use case

**Implementation:**
```typescript
// lib/events/types.ts
export interface SemanticSearchOptions {
  limit?: number;
  threshold?: number;  // default: 0.3
  projectId?: string;
}

// lib/context/sqlite-storage.ts
const threshold = options?.threshold ?? 0.3;
```

## Recommendations

**Threshold Selection Guide:**

| Threshold | Use Case | Expected Results |
|-----------|----------|------------------|
| 0.2-0.25 | Exploratory/discovery queries | High recall, some noise |
| **0.3** | **General semantic search (default)** | **Balanced precision/recall** |
| 0.4-0.5 | "Very similar only" queries | High precision, lower recall |
| 0.6+ | Near-duplicate detection | Very high precision, very low recall |

**Best Practices:**
1. Always make threshold configurable (user preference varies)
2. Document default value in interface/type definition
3. Test with realistic data (not synthetic vectors)
4. Consider use case: discovery (lower) vs precision (higher)

## Why This Matters

- Prevents future developers from repeating trial-and-error
- Explains non-obvious default value (0.3 not 0.5)
- Provides tuning guidance for different use cases
- Model-specific (other embedding models may differ)

## References

- Implementation: [lib/context/sqlite-storage.ts](../../lib/context/sqlite-storage.ts#L1510) - semanticSearch() method
- Type definition: [lib/events/types.ts](../../lib/events/types.ts#L233) - SemanticSearchOptions
- Tests: [test/embeddings/semantic-search.test.ts](../../test/embeddings/semantic-search.test.ts)
- Commit: d94c522 (Phase 2.5: Semantic Search)
- Architect Review: [.aiknowsys/reviews/PENDING_arno-paffen.md](../reviews/PENDING_arno-paffen.md) (Feb 16, 2026)

## Model-Specific Notes

**all-MiniLM-L6-v2:**
- 384-dimensional normalized embeddings
- Trained on semantic textual similarity tasks
- Output vectors have L2 norm = 1.0 (unit sphere)
- Cosine similarity range: typically 0.0-0.8 (rarely >0.9 unless near-duplicate)

**If switching models:**
- Re-test threshold with new model's outputs
- Different models produce different score distributions
- e5-base, BERT, etc. may require different defaults
