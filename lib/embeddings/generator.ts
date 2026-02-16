/**
 * @file lib/embeddings/generator.ts
 * @description Local embedding generation using transformers.js (Phase 2.3)
 * 
 * Model: all-MiniLM-L6-v2 (384 dimensions)
 * - Privacy-first: All processing local (no API calls)
 * - Offline-capable: Models cached after first download (~50MB)
 * - Semantic search: Find events by meaning, not keywords
 * 
 * Uses @xenova/transformers (transformers.js):
 * - ONNX runtime for fast inference
 * - Works in Node.js and browsers
 * - Lazy model loading (only when needed)
 */

import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';
import type { KnowledgeEvent } from '../events/types.js';

export class EmbeddingGenerator {
  private model: FeatureExtractionPipeline | null = null;
  private modelPromise: Promise<FeatureExtractionPipeline> | null = null;
  
  /**
   * Generate embedding for arbitrary text
   * @param text - Input text to embed (max ~512 tokens recommended)
   * @returns 384-dimensional embedding vector (normalized)
   */
  async generateEmbedding(text: string): Promise<Float32Array> {
    // Validate input
    if (text === null || text === undefined) {
      throw new Error('generateEmbedding: text is required and cannot be null/undefined');
    }
    
    if (typeof text !== 'string') {
      throw new Error(`generateEmbedding: text must be a string, got ${typeof text}`);
    }
    
    // Ensure model is loaded
    await this.ensureModelLoaded();
    
    // Generate embedding with mean pooling and normalization
    const output = await this.model!(text, { pooling: 'mean', normalize: true });
    
    // Extract embedding data as Float32Array
    // output.data is Tensor data - convert to regular array first
    const dataArray = Array.from(output.data);
    return new Float32Array(dataArray);
  }
  
  /**
   * Generate embedding for a knowledge event
   * Converts event to search-optimized text representation first
   * @param event - Knowledge event to embed
   * @returns 384-dimensional embedding vector
   */
  async embedEvent(event: KnowledgeEvent): Promise<Float32Array> {
    if (!event) {
      throw new Error('embedEvent: event is required and cannot be null/undefined');
    }
    
    // Convert event to searchable text
    const searchText = this.eventToSearchText(event);
    
    // Generate embedding for search text
    return this.generateEmbedding(searchText);
  }
  
  /**
   * Generate embeddings for multiple events (batch processing)
   * @param events - Array of knowledge events
   * @returns Array of 384-dimensional embeddings (same order as input)
   */
  async embedEvents(events: KnowledgeEvent[]): Promise<Float32Array[]> {
    if (!events || events.length === 0) {
      return [];
    }
    
    // Process events sequentially for now
    // Future optimization: Batch processing via model API
    const embeddings: Float32Array[] = [];
    
    for (const event of events) {
      const embedding = await this.embedEvent(event);
      embeddings.push(embedding);
    }
    
    return embeddings;
  }
  
  /**
   * Convert knowledge event to search-optimized text representation
   * Prioritizes most relevant fields for semantic search
   * 
   * @param event - Knowledge event to convert
   * @returns Compact text representation (under 512 tokens)
   */
  eventToSearchText(event: KnowledgeEvent): string {
    const parts: string[] = [];
    
    // Include event type for context
    parts.push(`Event: ${event.eventType}`);
    
    // Extract type-specific fields (most relevant for search)
    switch (event.eventType) {
      case 'task_completed': {
        const data = event.data as import('../events/types.js').TaskCompletedData;
        if (data.description) parts.push(data.description);
        if (data.outcome) parts.push(`Outcome: ${data.outcome}`);
        if (data.filesChanged?.length) {
          parts.push(`Files: ${data.filesChanged.join(', ')}`);
        }
        break;
      }
        
      case 'decision_made': {
        const data = event.data as import('../events/types.js').DecisionMadeData;
        if (data.decision) parts.push(data.decision);
        if (data.rationale) parts.push(`Rationale: ${data.rationale}`);
        if (data.alternativesConsidered?.length) {
          parts.push(`Alternatives: ${data.alternativesConsidered.join(', ')}`);
        }
        break;
      }
        
      case 'pattern_discovered': {
        const data = event.data as import('../events/types.js').PatternDiscoveredData;
        if (data.pattern) parts.push(data.pattern);
        if (data.category) parts.push(`Category: ${data.category}`);
        if (data.trigger) parts.push(`Trigger: ${data.trigger}`);
        if (data.solution) parts.push(`Solution: ${data.solution}`);
        break;
      }
        
      case 'validation_passed': {
        const data = event.data as import('../events/types.js').ValidationPassedData;
        if (data.command) parts.push(`Command: ${data.command}`);
        if (data.result) parts.push(data.result);
        break;
      }
        
      case 'bug_encountered': {
        const data = event.data as import('../events/types.js').BugEncounteredData;
        if (data.description) parts.push(data.description);
        break;
      }        
      case 'bug_resolved': {
        const data = event.data as import('../events/types.js').BugResolvedData;
        if (data.bugDescription) parts.push(data.bugDescription);
        if (data.fixDescription) parts.push(`Fix: ${data.fixDescription}`);
        if (data.prevention) parts.push(`Prevention: ${data.prevention}`);
        break;
      }
        
      case 'learning_captured': {
        const data = event.data as import('../events/types.js').LearningCapturedData;
        if (data.learning) parts.push(data.learning);
        if (data.evidence) parts.push(`Evidence: ${data.evidence}`);
        if (data.applicability) parts.push(`Applicability: ${data.applicability}`);
        break;
      }
        
      case 'session_started': {
        const data = event.data as import('../events/types.js').SessionStartedData;
        if (data.title) parts.push(`Session: ${data.title}`);
        if (data.topics?.length) {
          parts.push(`Topics: ${data.topics.join(', ')}`);
        }
        break;
      }
        
      case 'goal_defined': {
        const data = event.data as import('../events/types.js').GoalDefinedData;
        if (data.goal) parts.push(`Goal: ${data.goal}`);
        if (data.successCriteria?.length) {
          parts.push(`Success criteria: ${data.successCriteria.join(', ')}`);
        }
        break;
      }
        
      default:
        // Generic fallback: serialize all data fields
        parts.push(JSON.stringify(event.data));
    }
    
    // Join parts with separators for better semantic understanding
    return parts.join(' | ');
  }
  
  /**
   * Lazy-load the embedding model on first use
   * Models are cached in ~/.cache/huggingface after first download
   * 
   * @private
   */
  private async ensureModelLoaded(): Promise<void> {
    // Model already loaded
    if (this.model) {
      return;
    }
    
    // Model loading in progress - wait for existing promise
    if (this.modelPromise) {
      await this.modelPromise;
      return;
    }
    
    // Start loading model (first time only)
    this.modelPromise = pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    
    this.model = await this.modelPromise;
    this.modelPromise = null; // Clear promise after successful load
  }
}
