/**
 * AI-Friendly Error Builder
 * 
 * Creates structured, conversational error responses that help AI agents
 * learn from mistakes instead of retrying blindly.
 * 
 * @example
 * // Instead of: Error: unknown option '--appendSection'
 * // Return:
 * {
 *   success: false,
 *   error: {
 *     type: 'InvalidParameter',
 *     message: "Invalid parameter 'appendSection'",
 *     suggestion: "CLI options use dash-case: --append-section",
 *     correct_usage: [...]
 *   }
 * }
 */

import type { AIFriendlyError, UsageExample } from '../types/index.js';

export class AIFriendlyErrorBuilder {
  /**
   * Create error for invalid parameter (wrong name, case, etc.)
   */
  static invalidParameter(
    param: string,
    suggestion?: string,
    examples?: string[]
  ): AIFriendlyError {
    const correct_usage: UsageExample[] | undefined = examples?.map(ex => ({
      description: 'Correct usage',
      example: ex
    }));

    return {
      success: false,
      error: {
        type: 'InvalidParameter',
        message: `Invalid parameter '${param}'`,
        parameter: param,
        suggestion,
        correct_usage,
        docs_url: 'https://github.com/arpa73/AIKnowSys#tools'
      }
    };
  }

  /**
   * Create error for tool not found (typo, wrong name, etc.)
   */
  static toolNotFound(toolName: string, similar?: string[]): AIFriendlyError {
    const suggestion = similar?.length 
      ? `Did you mean: ${similar.join(', ')}?`
      : 'Run list_tools() to see available tools';

    return {
      success: false,
      error: {
        type: 'ToolNotFound',
        message: `Tool '${toolName}' not found`,
        suggestion,
        similar_errors: similar,
        docs_url: 'https://github.com/arpa73/AIKnowSys#available-tools'
      }
    };
  }

  /**
   * Create error for validation failure (wrong format, type, etc.)
   */
  static validationFailed(
    field: string,
    reason: string,
    example?: string
  ): AIFriendlyError {
    return {
      success: false,
      error: {
        type: 'ValidationFailed',
        message: `Validation failed for '${field}': ${reason}`,
        parameter: field,
        suggestion: example ? `Try: ${example}` : undefined,
        docs_url: 'https://github.com/arpa73/AIKnowSys#validation'
      }
    };
  }

  /**
   * Create error for missing required parameter
   */
  static missingRequired(
    param: string,
    example?: string
  ): AIFriendlyError {
    return {
      success: false,
      error: {
        type: 'MissingRequired',
        message: `Missing required parameter '${param}'`,
        parameter: param,
        suggestion: example ? `Example: ${example}` : 'This parameter is required',
        docs_url: 'https://github.com/arpa73/AIKnowSys#tools'
      }
    };
  }

  /**
   * Create error for database issues (file not found, corrupt, etc.)
   */
  static databaseError(
    message: string,
    suggestion?: string
  ): AIFriendlyError {
    return {
      success: false,
      error: {
        type: 'DatabaseError',
        message,
        suggestion: suggestion || 'Run npx aiknowsys migrate-to-sqlite to create database',
        docs_url: 'https://github.com/arpa73/AIKnowSys#database-setup'
      }
    };
  }

  /**
   * Create error for file system issues (permissions, not found, etc.)
   */
  static fileSystemError(
    path: string,
    reason: string,
    suggestion?: string
  ): AIFriendlyError {
    return {
      success: false,
      error: {
        type: 'FileSystemError',
        message: `File system error for '${path}': ${reason}`,
        parameter: path,
        suggestion,
        docs_url: 'https://github.com/arpa73/AIKnowSys#troubleshooting'
      }
    };
  }
}
