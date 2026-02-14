import { describe, it, expect } from 'vitest';
import { AIFriendlyErrorBuilder } from '../../lib/utils/error-builder.js';
import type { AIFriendlyError } from '../../lib/types/index.js';

describe('AIFriendlyErrorBuilder', () => {
  describe('invalidParameter', () => {
    it('should create error with parameter name and suggestion', () => {
      const error = AIFriendlyErrorBuilder.invalidParameter(
        'appendSection',
        "Did you mean 'append-section'? (Commander.js uses dash-case for CLI options)"
      );

      expect(error.success).toBe(false);
      expect(error.error.type).toBe('InvalidParameter');
      expect(error.error.message).toBe("Invalid parameter 'appendSection'");
      expect(error.error.parameter).toBe('appendSection');
      expect(error.error.suggestion).toContain('append-section');
      expect(error.error.docs_url).toBeDefined();
    });

    it('should include usage examples when provided', () => {
      const examples = [
        "append_to_session({ section: '## Notes', content: '...' })",
        "npx aiknowsys update-session --append-section '## Notes'"
      ];

      const error = AIFriendlyErrorBuilder.invalidParameter(
        'appendSection',
        'Use dash-case for CLI options',
        examples
      );

      expect(error.error.correct_usage).toHaveLength(2);
      expect(error.error.correct_usage?.[0].description).toBeDefined();
      expect(error.error.correct_usage?.[0].example).toBe(examples[0]);
    });

    it('should work without suggestion or examples', () => {
      const error = AIFriendlyErrorBuilder.invalidParameter('unknownParam');

      expect(error.success).toBe(false);
      expect(error.error.parameter).toBe('unknownParam');
      expect(error.error.suggestion).toBeUndefined();
      expect(error.error.correct_usage).toBeUndefined();
    });
  });

  describe('toolNotFound', () => {
    it('should create error with tool name', () => {
      const error = AIFriendlyErrorBuilder.toolNotFound('query-session');

      expect(error.success).toBe(false);
      expect(error.error.type).toBe('ToolNotFound');
      expect(error.error.message).toBe("Tool 'query-session' not found");
      expect(error.error.suggestion).toContain('list_tools()');
    });

    it('should suggest similar tool names', () => {
      const similar = ['query-sessions', 'query-plans', 'search-context'];
      const error = AIFriendlyErrorBuilder.toolNotFound('query-session', similar);

      expect(error.error.suggestion).toContain('Did you mean:');
      expect(error.error.suggestion).toContain('query-sessions');
      expect(error.error.similar_errors).toEqual(similar);
    });

    it('should include docs URL', () => {
      const error = AIFriendlyErrorBuilder.toolNotFound('unknown');

      expect(error.error.docs_url).toContain('available-tools');
    });
  });

  describe('validationFailed', () => {
    it('should create validation error with field and reason', () => {
      const error = AIFriendlyErrorBuilder.validationFailed(
        'content',
        'Content cannot be empty'
      );

      expect(error.success).toBe(false);
      expect(error.error.type).toBe('ValidationFailed');
      expect(error.error.message).toContain('content');
      expect(error.error.message).toContain('Content cannot be empty');
      expect(error.error.parameter).toBe('content');
    });

    it('should include example when provided', () => {
      const example = "append_to_session({ content: 'Your content here' })";
      const error = AIFriendlyErrorBuilder.validationFailed(
        'content',
        'Content is required',
        example
      );

      expect(error.error.suggestion).toContain('Try:');
      expect(error.error.suggestion).toContain(example);
    });

    it('should work without example', () => {
      const error = AIFriendlyErrorBuilder.validationFailed(
        'date',
        'Invalid date format'
      );

      expect(error.error.suggestion).toBeUndefined();
      expect(error.error.docs_url).toBeDefined();
    });
  });

  describe('missingRequired', () => {
    it('should create error for missing required parameter', () => {
      const error = AIFriendlyErrorBuilder.missingRequired(
        'content',
        "append_to_session({ section: '## Notes', content: 'Required!' })"
      );

      expect(error.success).toBe(false);
      expect(error.error.type).toBe('MissingRequired');
      expect(error.error.message).toContain('content');
      expect(error.error.message).toContain('required');
      expect(error.error.parameter).toBe('content');
    });

    it('should include usage example in suggestion', () => {
      const example = "create_session({ title: 'My Session' })";
      const error = AIFriendlyErrorBuilder.missingRequired('title', example);

      expect(error.error.suggestion).toContain(example);
    });
  });

  describe('error learning and patterns', () => {
    it('should detect camelCase vs dash-case confusion', () => {
      const error = AIFriendlyErrorBuilder.invalidParameter(
        'appendSection',
        'CLI options use dash-case: --append-section'
      );

      expect(error.error.suggestion).toContain('dash-case');
      expect(error.error.suggestion).toContain('--append-section');
    });

    it('should provide relevant docs URL based on error type', () => {
      const invalidParam = AIFriendlyErrorBuilder.invalidParameter('test');
      const toolNotFound = AIFriendlyErrorBuilder.toolNotFound('test');
      const validation = AIFriendlyErrorBuilder.validationFailed('test', 'fail');

      expect(invalidParam.error.docs_url).toContain('tools');
      expect(toolNotFound.error.docs_url).toContain('available-tools');
      expect(validation.error.docs_url).toContain('validation');
    });
  });

  describe('type safety', () => {
    it('should return proper success: false structure', () => {
      const error = AIFriendlyErrorBuilder.invalidParameter('test');

      // TypeScript compile-time check
      const checkType = (e: AIFriendlyError): boolean => e.success === false;
      expect(checkType(error)).toBe(true);
    });

    it('should enforce ErrorType values', () => {
      const error1 = AIFriendlyErrorBuilder.invalidParameter('x');
      const error2 = AIFriendlyErrorBuilder.toolNotFound('x');
      const error3 = AIFriendlyErrorBuilder.validationFailed('x', 'y');
      const error4 = AIFriendlyErrorBuilder.missingRequired('x');

      expect(error1.error.type).toBe('InvalidParameter');
      expect(error2.error.type).toBe('ToolNotFound');
      expect(error3.error.type).toBe('ValidationFailed');
      expect(error4.error.type).toBe('MissingRequired');
    });
  });
});
