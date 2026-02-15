import { z } from 'zod';
import { AIFriendlyErrorBuilder } from '../../../../lib/utils/error-builder.js';

/**
 * MCP Error Response Format
 */
export interface MCPErrorResponse {
  [x: string]: unknown; // Allow additional properties for MCP SDK compatibility
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

/**
 * Handle CLI execution errors with conversational error responses
 * 
 * Parses common CLI error patterns and converts them to AI-friendly format:
 * - "unknown option" → InvalidParameter with dash-case suggestion
 * - "required option" → MissingRequired with examples
 * - "invalid argument" → ValidationFailed with correct format
 * 
 * @param error - Error from CLI execution
 * @param context - Context string for the operation
 * @returns MCP-compliant error response or null if error should be passed through
 */
export function handleCLIError(
  error: unknown,
  context: string
): MCPErrorResponse | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message;

  // Pattern: "unknown option '--appendSection'"
  const unknownOptionMatch = message.match(/unknown option ['"]?--?([a-zA-Z-]+)['"]?/i);
  if (unknownOptionMatch) {
    const param = unknownOptionMatch[1];
    const errorResponse = AIFriendlyErrorBuilder.invalidParameter(
      param,
      'CLI options use dash-case (e.g., --append-section). Use the MCP tool directly to avoid CLI parameter confusion.',
      [`Use the MCP tool: ${context.replace(/ /g, '_')}({ ... }) instead of CLI flags`]
    );
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
      isError: true
    };
  }

  // Pattern: "required option '--content' not specified"
  const requiredOptionMatch = message.match(/required option ['"]?--?([a-zA-Z-]+)['"]? not specified/i);
  if (requiredOptionMatch) {
    const param = requiredOptionMatch[1];
    const errorResponse = AIFriendlyErrorBuilder.missingRequired(
      param,
      `This parameter is required for ${context}`
    );
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
      isError: true
    };
  }

  // Pattern: "error: invalid argument..."
  if (message.toLowerCase().includes('invalid argument')) {
    const errorResponse = AIFriendlyErrorBuilder.validationFailed(
      context,
      message,
      'Check parameter format and types'
    );
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
      isError: true
    };
  }

  // Pattern: database not found
  if (message.toLowerCase().includes('database') && (message.toLowerCase().includes('not found') || message.toLowerCase().includes('enoent'))) {
    const errorResponse = AIFriendlyErrorBuilder.databaseError(
      'Database not found',
      'Run: npx aiknowsys migrate-to-sqlite'
    );
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
      isError: true
    };
  }

  // Pattern: file/path not found
  if (message.toLowerCase().includes('enoent') || message.toLowerCase().includes('no such file')) {
    const pathMatch = message.match(/['"]([^'"]+)['"]/);
    const path = pathMatch ? pathMatch[1] : 'unknown path';
    const errorResponse = AIFriendlyErrorBuilder.fileSystemError(
      path,
      'File or directory not found',
      'Check that the path exists and you have permissions'
    );
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
      isError: true
    };
  }

  // Not a recognized CLI error pattern
  return null;
}
