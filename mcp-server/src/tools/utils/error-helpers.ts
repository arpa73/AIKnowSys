import { z } from 'zod';
import { AIFriendlyErrorBuilder } from '../../../../lib/utils/error-builder.js';

/**
 * MCP Error Response Format
 */
export interface MCPErrorResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError: true;
}

/**
 * Configuration for a specific field's error handling
 */
export interface FieldErrorConfig {
  suggestion: string;
  examples: string[];
}

/**
 * Map of field names to their error configurations
 */
export type FieldErrorMap = Record<string, FieldErrorConfig>;

/**
 * Handle Zod validation errors with conversational error responses
 * 
 * @param error - The Zod validation error
 * @param context - Context string for generic errors (e.g., 'session creation', 'plan update')
 * @param fieldMap - Map of field names to error configurations
 * @returns MCP-compliant error response with structured error data
 */
export function handleZodError(
  error: z.ZodError,
  context: string,
  fieldMap: FieldErrorMap
): MCPErrorResponse {
  const firstError = error.errors[0];
  const field = firstError.path.join('.');
  const code = firstError.code;
  
  // Check for discriminated union errors (special case)
  const fieldConfig = fieldMap[field] || (code === 'invalid_union_discriminator' ? fieldMap.operation : undefined);
  
  if (fieldConfig) {
    const errorResponse = AIFriendlyErrorBuilder.invalidParameter(
      field,
      fieldConfig.suggestion,
      fieldConfig.examples
    );
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
      isError: true
    };
  }
  
  // Generic validation failure fallback
  const errorResponse = AIFriendlyErrorBuilder.validationFailed(
    context,
    error instanceof Error ? error.message : String(error),
    'Check parameter types and required fields'
  );
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
    isError: true
  };
}
