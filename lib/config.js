/**
 * Configuration management utilities for AIKnowSys
 * Handles .aiknowsys.config.json for feature preferences
 */

import fs from 'fs';
import path from 'path';

/**
 * Get default configuration object
 * @returns {Object} Default config with all features
 */
export function getDefaultConfig() {
  return {
    version: '1.0',
    features: {
      agents: true,
      skills: true,
      vscodeHooks: true,
      sessionPersistence: true,
      tddEnforcement: true,
      openspec: false,
      context7: false
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
 * @param {string} targetDir - Directory to load config from
 * @returns {Promise<Object>} Configuration object
 */
export async function loadConfig(targetDir) {
  const configPath = path.join(targetDir, '.aiknowsys.config.json');
  
  // Return defaults if file doesn't exist
  if (!fs.existsSync(configPath)) {
    return getDefaultConfig();
  }
  
  try {
    const content = await fs.promises.readFile(configPath, 'utf8');
    const config = JSON.parse(content);
    
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
  } catch (_error) {
    // Return defaults on any error (malformed JSON, read error, etc.)
    return getDefaultConfig();
  }
}

/**
 * Save configuration to .aiknowsys.config.json
 * @param {string} targetDir - Directory to save config to
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
export async function saveConfig(targetDir, config) {
  const configPath = path.join(targetDir, '.aiknowsys.config.json');
  const content = JSON.stringify(config, null, 2);
  await fs.promises.writeFile(configPath, content, 'utf8');
}

/**
 * Validate configuration structure
 * Permissive validation - warns about issues but doesn't fail on unknown features
 * @param {Object} config - Configuration object to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateConfig(config) {
  const errors = [];
  
  if (!config) {
    errors.push('Config is null or undefined');
    return { valid: false, errors };
  }
  
  if (!config.version) {
    errors.push('Missing required field: version');
  }
  
  if (!config.features || typeof config.features !== 'object') {
    errors.push('Missing or invalid required field: features (must be object)');
  }
  
  // Preferences is optional but should be an object if present
  if (config.preferences && typeof config.preferences !== 'object') {
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
 * @param {Object} config - Configuration object
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} Whether the feature is enabled
 */
export function isFeatureEnabled(config, featureName) {
  // Default to enabled if features object is missing
  if (!config || !config.features) {
    return true;
  }
  
  // Default to enabled for unknown features (backward compatibility)
  return config.features[featureName] ?? true;
}
