/**
 * Type definitions for YAML frontmatter in .aiknowsys markdown files
 */

/**
 * Session file frontmatter
 * Used in .aiknowsys/sessions/*.md files
 */
export interface SessionFrontmatter {
  /** Session date (YYYY-MM-DD) */
  date: string;
  
  /** Main topic (deprecated, use topics array) */
  topic?: string;
  
  /** Session status */
  status?: 'active' | 'complete' | 'paused' | 'abandoned';
  
  /** Related plan reference */
  plan?: string;
  
  /** Topic tags */
  topics?: string[];
  
  /** Files modified in session */
  files?: string[];
  
  /** Session duration */
  duration?: string;
  
  /** Session phases */
  phases?: string[];
  
  /** Creation timestamp */
  created?: string;
  
  /** Last update timestamp */
  updated?: string;
  
  /** Allow additional fields */
  [key: string]: unknown;
}

/**
 * Plan file frontmatter
 * Used in .aiknowsys/PLAN_*.md files
 */
export interface PlanFrontmatter {
  /** Plan title */
  title: string;
  
  /** Plan author */
  author?: string;
  
  /** Plan status */
  status?: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';
  
  /** Topic tags */
  topics?: string[];
  
  /** Creation date */
  created?: string;
  
  /** Last update date */
  updated?: string;
  
  /** Priority level */
  priority?: 'high' | 'medium' | 'low';
  
  /** Plan type */
  type?: 'feature' | 'refactor' | 'bugfix' | 'research';
  
  /** Plan description */
  description?: string;
  
  /** Allow additional fields */
  [key: string]: unknown;
}

/**
 * Learned pattern frontmatter
 * Used in .aiknowsys/learned/*.md files
 */
export interface LearnedFrontmatter {
  /** Pattern category */
  category?: string;
  
  /** Search keywords */
  keywords?: string[];
  
  /** Pattern author */
  author?: string;
  
  /** Creation date */
  created?: string;
  
  /** Last update date */
  updated?: string;
  
  /** Allow additional fields */
  [key: string]: unknown;
}
