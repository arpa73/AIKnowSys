---
pattern: Local Embeddings Generation
category: privacy_first
created: 2024-02-16
context: Phase 2.3 - Semantic search implementation
trigger_words:
  - embeddings
  - semantic search
  - vector similarity
  - transformers.js
  - privacy-first ML
applicability: universal
confidence: high
---

# Local Embeddings Pattern

**Context:** When implementing semantic search or similarity matching, there are multiple embedding generation approaches. This pattern explains why we chose local generation over API-based solutions.

**Trigger:** Any feature requiring:
- Semantic search across text data
- Vector similarity matching
- Natural language understanding
- Privacy-sensitive ML operations

---

## The Decision: Local vs API-Based Embeddings

### Options Evaluated

**Option 1: OpenAI/Anthropic Embeddings API**
- ❌ **Privacy violation:** Sends all content to third party
- ❌ **Cost:** Per-token pricing ($0.0001 per 1K tokens)
- ❌ **Offline:** Requires internet connection
- ❌ **Vendor lock-in:** API changes break your code
- ✅ **Quality:** State-of-art embeddings
- ✅ **Zero setup:** No model downloads

**Option 2: Python + sentence-transformers**
- ❌ **Dependencies:** Python runtime required
- ❌ **Cross-platform:** Path issues (Windows, macOS, Linux)
- ❌ **Deployment:** Virtual env management nightmare
- ❌ **NPM workflow:** Breaks "npm install && go" expectation
- ✅ **Performance:** Fast native inference
- ✅ **Quality:** Excellent models available

**Option 3: @xenova/transformers (Local JavaScript) ✅ CHOSEN**
- ✅ **Privacy:** 100% local processing, zero API calls
- ✅ **Offline:** Works without internet (after first model download)
- ✅ **Zero dependencies:** Pure JavaScript, no Python needed
- ✅ **NPM native:** `npm install @xenova/transformers` - done
- ✅ **Cross-platform:** Same code works everywhere
- ✅ **Portable:** Standard ONNX models
- ⚠️ **Trade-off:** 50MB model download on first use
- ⚠️ **Trade-off:** 200MB memory footprint when loaded

---

## Implementation Pattern

### 1. Model Selection Criteria

**Chosen Model:** `all-MiniLM-L6-v2` (384 dimensions)

**Why this model:**
- ✅ **Size:** 50MB (acceptable one-time download)
- ✅ **Speed:** Fast inference (~10-50ms per text)
- ✅ **Quality:** 80%+ accuracy on semantic similarity benchmarks
- ✅ **Popularity:** 50M+ downloads, well-tested
- ✅ **Compatibility:** Works with transformers.js without modification

**Rejected alternatives:**
- `all-mpnet-base-v2` (768 dim): Better quality, 2x larger, 2x slower
- `all-distilroberta-v1` (768 dim): Better quality, 3x larger
- `paraphrase-multilingual`: Multilingual support not needed (English-only codebase)

**Trade-off rationale:**
- 50MB download is acceptable (one-time cost)
- 384 dimensions is sufficient for code/decision similarity
- Speed > quality for interactive search (user waiting)

### 2. Lazy Loading Pattern

**Problem:** Loading 200MB model upfront delays startup

**Solution:** Lazy model initialization on first use

```typescript
export class EmbeddingGenerator {
  private model: FeatureExtractionPipeline | null = null;
  private modelPromise: Promise<FeatureExtractionPipeline> | null = null;
  
  private async ensureModelLoaded(): Promise<void> {
    // Already loaded - instant return
    if (this.model) {
      return;
    }
    
    // Loading in progress - wait for existing promise
    if (this.modelPromise) {
      await this.modelPromise;
      return;
    }
    
    // First call - start loading
    this.modelPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    this.model = await this.modelPromise;
    this.modelPromise = null; // Clear promise after load
  }
  
  async generateEmbedding(text: string): Promise<Float32Array> {
    await this.ensureModelLoaded(); // Lazy load on first use
    const output = await this.model!(text, { pooling: 'mean', normalize: true });
    return new Float32Array(Array.from(output.data));
  }
}
```

**Benefits:**
- ✅ Zero startup delay (model loads only when needed)
- ✅ Concurrent requests wait for single model load (no duplicate downloads)
- ✅ Subsequent calls are instant (model cached in memory)

**Caching behavior:**
- Models downloaded to `~/.cache/huggingface/` (persisted across restarts)
- In-memory cache for loaded model (alive until process ends)
- First call: ~3-5 seconds (model download + initialization)
- Subsequent calls: ~10-50ms (inference only)

### 3. Event → Text Conversion Strategy

**Problem:** Events are structured JSON, embeddings need text

**Solution:** Type-aware text extraction prioritizing search-relevant fields

```typescript
eventToSearchText(event: KnowledgeEvent): string {
  const parts: string[] = [];
  
  // Include event type for context
  parts.push(`Event: ${event.eventType}`);
  
  // Extract type-specific fields
  switch (event.eventType) {
    case 'task_completed':
      const data = event.data as TaskCompletedData;
      if (data.description) parts.push(data.description);
      if (data.outcome) parts.push(`Outcome: ${data.outcome}`);
      if (data.filesChanged?.length) {
        parts.push(`Files: ${data.filesChanged.join(', ')}`);
      }
      break;
    
    case 'decision_made':
      // Extract decision, rationale, alternatives...
      break;
      
    // ... 9 event types total
  }
  
  return parts.join(' | '); // Pipe separator for clarity
}
```

**Design decisions:**
- ✅ **Type-aware:** Different fields for different event types (not generic JSON.stringify)
- ✅ **Prioritized:** Most relevant fields first (description > metadata)
- ✅ **Compact:** Target <512 tokens (~2KB text) for fast embedding
- ✅ **Readable:** Pipe separators (`|`) improve semantic understanding

**Example transformations:**
```typescript
// Input: task_completed event
{
  eventType: 'task_completed',
  data: {
    description: 'Implement JWT authentication',
    outcome: 'success',
    filesChanged: ['lib/auth.ts', 'test/auth.test.ts']
  }
}

// Output: search text
"Event: task_completed | Implement JWT authentication | Outcome: success | Files: lib/auth.ts, test/auth.test.ts"
```

### 4. Vector Normalization

**Why normalize embeddings:**
- Enables cosine similarity via dot product (faster than full cosine calculation)
- Reduces storage size (can quantize to int8 if needed)
- Standard practice for semantic search

**How to normalize:**
```typescript
const output = await this.model(text, { 
  pooling: 'mean',    // Average token embeddings → single vector
  normalize: true     // L2 normalization (magnitude = 1.0)
});
```

**Verification:**
```typescript
// All embeddings should have magnitude ≈ 1.0
const magnitude = Math.sqrt(
  Array.from(embedding).reduce((sum, val) => sum + val * val, 0)
);
expect(magnitude).toBeGreaterThan(0.99);
expect(magnitude).toBeLessThan(1.01);
```

---

## Performance Characteristics

**Benchmarks (M1 MacBook Pro):**
- First call (cold start): 3-5 seconds (model download + init)
- First call (warm start): 400-500ms (model init from cache)
- Subsequent calls: 10-50ms (inference only)
- Batch processing (10 events): 100-200ms (sequential)

**Memory usage:**
- Model loaded: ~200MB RAM
- Per embedding: 384 floats × 4 bytes = 1.5KB
- 1000 embeddings: ~1.5MB (negligible)

**Disk usage:**
- Model files: ~50MB (`~/.cache/huggingface/`)
- Persisted across restarts
- Shared across all projects using same model

---

## Privacy Guarantees

**What stays local:**
- ✅ All knowledge event content
- ✅ All embedding calculations
- ✅ Model files (cached locally)
- ✅ Query embeddings

**What never leaves your machine:**
- ✅ Event data (task descriptions, decisions, patterns)
- ✅ Search queries
- ✅ Similarity calculations

**Comparison to commercial solutions:**

| Feature | AIKnowSys (Local) | OpenAI Embeddings | GitHub Copilot Memory |
|---------|-------------------|-------------------|----------------------|
| Privacy | ✅ 100% local | ❌ Data sent to API | ❌ Stored on Microsoft servers |
| Offline | ✅ Works offline | ❌ Requires internet | ❌ Requires internet |
| Cost | ✅ Free (one-time download) | ❌ $0.0001/1K tokens | ❌ Bundled with subscription |
| Control | ✅ You own it | ❌ Subject to vendor ToS | ❌ Subject to vendor ToS |

**Trust model:**
- Code is open source (inspect `lib/embeddings/generator.ts`)
- No network calls (verify with network inspector)
- Models are public (Hugging Face verified)

---

## When to Use This Pattern

**✅ Use local embeddings when:**
- Privacy is critical (code, decisions, proprietary patterns)
- Offline operation required (air-gapped environments)
- Cost control needed (no per-query fees)
- Knowledge contains sensitive IP
- Regulatory compliance (GDPR, HIPAA, etc.)

**❌ Consider API embeddings when:**
- Privacy is not a concern (public data)
- State-of-art quality required (research, production ML)
- Zero setup preferred (no model downloads)
- Embedding quality > cost (willing to pay for better results)

**For AIKnowSys specifically:**
- ✅ **ALWAYS use local** - privacy is Core Philosophy #5
- Knowledge contains code decisions, patterns, strategies (sensitive IP)
- Competitive advantage comes from knowledge accumulation
- Sending to API would defeat the privacy-first value proposition

---

## Integration with Event Storage

**Phase 2.4 Plan:**
```typescript
// 1. Generate embedding when storing event
const embedding = await generator.embedEvent(event);

// 2. Store with event in SQLite
await db.run(
  'INSERT INTO knowledge_events (event_id, project_id, data, embedding) VALUES (?, ?, ?, ?)',
  [event.eventId, event.projectId, JSON.stringify(event.data), Buffer.from(embedding.buffer)]
);

// 3. Use sqlite-vss for semantic search
const queryEmbedding = await generator.generateEmbedding(userQuery);
const results = await db.all(
  'SELECT * FROM vss_search(embedding, ?) LIMIT ?',
  [Buffer.from(queryEmbedding.buffer), limit]
);
```

---

## Lessons Learned

### What Worked Well

1. **Lazy loading strategy**
   - Zero startup delay
   - Model loads only when needed
   - Concurrent requests handled correctly

2. **Type-safe event conversion**
   - Discriminated union narrowing works perfectly
   - Type assertions make intent clear
   - Easy to add new event types

3. **Test-driven development**
   - Tests caught tensor conversion bug early
   - Semantic similarity tests verify quality
   - Model caching tests prevent regressions

### What We'd Do Differently

1. **Batch processing placeholder**
   - Intentionally left sequential (YAGNI)
   - Will optimize when/if needed
   - Comment documents future path

2. **Error handling pattern**
   - Kept simple for library code (not CLI/MCP)
   - Descriptive errors sufficient for developers
   - Would use AIFriendlyErrorBuilder if exposing via MCP

---

## Future Enhancements

**Phase 2.4 (Immediate):**
- [ ] Store embeddings in SQLite events table
- [ ] Add sqlite-vss extension for vector search
- [ ] Create `semanticSearch(query, limit)` API

**Phase 3+ (Future):**
- [ ] Optimize batch processing (parallel inference)
- [ ] Add embedding caching layer (avoid re-embedding same text)
- [ ] Support custom models (user-provided ONNX files)
- [ ] Quantization to int8 (50% storage reduction)
- [ ] Multi-language models (if non-English codebases emerge)

---

## Related Files

**Implementation:**
- [lib/embeddings/generator.ts](../../lib/embeddings/generator.ts) - EmbeddingGenerator class
- [test/embeddings/embedding-generator.test.ts](../../test/embeddings/embedding-generator.test.ts) - Comprehensive tests

**Context:**
- [CODEBASE_ESSENTIALS.md](../../CODEBASE_ESSENTIALS.md) - Core Philosophy #5 (Privacy-First)
- [.aiknowsys/PLAN_knowledge_bank_evolution.md](../PLAN_knowledge_bank_evolution.md) - Phase 2.3 details

**Dependencies:**
- [@xenova/transformers](https://www.npmjs.com/package/@xenova/transformers) - Transformers.js library
- [Hugging Face Model](https://huggingface.co/Xenova/all-MiniLM-L6-v2) - all-MiniLM-L6-v2

---

**Pattern Status:** ✅ Validated in production (Phase 2.3 complete)  
**Reusability:** High - applicable to any privacy-sensitive embedding use case  
**Maintenance:** Low - stable API, well-tested, minimal dependencies
