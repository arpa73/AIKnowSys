/**
 * Input sanitization utilities for project names, paths, and user input
 */

/**
 * Result interface for sanitization operations
 */
export interface SanitizationResult {
  valid: boolean;
  sanitized: string;
  errors: string[];
}

/**
 * Result interface for validation operations
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Sanitize project name for safe filesystem and package usage
 * @param name - Raw project name input
 * @returns Sanitization result with validation status
 * @example
 * const result = sanitizeProjectName('My Awesome Project!');
 * if (!result.valid) {
 *   console.error(result.errors); // ['Project name cannot contain spaces...', ...]
 * }
 * console.log(result.sanitized); // 'my-awesome-project'
 */
export function sanitizeProjectName(name: string): SanitizationResult {
  const errors: string[] = [];
  
  if (typeof name !== 'string') {
    return { valid: false, sanitized: '', errors: ['Project name is required'] };  
  }

  const trimmed = name.trim();
  
  // Check minimum length
  if (trimmed.length === 0) {
    errors.push('Project name is empty');
  }
  
  // Check maximum length (npm package name limit is 214)
  if (trimmed.length > 214) {
    errors.push('Project name is too long (max 214 characters)');
  }
  
  // Check for invalid characters (npm package naming rules)
  // Allow: lowercase letters, numbers, hyphens, underscores, @scope/
  if (!/^(@[a-z0-9-._~]+\/)?[a-z0-9-._~]+$/i.test(trimmed)) {
    errors.push('Project name can only contain letters, numbers, hyphens, underscores, and dots');
  }
  
  // Check for emoji and special Unicode characters
  // Emoji range: U+1F300 to U+1F9FF (and others)
  if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(trimmed)) {
    errors.push('Project name cannot contain emoji or special Unicode characters');
  }
  
  // Check for npm reserved names
  const reservedNames = [
    'node_modules', 'favicon.ico', 'node', 'npm', 'package', 'readme',
    'license', 'changelog', 'test', 'tests', 'example', 'examples'
  ];
  const lowercaseName = trimmed.toLowerCase().replace(/^@[^/]+\//, ''); // Remove scope
  if (reservedNames.includes(lowercaseName)) {
    errors.push(`Project name '${lowercaseName}' is reserved by npm`);
  }
  
  // Check for leading/trailing special characters
  if (/^[._-]/.test(trimmed)) {
    errors.push('Project name cannot start with a dot, hyphen, or underscore');
  }
  
  // Check for spaces
  if (/\s/.test(trimmed)) {
    errors.push('Project name cannot contain spaces (use hyphens instead)');
  }
  
  // Create sanitized version
  const sanitized = trimmed
    .toLowerCase()
    .replace(/\s+/g, '-')              // Replace spaces with hyphens
    .replace(/[^a-z0-9-._~@/]/g, '')   // Remove invalid characters
    .replace(/^[._-]+/, '')            // Remove leading special chars
    .replace(/[._-]+$/, '');           // Remove trailing special chars
  
  return {
    valid: errors.length === 0,
    sanitized,
    errors
  };
}

/**
 * Sanitize directory path for safe filesystem usage
 * @param dirPath - Raw directory path input
 * @returns Sanitization result with validation status
 * @example
 * const result = sanitizeDirectoryPath('../../../etc/passwd');
 * if (!result.valid) {
 *   console.error(result.errors); // ['Directory path cannot contain ".."...']
 * }
 */
export function sanitizeDirectoryPath(dirPath: string): SanitizationResult {
  const errors: string[] = [];
  
  if (typeof dirPath !== 'string') {
    return { valid: false, sanitized: '', errors: ['Directory path is required'] };
  }

  const trimmed = dirPath.trim();
  
  // Check for empty path
  if (trimmed.length === 0) {
    errors.push('Directory path is empty');
  }
  
  // Check for null bytes (security)
  if (trimmed.includes('\0')) {
    errors.push('Directory path contains invalid null byte');
  }
  
  // Normalize path for consistent checking (convert backslashes)
  const normalized = trimmed.replace(/\\/g, '/');
  
  // Check for directory traversal attempts (basic check)
  if (normalized.includes('..')) {
    errors.push('Directory path cannot contain ".." (parent directory references)');
  }
  
  // Windows reserved names check (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
  const basename = normalized.split('/').pop();
  if (basename && /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(basename)) {
    errors.push('Directory path uses a reserved Windows filename');
  }
  
  // Check for invalid Windows path characters
  if (/[<>:"|?*]/.test(trimmed)) {
    errors.push('Directory path contains invalid characters (< > : " | ? *)');
  }
  
  return {
    valid: errors.length === 0,
    sanitized: trimmed,
    errors
  };
}

/**
 * Sanitize filename for safe filesystem usage
 * @param filename - Raw filename input
 * @returns Sanitization result with validation status
 * @example
 * const result = sanitizeFilename('my document.txt');
 * console.log(result.sanitized); // 'my-document.txt'
 * console.log(result.valid); // true
 */
export function sanitizeFilename(filename: string): SanitizationResult {
  const errors: string[] = [];
  
  if (typeof filename !== 'string') {
    return { valid: false, sanitized: '', errors: ['Filename is required'] };
  }

  const trimmed = filename.trim();
  
  // Check for empty filename
  if (trimmed.length === 0) {
    errors.push('Filename is empty');
  }
  
  // Check maximum length (255 is typical filesystem limit)
  if (trimmed.length > 255) {
    errors.push('Filename is too long (max 255 characters)');
  }
  
  // Check for null bytes
  if (trimmed.includes('\0')) {
    errors.push('Filename contains invalid null byte');
  }
  
  // Check for path separators (filename only, not path)
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    errors.push('Filename cannot contain path separators (/ or \\)');
  }
  
  // Windows reserved names
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i.test(trimmed)) {
    errors.push('Filename uses a reserved Windows name');
  }
  
  // Invalid characters for both Windows and Unix
  if (/[<>:"|?*\0]/.test(trimmed)) {
    errors.push('Filename contains invalid characters');
  }
  
  // Create sanitized version
  const sanitized = trimmed
    .replace(/[<>:"|?*\0]/g, '')  // Remove invalid chars
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .slice(0, 255);               // Truncate to max length
  
  return {
    valid: errors.length === 0,
    sanitized,
    errors
  };
}

/**
 * Validate that a path is safe for file operations (no traversal attacks)
 * @param basePath - Base directory (trusted)
 * @param userPath - User-provided path
 * @returns Validation result
 * @example
 * const result = validatePathTraversal('/home/user/projects', 'my-app/src/index.js');
 * if (result.valid) {
 *   // Safe to join paths: path.join(basePath, userPath)
 * }
 */
export function validatePathTraversal(basePath: string, userPath: string): ValidationResult {
  const errors: string[] = [];
  
  if (!basePath || !userPath) {
    return { valid: false, errors: ['Both basePath and userPath are required'] };
  }
  
  // Normalize paths to prevent traversal
  const normalizedUser = userPath.replace(/\\/g, '/');
  
  // Check for absolute paths (should be relative to base)
  if (normalizedUser.startsWith('/')) {
    errors.push('Path must be relative to the base directory');
  }
  
  // Check for parent directory references
  if (normalizedUser.includes('..')) {
    errors.push('Path cannot contain ".." (parent directory references)');
  }
  
  // Check for null bytes
  if (userPath.includes('\0')) {
    errors.push('Path contains invalid null byte');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize skill name for safe installation
 * @param name - Raw skill name input
 * @returns Sanitization result with validation status
 * @example
 * const result = sanitizeSkillName('Code Refactoring');
 * console.log(result.sanitized); // 'code-refactoring'
 * console.log(result.valid); // false (contains uppercase)
 */
export function sanitizeSkillName(name: string): SanitizationResult {
  const errors: string[] = [];
  
  if (typeof name !== 'string') {
    return { valid: false, sanitized: '', errors: ['Skill name is required'] };
  }

  const trimmed = name.trim();
  
  // Check for empty
  if (trimmed.length === 0) {
    errors.push('Skill name is empty');
  }
  
  // Check format: lowercase with hyphens only
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    errors.push('Skill name must be lowercase letters, numbers, and hyphens only');
  }
  
  // Check for leading/trailing hyphens
  if (/^-|-$/.test(trimmed)) {
    errors.push('Skill name cannot start or end with a hyphen');
  }
  
  const sanitized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
  
  return {
    valid: errors.length === 0,
    sanitized,
    errors
  };
}
