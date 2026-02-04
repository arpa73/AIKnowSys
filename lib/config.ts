/**
 * Configuration management utilities for AIKnowSys
 * Handles .aiknowsys.config.json for feature preferences
 */

import fs from 'fs';
import path from 'path';

/**
 * Feature toggle configuration
 */
export interface FeatureConfig {
  agents: boolean;
  skills: boolean;
  vscodeHooks: boolean;
  sessionPersistence: boolean;
  tddEnforcement: boolean;
  openspec: boolean;
}

/**
 * User preferences for project setup
 */
export interface PreferencesConfig {
  templateType: 'full' | 'minimal';
  stackName: string | null;
}

/**
 * Main AIKnowSys configuration
 */
export interface Config {
  version: string;
  features: FeatureConfig;
  preferences: PreferencesConfig;
}

/**
 * Validation result for configuration
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Get default configuration object
 * @returns Default config with all features enabled
 */
export function getDefaultConfig(): Config {
  return {
    version: '1.0',
    features: {
      agents: true,
      skills: true,
      vscodeHooks: true,
      sessionPersistence: true,
      tddEnforcement: true,
      openspec: false
    },
    preferences: {
      templateType: 'full',
      stackName: null
    }
  };
}

/**
 * Load configuration from .aiknowsys.config.json
 * Returns defaults if file doesn't exist (backward compatibility)
 * @param targetDir - Directory to load config from
 * @returns Configuration object
 */
export async function loadConfig(targetDir: string): Promise<Config> {
  const configPath = path.join(targetDir, '.aiknowsys.config.json');
  
  // Return defaults if file doesn't exist
  if (!fs.existsSync(configPath)) {
    return getDefaultConfig();
  }
  
  try {
    const content = await fs.promises.readFile(configPath, 'utf8');
    const config = JSON.parse(content) as Partial<Config>;
    
    // Merge with defaults to handle partial configs
    const defaults = getDefaultConfig();
    return {
      version: config.version || defaults.version,
      features: {
        ...defaults.features,
        ...config.features
      },
      preferences: {
        ...defaults.preferences,
        ...config.preferences
      }
    };
  } catch {
    // Return defaults on any error (malformed JSON, read error, etc.)
    return getDefaultConfig();
  }
}

/**
 * Save configuration to .aiknowsys.config.json
 * @param targetDir - Directory to save config to
 * @param config - Configuration object
 */
export async function saveConfig(targetDir: string, config: Config): Promise<void> {
  const configPath = path.join(targetDir, '.aiknowsys.config.json');
  const content = JSON.stringify(config, null, 2);
  await fs.promises.writeFile(configPath, content, 'utf8');
}

/**
 * Validate configuration structure
 * Permissive validation - warns about issues but doesn't fail on unknown features
 * @param config - Configuration object to validate
 * @returns Validation result with errors if any
 */
export function validateConfig(config: unknown): ConfigValidationResult {
  const errors: string[] = [];
  
  if (!config) {
    errors.push('Config is null or undefined');
    return { valid: false, errors };
  }
  
  // Type guard for config object
  if (typeof config !== 'object') {
    errors.push('Config must be an object');
    return { valid: false, errors };
  }
  
  const cfg = config as Record<string, unknown>;
  
  if (!cfg.version) {
    errors.push('Missing required field: version');
  }
  
  if (!cfg.features || typeof cfg.features !== 'object') {
    errors.push('Missing or invalid required field: features (must be object)');
  }
  
  // Preferences is optional but should be an object if present
  if (cfg.preferences && typeof cfg.preferences !== 'object') {
    errors.push('Invalid field: preferences (must be object if present)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a feature is enabled in the configuration
 * Defaults to true for backward compatibility (unknown features are considered enabled)
 * @param config - Configuration object
 * @param featureName - Name of the feature to check
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(config: Config | null | undefined, featureName: keyof FeatureConfig): boolean {
  // Default to enabled if features object is missing
  if (!config || !config.features) {
    return true;
  }
  
  // Default to enabled for unknown features (backward compatibility)
  return config.features[featureName] ?? true;
}
