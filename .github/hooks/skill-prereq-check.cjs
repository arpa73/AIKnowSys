#!/usr/bin/env node
/**
 * Skill Prerequisite Check Hook (preToolUse event)
 * 
 * Ensures the AI has read required skills BEFORE editing files.
 * Provides just-in-time reminders to prevent pattern violations.
 * 
 * Example: When editing dependency files, ensures dependency-updates
 * skill was read for safe upgrade procedures.
 * 
 * Non-blocking: Always exits with code 0
 * Timeout: Must complete within 2 seconds
 */

const fs = require('fs');
const path = require('path');

async function main() {
  let input = '';
  
  process.stdin.on('data', chunk => input += chunk.toString());
  
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input || '{}');
      
      // Get file path being edited
      const filePath = data.parameters?.filePath || '';
      if (!filePath) {
        process.exit(0);
        return;
      }
      
      // Load configuration
      const config = loadConfig();
      if (!config.skillDetection?.enabled) {
        process.exit(0);
        return;
      }
      
      // Check which skills should be loaded for this file
      const requiredSkills = detectRequiredSkills(filePath, config.skills);
      
      if (requiredSkills.length === 0) {
        process.exit(0);
        return;
      }
      
      // Check conversation history to see if skills were read
      const conversation = data.conversation || [];
      const loadedSkills = findLoadedSkills(conversation, requiredSkills);
      
      // Find skills that weren't loaded
      const missingSkills = requiredSkills.filter(
        skill => !loadedSkills.includes(skill.name)
      );
      
      if (missingSkills.length > 0) {
        console.error(`[Skills] ⚠️  Before editing ${path.basename(filePath)}, consider reading:`);
        missingSkills.forEach(skill => {
          console.error(`[Skills]   - .github/skills/${skill.path}`);
          console.error(`[Skills]     Why: ${skill.description}`);
        });
        console.error('[Skills] These skills contain important patterns for this file type');
      }
      
      process.exit(0);
    } catch (err) {
      // Fail silently
      process.exit(0);
    }
  });
}

/**
 * Load hook configuration
 */
function loadConfig() {
  const configPath = path.join('.github', 'hooks', 'config.json');
  
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return mergeWithDefaults(config);
    } catch (err) {
      // Fall back to defaults
    }
  }
  
  return getDefaultConfig();
}

/**
 * Detect required skills based on file being edited
 */
function detectRequiredSkills(filePath, skillsConfig) {
  const required = [];
  const fileName = path.basename(filePath);
  const fileExt = path.extname(filePath);
  
  for (const [skillName, skillConfig] of Object.entries(skillsConfig)) {
    const fileTriggers = skillConfig.triggers?.files || [];
    
    // Check if file matches any trigger pattern
    const fileMatch = fileTriggers.some(pattern => {
      if (pattern.includes('*')) {
        // Simple glob matching
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        const regex = new RegExp(regexPattern, 'i');
        return regex.test(fileName) || regex.test(filePath);
      }
      
      return fileName.includes(pattern) || filePath.includes(pattern);
    });
    
    if (fileMatch) {
      required.push({
        name: skillName,
        ...skillConfig
      });
    }
  }
  
  return required;
}

/**
 * Find which required skills were already loaded in conversation
 */
function findLoadedSkills(conversation, requiredSkills) {
  const loaded = [];
  
  for (const msg of conversation) {
    const content = msg.content || msg.text || '';
    
    // Check for skill file reads
    for (const skill of requiredSkills) {
      const skillPath = `.github/skills/${skill.path}`;
      if (content.includes(skillPath) || content.includes(skill.name)) {
        if (!loaded.includes(skill.name)) {
          loaded.push(skill.name);
        }
      }
    }
  }
  
  return loaded;
}

/**
 * Merge user config with defaults
 */
function mergeWithDefaults(userConfig) {
  const defaults = getDefaultConfig();
  
  return {
    ...defaults,
    ...userConfig,
    skills: {
      ...defaults.skills,
      ...userConfig.skills
    },
    skillDetection: {
      ...defaults.skillDetection,
      ...userConfig.skillDetection
    }
  };
}

/**
 * Get default configuration
 */
function getDefaultConfig() {
  return {
    skillDetection: {
      enabled: true,
      showRecommendations: true,
      trackUsage: true,
      conversationContextDepth: 5
    },
    skills: {
      'dependency-updates': {
        path: 'dependency-updates/SKILL.md',
        triggers: {
          keywords: ['update deps', 'upgrade packages'],
          files: ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pom.xml']
        },
        requiresConfirmation: true,
        priority: 'high',
        description: 'Safe dependency update procedures'
      },
      'code-refactoring': {
        path: 'code-refactoring/SKILL.md',
        triggers: {
          keywords: ['refactor', 'clean up'],
          files: []
        },
        autoLoad: true,
        priority: 'high',
        description: 'Test-driven refactoring workflow'
      }
    }
  };
}

main();
