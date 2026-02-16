/**
 * Vector similarity utilities for semantic search
 * Phase 2.5: JavaScript-based cosine similarity (no sqlite-vss)
 */

/**
 * Compute cosine similarity between two vectors
 * 
 * Formula: cos(θ) = (A · B) / (||A|| × ||B||)
 * 
 * Returns value between -1.0 and 1.0:
 * - 1.0: Identical direction (perfect similarity)
 * - 0.0: Orthogonal (no similarity)
 * - -1.0: Opposite direction (perfect dissimilarity)
 * 
 * @param v1 - First vector (Float32Array)
 * @param v2 - Second vector (Float32Array)
 * @returns Cosine similarity score (-1.0 to 1.0)
 * @throws Error if dimensions don't match or vectors are zero
 */
export function cosineSimilarity(v1: Float32Array, v2: Float32Array): number {
  // Validate dimensions
  if (v1.length !== v2.length) {
    throw new Error(
      `Vector dimensions must match (got ${v1.length} and ${v2.length})`
    );
  }

  // Compute dot product and magnitudes
  let dotProduct = 0;
  let magnitudeV1 = 0;
  let magnitudeV2 = 0;

  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    magnitudeV1 += v1[i] * v1[i];
    magnitudeV2 += v2[i] * v2[i];
  }

  magnitudeV1 = Math.sqrt(magnitudeV1);
  magnitudeV2 = Math.sqrt(magnitudeV2);

  // Check for zero vectors (undefined cosine similarity)
  if (magnitudeV1 === 0 || magnitudeV2 === 0) {
    throw new Error('Cannot compute similarity with zero vector');
  }

  // Compute cosine similarity
  const similarity = dotProduct / (magnitudeV1 * magnitudeV2);

  // Clamp to [-1, 1] to handle floating-point errors
  return Math.max(-1, Math.min(1, similarity));
}

/**
 * Batch compute cosine similarities between a query and multiple candidates
 * Optimized for semantic search (avoids recomputing query magnitude)
 * 
 * @param queryEmbedding - Query vector
 * @param candidates - Array of candidate vectors
 * @returns Array of similarity scores (same order as candidates)
 */
export function batchCosineSimilarity(
  queryEmbedding: Float32Array,
  candidates: Float32Array[]
): number[] {
  // Pre-compute query magnitude (only once)
  let queryMagnitude = 0;
  for (let i = 0; i < queryEmbedding.length; i++) {
    queryMagnitude += queryEmbedding[i] * queryEmbedding[i];
  }
  queryMagnitude = Math.sqrt(queryMagnitude);

  if (queryMagnitude === 0) {
    throw new Error('Cannot compute similarity with zero query vector');
  }

  // Compute similarity for each candidate
  return candidates.map(candidate => {
    // Validate dimensions
    if (candidate.length !== queryEmbedding.length) {
      throw new Error(
        `Vector dimensions must match (got ${queryEmbedding.length} and ${candidate.length})`
      );
    }

    // Compute dot product and candidate magnitude
    let dotProduct = 0;
    let candidateMagnitude = 0;

    for (let i = 0; i < queryEmbedding.length; i++) {
      dotProduct += queryEmbedding[i] * candidate[i];
      candidateMagnitude += candidate[i] * candidate[i];
    }

    candidateMagnitude = Math.sqrt(candidateMagnitude);

    if (candidateMagnitude === 0) {
      // Return 0 instead of throwing (skip invalid candidates)
      return 0;
    }

    // Compute cosine similarity
    const similarity = dotProduct / (queryMagnitude * candidateMagnitude);

    // Clamp to [-1, 1]
    return Math.max(-1, Math.min(1, similarity));
  });
}
