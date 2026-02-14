/**
 * Type definitions for test utility functions
 */

/**
 * Create a unique temporary test directory
 */
export function createTestDir(): string;

/**
 * Clean up test directory after tests
 */
export function cleanupTestDir(dirPath: string): void;

/**
 * Mock project options
 */
export interface MockProjectOptions {
  hasEssentials?: boolean;
  hasAgents?: boolean;
  hasChangelog?: boolean;
  version?: string | null;
  hasValidationMatrix?: boolean;
  hasDuplicateMatrix?: boolean;
  essentialsSize?: 'small' | 'medium' | 'large';
}

/**
 * Create a mock project structure for testing
 */
export function createMockProject(dir: string, options?: MockProjectOptions): void;

/**
 * Sample Node project options
 */
export interface SampleNodeProjectOptions {
  framework?: string;
  hasTests?: boolean;
  hasDatabase?: boolean;
  [key: string]: string | boolean | number | undefined;
}

/**
 * Create a sample Node.js project for testing
 */
export function createSampleNodeProject(dir: string, options?: SampleNodeProjectOptions): void;

/**
 * Assert file exists
 */
export function assertFileExists(filePath: string, message?: string): void;

/**
 * Assert file does not exist
 */
export function assertFileNotExists(filePath: string, message?: string): void;

/**
 * Assert file contains content (string or regex)
 */
export function assertFileContains(filePath: string, content: string | RegExp, message?: string): void;

/**
 * Assert file does not contain content (string or regex)
 */
export function assertFileNotContains(filePath: string, content: string | RegExp, message?: string): void;

/**
 * Assert placeholder was replaced in file
 */
export function assertPlaceholderReplaced(filePath: string, placeholder: string, message?: string): void;

/**
 * Assert placeholder still exists in file
 */
export function assertPlaceholderExists(filePath: string, placeholder: string, message?: string): void;

/**
 * Mock inquirer prompt responses
 */
export function mockInquirerPrompt(answers: Record<string, unknown>): void;

/**
 * Count lines in a file
 */
export function countLines(filePath: string): number;
